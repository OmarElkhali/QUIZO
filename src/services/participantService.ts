import { auth, db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { Attempt, Competition, ManualQuestion, ManualQuiz, Participant, ShareCodeDoc } from '@/types/quiz';
import { QuizStatus, ShareCodeType, CompetitionStats, toIso, normalizeCode, isFirestorePermissionError, isAnonymousAuthDisabled, stripUndefinedDeep, generateShareCode, ensureParticipantSession, mapManualQuiz, mapCompetition, mapParticipant, mapAttempt, getAvailableShareCode, writeShareCode, getShareCode, resolveShareCode } from './manualQuizCore';
import { getCompetitionById } from './competitionService';

export const addParticipantToQuiz = async (
  quizId: string,
  _userId: string,
  name: string,
  email?: string
): Promise<string> => {
  try {
    const userId = await ensureParticipantSession();
    const participantsRef = collection(db, 'quizzes', quizId, 'participants');
    const participantRef = doc(participantsRef, userId);
    const existing = await getDoc(participantRef);

    if (existing.exists()) {
      await updateDoc(participantRef, {
        name,
        email: email || null,
        isActive: false,
        lastActivityAt: serverTimestamp(),
      });
      return participantRef.id;
    }

    const participantData = {
      quizId,
      userId,
      name,
      email: email || null,
      joinedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      isActive: false,
      currentQuestionIndex: 0,
    };

    await setDoc(participantRef, participantData);
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        'stats.participantsCount': increment(1),
        participants: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (statsError) {
      console.warn('Mise a jour des statistiques quiz ignoree:', statsError);
    }

    return participantRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout du participant:", error);
    throw new Error(`Echec de l'ajout du participant: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createQuizAttempt = async (
  quizId: string,
  participantId: string,
  _userId: string
): Promise<string> => {
  try {
    const userId = await ensureParticipantSession();
    const attemptData = {
      quizId,
      participantId,
      userId,
      startedAt: serverTimestamp(),
      answers: {},
    };

    const attemptRef = await addDoc(collection(db, 'quizzes', quizId, 'attempts'), attemptData);
    await updateParticipantProgress(quizId, participantId, 0);
    return attemptRef.id;
  } catch (error) {
    console.error('Erreur lors de la creation de la tentative:', error);
    throw new Error(`Echec de la creation de la tentative: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updateParticipantProgress = async (
  quizId: string,
  participantId: string,
  currentQuestionIndex: number
): Promise<void> => {
  try {
    const participantRef = doc(db, 'quizzes', quizId, 'participants', participantId);
    await updateDoc(participantRef, {
      currentQuestionIndex,
      isActive: true,
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise a jour de la progression:', error);
    throw new Error(`Echec de la mise a jour de la progression: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const recordQuizAttemptAnswer = async (
  quizId: string,
  attemptId: string,
  questionId: string,
  optionId: string
): Promise<void> => {
  const attemptRef = doc(db, 'quizzes', quizId, 'attempts', attemptId);
  await updateDoc(attemptRef, {
    [`answers.${questionId}`]: optionId,
  });
};

export const submitQuizAttempt = async (
  quizId: string,
  attemptId: string,
  participantId: string,
  answers: Record<string, string>
): Promise<number> => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    const attemptRef = doc(db, 'quizzes', quizId, 'attempts', attemptId);
    const [quizDoc, attemptDoc] = await Promise.all([getDoc(quizRef), getDoc(attemptRef)]);

    if (!quizDoc.exists() || !attemptDoc.exists()) throw new Error('Quiz ou tentative non trouve');

    const quiz = mapManualQuiz(quizDoc.id, quizDoc.data());
    const score = calculateScore(quiz.questions, answers);
    const attempt = mapAttempt(attemptDoc.id, attemptDoc.data());
    const startTime = new Date(attempt.startedAt).getTime();
    const timeSpent = Math.max(0, Math.floor((Date.now() - startTime) / 1000));

    await updateDoc(attemptRef, {
      answers,
      score,
      completedAt: serverTimestamp(),
      timeSpent,
    });

    const participantRef = doc(db, 'quizzes', quizId, 'participants', participantId);
    await updateDoc(participantRef, {
      score,
      completedAt: serverTimestamp(),
      isActive: false,
      lastActivityAt: serverTimestamp(),
    });

    try {
      await updateQuizStats(quizId);
    } catch (statsError) {
      console.warn('Mise a jour des statistiques quiz ignoree:', statsError);
    }
    return score;
  } catch (error) {
    console.error('Erreur lors de la soumission des reponses:', error);
    throw new Error(`Echec de la soumission des reponses: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getQuizParticipants = async (quizId: string): Promise<Participant[]> => {
  try {
    const snapshot = await getDocs(query(collection(db, 'quizzes', quizId, 'participants'), orderBy('joinedAt', 'desc')));
    return snapshot.docs.map((participantDoc) => mapParticipant(participantDoc.id, participantDoc.data()));
  } catch (error) {
    console.error('Erreur lors de la recuperation des participants:', error);
    throw new Error(`Echec de la recuperation des participants: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getQuizAttempts = async (quizId: string): Promise<Attempt[]> => {
  try {
    const snapshot = await getDocs(query(collection(db, 'quizzes', quizId, 'attempts'), orderBy('startedAt', 'desc')));
    return snapshot.docs.map((attemptDoc) => mapAttempt(attemptDoc.id, attemptDoc.data()));
  } catch (error) {
    console.error('Erreur lors de la recuperation des tentatives:', error);
    throw new Error(`Echec de la recuperation des tentatives: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getQuizAttempt = async (quizId: string, attemptId: string): Promise<Attempt | null> => {
  try {
    const attemptDoc = await getDoc(doc(db, 'quizzes', quizId, 'attempts', attemptId));
    if (!attemptDoc.exists()) return null;
    return mapAttempt(attemptDoc.id, attemptDoc.data());
  } catch (error) {
    console.error('Erreur lors de la recuperation de la tentative:', error);
    throw new Error(`Echec de la recuperation de la tentative: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updateQuizStatus = async (quizId: string, status: QuizStatus): Promise<void> => {
  try {
    await updateDoc(doc(db, 'quizzes', quizId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise a jour du statut:', error);
    throw new Error(`Echec de la mise a jour du statut: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const listenToParticipants = (quizId: string, callback: (participants: Participant[]) => void): (() => void) => {
  const participantsQuery = query(collection(db, 'quizzes', quizId, 'participants'), orderBy('joinedAt', 'desc'));
  return onSnapshot(participantsQuery, (snapshot) => {
    callback(snapshot.docs.map((participantDoc) => mapParticipant(participantDoc.id, participantDoc.data())));
  });
};

export const listenToAttempts = (quizId: string, callback: (attempts: Attempt[]) => void): (() => void) => {
  const attemptsQuery = query(collection(db, 'quizzes', quizId, 'attempts'), orderBy('startedAt', 'desc'));
  return onSnapshot(attemptsQuery, (snapshot) => {
    callback(snapshot.docs.map((attemptDoc) => mapAttempt(attemptDoc.id, attemptDoc.data())));
  });
};

export const addParticipantToCompetition = async (
  competitionId: string,
  _userId: string,
  name: string,
  email?: string
): Promise<string> => {
  try {
    const userId = await ensureParticipantSession();
    const competition = await getCompetitionById(competitionId);
    if (!competition) throw new Error('Competition introuvable');

    const participantsRef = collection(db, 'competitions', competitionId, 'participants');
    const participantRef = doc(participantsRef, userId);
    const existing = await getDoc(participantRef);

    if (existing.exists()) {
      await updateDoc(participantRef, {
        name,
        email: email || null,
        lastActivityAt: serverTimestamp(),
      });
      return participantRef.id;
    }

    const participantData = {
      competitionId,
      quizId: competition.quizId,
      userId,
      name,
      email: email || null,
      joinedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      isActive: false,
      currentQuestionIndex: 0,
    };

    await setDoc(participantRef, participantData);
    try {
      await updateDoc(doc(db, 'competitions', competitionId), {
        participantsCount: increment(1),
      });
    } catch (statsError) {
      console.warn('Mise a jour du compteur competition ignoree:', statsError);
    }

    return participantRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout du participant:", error);
    throw new Error(`Echec de l'ajout du participant: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createCompetitionAttempt = async (
  competitionId: string,
  participantId: string
): Promise<string> => {
  try {
    const userId = await ensureParticipantSession();
    const competition = await getCompetitionById(competitionId);
    if (!competition) throw new Error('Competition introuvable');

    const attemptRef = await addDoc(collection(db, 'competitions', competitionId, 'attempts'), {
      competitionId,
      quizId: competition.quizId,
      participantId,
      userId,
      startedAt: serverTimestamp(),
      answers: {},
    });

    await updateDoc(doc(db, 'competitions', competitionId, 'participants', participantId), {
      isActive: true,
      lastActivityAt: serverTimestamp(),
    });

    return attemptRef.id;
  } catch (error) {
    console.error('Erreur lors de la creation de la tentative:', error);
    throw new Error(`Echec de la creation de la tentative: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createAttempt = createCompetitionAttempt;

export const updateCompetitionParticipantProgress = async (
  competitionId: string,
  participantId: string,
  currentQuestionIndex: number
): Promise<void> => {
  await updateDoc(doc(db, 'competitions', competitionId, 'participants', participantId), {
    currentQuestionIndex,
    isActive: true,
    lastActivityAt: serverTimestamp(),
  });
};

export const recordCompetitionAttemptAnswer = async (
  competitionId: string,
  attemptId: string,
  questionId: string,
  optionId: string
): Promise<void> => {
  await updateDoc(doc(db, 'competitions', competitionId, 'attempts', attemptId), {
    [`answers.${questionId}`]: optionId,
  });
};

export const submitCompetitionAttempt = async (
  competitionId: string,
  attemptId: string,
  participantId: string,
  answers: Record<string, string>,
  quizId: string
): Promise<number> => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    const attemptRef = doc(db, 'competitions', competitionId, 'attempts', attemptId);
    const [quizDoc, attemptDoc] = await Promise.all([getDoc(quizRef), getDoc(attemptRef)]);

    if (!quizDoc.exists() || !attemptDoc.exists()) throw new Error('Tentative ou quiz non trouve');

    const quiz = mapManualQuiz(quizDoc.id, quizDoc.data());
    const score = calculateScore(quiz.questions, answers);
    const attempt = mapAttempt(attemptDoc.id, attemptDoc.data());
    const timeSpent = Math.max(0, Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000));

    await updateDoc(attemptRef, {
      answers,
      completedAt: serverTimestamp(),
      score,
      timeSpent,
    });

    await updateDoc(doc(db, 'competitions', competitionId, 'participants', participantId), {
      score,
      completedAt: serverTimestamp(),
      isActive: false,
      lastActivityAt: serverTimestamp(),
    });

    return score;
  } catch (error) {
    console.error('Erreur lors de la soumission des reponses:', error);
    throw new Error(`Echec de la soumission des reponses: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const submitAttemptAnswers = async (
  competitionId: string,
  attemptId: string,
  participantId: string,
  answers: Record<string, string>,
  quizId: string
): Promise<number> => submitCompetitionAttempt(competitionId, attemptId, participantId, answers, quizId);

const calculateScore = (questions: ManualQuestion[], answers: Record<string, string>): number => {
  let earned = 0;
  let total = 0;

  questions.forEach((question) => {
    const points = question.points || 1;
    total += points;
    const correctOption = question.options.find((option) => option.isCorrect);
    if (correctOption && answers[question.id] === correctOption.id) {
      earned += points;
    }
  });

  return total ? Math.round((earned / total) * 100) : 0;
};

const updateQuizStats = async (quizId: string): Promise<void> => {
  const [participants, attempts] = await Promise.all([
    getQuizParticipants(quizId),
    getQuizAttempts(quizId),
  ]);

  const completedAttempts = attempts.filter((attempt) => attempt.completedAt && typeof attempt.score === 'number');
  const averageScore = completedAttempts.length
    ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length
    : 0;

  await updateDoc(doc(db, 'quizzes', quizId), {
    participants: participants.length,
    completionRate: participants.length ? Math.round((completedAttempts.length / participants.length) * 100) : 0,
    stats: {
      participantsCount: participants.length,
      completedAttempts: completedAttempts.length,
      averageScore,
    },
    updatedAt: serverTimestamp(),
  });
};
