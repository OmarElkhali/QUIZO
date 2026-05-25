import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import {
  ensureParticipantSession,
  getManualQuiz,
  getQuizAttempt,
  recordQuizAttemptAnswer,
  submitQuizAttempt,
  updateParticipantProgress,
} from '@/services/manualQuizService';
import { Attempt, ManualQuiz } from '@/types/quiz';
import { QuizAnswerCard } from '@/components/ui/premium';
import { cn } from '@/lib/utils';

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
        if (quizData.status === 'completed') throw new Error('Ce quiz est terminé');
        if (quizData.status === 'draft' && quizData.mode === 'realtime') {
          throw new Error("Ce quiz n’a pas encore démarré");
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
      toast.success('Quiz soumis avec succès');
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
      toast.error('Impossible de sauvegarder cette réponse');
    });
  };

  const goToQuestion = (index: number) => {
    if (!quiz) return;
    setCurrentQuestionIndex(Math.max(0, Math.min(index, quiz.questions.length - 1)));
  };

  if (!quizId || !attemptId) return <Navigate to="/join-quiz" />;

  if (isLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement de la session" description="Récupération du quiz et de votre tentative." />
      </AppShell>
    );
  }

  if (error || !quiz || !currentQuestion) {
    return (
      <AppShell>
        <StateCard
          state="error"
          title="Impossible de charger le quiz"
          description={error || 'Session invalide'}
          action={
            <Button className="quizo-copper-button" onClick={() => navigate('/join-quiz')}>
              Retour
            </Button>
          }
        />
      </AppShell>
    );
  }

  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="dark quizo-app-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 quizo-ambient" />
      <header className="relative z-10 flex h-20 items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="text-[#dbc2b0] hover:bg-white/[0.055] hover:text-white" onClick={() => navigate('/join-quiz')}>
            <X className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold tracking-wide text-[#dbc2b0]">{quiz.title}</span>
        </div>
        {timeLeft !== null && (
          <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.055] px-5 py-2 text-[#ffb77d] shadow-[0_0_20px_rgba(255,183,125,0.08)]">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm font-bold tracking-widest">{formatTime(timeLeft)}</span>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-4 pb-32 pt-8 md:px-10">
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <span className="quizo-label">Question {currentQuestionIndex + 1} / {quiz.questions.length}</span>
            <span className="quizo-label text-[#ffb77d]">{Math.round(progress)}%</span>
          </div>
          <div className="h-px overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#ffb77d] shadow-[0_0_12px_rgba(255,183,125,0.9)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="quizo-panel relative overflow-hidden p-6 sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-transparent" />
          <div className="relative">
            <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              <span className="mr-3 font-light text-[#ffb77d]/70">Q{currentQuestionIndex + 1}.</span>
              {currentQuestion.text}
            </h1>

            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="mt-10 space-y-4"
            >
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id] === option.id;
                return (
                  <Label key={option.id} htmlFor={`${currentQuestion.id}-${option.id}`} className="block cursor-pointer">
                    <RadioGroupItem value={option.id} id={`${currentQuestion.id}-${option.id}`} className="sr-only" />
                    <QuizAnswerCard selected={selected}>{option.text}</QuizAnswerCard>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        </section>

        <aside className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full border border-white/[0.07] bg-white/[0.045] px-4 py-2 text-sm text-[#a79d96]">
            {answeredCount} / {quiz.questions.length} réponses enregistrées
          </div>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((question, index) => (
              <Button
                key={question.id}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-9 w-9 border border-white/[0.07] bg-white/[0.045] text-[#dbc2b0] hover:bg-white/[0.08]',
                  index === currentQuestionIndex && 'border-orange-300/50 bg-orange-500/15 text-[#ffb77d]',
                  answers[question.id] && index !== currentQuestionIndex && 'border-emerald-400/35 text-emerald-300'
                )}
                onClick={() => goToQuestion(index)}
                disabled={isSubmitting}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </aside>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#070707] via-[#070707]/90 to-transparent p-5 md:p-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Button
            variant="outline"
            className="rounded-full px-6 quizo-outline-button"
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button className="rounded-full px-8 quizo-copper-button" onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={isSubmitting}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full bg-emerald-500 px-8 text-[#061a11] hover:bg-emerald-400">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Soumission...
                </>
              ) : (
                <>
                  Terminer
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default QuizSession;
