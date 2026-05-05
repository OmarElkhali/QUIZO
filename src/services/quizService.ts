import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { AIModelType, Quiz, Question } from '@/types/quiz';
import { uploadFileToSupabase } from './storageService';
import { getAuth, signInAnonymously } from 'firebase/auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : String(error)
);

const getErrorCode = (error: unknown): string | undefined => (
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : undefined
);

export const uploadFile = async (file: File, userId: string): Promise<string> => {
  try {
    console.log('Téléchargement du fichier:', file.name);
    const fileUrl = await uploadFileToSupabase(file, userId);
    console.log('Fichier téléchargé avec succès:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Erreur de téléchargement:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const extractTextFromFile = async (fileUrl: string, fileType: string): Promise<string> => {
  try {
    console.log(`Extraction du texte de ${fileUrl} (${fileType})`);
    
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Échec du téléchargement du fichier: ${response.statusText}`);
    }
    
    if (fileType.includes('text') || fileType.includes('txt')) {
      return await response.text();
    }
    
    throw new Error('Format de fichier non supporté');
  } catch (error) {
    console.error('Erreur d\'extraction de texte:', error);
    throw new Error(`Echec de l'extraction: ${getErrorMessage(error)}`);
  }
};

export const generateQuizQuestions = async (
  text: string,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  additionalInfo?: string,
  modelType: AIModelType = 'gemini',
  progressCallback?: (progress: number) => void
): Promise<Question[]> => {
  try {
    console.log(`Génération de ${numQuestions} questions avec le modèle ${modelType}...`);
    
    // Utilisation de l'API backend Python pour les deux modèles
    console.log(`Appel de l'API backend a ${BACKEND_URL}/generate pour le modele ${modelType}`);
    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        numQuestions, 
        difficulty, 
        additionalInfo,
        modelType
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API backend (${modelType}):`, errorText);
      throw new Error(`Erreur API backend (${response.status}): ${errorText}`);
    }
    
    const data = await response.json() as { questions?: Question[]; warning?: string };
    const questions = data.questions;
    
    if (data.warning) {
      console.warn("Avertissement du backend:", data.warning);
    }

    if (!questions || questions.length === 0) {
      throw new Error(`Aucune question générée par l'API backend (${modelType})`);
    }
    
    // Validation des questions générées (déplacée hors du bloc try/catch API)
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.warn("Format de questions invalide ou vide reçu du backend, utilisation du fallback");
      // Création de questions de secours basiques si le backend renvoie des données invalides
      const fallbackQuestions: Question[] = [];
      for (let i = 0; i < numQuestions; i++) {
        fallbackQuestions.push({
          id: `invalid_q${i+1}`,
          text: `Question invalide ${i+1}?`, // Texte indiquant un format invalide
          options: [
            {id: `invalid_q${i+1}_a`, text: "Option Invalide A", isCorrect: true},
            {id: `invalid_q${i+1}_b`, text: "Option Invalide B", isCorrect: false},
            {id: `invalid_q${i+1}_c`, text: "Option Invalide C", isCorrect: false},
            {id: `invalid_q${i+1}_d`, text: "Option Invalide D", isCorrect: false}
          ],
          explanation: "Ceci est une question de secours car le format reçu était invalide.",
          difficulty: difficulty
        });
      }
      return fallbackQuestions;
    }

    // Assurer que chaque question a un ID unique et les options aussi
    const validatedQuestions = questions.map((q, index) => ({
      ...q,
      id: q.id || `gen_q${index + 1}`, // Assigner un ID si manquant
      options: q.options.map((opt, optIndex) => ({
        ...opt,
        id: opt.id || `gen_q${index + 1}_opt${optIndex + 1}` // Assigner un ID d'option si manquant
      }))
    }));

    console.log(`Génération réussie: ${validatedQuestions.length} questions reçues.`);
    return validatedQuestions;
  } catch (error) {
    console.error('Erreur de génération de quiz:', error);
    throw error;
  }
};

async function refreshAuthToken() {
  const auth = getAuth();
  if (auth.currentUser) {
    try {
      console.log('Rafraîchissement du token d\'authentification...');
      console.log('État de l\'utilisateur avant rafraîchissement:', auth.currentUser.uid);
      
      // Forcer le rafraîchissement du token
      await auth.currentUser.getIdToken(true);
      
      // Vérifier si le token est valide
      const token = await auth.currentUser.getIdToken();
      console.log('Token rafraîchi avec succès, longueur:', token.length);
      console.log('État de l\'utilisateur après rafraîchissement:', auth.currentUser.uid);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      // Tentative de reconnexion si le token est invalide
      try {
        await signInAnonymously(auth);
        console.log('Reconnexion anonyme réussie');
      } catch (signInError) {
        console.error('Échec de la reconnexion:', signInError);
      }
    }
  } else {
    console.error('Aucun utilisateur connecté pour rafraîchir le token');
  }
}

