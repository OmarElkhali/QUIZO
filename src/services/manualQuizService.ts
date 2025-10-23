import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { ManualQuiz, ManualQuestion, Competition, Participant, Attempt } from '@/types/quiz';

// Génération d'un code de partage aléatoire
export const generateShareCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Création d'un quiz manuel
export const createManualQuiz = async (userId: string, title: string, description: string): Promise<string> => {
  try {
    const quizData = {
      creatorId: userId,
      title,
      description,
      questions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: false,
    };
    
    const docRef = await addDoc(collection(db, 'quizzes'), quizData);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du quiz manuel:', error);
    throw new Error(`Échec de la création du quiz manuel: ${error.message}`);
  }
};

// Récupération d'un quiz manuel
export const getManualQuiz = async (quizId: string): Promise<ManualQuiz | null> => {
  try {
    console.log('Tentative de récupération du quiz avec ID:', quizId);
    const docRef = doc(db, 'quizzes', quizId);
    console.log('Référence du document créée');
    const docSnap = await getDoc(docRef);
    console.log('Document récupéré, existe:', docSnap.exists());
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    console.log('Données du quiz:', data);
    return {
      id: docSnap.id,
      title: data.title || 'Quiz sans titre',
      description: data.description || '',
      questions: data.questions || [],
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      creatorId: data.creatorId,
      isPublic: data.isPublic || false,
      timeLimit: data.timeLimit,
      shareCode: data.shareCode
    };
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération du quiz manuel:', error);
    throw new Error(`Échec de la récupération du quiz manuel: ${error.message}`);
  }
};

// Mise à jour d'un quiz manuel
export const updateManualQuiz = async (quizId: string, updates: Partial<ManualQuiz>): Promise<void> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const { id, ...updateData } = updates;
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quiz manuel:', error);
    throw new Error(`Échec de la mise à jour du quiz manuel: ${error.message}`);
  }
};

// Ajout d'une question à un quiz manuel
export const addQuestionToManualQuiz = async (quizId: string, question: ManualQuestion): Promise<string> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Quiz non trouvé');
    }
    
    const data = docSnap.data();
    const questions = data.questions || [];
    
    // Générer un ID unique pour la question
    const questionId = `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newQuestion = { ...question, id: questionId };
    
    questions.push(newQuestion);
    
    await updateDoc(docRef, {
      questions,
      updatedAt: serverTimestamp(),
    });
    
    return questionId;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la question:', error);
    throw new Error(`Échec de l'ajout de la question: ${error.message}`);
  }
};

// Mise à jour d'une question dans un quiz manuel
export const updateQuestionInManualQuiz = async (quizId: string, questionId: string, updates: Partial<ManualQuestion>): Promise<void> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Quiz non trouvé');
    }
    
    const data = docSnap.data();
    const questions = data.questions || [];
    
    const questionIndex = questions.findIndex((q: ManualQuestion) => q.id === questionId);
    
    if (questionIndex === -1) {
      throw new Error('Question non trouvée');
    }
    
    questions[questionIndex] = { ...questions[questionIndex], ...updates };
    
    await updateDoc(docRef, {
      questions,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la question:', error);
    throw new Error(`Échec de la mise à jour de la question: ${error.message}`);
  }
};

// Suppression d'une question d'un quiz manuel
export const deleteQuestionFromManualQuiz = async (quizId: string, questionId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Quiz non trouvé');
    }
    
    const data = docSnap.data();
    let questions = data.questions || [];
    
    questions = questions.filter((q: ManualQuestion) => q.id !== questionId);
    
    await updateDoc(docRef, {
      questions,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la question:', error);
    throw new Error(`Échec de la suppression de la question: ${error.message}`);
  }
};

// Création d'une compétition
export const createCompetition = async (quizId: string, userId: string, title: string, description: string, startDate: Date, endDate: Date): Promise<string> => {
  try {
    const shareCode = generateShareCode();
    
    const competitionData = {
      quizId,
      creatorId: userId,
      title,
      description,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      shareCode,
      isActive: true,
      createdAt: serverTimestamp(),
      participantsCount: 0
    };
    
    const docRef = await addDoc(collection(db, 'competitions'), competitionData);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la compétition:', error);
    throw new Error(`Échec de la création de la compétition: ${error.message}`);
  }
};

