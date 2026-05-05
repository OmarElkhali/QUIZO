import { useCallback, useContext, useMemo } from 'react';
import QuizContext from '@/context/QuizContext';
import { toast } from 'sonner';
import { getFirebaseBackupQuestions } from '@/services/aiService';
import { Question, Quiz } from '@/types/quiz';

type QuizOption = Question['options'][number];

const getStableId = (prefix: string, index: number): string => `${prefix}-${index + 1}`;

const normalizeOptions = (
  options: Question['options'] | undefined,
  questionId: string
): QuizOption[] => {
  const validOptions = Array.isArray(options)
    ? options.filter((option): option is QuizOption => Boolean(option) && typeof option === 'object')
    : [];

  const normalizedOptions = validOptions.map((option, index) => ({
    ...option,
    id: option.id || getStableId(`${questionId}-option`, index),
    text: option.text || 'Option sans texte',
    isCorrect: typeof option.isCorrect === 'boolean' ? option.isCorrect : false,
  }));

  if (normalizedOptions.length === 0) {
    return [{
      id: `${questionId}-option-1`,
      text: 'Option par defaut',
      isCorrect: true,
    }];
  }

  if (!normalizedOptions.some((option) => option.isCorrect)) {
    return normalizedOptions.map((option, index) => ({
      ...option,
      isCorrect: index === 0 ? true : option.isCorrect,
    }));
  }

  return normalizedOptions;
};

const normalizeQuestions = (
  questions: Question[],
  quizId: string,
  fallbackDifficulty: Quiz['difficulty'] = 'medium'
): Question[] => questions
  .filter((question): question is Question => Boolean(question) && typeof question === 'object')
  .map((question, index) => {
    const questionId = question.id || getStableId(`${quizId}-question`, index);

    return {
      ...question,
      id: questionId,
      text: question.text || 'Question sans texte',
      options: normalizeOptions(question.options, questionId),
      explanation: question.explanation || 'Aucune explication disponible',
      correctAnswer: question.correctAnswer || '',
      difficulty: question.difficulty || fallbackDifficulty,
    };
  });

export const useQuiz = () => {
  const context = useContext(QuizContext);

  if (context === undefined) {
    console.error('useQuiz must be used within a QuizProvider');
    throw new Error('useQuiz must be used within a QuizProvider');
  }

  const { getQuiz: contextGetQuiz } = context;

  const getQuiz = useCallback(async (id: string) => {
    if (!id) {
      console.error('[useQuiz] ID du quiz non specifie');
      throw new Error('ID du quiz non specifie');
    }

    const startedAt = performance.now();
    console.groupCollapsed(`[useQuiz] Chargement du quiz ${id}`);

    try {
      const result = await contextGetQuiz(id);

      if (!result || typeof result !== 'object') {
        console.error('[useQuiz] Quiz introuvable ou format invalide:', { id, result });
        throw new Error('Quiz introuvable ou format invalide');
      }

      const normalizedQuiz: Quiz = {
        ...result,
        title: result.title || 'Quiz sans titre',
        description: result.description || 'Quiz genere par IA base sur vos documents.',
        createdAt: result.createdAt || new Date().toISOString(),
        duration: result.duration || '8 min',
        completionRate: typeof result.completionRate === 'number' ? result.completionRate : 0,
        participants: typeof result.participants === 'number' ? result.participants : 0,
        collaborators: Array.isArray(result.collaborators) ? result.collaborators : [],
        isShared: typeof result.isShared === 'boolean' ? result.isShared : false,
      };

      const sourceQuestions = Array.isArray(result.questions) && result.questions.length > 0
        ? result.questions
        : await getFirebaseBackupQuestions();

      normalizedQuiz.questions = normalizeQuestions(
        sourceQuestions,
        id,
        normalizedQuiz.difficulty || 'medium'
      );

      if (normalizedQuiz.questions.length === 0) {
        throw new Error('Le quiz ne contient aucune question valide');
      }

      if (!Array.isArray(result.questions) || result.questions.length === 0) {
        toast.warning('Des questions de secours ont ete chargees car le quiz original etait vide.');
      }

      console.info(`[useQuiz] Quiz ${id} charge avec succes`, {
        questionCount: normalizedQuiz.questions.length,
        durationMs: Math.round(performance.now() - startedAt),
      });

      return normalizedQuiz;
    } catch (error) {
      console.error(`[useQuiz] Erreur lors du chargement du quiz ${id}:`, error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }, [contextGetQuiz]);

  return useMemo(() => ({
    ...context,
    getQuiz,
  }), [context, getQuiz]);
};