export const createQuiz = async (
  userId: string, 
  title: string, 
  description: string, 
  questions: Question[],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  timeLimit?: number
): Promise<string> => {
  try {
    console.log('Création du quiz:', title);
    
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }
    
    // Rafraîchir le token avant de sauvegarder
    await refreshAuthToken();
    
    let parsedTimeLimit = null;
    if (timeLimit !== undefined && timeLimit !== null) {
      parsedTimeLimit = Number(timeLimit);
      if (isNaN(parsedTimeLimit)) {
        parsedTimeLimit = null;
      }
    }
    
    const quizData = {
      creatorId: userId,  // Au lieu de userId
      title,
      description,
      questions,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completionRate: 0,
      duration: parsedTimeLimit ? `${parsedTimeLimit} min` : `${Math.round(questions.length * 1.5)} min`,
      participants: 0,
      collaborators: [],
      collaboratorUids: [],
      invitedEmails: [],
      isShared: false,
      visibility: 'private',
      mode: 'async',
      status: 'active',
      difficulty,
      timeLimit: parsedTimeLimit
    };
    
    console.log('Données du quiz à créer:', quizData);
    
    const docRef = await addDoc(collection(db, 'quizzes'), quizData);
    console.log('Quiz créé avec ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erreur de création de quiz:', error);
    throw new Error(`Échec de la création du quiz: ${error.message}`);
  }
};

export const getQuizzes = async (userId: string): Promise<Quiz[]> => {
  try {
    console.log('🔍 [getQuizzes] Récupération des quiz pour l\'utilisateur:', userId);
    
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }
    
    // Vérifier si l'utilisateur est authentifié
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }
    
    console.log('🔑 [getQuizzes] Utilisateur Firebase Auth:', {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email
    });
    
    const q = query(
      collection(db, 'quizzes'), 
      where('creatorId', '==', userId)
    );
    
    console.log('🔄 [getQuizzes] Exécution de la requête Firestore avec filtre creatorId ==', userId);
    const querySnapshot = await getDocs(q);
    console.log('✅ [getQuizzes] Requête Firestore terminée -', querySnapshot.size, 'documents trouvés');
    
    const quizzes: Quiz[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 [getQuizzes] Document trouvé:', {
        id: doc.id,
        creatorId: data.creatorId,
        userId: data.userId,
        title: data.title
      });
      
      quizzes.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        questions: data.questions || [],
        createdAt: data.createdAt?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        completionRate: data.completionRate || 0,
        duration: data.duration || '30 min',
        participants: data.participants || 0,
        collaborators: data.collaborators || [],
        collaboratorUids: data.collaboratorUids || [],
        invitedEmails: data.invitedEmails || [],
        isShared: data.isShared || false,
        shareCode: data.shareCode,
        visibility: data.visibility || (data.shareCode ? 'by_code' : 'private'),
        mode: data.mode || 'async',
        status: data.status || 'active',
      });
    });
    
    console.log(`${quizzes.length} quiz récupérés pour l'utilisateur ${userId}`);
    return quizzes;
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error);
    if (error.code === 'permission-denied') {
      throw new Error('Permission refusée. Veuillez vérifier que vous êtes connecté.');
    }
    throw new Error(`Impossible de récupérer les quiz: ${error.message}`);
  }
};

