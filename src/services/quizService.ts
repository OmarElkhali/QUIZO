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
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { Quiz, Question } from '@/types/quiz';
import { uploadFileToSupabase } from './storageService';
import { getAuth, signInAnonymously } from 'firebase/auth';

export const uploadFile = async (file: File, userId: string): Promise<string> => {
  try {
    console.log('Téléchargement du fichier:', file.name);
    const fileUrl = await uploadFileToSupabase(file, userId);
    console.log('Fichier téléchargé avec succès:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Erreur de téléchargement:', error);
    throw new Error('Échec du téléchargement du fichier');
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
  } catch (error: any) {
    console.error('Erreur d\'extraction de texte:', error);
    throw new Error(`Échec de l'extraction: ${error.message}`);
  }
};

export const generateQuizQuestions = async (
  text: string,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  additionalInfo?: string,
  modelType: 'chatgpt' | 'gemini' = 'chatgpt',
  progressCallback?: (progress: number) => void
): Promise<Question[]> => {
  try {
    console.log(`Génération de ${numQuestions} questions avec le modèle ${modelType}...`);
    
    let questions;
    // Utilisation de l'API backend Python pour les deux modèles
    console.log(`Appel de l'API backend à /api/generate pour le modèle ${modelType}`);
    const response = await fetch('/api/generate', {
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
    
    const data = await response.json();
    questions = data.questions;
    
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
      userId,
      title,
      description,
      questions,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completionRate: 0,
      duration: parsedTimeLimit ? `${parsedTimeLimit} min` : `${Math.round(questions.length * 1.5)} min`,
      participants: 0,
      collaborators: [],
      isShared: false,
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
    console.log('Récupération des quiz pour l\'utilisateur:', userId);
    
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }
    
    // Vérifier si l'utilisateur est authentifié
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const q = query(
      collection(db, 'quizzes'), 
      where('userId', '==', userId)
    );
    
    console.log('Exécution de la requête Firestore...');
    const querySnapshot = await getDocs(q);
    console.log('Requête Firestore terminée');
    
    const quizzes: Quiz[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Document trouvé:', doc.id);
      
      // Vérifier que l'utilisateur a accès à ce quiz
      if (data.userId !== userId && !(data.collaborators || []).includes(userId)) {
        console.log('Accès refusé au quiz:', doc.id);
        return;
      }
      
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
        isShared: data.isShared || false,
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
    where('collaborators', 'array-contains', userId)
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
      isShared: true,
    });
  });
  
  return quizzes;
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  try {
    console.group(`[quizService] Récupération du quiz ${quizId}`);
    console.time(`[quizService] Temps de récupération du quiz ${quizId}`);
    
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
    
    console.timeEnd(`[quizService] Temps de récupération du quiz ${quizId}`);
    console.groupEnd();

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
      isShared: data.isShared || false,
      difficulty: data.difficulty || 'medium',
      timeLimit: data.timeLimit || null
    };
  } catch (error: any) {
    console.error('[quizService] Erreur lors de la récupération du quiz:', error);
    console.timeEnd(`[quizService] Temps de récupération du quiz ${quizId}`);
    console.groupEnd();
    throw new Error(`Échec de la récupération du quiz: ${error.message}`);
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
    const docRef = doc(db, 'quizzes', quizId);
    
    const quizDoc = await getDoc(docRef);
    if (!quizDoc.exists()) {
      throw new Error('Quiz not found');
    }
    
    await deleteDoc(docRef);
    
    console.log('Quiz supprimé avec succès de la base de données');
  } catch (error) {
    console.error('Erreur lors de la suppression du quiz:', error);
    throw new Error(`Échec de la suppression du quiz: ${error.message}`);
  }
};

export const shareQuiz = async (
  quizId: string, 
  collaboratorEmail: string
): Promise<void> => {
  const docRef = doc(db, 'quizzes', quizId);
  
  // Utiliser l'email comme identifiant du collaborateur au lieu d'un ID aléatoire
  await updateDoc(docRef, {
    collaborators: arrayUnion(collaboratorEmail),
    isShared: true,
  });
  
  // Vous pourriez également ajouter ici une logique pour envoyer un email d'invitation
  // si vous avez un service d'envoi d'emails configuré
};

export const removeCollaborator = async (
  quizId: string, 
  collaboratorId: string
): Promise<void> => {
  const docRef = doc(db, 'quizzes', quizId);
  
  await updateDoc(docRef, {
    collaborators: arrayRemove(collaboratorId),
  });
  
  const quizDoc = await getDoc(docRef);
  const collaborators = quizDoc.data()?.collaborators || [];
  
  if (collaborators.length === 0) {
    await updateDoc(docRef, {
      isShared: false,
    });
  }
};
