import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BarChart3, BookOpen, Check, Download, Home, Share2, Target, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/context/AuthContext';
import { saveQuizResult } from '@/services/quizService';
import { cn } from '@/lib/utils';
import { PremiumMetric, PremiumPanel } from '@/components/ui/premium';

const normalizeAnswerId = (answer: any) => answer?.selectedOptionId || answer;

const Results = () => {
  const { quizId, submissionId } = useParams<{ quizId: string; submissionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getQuiz } = useQuiz();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [resultSaved, setResultSaved] = useState(false);

  const score = location.state?.score ?? 0;
  const userAnswers = useMemo(() => location.state?.answers ?? {}, [location.state?.answers]);
  const timeSpent = location.state?.timeSpent ?? 0;
  const startTime = useMemo(() => location.state?.startTime ?? Date.now(), [location.state?.startTime]);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) {
        toast.error('ID du quiz non spécifié');
        navigate('/');
        return;
      }

      try {
        const quizData = await getQuiz(quizId);
        if (!quizData) {
          toast.error('Quiz introuvable');
          navigate('/');
          return;
        }
        setQuiz(quizData);
      } catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
        toast.error('Impossible de charger les résultats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, getQuiz, navigate]);

  useEffect(() => {
    const saveResults = async () => {
      if (!quiz || !user || resultSaved) return;

      try {
        const totalQuestions = quiz.questions?.length || 0;
        const correctAnswers = Math.round((score / 100) * totalQuestions);
        const calculatedTimeSpent = timeSpent || Math.floor((Date.now() - startTime) / 1000);
        const formattedAnswers = Object.entries(userAnswers).map(([questionId, answer]: [string, any]) => ({
          questionId,
          selectedOptionId: normalizeAnswerId(answer),
          isCorrect: answer?.isCorrect || false,
        }));

        await saveQuizResult({
          userId: user.id,
          quizId: quiz.id,
          quizTitle: quiz.title,
          score,
          totalQuestions,
          correctAnswers,
          timeSpent: calculatedTimeSpent,
          answers: formattedAnswers,
        });

        setResultSaved(true);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des résultats:', error);
      }
    };

    saveResults();
  }, [quiz, user, score, userAnswers, timeSpent, startTime, resultSaved]);

  useEffect(() => {
    if (score >= 70 && !isLoading && quiz) {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.62 },
        colors: ['#ffb77d', '#d97706', '#fcd34d', '#ffffff'],
      });
    }
  }, [score, isLoading, quiz]);

  if (isLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement des résultats" description="Calcul du score et préparation du récapitulatif." />
      </AppShell>
    );
  }

  if (!quiz) {
    return (
      <AppShell>
        <StateCard
          state="error"
          title="Résultats introuvables"
          description="Impossible d’ouvrir ce récapitulatif."
          action={<Button className="quizo-copper-button" onClick={() => navigate('/')}>Retour à l’accueil</Button>}
        />
      </AppShell>
    );
  }

  const totalQuestions = quiz.questions.length;
  const questionStates = quiz.questions.map((question: any) => {
    const userAnswerId = normalizeAnswerId(userAnswers[question.id]);
    const userAnswer = question.options.find((opt: any) => opt.id === userAnswerId);
    const correctAnswer = question.options.find((opt: any) => opt.isCorrect);
    const isCorrect = userAnswerId === correctAnswer?.id;
    const unanswered = !userAnswerId;
    return { question, userAnswer, correctAnswer, isCorrect, unanswered };
  });

  const correctAnswers = questionStates.filter((item) => item.isCorrect).length;
  const unansweredQuestions = questionStates.filter((item) => item.unanswered).length;
  const answeredIncorrectly = totalQuestions - correctAnswers - unansweredQuestions;
  const filteredQuestions = questionStates.filter((item) => {
    if (activeTab === 'correct') return item.isCorrect;
    if (activeTab === 'incorrect') return !item.isCorrect && !item.unanswered;
    if (activeTab === 'unanswered') return item.unanswered;
    return true;
  });

  const scoreText = score >= 90 ? 'Excellent !' : score >= 75 ? 'Très bien !' : score >= 60 ? 'Bon travail' : 'À renforcer';

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: `Résultats du Quiz: ${quiz.title}`,
        text: `J’ai obtenu un score de ${score}% au quiz "${quiz.title}" !`,
        url: window.location.href,
      }).catch(() => toast.error('Impossible de partager'));
      return;
    }

    navigator.clipboard
      .writeText(`J’ai obtenu un score de ${score}% au quiz "${quiz.title}" ! ${window.location.href}`)
      .then(() => toast.success('Lien copié dans le presse-papier'))
      .catch(() => toast.error('Impossible de copier le lien'));
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Résultats"
        title={quiz.title}
        description="Récapitulatif de votre tentative, score global et détails des réponses."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="quizo-outline-button" onClick={shareResults}>
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
            <Button variant="outline" className="quizo-outline-button" onClick={() => toast.success('Export PDF bientôt disponible')}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <PremiumPanel className="p-6 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-orange-300/35 bg-orange-500/15 text-[#ffb77d]">
            <Trophy className="h-9 w-9" />
          </div>
          <p className="quizo-label justify-center">Votre score</p>
          <div className="mt-4 quizo-brand-text text-7xl font-black tracking-tight">{score}%</div>
          <p className="mt-3 text-xl font-bold text-white">{scoreText}</p>
          <Progress value={score} className="mt-6 h-2 bg-white/10" />

          <div className="mt-8 grid grid-cols-2 gap-4">
            <PremiumMetric label="Correctes" value={correctAnswers} icon={Check} tone="green" className="p-4" />
            <PremiumMetric label="Incorrectes" value={answeredIncorrectly} icon={X} tone="default" className="p-4" />
            <PremiumMetric label="Sans réponse" value={unansweredQuestions} icon={Target} tone="copper" className="p-4" />
            <PremiumMetric label="Total" value={totalQuestions} icon={BarChart3} tone="blue" className="p-4" />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button variant="outline" onClick={() => navigate('/')} className="quizo-outline-button">
              <Home className="mr-2 h-4 w-4" />
              Retour à l’accueil
            </Button>
            <Button onClick={() => navigate(`/quiz/${quizId}`)} className="quizo-copper-button">
              <BookOpen className="mr-2 h-4 w-4" />
              Refaire le quiz
            </Button>
          </div>
        </PremiumPanel>

        <PremiumPanel className="overflow-hidden">
          <div className="border-b border-white/[0.07] p-6">
            <h2 className="text-2xl font-bold text-white">Détails des réponses</h2>
            <p className="mt-1 text-sm text-[#a79d96]">Filtrez les questions par état de réponse.</p>
          </div>
          <div className="p-6">
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="mb-6 grid h-auto grid-cols-2 gap-2 bg-transparent md:grid-cols-4">
                <TabsTrigger value="all" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">
                  Toutes ({totalQuestions})
                </TabsTrigger>
                <TabsTrigger value="correct" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300">
                  Correctes ({correctAnswers})
                </TabsTrigger>
                <TabsTrigger value="incorrect" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-red-500/15 data-[state=active]:text-red-300">
                  Incorrectes ({answeredIncorrectly})
                </TabsTrigger>
                <TabsTrigger value="unanswered" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">
                  Sans réponse ({unansweredQuestions})
                </TabsTrigger>
              </TabsList>

              {['all', 'correct', 'incorrect', 'unanswered'].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
                  {filteredQuestions.map(({ question, userAnswer, correctAnswer, isCorrect, unanswered }, index) => (
                    <article
                      key={question.id}
                      className={cn(
                        'rounded-2xl border p-5',
                        isCorrect ? 'border-emerald-400/25 bg-emerald-500/10' : unanswered ? 'border-orange-400/25 bg-orange-500/10' : 'border-red-400/25 bg-red-500/10'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', isCorrect ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                          {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-6 text-white">{index + 1}. {question.text}</p>
                          <div className="mt-4 space-y-2 border-l border-white/10 pl-4 text-sm text-[#d8d2ce]">
                            <p>
                              <span className="font-semibold">Votre réponse:</span>{' '}
                              <span>{userAnswer ? userAnswer.text : 'Non répondu'}</span>
                            </p>
                            {!isCorrect && (
                              <p className="text-emerald-300">
                                <span className="font-semibold">Réponse correcte:</span>{' '}
                                {correctAnswer ? correctAnswer.text : 'Pas de réponse correcte'}
                              </p>
                            )}
                          </div>
                          {question.explanation && (
                            <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/25 p-4 text-sm leading-6 text-[#a79d96]">
                              <span className="font-semibold text-white">Explication:</span> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </PremiumPanel>
      </section>
    </AppShell>
  );
};

export default Results;
