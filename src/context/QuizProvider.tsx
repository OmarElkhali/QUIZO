import { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import QuizContext from './QuizContext';
import { Quiz } from '@/types/quiz';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import * as quizService from '@/services/quizService';
import { generateQuestionsWithAI, getFirebaseBackupQuestions, processFileAndGenerateQuestions } from '@/services/aiService';
import { useNavigate } from 'react-router-dom';

type ProgressCallback = (stage: string, percent: number, message?: string) => void;

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sharedQuizzes, setSharedQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Déplacer la déclaration de fetchQuizzes avant son utilisation
  const fetchQuizzes = useCallback(async () => {
    if (!user) {
      console.log('Aucun utilisateur connecté, impossible de récupérer les quiz');
      setQuizzes([]);
      setSharedQuizzes([]);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('QuizProvider: Récupération des quiz pour l\'utilisateur', user.id);
      
      if (!user.id) {
        throw new Error('ID utilisateur manquant');
      }
      
      const [userQuizzes, shared] = await Promise.all([
        quizService.getQuizzes(user.id),
        quizService.getSharedQuizzes(user.id)
      ]);
      
      setQuizzes(userQuizzes);
      setSharedQuizzes(shared);
      
      console.log('QuizProvider: Quiz récupérés avec succès', {
        userQuizzes: userQuizzes.length,
        sharedQuizzes: shared.length
      });
    } catch (error) {
      console.error('QuizProvider: Erreur lors de la récupération des quiz:', error);
      setQuizzes([]);
      setSharedQuizzes([]);
      toast.error(error.message || 'Impossible de récupérer vos quiz');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Puis utiliser fetchQuizzes dans useEffect
  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user, fetchQuizzes]);
  
  const createQuiz = async (
    file: File, 
    numQuestions: number, 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    timeLimit?: number,
    additionalInfo?: string,
    apiKey?: string,
    modelType: 'chatgpt' | 'gemini' = 'gemini',
    progressCallback?: ProgressCallback
  ) => {
    try {
      setIsLoading(true);
      
      if (!user || !user.id) {
        throw new Error("Vous devez être connecté pour créer un quiz");
      }
      
      // 1. Validation des entrées
      if (!file) {
        throw new Error("Aucun fichier sélectionné");
      }
      
      if (numQuestions <= 0 || numQuestions > 50) {
        throw new Error("Le nombre de questions doit être entre 1 et 50");
      }
      
      // 2. Initialisation
      progressCallback?.('Initialisation', 0, 'Démarrage de la création du quiz...');
      console.log(`Création d'un quiz à partir du fichier: ${file.name}`);
      
      // 3. Génération des questions
      let questions = [];
      
      try {
        // Télécharger le fichier pour référence future
        const fileUrl = await quizService.uploadFile(file, user.id);
        progressCallback?.('Fichier téléchargé', 25, `Fichier téléchargé: ${file.name}`);
        
        // Utiliser notre nouvelle fonction qui extrait le texte et génère les questions
        progressCallback?.('Génération des questions', 30, `Génération de ${numQuestions} questions avec ${modelType}...`);
        questions = await processFileAndGenerateQuestions(
          file,
          numQuestions,
          difficulty,
          additionalInfo,
          modelType,
          (progress: number) => {
            const percent = 30 + Math.round(progress * 45);
            progressCallback?.('Génération des questions', percent, `Progression: ${Math.round(progress * 100)}%`);
          }
        );
      } catch (genError) {
        // En cas d'erreur, aucune notification à l'utilisateur
        console.error("Erreur silencieuse lors de la génération des questions:", genError);
        throw genError; // Le fallback est géré dans le service AI
      }
      
      if (!questions || questions.length === 0) {
        throw new Error("Impossible de générer des questions");
      }
      
      // Vérifier et afficher les questions générées
      console.log(`${questions.length} QUESTIONS GÉNÉRÉES:`, questions);
      progressCallback?.('Questions générées', 75, `${questions.length} questions générées`);
      
      // 4. Sauvegarder le quiz
      progressCallback?.('Sauvegarde du quiz', 80, 'Sauvegarde du quiz dans la base de données...');
      const title = file.name.split('.')[0];
      const description = additionalInfo || 'Quiz généré par IA basé sur vos documents.';
      
      let quizId;
      
      try {
        quizId = await quizService.createQuiz(
          user.id,
          title,
          description,
          questions, // Passer les questions générées
          difficulty,
          timeLimit
        );
        
        // Vérification post-création
        const savedQuiz = await quizService.getQuiz(quizId);
        if (savedQuiz && (!savedQuiz.questions || savedQuiz.questions.length === 0)) {
          console.error("Les questions n'ont pas été enregistrées dans Firestore. Mise à jour du quiz...");
          await quizService.updateQuiz(quizId, { questions });
        }
        
        progressCallback?.('Quiz sauvegardé', 100, 'Quiz créé avec succès');
        toast.success('Quiz créé avec succès');
        
        // Redirection directe vers la page du quiz sans passer par la prévisualisation
        setTimeout(() => {
          navigate(`/quiz-preview/${quizId}`);
        }, 500);
        
        return quizId;
      } catch (genError) {
        console.error("Erreur lors de la génération du quiz standard:", genError);
        
        // Créer un quiz de secours avec des questions Firebase
        progressCallback?.('Création du quiz de secours', 80, 'Création d\'un quiz de secours...');
        
        const backupQuestions = await getFirebaseBackupQuestions();
        const title = file ? file.name.split('.')[0] : 'Quiz de secours';
        const description = 'Quiz de secours généré automatiquement';
        
        quizId = await quizService.createQuiz(
          user.id,
          title,
          description,
          backupQuestions,
          difficulty,
          timeLimit
        );
        
        progressCallback?.('Quiz de secours créé', 100, 'Quiz de secours créé avec succès');
        toast.success('Quiz de secours créé avec succès');
        
        // Redirection directe vers la page du quiz
        setTimeout(() => {
          navigate(`/quiz-preview/${quizId}`);
        }, 500);
        
        return quizId;
      }
    } catch (error: any) {
      console.error('QuizProvider: Error creating quiz:', error);
      toast.error(`Impossible de créer le quiz: ${error.message || "Erreur inconnue"}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const getQuiz = useCallback(async (id: string) => {
    console.log(`QuizProvider: Récupération du quiz avec ID: ${id}`);
    
    try {
      // Essayer de récupérer le quiz normalement
      const quiz = await quizService.getQuiz(id);
      
      if (quiz) {
        console.log('QuizProvider: Quiz récupéré avec succès');
        
        // Vérifier si le quiz a des questions
        if (!quiz.questions || quiz.questions.length === 0) {
          console.log('QuizProvider: Quiz sans questions, vérification des questions dans Firestore');
          
          // Essayer de mettre à jour le quiz une dernière fois pour récupérer les questions
          try {
            const freshQuiz = await quizService.getQuiz(id);
            if (freshQuiz && freshQuiz.questions && freshQuiz.questions.length > 0) {
              console.log('QuizProvider: Questions trouvées dans le quiz rafraîchi');
              return freshQuiz;
            } else {
              console.log('QuizProvider: Aucune question trouvée');
              throw new Error('Le quiz ne contient pas de questions');
            }
          } catch (error) {
            console.error('QuizProvider: Erreur lors de la récupération du quiz rafraîchi:', error);
            throw error;
          }
        }
        
        setCurrentQuiz(quiz);
        return quiz;
      } else {
        // Si le quiz est null/undefined, créer un quiz de secours
        console.log('QuizProvider: Quiz non trouvé, création d\'un quiz de secours');
        
        const backupQuestions = await getFirebaseBackupQuestions();
        const backupQuiz = {
          id,
          title: "Quiz",
          description: "Quiz généré automatiquement",
          questions: backupQuestions,
          createdAt: new Date().toISOString().split('T')[0],
          completionRate: 0,
          duration: "30 min",
          participants: 0,
          difficulty: "medium" as const,
          timeLimit: 30
        };
        
        setCurrentQuiz(backupQuiz);
        return backupQuiz;
      }
    } catch (error) {
      console.error('QuizProvider: Error getting quiz:', error);
      toast.error(`Impossible de récupérer le quiz: ${error.message || "Erreur inconnue"}`);
      return null;
    }
  }, []);
  
  const submitQuizAnswers = useCallback(async (quizId: string, answers: Record<string, string>) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour soumettre vos réponses');
      throw new Error('User not authenticated');
    }
    
    setIsLoading(true);
    try {
      const result = await quizService.submitQuizAnswers(quizId, user.id, answers);
      setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, completionRate: 100 } : q));
      toast.success('Réponses soumises avec succès');
      return result;
    } catch (error) {
      console.error('Error submitting answers:', error);
      toast.error('Impossible de soumettre vos réponses');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  const deleteQuiz = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await quizService.deleteQuiz(id);
      setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
      setSharedQuizzes(prev => prev.filter(quiz => quiz.id !== id));
      if (currentQuiz?.id === id) setCurrentQuiz(null);
      // Ne pas afficher de toast ici, c'est géré dans le composant DeleteQuizDialog
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      // Propager l'erreur avec un message clair
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentQuiz]);
  
  const shareQuiz = useCallback(async (id: string, email: string) => {
    setIsLoading(true);
    try {
      await quizService.shareQuiz(id, email);
      setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isShared: true } : q));
      toast.success('Quiz partagé avec succès');
    } catch (error) {
      console.error('Error sharing quiz:', error);
      toast.error('Impossible de partager le quiz');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const removeCollaborator = useCallback(async (quizId: string, collaboratorId: string) => {
    setIsLoading(true);
    try {
      await quizService.removeCollaborator(quizId, collaboratorId);
      await fetchQuizzes();
      toast.success('Collaborateur supprimé avec succès');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Impossible de supprimer le collaborateur');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchQuizzes]);

  const value = useMemo(() => ({
    quizzes,
    sharedQuizzes,
    currentQuiz,
    isLoading,
    fetchQuizzes, // Ajouter cette ligne
    createQuiz,
    getQuiz,
    submitQuizAnswers,
    deleteQuiz,
    shareQuiz,
    removeCollaborator,
  }), [quizzes, sharedQuizzes, currentQuiz, isLoading, fetchQuizzes, createQuiz, getQuiz, submitQuizAnswers, deleteQuiz, shareQuiz, removeCollaborator]);
  
  return (
    <QuizContext.Provider
      value={value}
    >
      {children}
    </QuizContext.Provider>
  );
};
