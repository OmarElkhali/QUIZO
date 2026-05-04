import { auth, db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { Attempt, Competition, ManualQuestion, ManualQuiz, Participant, ShareCodeDoc } from '@/types/quiz';
import { QuizStatus, ShareCodeType, CompetitionStats, toIso, normalizeCode, isFirestorePermissionError, isAnonymousAuthDisabled, stripUndefinedDeep, generateShareCode, ensureParticipantSession, mapManualQuiz, mapCompetition, mapParticipant, mapAttempt, getAvailableShareCode, writeShareCode, getShareCode, resolveShareCode } from './manualQuizCore';

export const createCompetition = async (
  quizId: string,
  userId: string,
  title: string,
  description: string,
  startDate: Date,
  endDate: Date
): Promise<string> => {
  try {
    const shareCode = await getAvailableShareCode('competition');
    const competitionData = {
      quizId,
      creatorId: userId,
      ownerId: userId,
      title,
      description,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      shareCode,
      isActive: true,
      status: 'active',
      createdAt: serverTimestamp(),
      participantsCount: 0,
    };

    const docRef = await addDoc(collection(db, 'competitions'), competitionData);
    await writeShareCode(shareCode, 'competition', docRef.id, userId);
    await updateDoc(doc(db, 'quizzes', quizId), {
      visibility: 'by_code',
      isPublic: true,
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la creation de la competition:', error);
    throw new Error(`Echec de la creation de la competition: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getCompetitionByShareCode = async (shareCode: string): Promise<Competition | null> => {
  try {
    const resolved = await resolveShareCode(shareCode, 'competition');
    return getCompetitionById(resolved.targetId);
  } catch (error) {
    console.error('Erreur lors de la recuperation de la competition:', error);
    throw new Error(`Echec de la recuperation de la competition: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getCompetitionById = async (competitionId: string): Promise<Competition | null> => {
  try {
    const docRef = doc(db, 'competitions', competitionId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? mapCompetition(docSnap.id, docSnap.data()) : null;
  } catch (error) {
    console.error('Erreur lors de la recuperation de la competition:', error);
    throw new Error(`Echec de la recuperation de la competition: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getCompetitionLeaderboard = async (competitionId: string): Promise<Participant[]> => {
  try {
    const participants = await getCompetitionParticipants(competitionId);
    return participants
      .filter((participant) => participant.completedAt)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((participant, index) => ({ ...participant, rank: index + 1 }));
  } catch (error) {
    console.error('Erreur lors de la recuperation du classement:', error);
    throw new Error(`Echec de la recuperation du classement: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getCompetitionStats = async (competitionId: string): Promise<CompetitionStats> => {
  try {
    const [participants, attempts] = await Promise.all([
      getCompetitionParticipants(competitionId),
      getCompetitionAttempts(competitionId),
    ]);

    const completedAttempts = attempts.filter((attempt) => attempt.completedAt && typeof attempt.score === 'number');
    const averageScore = completedAttempts.length
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length
      : 0;

    return {
      totalParticipants: participants.length,
      completedAttempts: completedAttempts.length,
      averageScore,
      participationRate: participants.length ? (completedAttempts.length / participants.length) * 100 : 0,
    };
  } catch (error) {
    console.error('Erreur lors de la recuperation des statistiques:', error);
    throw new Error(`Echec de la recuperation des statistiques: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getCompetitionParticipants = async (competitionId: string): Promise<Participant[]> => {
  const snapshot = await getDocs(query(collection(db, 'competitions', competitionId, 'participants'), orderBy('joinedAt', 'desc')));
  return snapshot.docs.map((participantDoc) => mapParticipant(participantDoc.id, participantDoc.data()));
};

export const getCompetitionAttempts = async (competitionId: string): Promise<Attempt[]> => {
  const snapshot = await getDocs(query(collection(db, 'competitions', competitionId, 'attempts'), orderBy('startedAt', 'desc')));
  return snapshot.docs.map((attemptDoc) => mapAttempt(attemptDoc.id, attemptDoc.data()));
};

export const listenToCompetitionParticipants = (
  competitionId: string,
  callback: (participants: Participant[]) => void
): (() => void) => {
  const participantsQuery = query(collection(db, 'competitions', competitionId, 'participants'), orderBy('joinedAt', 'desc'));
  return onSnapshot(participantsQuery, (snapshot) => {
    callback(snapshot.docs.map((participantDoc) => mapParticipant(participantDoc.id, participantDoc.data())));
  });
};

export const listenToCompetitionAttempts = (
  competitionId: string,
  callback: (attempts: Attempt[]) => void
): (() => void) => {
  const attemptsQuery = query(collection(db, 'competitions', competitionId, 'attempts'), orderBy('startedAt', 'desc'));
  return onSnapshot(attemptsQuery, (snapshot) => {
    callback(snapshot.docs.map((attemptDoc) => mapAttempt(attemptDoc.id, attemptDoc.data())));
  });
};