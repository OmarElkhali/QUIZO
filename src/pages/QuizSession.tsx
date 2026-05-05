import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
          throw new Error("Ce quiz n'a pas encore démarré");
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
            <Button className="bg-[#d77a36] text-white hover:bg-[#b85f26]" onClick={() => navigate('/join-quiz')}>
              Retour
            </Button>
          }
        />
      </AppShell>
    );
  }

  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <AppShell>
      <PageHeader
        eyebrow={quiz.mode === 'realtime' ? 'Session live' : 'Session autonome'}
        title={quiz.title}
        description={quiz.description || 'Répondez aux questions, votre progression est sauvegardée automatiquement.'}
        actions={
          timeLeft !== null ? (
            <div className="flex items-center rounded-lg border border-[#d77a36]/30 bg-[#d77a36]/12 px-3 py-2 text-[#f7c693]">
              <Clock className="mr-2 h-4 w-4" />
              <span className="font-semibold tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          ) : null
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section>
          <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-2 flex justify-between text-sm text-slate-400">
              <span>Question {currentQuestionIndex + 1} sur {quiz.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/10" />
          </div>

          <Card className="border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex flex-col gap-3 text-xl leading-8 text-white sm:flex-row sm:justify-between">
                <span>{currentQuestion.text}</span>
                <span className="shrink-0 rounded-md border border-white/10 bg-[#0b0f14] px-2 py-1 text-sm font-medium text-slate-400">
                  {currentQuestion.points || 1} pt
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.id] === option.id;
                  return (
                    <Label
                      key={option.id}
                      htmlFor={`${currentQuestion.id}-${option.id}`}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-slate-200 transition',
                        selected
                          ? 'border-[#d77a36] bg-[#d77a36]/15 text-white shadow-[0_0_0_1px_rgba(215,122,54,0.25)]'
                          : 'border-white/10 bg-[#0b0f14] hover:border-[#d77a36]/40 hover:bg-white/[0.05]'
                      )}
                    >
                      <RadioGroupItem value={option.id} id={`${currentQuestion.id}-${option.id}`} />
                      <span>{option.text}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-white/10 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                className="w-full border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] sm:w-auto"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button className="w-full bg-[#d77a36] text-white hover:bg-[#b85f26] sm:w-auto" onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={isSubmitting}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
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
            </CardFooter>
          </Card>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="font-semibold text-white">Navigation</h2>
            <p className="mt-1 text-sm text-slate-500">{answeredCount} / {quiz.questions.length} réponses enregistrées</p>
            <div className="mt-4 grid grid-cols-5 gap-2 xl:grid-cols-4">
              {quiz.questions.map((question, index) => (
                <Button
                  key={question.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-9 border border-white/10 bg-[#0b0f14] text-slate-300 hover:bg-white/[0.08]',
                    index === currentQuestionIndex && 'border-[#d77a36] bg-[#d77a36]/15 text-[#f7c693]',
                    answers[question.id] && index !== currentQuestionIndex && 'border-emerald-500/40 text-emerald-300'
                  )}
                  onClick={() => goToQuestion(index)}
                  disabled={isSubmitting}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>

          {answeredCount < quiz.questions.length && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-300" />
                <p className="text-sm text-amber-100">
                  {quiz.questions.length - answeredCount} question(s) sans réponse.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
};

export default QuizSession;
