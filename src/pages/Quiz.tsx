import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { QuizAnswerCard } from '@/components/ui/premium';
import { StateCard } from '@/components/ui/StateCard';
import { AppShell } from '@/components/layout/AppShell';
import { randomizeQuestionOptionOrder } from '@/domain/quizRules';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit?: number;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining < 10 ? '0' : ''}${remaining}`;
};

const Quiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitQuizAnswers, getQuiz } = useQuiz();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedQuizIdRef = useRef<string | null>(null);
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  useEffect(() => {
    let isMounted = true;
    const loadQuiz = async () => {
      if (isAuthLoading || !user?.id) return;

      if (!id) {
        setError('ID manquant');
        setIsLoading(false);
        return;
      }

      if (loadedQuizIdRef.current === id) return;

      try {
        setIsLoading(true);
        setError(null);
        setCurrentQuestionIndex(0);
        const data = await getQuiz(id);
        if (!isMounted) return;

        if (!data || !data.questions || !data.questions.length) {
          setError('Quiz introuvable ou sans questions');
          setIsLoading(false);
          return;
        }

        const presentedQuestions = randomizeQuestionOptionOrder(data.questions.map(q => ({
          id: q.id,
          text: q.text,
          options: q.options.map(opt => ({ id: opt.id, text: opt.text, isCorrect: opt.isCorrect })),
        })));
        setQuiz({
          id: data.id,
          title: data.title,
          questions: presentedQuestions,
          timeLimit: data.timeLimit,
        });

        const initialAnswers: Record<string, string> = {};
        data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);

        const calculatedTimeLimit = data.timeLimit || Math.ceil(data.questions.length * 1.5);
        setTimeLeft(calculatedTimeLimit * 60);
        loadedQuizIdRef.current = id;
        setIsLoading(false);
      } catch (err: any) {
        if (isMounted) {
          loadedQuizIdRef.current = null;
          setError(err.message || 'Erreur inconnue');
          setIsLoading(false);
        }
      }
    };

    loadQuiz();
    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [getQuiz, id, isAuthLoading, user?.id]);

  useEffect(() => {
    if (isLoading || !quiz?.id || isSubmitting || timeLeftRef.current <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => Math.max(0, prevTime - 1));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, isSubmitting, quiz?.id]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !quiz || !id) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const unansweredQuestions = quiz.questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0 && timeLeftRef.current > 10) {
      const confirmSubmit = window.confirm(
        t('quiz.unansweredConfirm', { count: unansweredQuestions.length })
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitQuizAnswers(id, answers);

      if (result) {
        navigate(`/results/${result.quizId}/${result.submissionId}`, {
          state: {
            score: result.score,
            answers,
            totalQuestions: quiz.questions.length,
            timeSpent: (quiz.timeLimit ?? Math.ceil(quiz.questions.length * 1.5)) * 60 - timeLeftRef.current,
          },
        });
      }
    } catch (submitError: any) {
      toast.error(t('errors.generic'));
      setIsSubmitting(false);
    }
  }, [isSubmitting, quiz, id, answers, submitQuizAnswers, navigate, t]);

  useEffect(() => {
    if (timeLeft === 0 && quiz && !isSubmitting && !isLoading) {
      handleSubmit();
    }
  }, [timeLeft, quiz, isSubmitting, isLoading, handleSubmit]);

  const handleSelectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: optionId,
    }));
  }, []);

  if (isAuthLoading || isLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title={t('common.loading')} description={t('common.loading')} />
      </AppShell>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (error || !quiz) {
    return (
      <AppShell>
        <StateCard
          state="error"
          title={t('errors.notFound')}
          description={error || t('errors.generic')}
          action={<Button className="quizo-copper-button" onClick={() => navigate('/')}>{t('common.back')}</Button>}
        />
      </AppShell>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <div className="dark quizo-app-bg relative min-h-[100dvh]">
      <div className="pointer-events-none fixed inset-0 quizo-ambient" />
      <header className="quizo-page-frame relative z-10 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--quizo-border)] py-3 sm:min-h-20">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" aria-label="Quitter le quiz" className="text-[var(--quizo-muted)] hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)]" onClick={() => navigate(`/quiz-preview/${id}`)}>
            <X className="h-5 w-5" />
          </Button>
          <span className="line-clamp-1 text-sm font-semibold text-[var(--quizo-heading)]">{quiz.title}</span>
        </div>
        <div className={`quizo-tabular flex items-center gap-2 rounded-lg border border-[var(--quizo-border)] bg-[var(--quizo-surface)] px-4 py-2 ${timeLeft < 30 ? 'text-red-400' : 'text-orange-400'}`}>
          <Clock className="h-4 w-4" />
          <span className="font-mono text-sm font-bold tracking-widest">{formatTime(timeLeft)}</span>
        </div>
      </header>

      <main className="quizo-page-frame relative z-10 w-full pb-32 pt-6 sm:pt-10">
        <div className="mb-7 sm:mb-10">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-orange-400">{t('quiz.question')} {currentQuestionIndex + 1} {t('quiz.of')} {quiz.questions.length}</span>
            <span className="quizo-tabular text-sm font-semibold text-[var(--quizo-muted)]">{Math.round(progress)}%</span>
          </div>
          <div role="progressbar" aria-label="Progression du quiz" aria-valuenow={currentQuestionIndex + 1} aria-valuemin={0} aria-valuemax={quiz.questions.length} className="h-2 overflow-hidden rounded-full bg-[var(--quizo-surface-soft)]">
            <motion.div className="h-full origin-left bg-orange-500" initial={false} animate={{ scaleX: progress / 100 }} transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 190, damping: 30 }} />
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <section className="quizo-play-surface min-h-[min(42rem,calc(100dvh-15rem))] rounded-[1.25rem] border border-[var(--quizo-border)] p-5 sm:p-9 xl:p-12">
          <AnimatePresence mode="wait" initial={false}>
          <motion.div key={currentQuestion.id} initial={reduced ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -20 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
            <p className="mb-5 text-sm font-semibold text-orange-400">{t('quiz.question')} {String(currentQuestionIndex + 1).padStart(2, '0')}</p>
            <h1 className="max-w-[35ch] text-balance text-[clamp(1.8rem,3vw,3.4rem)] font-bold leading-[1.1] tracking-[-.045em] text-[var(--quizo-heading)]">
              {currentQuestion.text}
            </h1>
            <RadioGroup value={answers[currentQuestion.id] || ''} onValueChange={(value) => handleSelectAnswer(currentQuestion.id, value)} className="mt-8 grid gap-3 md:grid-cols-2 sm:mt-11 sm:gap-4">
              {currentQuestion.options.map((option, optionIndex) => (
                <Label key={option.id} htmlFor={`option-${currentQuestion.id}-${option.id}`} className="block cursor-pointer rounded-xl focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-orange-400">
                  <RadioGroupItem value={option.id} id={`option-${currentQuestion.id}-${option.id}`} className="sr-only" />
                  <QuizAnswerCard selected={answers[currentQuestion.id] === option.id}><span className="mr-3 font-bold text-orange-400">{String.fromCharCode(65 + optionIndex)}</span>{option.text}</QuizAnswerCard>
                </Label>
              ))}
            </RadioGroup>
          </motion.div>
          </AnimatePresence>
        </section>
        <aside className="hidden rounded-[1.25rem] border border-[var(--quizo-border)] bg-[var(--quizo-surface)] p-6 xl:sticky xl:top-6 xl:block" aria-label="Navigation des questions">
          <p className="text-sm font-semibold text-[var(--quizo-muted)]">Votre progression</p>
          <p className="quizo-tabular mt-3 text-5xl font-bold tracking-tight text-[var(--quizo-heading)]">{answeredCount}<span className="text-2xl text-[var(--quizo-muted)]">/{quiz.questions.length}</span></p>
          <p className="mt-1 text-sm text-[var(--quizo-muted)]">questions répondues</p>
          <div className="mt-7 grid max-h-[42dvh] grid-cols-5 gap-2 overflow-y-auto" role="group" aria-label="Aller à une question">{quiz.questions.map((question, index) => <button key={question.id} type="button" onClick={() => setCurrentQuestionIndex(index)} aria-label={`Question ${index + 1}${answers[question.id] ? ', répondue' : ''}`} aria-current={index === currentQuestionIndex ? 'step' : undefined} className={`grid h-11 w-11 place-items-center rounded-xl border text-sm font-bold transition-colors ${index === currentQuestionIndex ? 'border-orange-400 bg-orange-500 text-[#281305]' : answers[question.id] ? 'border-orange-400/40 bg-orange-500/10 text-orange-300' : 'border-[var(--quizo-border)] text-[var(--quizo-muted)] hover:border-orange-400'}`}>{index + 1}</button>)}</div>
        </aside>
        </div>
      </main>

      <footer className="quizo-bottom-dock fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--quizo-border)] bg-[var(--quizo-header)] p-4 backdrop-blur-xl md:p-5">
        <div className="quizo-page-frame flex items-center justify-between gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            className="quizo-outline-button min-h-11 px-3 sm:px-5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('quiz.previous')}
          </Button>
          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="quizo-copper-button min-h-11 px-4 sm:px-7">
              {isSubmitting ? t('common.loading') : t('common.finish')}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))} disabled={isSubmitting} className="quizo-copper-button min-h-11 px-4 sm:px-7">
              {t('quiz.next')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Quiz;
