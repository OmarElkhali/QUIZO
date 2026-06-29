import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  Attempt,
  Competition,
  ManualQuestion,
  ManualQuiz,
  Participant,
  ShareCodeDoc,
} from '@/types/quiz';

export type QuizStatus = 'draft' | 'active' | 'completed';
export type ShareCodeType = 'quiz' | 'competition';

export interface CompetitionStats {
  totalParticipants: number;
  completedAttempts: number;
  averageScore: number;
  participationRate: number;
}

const SHARE_CODE_LENGTH = 6;

export const toIso = (value: unknown): string => {
  if (!value) return new Date().toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().toISOString();
    }
  }
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
};

export const normalizeCode = (code: string): string => code.trim().toUpperCase();

export const isFirestorePermissionError = (error: unknown): boolean => (
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  String((error as { code?: unknown }).code) === 'permission-denied'
);

export const isAnonymousAuthDisabled = (error: unknown): boolean => (
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  String((error as { code?: unknown }).code) === 'auth/admin-restricted-operation'
);

export const stripUndefinedDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }

  if (
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .map(([key, child]) => [key, stripUndefinedDeep(child)])
    ) as T;
  }

  return value;
};

export const generateShareCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < SHARE_CODE_LENGTH; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const ensureParticipantSession = async (): Promise<string> => {
  // Attendre que l'état d'authentification initial de Firebase soit chargé
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  } else {
    await new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
      });
    });
  }

  if (auth.currentUser) return auth.currentUser.uid;

  try {
    const credential = await signInAnonymously(auth);
    return credential.user.uid;
  } catch (error) {
    if (!isAnonymousAuthDisabled(error)) {
      throw error;
    }

    throw new Error(
      'L\'authentification anonyme est desactivee. ' +
      'Veuillez vous connecter avec votre compte pour participer.'
    );
  }
};

export const mapManualQuiz = (id: string, data: Record<string, unknown>): ManualQuiz => ({
  id,
  title: String(data.title || 'Quiz sans titre'),
  description: String(data.description || ''),
  questions: Array.isArray(data.questions) ? (data.questions as ManualQuestion[]) : [],
  createdAt: toIso(data.createdAt),
  creatorId: String(data.creatorId || data.ownerId || data.userId || ''),
  isPublic: Boolean(data.isPublic),
  timeLimit: typeof data.timeLimit === 'number' ? data.timeLimit : undefined,
  shareCode: typeof data.shareCode === 'string' ? data.shareCode : undefined,
  visibility: data.visibility === 'by_code' ? 'by_code' : 'private',
  mode: data.mode === 'realtime' ? 'realtime' : 'async',
  status: data.status === 'draft' || data.status === 'completed' ? data.status : 'active',
  invitedEmails: Array.isArray(data.invitedEmails) ? (data.invitedEmails as string[]) : [],
  collaboratorUids: Array.isArray(data.collaboratorUids) ? (data.collaboratorUids as string[]) : [],
  stats: typeof data.stats === 'object' && data.stats !== null
    ? (data.stats as ManualQuiz['stats'])
    : undefined,
});

export const mapCompetition = (id: string, data: Record<string, unknown>): Competition => ({
  id,
  quizId: String(data.quizId || ''),
  creatorId: String(data.creatorId || data.ownerId || ''),
  title: String(data.title || 'Competition'),
  description: typeof data.description === 'string' ? data.description : '',
  startDate: toIso(data.startDate),
  endDate: toIso(data.endDate),
  shareCode: String(data.shareCode || ''),
  isActive: data.isActive !== false,
  participantsCount: typeof data.participantsCount === 'number' ? data.participantsCount : 0,
  status: data.status === 'completed' ? 'completed' : 'active',
});

export const mapParticipant = (id: string, data: Record<string, unknown>): Participant => ({
  id,
  competitionId: typeof data.competitionId === 'string' ? data.competitionId : undefined,
  quizId: typeof data.quizId === 'string' ? data.quizId : undefined,
  userId: String(data.userId || ''),
  email: typeof data.email === 'string' ? data.email : undefined,
  name: String(data.name || data.displayName || 'Participant'),
  joinedAt: toIso(data.joinedAt),
  score: typeof data.score === 'number' ? data.score : undefined,
  completedAt: data.completedAt ? toIso(data.completedAt) : undefined,
  isActive: Boolean(data.isActive),
  currentQuestionIndex: typeof data.currentQuestionIndex === 'number' ? data.currentQuestionIndex : 0,
  lastActivityAt: data.lastActivityAt ? toIso(data.lastActivityAt) : undefined,
});

