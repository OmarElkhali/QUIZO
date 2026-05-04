import { auth, db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { Attempt, Competition, ManualQuestion, ManualQuiz, Participant, ShareCodeDoc } from '@/types/quiz';
import { QuizStatus, ShareCodeType, CompetitionStats, toIso, normalizeCode, isFirestorePermissionError, isAnonymousAuthDisabled, stripUndefinedDeep, generateShareCode, ensureParticipantSession, mapManualQuiz, mapCompetition, mapParticipant, mapAttempt, getAvailableShareCode, writeShareCode, getShareCode, resolveShareCode } from './manualQuizCore';

export const createManualQuiz = async (userId: string, title: string, description: string): Promise<string> => {
  try {
    const quizData = {
      creatorId: userId,
      ownerId: userId,
      title,
      description,
      questions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: false,
      visibility: 'private',
      mode: 'async',
      status: 'active',
      invitedEmails: [],
      collaboratorUids: [],
      stats: {
        participantsCount: 0,
        completedAttempts: 0,
        averageScore: 0,
      },
    };

    const docRef = await addDoc(collection(db, 'quizzes'), quizData);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la creation du quiz manuel:', error);
    throw new Error(`Echec de la creation du quiz manuel: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getManualQuiz = async (quizId: string): Promise<ManualQuiz | null> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? mapManualQuiz(docSnap.id, docSnap.data()) : null;
  } catch (error) {
    console.error('Erreur detaillee lors de la recuperation du quiz manuel:', error);
    throw new Error(`Echec de la recuperation du quiz manuel: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updateManualQuiz = async (quizId: string, updates: Partial<ManualQuiz>): Promise<void> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const { id, createdAt, ...updateData } = updates;
    void id;
    void createdAt;

    const payload = stripUndefinedDeep({
      ...updateData,
      visibility: updates.isPublic ? 'by_code' : updates.visibility,
    });

    await updateDoc(docRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise a jour du quiz manuel:', error);
    throw new Error(`Echec de la mise a jour du quiz manuel: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const addQuestionToManualQuiz = async (quizId: string, question: ManualQuestion): Promise<string> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Quiz non trouve');

    const data = docSnap.data();
    const questions = Array.isArray(data.questions) ? data.questions : [];
    const questionId = `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newQuestion = stripUndefinedDeep({ ...question, id: questionId });

    await updateDoc(docRef, {
      questions: [...questions, newQuestion],
      updatedAt: serverTimestamp(),
    });

    return questionId;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la question:", error);
    throw new Error(`Echec de l'ajout de la question: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updateQuestionInManualQuiz = async (
  quizId: string,
  questionId: string,
  updates: Partial<ManualQuestion>
): Promise<void> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Quiz non trouve');

    const data = docSnap.data();
    const questions = Array.isArray(data.questions) ? data.questions as ManualQuestion[] : [];
    const questionIndex = questions.findIndex((question) => question.id === questionId);

    if (questionIndex === -1) throw new Error('Question non trouvee');

    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = stripUndefinedDeep({ ...updatedQuestions[questionIndex], ...updates });

    await updateDoc(docRef, {
      questions: updatedQuestions,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise a jour de la question:', error);
    throw new Error(`Echec de la mise a jour de la question: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteQuestionFromManualQuiz = async (quizId: string, questionId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Quiz non trouve');

    const data = docSnap.data();
    const questions = Array.isArray(data.questions) ? data.questions as ManualQuestion[] : [];

    await updateDoc(docRef, {
      questions: questions.filter((question) => question.id !== questionId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la question:', error);
    throw new Error(`Echec de la suppression de la question: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateAndAssignShareCode = async (quizId: string): Promise<string> => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizRef);
    if (!quizSnap.exists()) throw new Error('Quiz introuvable');

    const quiz = mapManualQuiz(quizSnap.id, quizSnap.data());
    if (quiz.shareCode) {
      const existing = await getShareCode(quiz.shareCode);
      if (!existing) await writeShareCode(quiz.shareCode, 'quiz', quiz.id, quiz.creatorId);
      return quiz.shareCode;
    }

    const shareCode = await getAvailableShareCode('quiz');
    await writeShareCode(shareCode, 'quiz', quiz.id, quiz.creatorId);
    await updateDoc(quizRef, {
      shareCode,
      visibility: 'by_code',
      isPublic: true,
      updatedAt: serverTimestamp(),
    });

    return shareCode;
  } catch (error) {
    console.error('Erreur lors de la generation du code de partage:', error);
    throw new Error(`Echec de la generation du code de partage: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getQuizByShareCode = async (shareCode: string): Promise<ManualQuiz | null> => {
  try {
    const resolved = await resolveShareCode(shareCode, 'quiz');
    return getManualQuiz(resolved.targetId);
  } catch (error) {
    console.error('Erreur lors de la recuperation du quiz:', error);
    throw new Error(`Echec de la recuperation du quiz: ${error instanceof Error ? error.message : String(error)}`);
  }
};