export const getSharedQuizzes = async (userId: string): Promise<Quiz[]> => {
  const q = query(
    collection(db, 'quizzes'), 
    where('collaboratorUids', 'array-contains', userId)
  );
  
  const querySnapshot = await getDocs(q);
  const quizzes: Quiz[] = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    quizzes.push({
      id: doc.id,
      title: data.title,
      description: data.description,
      questions: data.questions,
      createdAt: data.createdAt.toDate().toISOString().split('T')[0],
      completionRate: data.completionRate,
      duration: data.duration,
      participants: data.participants,
      collaborators: data.collaborators || [],
      collaboratorUids: data.collaboratorUids || [],
      invitedEmails: data.invitedEmails || [],
      shareCode: data.shareCode,
      visibility: data.visibility || (data.shareCode ? 'by_code' : 'private'),
      isShared: true,
    });
  });
  
  return quizzes;
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  const startedAt = performance.now();
  console.group(`[quizService] Recuperation du quiz ${quizId}`);

  try {
    if (!quizId) {
      console.error('[quizService] ID du quiz manquant');
      throw new Error('ID du quiz manquant');
    }

    console.log('[quizService] Tentative de récupération depuis Firestore...');
    const docRef = doc(db, 'quizzes', quizId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.warn(`[quizService] Quiz ${quizId} non trouvé dans Firestore`);
      return null;
    }
    
    console.log('[quizService] Quiz trouvé dans Firestore, extraction des données...');

    const data = docSnap.data();
    if (!data || !data.questions || !Array.isArray(data.questions)) {
      console.error('[quizService] Structure de quiz invalide');
      return null;
    }

    console.log('[quizService] Données du quiz:', {
      id: docSnap.id,
      title: data.title,
      questionsCount: data.questions?.length || 0,
      createdAt: data.createdAt
    });
    
    return {
      id: docSnap.id,
      title: data.title || 'Quiz sans titre',
      description: data.description || 'Description non disponible', 
      questions: data.questions,
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      completionRate: data.completionRate || 0,
      duration: data.duration || '30 min',
      participants: data.participants || 0,
      collaborators: data.collaborators || [],
      collaboratorUids: data.collaboratorUids || [],
      invitedEmails: data.invitedEmails || [],
      isShared: data.isShared || false,
      difficulty: data.difficulty || 'medium',
      timeLimit: data.timeLimit || null,
      shareCode: data.shareCode,
      visibility: data.visibility || (data.shareCode ? 'by_code' : 'private'),
      mode: data.mode || 'async',
      status: data.status || 'active'
    };
  } catch (error) {
    console.error('[quizService] Erreur lors de la récupération du quiz:', error);
    throw new Error(`Echec de la recuperation du quiz: ${getErrorMessage(error)}`);
  } finally {
    console.info(`[quizService] Chargement termine en ${Math.round(performance.now() - startedAt)}ms`);
    console.groupEnd();
  }
};

export const submitQuizAnswers = async (
  quizId: string,
  userId: string,
  answers: Record<string, string>
): Promise<{ quizId: string; submissionId: string; score: number }> => {
  await refreshAuthToken();

  const quizDocRef = doc(db, 'quizzes', quizId);
  const quizDoc = await getDoc(quizDocRef);

  if (!quizDoc.exists()) {
    throw new Error('Quiz not found');
  }

  const quizData = quizDoc.data() as Quiz;
  let score = 0;
  const totalQuestions = quizData.questions.length;

  quizData.questions.forEach(question => {
    const correctAnswer = question.options.find(option => option.isCorrect)?.id;
    if (answers[question.id] === correctAnswer) {
      score++;
    }
  });

  const percentageScore = (score / totalQuestions) * 100;

  const submissionData = {
    quizId,
    userId,
    answers,
    score: percentageScore,
    submittedAt: serverTimestamp(),
  };

  const submissionRef = await addDoc(collection(db, 'submissions'), submissionData);

  // Mettre à jour le quiz avec le nombre de participants et le taux de complétion
  await updateDoc(quizDocRef, {
    participants: (quizData.participants || 0) + 1,
    completionRate: 100, // Marquer le quiz comme terminé (100%)
  });

  return {
    quizId,
    submissionId: submissionRef.id,
    score: percentageScore,
  };
};

export const updateQuiz = async (
  quizId: string, 
  updates: Partial<Quiz>
): Promise<void> => {
  const docRef = doc(db, 'quizzes', quizId);
  
  const { id, ...updateData } = updates;
  
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  try {
    console.log('Suppression du quiz:', quizId);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }
    
    console.log('Utilisateur actuel:', currentUser.uid);
    
    const docRef = doc(db, 'quizzes', quizId);
    
    const quizDoc = await getDoc(docRef);
    if (!quizDoc.exists()) {
      throw new Error('Quiz introuvable');
    }
    
    const quizData = quizDoc.data();
    console.log('Données du quiz:', {
      userId: quizData.userId,
      creatorId: quizData.creatorId,
      ownerId: quizData.ownerId,
      currentUserId: currentUser.uid
    });
    
    // Vérifier que l'utilisateur est propriétaire avant de tenter la suppression
    const isOwner = quizData.userId === currentUser.uid || 
                    quizData.creatorId === currentUser.uid || 
                    quizData.ownerId === currentUser.uid;
    
    if (!isOwner) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer ce quiz');
    }
    
    await deleteDoc(docRef);
    
    console.log('Quiz supprimé avec succès de la base de données');
  } catch (error) {
    console.error('Erreur lors de la suppression du quiz:', error);
    
    // Messages d'erreur plus spécifiques
    if (getErrorCode(error) === 'permission-denied') {
      throw new Error('Permission refusée: Vous n\'êtes pas autorisé à supprimer ce quiz');
    }
    
    throw new Error(`Echec de la suppression du quiz: ${getErrorMessage(error)}`);
  }
};

