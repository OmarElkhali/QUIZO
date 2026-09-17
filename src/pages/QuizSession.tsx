import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bookmark, Check, CloudOff, Loader2, Save, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
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
import { randomizeQuestionOptionOrder, remainingSeconds } from '@/domain/quizRules';
import { QuestionStage } from '@/components/live/QuestionStage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(() => new Set());
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const deadlineRef = useRef<number | null>(null);
  const answerSaveQueue = useRef<Record<string, Promise<void>>>({});

  const participantId = state.participantId || attempt?.participantId;
  const reviewStorageKey = attemptId ? `quizo-review:v1:${attemptId}` : '';

  useEffect(() => {
    if (!reviewStorageKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem(reviewStorageKey) || '[]');
      if (Array.isArray(stored)) setMarkedForReview(new Set(stored.filter(value => typeof value === 'string')));
    } catch { /* Ignore malformed local preferences. */ }
  }, [reviewStorageKey]);

  useEffect(() => {
    if (!reviewStorageKey) return;
    localStorage.setItem(reviewStorageKey, JSON.stringify([...markedForReview]));
  }, [markedForReview, reviewStorageKey]);

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
        if (attemptData.completedAt) throw new Error('Cette tentative est déjà terminée.');
        if (quizData.status === 'completed') throw new Error('Ce quiz est terminé');
        if (quizData.status === 'draft' && quizData.mode === 'realtime') {
          throw new Error("Ce quiz n’a pas encore démarré");
        }

        setQuiz({ ...quizData, questions: randomizeQuestionOptionOrder(quizData.questions) });
        setAttempt(attemptData);
        setAnswers(attemptData.answers || {});
        const startedAtMs = Date.parse(attemptData.startedAt);
        if (quizData.timeLimit && !Number.isFinite(startedAtMs)) throw new Error('Le début de cette tentative est invalide.');
        deadlineRef.current = quizData.timeLimit ? startedAtMs + quizData.timeLimit * 60_000 : null;
        setTimeLeft(deadlineRef.current === null ? null : remainingSeconds(deadlineRef.current, Date.now()));
        const firstUnanswered = quizData.questions.findIndex(question => !attemptData.answers?.[question.id]);
        setCurrentQuestionIndex(firstUnanswered < 0 ? Math.max(0, quizData.questions.length - 1) : firstUnanswered);
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
      await Promise.allSettled(Object.values(answerSaveQueue.current));
      const score = await submitQuizAttempt(quizId, attemptId, participantId, answers);
      if (reviewStorageKey) localStorage.removeItem(reviewStorageKey);
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
  }, [answers, attemptId, navigate, participantId, quiz, quizId, reviewStorageKey, timeLeft]);

  useEffect(() => {
    if (deadlineRef.current === null || isLoading || isSubmitting) return;
    const tick = () => {
      const remaining = remainingSeconds(deadlineRef.current!, Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        void handleSubmit();
      }
    };
    timerRef.current = setInterval(tick, 1000);
    tick();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleSubmit, isLoading, isSubmitting]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);

  const handleAnswerChange = useCallback((questionId: string, optionId: string) => {
    if (!quizId || !attemptId || isSubmitting || (deadlineRef.current !== null && Date.now() >= deadlineRef.current)) return;
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setSaveStatus('saving');
    const previous = answerSaveQueue.current[questionId] || Promise.resolve();
    const next = previous.catch(() => undefined).then(() => recordQuizAttemptAnswer(quizId, attemptId, questionId, optionId));
    answerSaveQueue.current[questionId] = next;
    void next.then(() => {
      if (answerSaveQueue.current[questionId] === next) setSaveStatus('saved');
    }).catch((answerError) => {
      console.error('Unable to save answer:', answerError);
      if (answerSaveQueue.current[questionId] === next) setSaveStatus('error');
      toast.error('Réponse conservée dans cet écran, mais la synchronisation a échoué.');
    });
  }, [attemptId, isSubmitting, quizId]);
  const handleCurrentAnswer = useCallback((optionId: string) => {
    if (currentQuestion) handleAnswerChange(currentQuestion.id, optionId);
  }, [currentQuestion, handleAnswerChange]);

  const toggleReview = (questionId: string) => setMarkedForReview(current => {
    const next = new Set(current);
    if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
    return next;
  });

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

  const progress = (answeredCount / quiz.questions.length) * 100;
  const unansweredCount = quiz.questions.length - answeredCount;
  const timerTotal = quiz.timeLimit ? quiz.timeLimit * 60 : undefined;
  const saveLabel = saveStatus === 'saving' ? 'Synchronisation…' : saveStatus === 'error' ? 'Hors ligne — réponse conservée' : saveStatus === 'saved' ? 'Réponse enregistrée' : 'Sauvegarde automatique';

  return (
    <div className="dark quizo-app-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 quizo-ambient" />
      <header className="quizo-page-frame relative z-10 flex min-h-16 flex-wrap items-center justify-between gap-3 py-3 sm:min-h-20 sm:py-4">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" aria-label="Quitter le quiz" className="text-[#dbc2b0] hover:bg-white/[0.055] hover:text-white" onClick={() => navigate('/join')}>
            <X className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold tracking-wide text-[#dbc2b0]">{quiz.title}</span>
        </div>
        <div role="status" className={cn('flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.055] px-4 py-2 text-xs', saveStatus === 'error' ? 'text-amber-300' : 'text-[#dbc2b0]')}>{saveStatus === 'error' ? <CloudOff className="h-4 w-4" /> : <Save className={cn('h-4 w-4', saveStatus === 'saving' && 'animate-pulse')} />}{saveLabel}</div>
      </header>

      <main className="quizo-page-frame relative z-10 flex w-full flex-col pb-40 pt-5 sm:pt-6">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="quizo-label">{answeredCount} réponse{answeredCount > 1 ? 's' : ''} sur {quiz.questions.length}</span>
            <span className="quizo-label text-[#ffb77d]">{Math.round(progress)} % complété</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={quiz.questions.length}>
            <div className="h-full bg-[#ffb77d] shadow-[0_0_12px_rgba(255,183,125,0.9)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="quizo-panel relative overflow-hidden p-5 sm:p-8 lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-transparent" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {timeLeft !== null ? <p className={cn('rounded-full border px-4 py-2 font-mono text-sm font-bold', timeLeft <= 60 ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-white/10 bg-white/[0.04] text-[#ffb77d]')}>Temps global · {formatTime(timeLeft)}</p> : <span />}
              <Button type="button" variant="ghost" size="sm" className={cn('rounded-full', markedForReview.has(currentQuestion.id) && 'bg-amber-500/15 text-amber-200')} onClick={() => toggleReview(currentQuestion.id)}><Bookmark className={cn('mr-2 h-4 w-4', markedForReview.has(currentQuestion.id) && 'fill-current')} />{markedForReview.has(currentQuestion.id) ? 'À revoir' : 'Marquer à revoir'}</Button>
            </div>
            <QuestionStage question={currentQuestion} index={currentQuestionIndex} total={quiz.questions.length} remaining={timeLeft} timerTotal={timerTotal} selected={answers[currentQuestion.id]} disabled={isSubmitting} onAnswer={handleCurrentAnswer} compact />
          </div>
        </section>

        <aside className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full border border-white/[0.07] bg-white/[0.045] px-4 py-2 text-sm text-[#a79d96]">
            {unansweredCount ? `${unansweredCount} question${unansweredCount > 1 ? 's' : ''} sans réponse` : 'Toutes les questions ont une réponse'} · {markedForReview.size} à revoir
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
                  answers[question.id] && index !== currentQuestionIndex && 'border-emerald-400/35 text-emerald-300',
                  markedForReview.has(question.id) && 'border-amber-400/50'
                )}
                onClick={() => goToQuestion(index)}
                disabled={isSubmitting}
                aria-label={`Question ${index + 1}${answers[question.id] ? ', répondue' : ', sans réponse'}${markedForReview.has(question.id) ? ', à revoir' : ''}`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </aside>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.06] bg-[#070707]/90 p-4 backdrop-blur-xl md:p-6">
        <div className="quizo-page-frame flex items-center justify-between gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="rounded-full px-6 quizo-outline-button"
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Précédent</span>
          </Button>
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button className="rounded-full px-8 quizo-copper-button" onClick={() => goToQuestion(currentQuestionIndex + 1)} disabled={isSubmitting}>
              {answers[currentQuestion.id] ? 'Question suivante' : 'Passer pour le moment'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => unansweredCount ? setConfirmSubmit(true) : void handleSubmit()} disabled={isSubmitting} className="rounded-full bg-emerald-500 px-8 text-[#061a11] hover:bg-emerald-400">
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
      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Terminer avec {unansweredCount} question{unansweredCount > 1 ? 's' : ''} sans réponse ?</AlertDialogTitle><AlertDialogDescription>Les questions sans réponse compteront comme incorrectes. Vous pouvez encore les compléter ou soumettre maintenant.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Continuer le quiz</AlertDialogCancel><AlertDialogAction onClick={() => void handleSubmit()}>Soumettre quand même</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizSession;