// Récupération d'une compétition par code de partage
export const getCompetitionByShareCode = async (shareCode: string): Promise<Competition | null> => {
  try {
    const q = query(
      collection(db, 'competitions'),
      where('shareCode', '==', shareCode),
      where('isActive', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      quizId: data.quizId,
      creatorId: data.creatorId,
      title: data.title,
      description: data.description || '',
      startDate: data.startDate.toDate().toISOString(),
      endDate: data.endDate.toDate().toISOString(),
      shareCode: data.shareCode,
      isActive: data.isActive,
      participantsCount: data.participantsCount || 0
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la compétition:', error);
    throw new Error(`Échec de la récupération de la compétition: ${error.message}`);
  }
};

// Récupération d'une compétition par ID
export const getCompetitionById = async (competitionId: string): Promise<Competition | null> => {
  try {
    const docRef = doc(db, 'competitions', competitionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      quizId: data.quizId,
      creatorId: data.creatorId,
      title: data.title,
      description: data.description || '',
      startDate: data.startDate.toDate().toISOString(),
      endDate: data.endDate.toDate().toISOString(),
      shareCode: data.shareCode,
      isActive: data.isActive,
      participantsCount: data.participantsCount || 0
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de la compétition:', error);
    throw new Error(`Échec de la récupération de la compétition: ${error.message}`);
  }
};

// Ajout d'un participant à une compétition
export const addParticipantToCompetition = async (competitionId: string, userId: string, name: string): Promise<string> => {
  try {
    const participantData = {
      competitionId,
      userId,
      name,
      joinedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'participants'), participantData);
    
    // Mettre à jour le compteur de participants
    const competitionRef = doc(db, 'competitions', competitionId);
    await updateDoc(competitionRef, {
      participantsCount: increment(1)
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du participant:', error);
    throw new Error(`Échec de l'ajout du participant: ${error.message}`);
  }
};

// Création d'une tentative
export const createAttempt = async (competitionId: string, participantId: string): Promise<string> => {
  try {
    const attemptData = {
      competitionId,
      participantId,
      startedAt: serverTimestamp(),
      answers: {}
    };
    
    const docRef = await addDoc(collection(db, 'attempts'), attemptData);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la tentative:', error);
    throw new Error(`Échec de la création de la tentative: ${error.message}`);
  }
};

// Soumission des réponses d'une tentative
export const submitAttemptAnswers = async (attemptId: string, answers: Record<string, string>, quizId: string): Promise<number> => {
  try {
    const attemptRef = doc(db, 'attempts', attemptId);
    const quizRef = doc(db, 'quizzes', quizId);
    
    const [attemptSnap, quizSnap] = await Promise.all([
      getDoc(attemptRef),
      getDoc(quizRef)
    ]);
    
    if (!attemptSnap.exists() || !quizSnap.exists()) {
      throw new Error('Tentative ou quiz non trouvé');
    }
    
    const quizData = quizSnap.data();
    const questions = quizData.questions || [];
    
    // Calculer le score
    let score = 0;
    let totalPoints = 0;
    
    questions.forEach((question: ManualQuestion) => {
      totalPoints += question.points;
      const correctOption = question.options.find(option => option.isCorrect);
      if (correctOption && answers[question.id] === correctOption.id) {
        score += question.points;
      }
    });
    
    const percentageScore = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    
    // Mettre à jour la tentative
    await updateDoc(attemptRef, {
      answers,
      completedAt: serverTimestamp(),
      score: percentageScore
    });
    
    // Mettre à jour le participant avec le score
    const attemptData = attemptSnap.data();
    const participantRef = doc(db, 'participants', attemptData.participantId);
    
    await updateDoc(participantRef, {
      score: percentageScore,
      completedAt: serverTimestamp()
    });
    
    return percentageScore;
  } catch (error) {
    console.error('Erreur lors de la soumission des réponses:', error);
    throw new Error(`Échec de la soumission des réponses: ${error.message}`);
  }
};

// Récupération du classement d'une compétition
export const getCompetitionLeaderboard = async (competitionId: string): Promise<Participant[]> => {
  try {
    const q = query(
      collection(db, 'participants'),
      where('competitionId', '==', competitionId),
      where('completedAt', '!=', null),
      orderBy('completedAt'),
      orderBy('score', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const participants: Participant[] = [];
    
    // Utiliser un compteur manuel au lieu du deuxième paramètre
    let rank = 1;
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      participants.push({
        id: docSnapshot.id,
        competitionId: data.competitionId,
        userId: data.userId,
        name: data.name,
        joinedAt: data.joinedAt.toDate().toISOString(),
        score: data.score,
        completedAt: data.completedAt ? data.completedAt.toDate().toISOString() : undefined,
        rank: rank++
      });
    });
    
    return participants;
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    throw new Error(`Échec de la récupération du classement: ${error.message}`);
  }
};

// Récupération des statistiques d'une compétition pour le tableau de bord du créateur
export const getCompetitionStats = async (competitionId: string): Promise<any> => {
  try {
    const participantsQuery = query(
      collection(db, 'participants'),
      where('competitionId', '==', competitionId)
    );
    
    const attemptsQuery = query(
      collection(db, 'attempts'),
      where('competitionId', '==', competitionId),
      where('completedAt', '!=', null)
    );
    
    const [participantsSnapshot, attemptsSnapshot] = await Promise.all([
      getDocs(participantsQuery),
      getDocs(attemptsQuery)
    ]);
    
    const totalParticipants = participantsSnapshot.size;
    const completedAttempts = attemptsSnapshot.size;
    
    let totalScore = 0;
    attemptsSnapshot.forEach(doc => {
      const data = doc.data();
      totalScore += data.score || 0;
    });
    
    const averageScore = completedAttempts > 0 ? totalScore / completedAttempts : 0;
    
    return {
      totalParticipants,
      completedAttempts,
      averageScore,
      participationRate: totalParticipants > 0 ? (completedAttempts / totalParticipants) * 100 : 0
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw new Error(`Échec de la récupération des statistiques: ${error.message}`);
  }
};

// ===== NOUVELLES FONCTIONS POUR LE MODE TEMPS RÉEL =====

/**
 * Récupérer tous les participants d'un quiz
 */
export const getQuizParticipants = async (quizId: string): Promise<Participant[]> => {
  try {
    const participantsRef = collection(db, 'quizzes', quizId, 'participants');
    const q = query(participantsRef, orderBy('joinedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Participant));
  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error);
    throw new Error(`Échec de la récupération des participants: ${error.message}`);
  }
};

/**
 * Récupérer toutes les tentatives d'un quiz
 */
export const getQuizAttempts = async (quizId: string): Promise<Attempt[]> => {
  try {
    const attemptsRef = collection(db, 'quizzes', quizId, 'attempts');
    const q = query(attemptsRef, orderBy('startedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Attempt));
  } catch (error) {
    console.error('Erreur lors de la récupération des tentatives:', error);
    throw new Error(`Échec de la récupération des tentatives: ${error.message}`);
  }
};

/**
 * Mettre à jour le statut d'un quiz
 */
export const updateQuizStatus = async (quizId: string, status: 'draft' | 'active' | 'completed'): Promise<void> => {
  try {
    const quizRef = doc(db, 'quizzes', quizId);
    await updateDoc(quizRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw new Error(`Échec de la mise à jour du statut: ${error.message}`);
  }
};

/**
 * Écouter les changements des participants en temps réel
 */
export const listenToParticipants = (quizId: string, callback: (participants: Participant[]) => void): (() => void) => {
  const participantsRef = collection(db, 'quizzes', quizId, 'participants');
  const q = query(participantsRef, orderBy('joinedAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const participants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Participant));
    
    callback(participants);
  });
  
  return unsubscribe;
};

/**
 * Écouter les changements des tentatives en temps réel
 */
export const listenToAttempts = (quizId: string, callback: (attempts: Attempt[]) => void): (() => void) => {
  const attemptsRef = collection(db, 'quizzes', quizId, 'attempts');
  const q = query(attemptsRef, orderBy('startedAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const attempts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Attempt));
    
    callback(attempts);
  });
  
  return unsubscribe;
};

/**
 * Ajouter un participant à un quiz
 */
export const addParticipantToQuiz = async (
  quizId: string, 
  userId: string, 
  name: string, 
  email?: string
): Promise<string> => {
  try {
    const participantData = {
      quizId,
      userId,
      name,
      email: email || null,
      joinedAt: serverTimestamp(),
      isActive: false,
      currentQuestionIndex: 0,
    };
    
    const participantRef = await addDoc(
      collection(db, 'quizzes', quizId, 'participants'),
      participantData
    );
    
    return participantRef.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du participant:', error);
    throw new Error(`Échec de l'ajout du participant: ${error.message}`);
  }
};

/**
 * Créer une tentative pour un participant
 */
export const createQuizAttempt = async (
  quizId: string,
  participantId: string,
  userId: string
): Promise<string> => {
  try {
    const attemptData = {
      quizId,
      participantId,
      userId,
      startedAt: serverTimestamp(),
      answers: {},
    };
    
    const attemptRef = await addDoc(
      collection(db, 'quizzes', quizId, 'attempts'),
      attemptData
    );
    
    // Mettre à jour le participant pour indiquer qu'il est actif
    const participantRef = doc(db, 'quizzes', quizId, 'participants', participantId);
    await updateDoc(participantRef, {
      isActive: true
    });
    
    return attemptRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la tentative:', error);
    throw new Error(`Échec de la création de la tentative: ${error.message}`);
  }
};

/**
 * Mettre à jour la progression d'un participant
 */
export const updateParticipantProgress = async (
  quizId: string,
  participantId: string,
  currentQuestionIndex: number
): Promise<void> => {
  try {
    const participantRef = doc(db, 'quizzes', quizId, 'participants', participantId);
    await updateDoc(participantRef, {
      currentQuestionIndex,
      isActive: true
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    throw new Error(`Échec de la mise à jour de la progression: ${error.message}`);
  }
};

/**
 * Soumettre les réponses d'une tentative de quiz
 */
export const submitQuizAttempt = async (
  quizId: string,
  attemptId: string,
  participantId: string,
  answers: Record<string, string>
): Promise<number> => {
  try {
    // Récupérer le quiz pour calculer le score
    const quizRef = doc(db, 'quizzes', quizId);
    const quizDoc = await getDoc(quizRef);
    
    if (!quizDoc.exists()) {
      throw new Error('Quiz non trouvé');
    }
    
    const quiz = quizDoc.data() as ManualQuiz;
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;
    
    // Calculer le score
    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const correctOption = question.options.find(opt => opt.isCorrect);
      
      if (correctOption && userAnswer === correctOption.id) {
        correctAnswers++;
      }
    });
    
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Mettre à jour la tentative
    const attemptRef = doc(db, 'quizzes', quizId, 'attempts', attemptId);
    const attemptDoc = await getDoc(attemptRef);
    const attemptData = attemptDoc.data();
    const startTime = attemptData?.startedAt?.toDate?.() || new Date();
    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    await updateDoc(attemptRef, {
      answers,
      score,
      completedAt: serverTimestamp(),
      timeSpent
    });
    
    // Mettre à jour le participant
    const participantRef = doc(db, 'quizzes', quizId, 'participants', participantId);
    await updateDoc(participantRef, {
      score,
      completedAt: serverTimestamp(),
      isActive: false
    });
    
    return score;
  } catch (error) {
    console.error('Erreur lors de la soumission des réponses:', error);
    throw new Error(`Échec de la soumission des réponses: ${error.message}`);
  }
};

/**
 * Récupérer un quiz par son shareCode
 */
export const getQuizByShareCode = async (shareCode: string): Promise<ManualQuiz | null> => {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const q = query(quizzesRef, where('shareCode', '==', shareCode), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ManualQuiz;
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error);
    throw new Error(`Échec de la récupération du quiz: ${error.message}`);
  }
};

/**
 * Générer et assigner un shareCode à un quiz
 */
export const generateAndAssignShareCode = async (quizId: string): Promise<string> => {
  try {
    let shareCode = generateShareCode();
    let isUnique = false;
    
    // Vérifier l'unicité du code
    while (!isUnique) {
      const existingQuiz = await getQuizByShareCode(shareCode);
      if (!existingQuiz) {
        isUnique = true;
      } else {
        shareCode = generateShareCode();
      }
    }
    
    // Assigner le code au quiz
    const quizRef = doc(db, 'quizzes', quizId);
    await updateDoc(quizRef, {
      shareCode,
      updatedAt: serverTimestamp()
    });
    
    return shareCode;
  } catch (error) {
    console.error('Erreur lors de la génération du code de partage:', error);
    throw new Error(`Échec de la génération du code de partage: ${error.message}`);
  }
};