/**
 * Générer un code de partage unique pour un quiz
 */
export const generateShareCode = (): string => {
  // Génère un code de 8 caractères alphanumériques
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans 0, O, 1, I pour éviter confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Obtenir ou créer le shareCode d'un quiz
 */
export const getOrCreateShareCode = async (quizId: string): Promise<string> => {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    const quizDoc = await getDoc(docRef);
    
    if (!quizDoc.exists()) {
      throw new Error('Quiz introuvable');
    }
    
    const quizData = quizDoc.data();
    
    // Si le quiz a déjà un shareCode, le retourner
    if (quizData.shareCode) {
      const shareCode = quizData.shareCode.toUpperCase();
      const ownerId = quizData.creatorId || quizData.userId || quizData.ownerId || getAuth().currentUser?.uid;

      if (ownerId) {
        await setDoc(doc(db, 'shareCodes', shareCode), {
          type: 'quiz',
          targetId: quizId,
          ownerId,
          status: 'active',
          createdAt: serverTimestamp(),
        }, { merge: true });

        await updateDoc(docRef, {
          isShared: true,
          isPublic: true,
          visibility: 'by_code',
          updatedAt: serverTimestamp(),
        });
      }

      return shareCode;
    }
    
    // Sinon, générer un nouveau code unique
    let shareCode = generateShareCode();
    let isUnique = false;
    
    // Vérifier que le code est unique
    while (!isUnique) {
      const q = query(collection(db, 'quizzes'), where('shareCode', '==', shareCode));
      const snapshot = await getDocs(q);
      const shareCodeDoc = await getDoc(doc(db, 'shareCodes', shareCode));
      
      if (snapshot.empty && !shareCodeDoc.exists()) {
        isUnique = true;
      } else {
        shareCode = generateShareCode();
      }
    }
    
    const ownerId = quizData.creatorId || quizData.userId || quizData.ownerId || getAuth().currentUser?.uid;
    if (!ownerId) {
      throw new Error('Proprietaire du quiz introuvable');
    }

    await setDoc(doc(db, 'shareCodes', shareCode), {
      type: 'quiz',
      targetId: quizId,
      ownerId,
      status: 'active',
      createdAt: serverTimestamp(),
    }, { merge: true });

    // Sauvegarder le shareCode dans le quiz
    await updateDoc(docRef, {
      shareCode,
      isShared: true,
      isPublic: true,
      visibility: 'by_code',
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ ShareCode généré pour le quiz ${quizId}: ${shareCode}`);
    return shareCode;
  } catch (error) {
    console.error('Erreur lors de la génération du shareCode:', error);
    throw new Error(`Impossible de générer le code de partage: ${error.message}`);
  }
};

/**
 * Rejoindre un quiz via son shareCode
 */
export const joinQuizByShareCode = async (shareCode: string): Promise<string> => {
  try {
    const normalizedCode = shareCode.trim().toUpperCase();
    const shareCodeDoc = await getDoc(doc(db, 'shareCodes', normalizedCode));

    if (shareCodeDoc.exists()) {
      const data = shareCodeDoc.data();
      if (data.type === 'quiz' && data.status === 'active' && data.targetId) {
        return data.targetId;
      }
    }

    console.log(`🔍 Recherche du quiz avec le code: ${shareCode}`);
    
    const q = query(
      collection(db, 'quizzes'),
      where('shareCode', '==', normalizedCode)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Code de partage invalide ou quiz introuvable');
    }
    
    const quizDoc = querySnapshot.docs[0];
    console.log(`✅ Quiz trouvé: ${quizDoc.id}`);
    
    return quizDoc.id;
  } catch (error) {
    console.error('Erreur lors de la recherche du quiz:', error);
    throw new Error(`Impossible de rejoindre le quiz: ${error.message}`);
  }
};

export const shareQuiz = async (
  quizId: string, 
  collaboratorEmail: string
): Promise<void> => {
  try {
    console.log(`📧 Partage du quiz ${quizId} avec ${collaboratorEmail}`);
    
    const docRef = doc(db, 'quizzes', quizId);
    const quizDoc = await getDoc(docRef);
    
    if (!quizDoc.exists()) {
      throw new Error('Quiz introuvable');
    }
    
    // Générer ou obtenir le shareCode
    const shareCode = await getOrCreateShareCode(quizId);
    
    // Ajouter l'email comme information d'invitation. Les droits passent par le code.
    await updateDoc(docRef, {
      invitedEmails: arrayUnion(collaboratorEmail),
      isShared: true,
      isPublic: true,
      visibility: 'by_code',
      updatedAt: serverTimestamp(),
    });
    
    // Construire le lien de partage
    const shareLink = `${window.location.origin}/join-quiz/${shareCode}`;
    
    console.log(`✅ Quiz partagé avec ${collaboratorEmail}`);
    console.log(`🔗 Lien de partage: ${shareLink}`);
    
    // TODO: Envoyer un email d'invitation avec le lien
    // Pour l'instant, on affiche juste un message
    // Vous pouvez intégrer un service comme SendGrid, Mailgun, ou Firebase Functions
    
  } catch (error) {
    console.error('Erreur lors du partage du quiz:', error);
    throw new Error(`Échec du partage: ${error.message}`);
  }
};

export const removeCollaborator = async (
  quizId: string, 
  collaboratorId: string
): Promise<void> => {
  const docRef = doc(db, 'quizzes', quizId);
  
  await updateDoc(docRef, {
    collaborators: arrayRemove(collaboratorId),
    collaboratorUids: arrayRemove(collaboratorId),
    invitedEmails: arrayRemove(collaboratorId),
  });
  
  const quizDoc = await getDoc(docRef);
  const collaborators = quizDoc.data()?.collaborators || [];
  
  if (collaborators.length === 0) {
    await updateDoc(docRef, {
      isShared: false,
    });
  }
};

// ========================================
// GESTION DES RÉSULTATS DE QUIZ
// ========================================

export interface QuizResult {
  id?: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // en secondes
  completedAt: Date;
  answers: {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
}

export interface QuizResultInput {
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  answers: {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
}

/**
 * Sauvegarder les résultats d'un quiz complété
 */
export const saveQuizResult = async (result: QuizResultInput): Promise<string> => {
  try {
    console.log('Sauvegarde des résultats du quiz:', result.quizId);
    
    const docRef = await addDoc(collection(db, 'quizResults'), {
      ...result,
      completedAt: serverTimestamp(),
    });
    
    console.log('Résultats sauvegardés avec succès:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des résultats:', error);
    throw new Error(`Échec de la sauvegarde des résultats: ${error.message}`);
  }
};

/**
 * Récupérer tous les résultats de quiz pour un utilisateur
 */
export const getUserQuizResults = async (userId: string): Promise<QuizResult[]> => {
  try {
    console.log('Récupération des résultats pour l\'utilisateur:', userId);
    
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }
    
    const q = query(
      collection(db, 'quizResults'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const results: QuizResult[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        userId: data.userId,
        quizId: data.quizId,
        quizTitle: data.quizTitle,
        score: data.score,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        timeSpent: data.timeSpent,
        completedAt: data.completedAt?.toDate() || new Date(),
        answers: data.answers || [],
      });
    });
    
    // Trier par date de complétion (plus récent en premier)
    results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    
    console.log(`${results.length} résultats récupérés`);
    return results;
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    throw new Error(`Impossible de récupérer les résultats: ${error.message}`);
  }
};

/**
 * Récupérer tous les résultats pour un quiz spécifique
 */
export const getQuizResults = async (quizId: string, userId: string): Promise<QuizResult[]> => {
  try {
    console.log('Récupération des résultats pour le quiz:', quizId);
    
    const q = query(
      collection(db, 'quizResults'),
      where('quizId', '==', quizId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const results: QuizResult[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        userId: data.userId,
        quizId: data.quizId,
        quizTitle: data.quizTitle,
        score: data.score,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        timeSpent: data.timeSpent,
        completedAt: data.completedAt?.toDate() || new Date(),
        answers: data.answers || [],
      });
    });
    
    // Trier par date (plus récent en premier)
    results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    
    return results;
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats du quiz:', error);
    throw new Error(`Impossible de récupérer les résultats: ${error.message}`);
  }
};
