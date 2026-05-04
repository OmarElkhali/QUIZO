import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock, Loader2 } from 'lucide-react';
import {
  ensureParticipantSession,
  getManualQuiz,
  getQuizAttempt,
  recordQuizAttemptAnswer,
  submitQuizAttempt,
  updateParticipantProgress,
} from '@/services/manualQuizService';
import { Attempt, ManualQuiz } from '@/types/quiz';

interface QuizSessionLocationState {
  participantId?: string;
  quizMode?: 'async' | 'realtime';
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const QuizSession = () => {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as QuizSessionLocationState;

  const [quiz, setQuiz] = useState<ManualQuiz | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const participantId = state.participantId || attempt?.participantId;

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!quizId || !attemptId) {
        setError('Session de quiz invalide');
        setIsLoading(false);
        return;
      }

      try {
        await ensureParticipantSession();
        const [quizData, attemptData] = await Promise.all([
          getManualQuiz(quizId),
          getQuizAttempt(quizId, attemptId),
        ]);

        if (cancelled) return;
        if (!quizData) throw new Error('Quiz introuvable');
        if (!attemptData) throw new Error('Tentative introuvable');
        if (quizData.status === 'completed') throw new Error('Ce quiz est termine');
        if (quizData.status === 'draft' && quizData.mode === 'realtime') {
          throw new Error("Ce quiz n'a pas encore demarre");
        }

        setQuiz(quizData);
        setAttempt(attemptData);
        setAnswers(attemptData.answers || {});
        setTimeLeft(quizData.timeLimit ? quizData.timeLimit * 60 : null);
      } catch (sessionError) {
        if (!cancelled) {
          const message = sessionError instanceof Error ? sessionError.message : 'Impossible de charger le quiz';
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSession();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptId, quizId]);

  useEffect(() => {
    if (!quizId || !participantId || isLoading || isSubmitting) return;
    void updateParticipantProgress(quizId, participantId, currentQuestionIndex).catch((progressError) => {
      console.error('Unable to update participant progress:', progressError);
    });
  }, [currentQuestionIndex, isLoading, isSubmitting, participantId, quizId]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || !quizId || !attemptId || !participantId || submittedRef.current) return;

    submittedRef.current = true;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const score = await submitQuizAttempt(quizId, attemptId, participantId, answers);
      toast.success('Quiz soumis avec succes');
      navigate(`/results/${quizId}/${attemptId}`, {
        state: {
          score,
          answers,
          totalQuestions: quiz.questions.length,
          timeSpent: quiz.timeLimit && timeLeft !== null ? quiz.timeLimit * 60 - timeLeft : undefined,
        },
      });
    } catch (submitError) {
      submittedRef.current = false;
      setIsSubmitting(false);
      const message = submitError instanceof Error ? submitError.message : 'Erreur lors de la soumission';
      toast.error(message);
    }
  }, [answers, attemptId, navigate, participantId, quiz, quizId, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isLoading || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current === null || current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void handleSubmit();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleSubmit, isLoading, isSubmitting, timeLeft]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    if (!quizId || !attemptId) return;
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    void recordQuizAttemptAnswer(quizId, attemptId, questionId, optionId).catch((answerError) => {
      console.error('Unable to save answer:', answerError);
      toast.error('Impossible de sauvegarder cette reponse');
    });
  };

  const goToQuestion = (index: number) => {
    if (!quiz) return;
    setCurrentQuestionIndex(Math.max(0, Math.min(index, quiz.questions.length - 1)));
  };

  if (!quizId || !attemptId) return <Navigate to="/join-quiz" />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error || !quiz || !currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Impossible de charger le quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error || 'Session invalide'}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/join-quiz')}>
                Retour
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl font-bold">{quiz.title}</h1>
                <p className="text-muted-foreground">{quiz.description}</p>
              </div>
              {timeLeft !== null && (
                <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-md">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="font-semibold">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} sur {quiz.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex justify-between gap-4">
                <span>{currentQuestion.text}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {currentQuestion.points || 1} pt
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`${currentQuestion.id}-${option.id}`}
                    className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                  >
                    <RadioGroupItem value={option.id} id={`${currentQuestion.id}-${option.id}`} />
                    <span>{option.text}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Precedent
              </Button>
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={isSubmitting}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? 'Soumission...' : 'Terminer'}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>

          <div className="flex flex-wrap gap-2 justify-center">
            {quiz.questions.map((question, index) => (
              <Button
                key={question.id}
                variant={index === currentQuestionIndex ? 'default' : answers[question.id] ? 'outline' : 'ghost'}
                size="sm"
                className={answers[question.id] ? 'border-green-500' : ''}
                onClick={() => goToQuestion(index)}
                disabled={isSubmitting}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          {answeredCount < quiz.questions.length && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-100 dark:border-amber-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {quiz.questions.length - answeredCount} question(s) sans reponse.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuizSession;
