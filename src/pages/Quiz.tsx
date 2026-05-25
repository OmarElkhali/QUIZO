import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
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

interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
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

        setQuiz({
          id: data.id,
          title: data.title,
          questions: data.questions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options.map(opt => ({ id: opt.id, text: opt.text })),
          })),
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
        `Il reste ${unansweredQuestions.length} question(s) sans réponse. Voulez-vous vraiment soumettre le quiz ?`
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
      toast.error('Erreur lors de la soumission: ' + (submitError.message || 'Erreur inconnue'));
      setIsSubmitting(false);
    }
  }, [isSubmitting, quiz, id, answers, submitQuizAnswers, navigate]);

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
        <StateCard state="loading" title="Chargement du quiz" description="Préparation de la session." />
      </AppShell>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (error || !quiz) {
    return (
      <AppShell>
        <StateCard
          state="error"
          title="Impossible de charger le quiz"
          description={error || 'Quiz introuvable'}
          action={<Button className="quizo-copper-button" onClick={() => navigate('/')}>Retour</Button>}
        />
      </AppShell>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="dark quizo-app-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 quizo-ambient" />
      <header className="relative z-10 flex h-20 items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="text-[#dbc2b0] hover:bg-white/[0.055] hover:text-white" onClick={() => navigate(`/quiz-preview/${id}`)}>
            <X className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold tracking-wide text-[#dbc2b0]">{quiz.title}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.055] px-5 py-2 text-[#ffb77d]">
          <Clock className="h-4 w-4" />
          <span className="font-mono text-sm font-bold tracking-widest">{formatTime(timeLeft)}</span>
        </div>
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
            <RadioGroup value={answers[currentQuestion.id] || ''} onValueChange={(value) => handleSelectAnswer(currentQuestion.id, value)} className="mt-10 space-y-4">
              {currentQuestion.options.map((option) => (
                <Label key={option.id} htmlFor={`option-${currentQuestion.id}-${option.id}`} className="block cursor-pointer">
                  <RadioGroupItem value={option.id} id={`option-${currentQuestion.id}-${option.id}`} className="sr-only" />
                  <QuizAnswerCard selected={answers[currentQuestion.id] === option.id}>{option.text}</QuizAnswerCard>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#070707] via-[#070707]/90 to-transparent p-5 md:p-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            className="rounded-full px-6 quizo-outline-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full bg-emerald-500 px-8 text-[#061a11] hover:bg-emerald-400">
              {isSubmitting ? 'Soumission...' : 'Terminer le quiz'}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))} disabled={isSubmitting} className="rounded-full px-8 quizo-copper-button">
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Quiz;
