
import { useContext } from 'react';
import QuizContext from '@/context/QuizContext';
import { toast } from 'sonner';
import { getFirebaseBackupQuestions } from '@/services/aiService';
import { Question } from '@/types/quiz';

export const useQuiz = () => {
  const context = useContext(QuizContext);
  
  if (context === undefined) {
    console.error('useQuiz must be used within a QuizProvider');
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  
  // Proxy les fonctions pour ajouter une gestion d'erreur supplémentaire
  const enhancedContext = {
    ...context,
    getQuiz: async (id: string) => {
      if (!id) {
        console.error('[useQuiz] ID du quiz non spécifié');
        throw new Error('ID du quiz non spécifié');
      }

      console.group('[useQuiz] Chargement du quiz');
      console.info('[useQuiz] Début du processus de chargement pour ID:', id);
      
      console.group(`[useQuiz] Chargement du quiz ${id}`);
      console.time(`[useQuiz] Temps total de chargement du quiz ${id}`);

      try {
        console.log(`[useQuiz] Début de la récupération du quiz ${id}`);
        console.time(`[useQuiz] Temps de chargement du quiz ${id}`);
        const result = await context.getQuiz(id);
        console.log(`[useQuiz] Données brutes reçues pour le quiz ${id}:`, result);
        
        if (!result || typeof result !== 'object') {
          console.error('[useQuiz] Quiz introuvable ou format invalide:', { id, result });
          throw new Error('Quiz introuvable ou format invalide');
        }
        console.log(`[useQuiz] Validation de la structure du quiz ${id}`);

        // Validation des champs obligatoires du quiz
        if (!result.title) {
          console.log('[useQuiz] Titre manquant, utilisation du titre par défaut');
          result.title = 'Quiz sans titre';
        }
        if (!result.description) {
          console.log('[useQuiz] Description manquante, utilisation de la description par défaut');
          result.description = 'Quiz généré par IA basé sur vos documents.';
        }
        if (!result.createdAt) {
          console.log('[useQuiz] Date de création manquante, utilisation de la date actuelle');
          result.createdAt = new Date().toISOString();
        }
        if (!result.duration) {
          console.log('[useQuiz] Durée manquante, utilisation de la durée par défaut');
          result.duration = '8 min';
        }
        if (typeof result.completionRate !== 'number') {
          console.log('[useQuiz] Taux de complétion invalide, initialisation à 0');
          result.completionRate = 0;
        }
        if (typeof result.participants !== 'number') {
          console.log('[useQuiz] Nombre de participants invalide, initialisation à 0');
          result.participants = 0;
        }
        if (!Array.isArray(result.collaborators)) {
          console.log('[useQuiz] Liste des collaborateurs invalide, initialisation à vide');
          result.collaborators = [];
        }
        if (typeof result.isShared !== 'boolean') {
          console.log('[useQuiz] État de partage invalide, initialisation à false');
          result.isShared = false;
        }

        // Valider la structure du quiz et ses questions
        if (!result.questions || !Array.isArray(result.questions)) {
          console.warn(`[useQuiz] Quiz ${id} sans questions valides, tentative de récupération des questions de secours`);
          try {
            console.log('[useQuiz] Début de la récupération des questions de secours');
            console.time('[useQuiz] Temps de récupération des questions de secours');
            const backupQuestions = await getFirebaseBackupQuestions();
            
            if (!backupQuestions || !Array.isArray(backupQuestions)) {
              console.error('[useQuiz] Format invalide des questions de secours:', backupQuestions);
              throw new Error('Format invalide des questions de secours');
            }
            
            console.log(`[useQuiz] ${backupQuestions.length} questions de secours récupérées`);
            
            if (backupQuestions.length > 0) {
              console.log('[useQuiz] Début de la transformation des questions de secours');
              result.questions = backupQuestions.map((q: Question) => {
                // Préparer les options avec validation
                let options = [];
                if (Array.isArray(q.options)) {
                  console.log(`[useQuiz] Validation des options pour la question de secours: ${q.text?.substring(0, 30)}...`);
                  options = q.options
                    .filter(opt => {
                      const isValid = opt && typeof opt === 'object';
                      if (!isValid) console.log('[useQuiz] Option invalide ignorée:', opt);
                      return isValid;
                    })
                    .map(opt => {
                      const option = {
                        id: opt.id || Math.random().toString(36).substr(2, 9),
                        text: opt.text || 'Option sans texte',
                        isCorrect: typeof opt.isCorrect === 'boolean' ? opt.isCorrect : false
                      };
                      if (!opt.text) console.log('[useQuiz] Option sans texte détectée, utilisation du texte par défaut');
                      return option;
                    });
                  
                  // S'assurer qu'au moins une option est correcte
                  const hasCorrectOption = options.some(opt => opt.isCorrect === true);
                  if (!hasCorrectOption && options.length > 0) {
                    // Marquer la première option comme correcte si aucune n'est correcte
                    options[0].isCorrect = true;
                    console.log('[useQuiz] Question de secours: Aucune option correcte trouvée, première option marquée comme correcte');
                  }
                }
                
                // Ajouter au moins une option si le tableau est vide
                if (options.length === 0) {
                  options = [{
                    id: Math.random().toString(36).substr(2, 9),
                    text: 'Option par défaut',
                    isCorrect: true
                  }];
                  console.log('Question de secours: Aucune option trouvée, option par défaut ajoutée');
                }
                
                return {
                  ...q,
                  id: q.id || Math.random().toString(36).substr(2, 9),
                  text: q.text || 'Question sans texte',
                  options: options,
                  explanation: q.explanation || 'Aucune explication disponible',
                  correctAnswer: q.correctAnswer || '',
                  difficulty: q.difficulty || result.difficulty || 'medium'
                };
              });
              
              console.log('Questions de secours appliquées avec succès');
              toast.warning('Des questions de secours ont été chargées car le quiz original était vide.');
            } else {
              throw new Error('Aucune question de secours disponible');
            }
          } catch (backupError) {
            console.error('Erreur lors de la récupération des questions de secours:', backupError);
            throw new Error('Impossible de charger les questions du quiz');
          }
        } else {
          // Valider et nettoyer chaque question
          result.questions = result.questions
            .filter((q: Question) => q && typeof q === 'object')
            .map((q: Question) => {
              // Préparer les options avec validation
              let options = [];
              if (Array.isArray(q.options)) {
                options = q.options
                  .filter(opt => opt && typeof opt === 'object')
                  .map(opt => ({
                    id: opt.id || Math.random().toString(36).substr(2, 9),
                    text: opt.text || 'Option sans texte',
                    isCorrect: typeof opt.isCorrect === 'boolean' ? opt.isCorrect : false
                  }));
                
                // S'assurer qu'au moins une option est correcte
                const hasCorrectOption = options.some(opt => opt.isCorrect === true);
                if (!hasCorrectOption && options.length > 0) {
                  // Marquer la première option comme correcte si aucune n'est correcte
                  options[0].isCorrect = true;
                  console.log('Aucune option correcte trouvée, première option marquée comme correcte');
                }
              }
              
              // Ajouter au moins une option si le tableau est vide
              if (options.length === 0) {
                options = [{
                  id: Math.random().toString(36).substr(2, 9),
                  text: 'Option par défaut',
                  isCorrect: true
                }];
                console.log('Aucune option trouvée, option par défaut ajoutée');
              }
              
              return {
                ...q,
                id: q.id || Math.random().toString(36).substr(2, 9),
                text: q.text || 'Question sans texte',
                options: options,
                explanation: q.explanation || 'Aucune explication disponible',
                correctAnswer: q.correctAnswer || ''
              };
            });
        }

        if (result.questions.length === 0) {
          throw new Error('Le quiz ne contient aucune question valide');
        }

        // Vérification finale pour s'assurer que toutes les questions ont des options valides
        const invalidQuestions = result.questions.filter(q => 
          !Array.isArray(q.options) || 
          q.options.length === 0 || 
          !q.options.some(opt => opt.isCorrect === true)
        );
        
        if (invalidQuestions.length > 0) {
          console.warn(`${invalidQuestions.length} questions avec des options invalides détectées, correction appliquée`);
          // La correction a déjà été appliquée dans les étapes précédentes
        }

        console.info(`[useQuiz] Quiz ${id} chargé avec succès:`, {
          questionCount: result.questions.length,
          hasValidStructure: true,
          title: result.title,
          createdAt: result.createdAt,
          questions: result.questions.map(q => ({
            id: q.id,
            text: q.text?.substring(0, 50),
            optionsCount: q.options?.length || 0,
            hasCorrectOption: q.options?.some(opt => opt.isCorrect) || false
          }))
        });
        console.timeEnd(`[useQuiz] Temps total de chargement du quiz ${id}`);
        console.groupEnd();
        return result;
      } catch (error: any) {
        console.error(`[useQuiz] Erreur lors du chargement du quiz ${id}:`, error);
        console.timeEnd(`[useQuiz] Temps total de chargement du quiz ${id}`);
        console.groupEnd();
        throw error;
      }
    },
    submitQuizAnswers: context.submitQuizAnswers,
  };

  return enhancedContext;
};