export const mapAttempt = (id: string, data: Record<string, unknown>): Attempt => ({
  id,
  competitionId: typeof data.competitionId === 'string' ? data.competitionId : undefined,
  quizId: typeof data.quizId === 'string' ? data.quizId : undefined,
  participantId: String(data.participantId || ''),
  userId: String(data.userId || ''),
  startedAt: toIso(data.startedAt),
  completedAt: data.completedAt ? toIso(data.completedAt) : undefined,
  score: typeof data.score === 'number' ? data.score : undefined,
  answers: data.answers && typeof data.answers === 'object' ? data.answers as Record<string, string> : {},
  timeSpent: typeof data.timeSpent === 'number' ? data.timeSpent : undefined,
});

export const getAvailableShareCode = async (type: ShareCodeType): Promise<string> => {
  for (let attempts = 0; attempts < 20; attempts += 1) {
    const code = generateShareCode();
    try {
      const shareCodeDoc = await getDoc(doc(db, 'shareCodes', code));
      if (shareCodeDoc.exists()) continue;
    } catch (error) {
      if (!isFirestorePermissionError(error)) {
        throw error;
      }

      console.warn('Verification shareCodes refusee; verification legacy uniquement.', error);
    }

    const legacyCollection = type === 'quiz' ? 'quizzes' : 'competitions';
    const legacyQuery = query(collection(db, legacyCollection), where('shareCode', '==', code), limit(1));
    const legacySnapshot = await getDocs(legacyQuery);
    if (legacySnapshot.empty) return code;
  }

  throw new Error('Impossible de generer un code de partage unique');
};

export const writeShareCode = async (
  code: string,
  type: ShareCodeType,
  targetId: string,
  ownerId: string
): Promise<void> => {
  try {
    await setDoc(doc(db, 'shareCodes', code), {
      type,
      targetId,
      ownerId,
      status: 'active',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    if (isFirestorePermissionError(error)) {
      console.warn('shareCodes non disponible avec les regles Firestore actuelles; fallback legacy shareCode utilise.', error);
      return;
    }

    throw error;
  }
};

export const getShareCode = async (code: string): Promise<ShareCodeDoc | null> => {
  const normalizedCode = normalizeCode(code);
  let codeDoc;

  try {
    codeDoc = await getDoc(doc(db, 'shareCodes', normalizedCode));
  } catch (error) {
    if (isFirestorePermissionError(error)) {
      console.warn('Lecture shareCodes refusee; fallback legacy par shareCode sur quiz/competition.', error);
      return null;
    }

    throw error;
  }

  if (!codeDoc.exists()) return null;

  const data = codeDoc.data();
  return {
    code: normalizedCode,
    type: data.type,
    targetId: data.targetId,
    ownerId: data.ownerId,
    status: data.status || 'active',
    createdAt: data.createdAt ? toIso(data.createdAt) : undefined,
    expiresAt: data.expiresAt ? toIso(data.expiresAt) : undefined,
  } as ShareCodeDoc;
};

export const resolveShareCode = async (
  code: string,
  expectedType?: ShareCodeType
): Promise<ShareCodeDoc> => {
  const normalizedCode = normalizeCode(code);
  const shareCode = await getShareCode(normalizedCode);

  if (shareCode && (!expectedType || shareCode.type === expectedType) && shareCode.status === 'active') {
    return shareCode;
  }

  const quizSnapshot = expectedType !== 'competition'
    ? await getDocs(query(collection(db, 'quizzes'), where('shareCode', '==', normalizedCode), limit(1)))
    : null;
  if (quizSnapshot && !quizSnapshot.empty) {
    const quizDoc = quizSnapshot.docs[0];
    const quiz = mapManualQuiz(quizDoc.id, quizDoc.data());
    if (auth.currentUser?.uid === quiz.creatorId) {
      await writeShareCode(normalizedCode, 'quiz', quiz.id, quiz.creatorId);
    }
    return {
      code: normalizedCode,
      type: 'quiz',
      targetId: quiz.id,
      ownerId: quiz.creatorId,
      status: 'active',
    };
  }

  const competitionSnapshot = expectedType !== 'quiz'
    ? await getDocs(query(collection(db, 'competitions'), where('shareCode', '==', normalizedCode), limit(1)))
    : null;
  if (competitionSnapshot && !competitionSnapshot.empty) {
    const competitionDoc = competitionSnapshot.docs[0];
    const competition = mapCompetition(competitionDoc.id, competitionDoc.data());
    if (auth.currentUser?.uid === competition.creatorId) {
      await writeShareCode(normalizedCode, 'competition', competition.id, competition.creatorId);
    }
    return {
      code: normalizedCode,
      type: 'competition',
      targetId: competition.id,
      ownerId: competition.creatorId,
      status: 'active',
    };
  }

  throw new Error('Code de partage invalide');
};

