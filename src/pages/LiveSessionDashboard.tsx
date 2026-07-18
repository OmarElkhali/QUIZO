import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  Crown,
  Play,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WaitingRoom } from '@/components/WaitingRoom';
import { LiveLeaderboard } from '@/components/LiveLeaderboard';
import { PremiumMetric, PremiumPanel } from '@/components/ui/premium';
import {
  listenToCompetition,
  listenToCompetitionAttempts,
  listenToCompetitionParticipants,
  updateCompetitionLiveState,
  getCompetitionById,
} from '@/services/competitionService';
import { getManualQuiz } from '@/services/manualQuizService';
import { Attempt, Competition, LiveState, ManualQuiz, Participant } from '@/types/quiz';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const LiveSessionDashboard = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [quiz, setQuiz] = useState<ManualQuiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [localCountdown, setLocalCountdown] = useState(3);

  // 1. Fetch competition and quiz, and subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribeComp: (() => void) | undefined;
    let unsubscribeParts: (() => void) | undefined;
    let unsubscribeAttempts: (() => void) | undefined;

    const initDashboard = async () => {
      try {
        const compData = await getCompetitionById(sessionId);
        if (!compData) {
          toast.error('Compétition en direct introuvable');
          navigate('/history');
          return;
        }

        // Initialize quiz
        const quizData = await getManualQuiz(compData.quizId);
        if (!quizData) {
          toast.error('Quiz introuvable pour cette compétition');
          navigate('/history');
          return;
        }

        if (cancelled) return;
        setQuiz(quizData);

        // Subscribe to competition changes
        unsubscribeComp = listenToCompetition(sessionId, (comp) => {
          setCompetition(comp);
        });

        // Subscribe to participants list
        unsubscribeParts = listenToCompetitionParticipants(sessionId, (parts) => {
          setParticipants(parts);
        });

        // Subscribe to attempts (answers)
        unsubscribeAttempts = listenToCompetitionAttempts(sessionId, (atts) => {
          setAttempts(atts);
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur initialisation dashboard:', error);
        toast.error('Une erreur est survenue lors du chargement de la session.');
        setIsLoading(false);
      }
    };

    initDashboard();

    return () => {
      cancelled = true;
      unsubscribeComp?.();
      unsubscribeParts?.();
      unsubscribeAttempts?.();
    };
  }, [sessionId, navigate]);

  // Status mapping
  const status = competition?.liveState?.status || 'waiting';
  const currentQuestionIndex = competition?.liveState?.currentQuestionIndex ?? 0;
  const currentQuestion = quiz?.questions[currentQuestionIndex];

  // 2. Countdown phase side-effect: auto advance to first question
  useEffect(() => {
    if (status !== 'countdown') return;

    setLocalCountdown(3);
    const interval = setInterval(() => {
      setLocalCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Advance to question 0
          void updateCompetitionLiveState(sessionId!, {
            status: 'question',
            currentQuestionIndex: 0,
            questionStartTime: new Date().toISOString(),
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, sessionId]);

  // 3. Compute answered players count for the current question
  const answeredCount = useMemo(() => {
    if (!currentQuestion) return 0;
    return attempts.filter((att) => att.answers && att.answers[currentQuestion.id]).length;
  }, [attempts, currentQuestion]);

  // Accuracy and metrics calculations
  const questionAnswersStats = useMemo(() => {
    if (!currentQuestion) return { a: 0, b: 0, c: 0, d: 0, correct: 0, incorrect: 0 };
    const stats = { a: 0, b: 0, c: 0, d: 0, correct: 0, incorrect: 0 };
    
    attempts.forEach((att) => {
      const selected = att.answers?.[currentQuestion.id];
      if (selected) {
        // Find which index option matches (0 = a, 1 = b, etc.)
        const optIdx = currentQuestion.options.findIndex((opt) => opt.id === selected);
        if (optIdx === 0) stats.a++;
        if (optIdx === 1) stats.b++;
        if (optIdx === 2) stats.c++;
        if (optIdx === 3) stats.d++;

        const correctOpt = currentQuestion.options.find((opt) => opt.isCorrect);
        if (correctOpt && selected === correctOpt.id) {
          stats.correct++;
        } else {
          stats.incorrect++;
        }
      }
    });

    return stats;
  }, [attempts, currentQuestion]);

  const totalAnsweredCurrent = questionAnswersStats.correct + questionAnswersStats.incorrect;
  const currentAccuracy = totalAnsweredCurrent > 0 
    ? Math.round((questionAnswersStats.correct / totalAnsweredCurrent) * 100) 
    : 0;

  // Actions
  const handleStartGame = async () => {
    if (!sessionId) return;
    try {
      await updateCompetitionLiveState(sessionId, {
        status: 'countdown',
        currentQuestionIndex: 0,
      });
    } catch (e) {
      toast.error('Erreur lors du démarrage du quiz');
    }
  };

  const handleRevealAnswers = async () => {
    if (!sessionId) return;
    try {
      await updateCompetitionLiveState(sessionId, {
        status: 'reveal',
      });
    } catch (e) {
      toast.error('Erreur lors de la révélation de la réponse');
    }
  };

  const handleShowLeaderboard = async () => {
    if (!sessionId) return;
    try {
      await updateCompetitionLiveState(sessionId, {
        status: 'leaderboard',
      });
    } catch (e) {
      toast.error('Erreur lors de la transition vers le classement');
    }
  };

  const handleNextQuestion = async () => {
    if (!sessionId || !quiz) return;
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= quiz.questions.length) {
      // Completed!
      try {
        await updateCompetitionLiveState(sessionId, {
          status: 'completed',
        });
      } catch (e) {
        toast.error('Erreur lors de la complétion du quiz');
      }
    } else {
      try {
        await updateCompetitionLiveState(sessionId, {
          status: 'question',
          currentQuestionIndex: nextIdx,
          questionStartTime: new Date().toISOString(),
        });
      } catch (e) {
        toast.error('Erreur lors de la transition vers la question suivante');
      }
    }
  };

  const handleCloseSession = async () => {
    navigate('/history');
  };

  if (isLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du salon en direct" description="Connexion aux serveurs de jeu..." />
      </AppShell>
    );
  }

  if (!competition || !quiz) {
    return (
      <AppShell>
        <StateCard
          state="error"
          title="Session introuvable"
          description="Les données de cette compétition en direct n'ont pas pu être chargées."
          action={<Button onClick={() => navigate('/history')}>Retourner à l'historique</Button>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Console d'Animation"
        title={competition.title}
        description="Pilotez le quiz en temps réel et projetez les questions et podiums aux joueurs."
      />

      {/* 1. LOBBY / WAITING STATE */}
      {status === 'waiting' && (
        <WaitingRoom
          shareCode={competition.shareCode}
          participants={participants}
          isHost={true}
          onStartGame={handleStartGame}
          gameTitle={competition.title}
        />
      )}

      {/* 2. COUNTDOWN STATE */}
      {status === 'countdown' && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <motion.div
            key={localCountdown}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-9xl font-black text-orange-500 tracking-tighter"
          >
            {localCountdown > 0 ? localCountdown : 'GO !'}
          </motion.div>
          <p className="text-xl text-[#a79d96] mt-8 font-semibold animate-pulse">
            Préparez-vous ! Le quiz démarre...
          </p>
        </div>
      )}

      {/* 3. ACTIVE QUESTION LOOP */}
      {(status === 'question' || status === 'reveal') && currentQuestion && (
        <div className="space-y-6">
          {/* Header metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <PremiumMetric
              label="Joueurs connectés"
              value={participants.length}
              icon={Users}
              tone="blue"
            />
            <PremiumMetric
              label="Réponses soumises"
              value={`${answeredCount} / ${participants.length}`}
              detail={answeredCount === participants.length ? "Tout le monde a répondu !" : undefined}
              icon={CheckCircle}
              tone="copper"
            />
            <PremiumMetric
              label="Question en cours"
              value={`${currentQuestionIndex + 1} / ${quiz.questions.length}`}
              icon={BarChart3}
              tone="violet"
            />
          </div>

          <PremiumPanel className="p-8 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <span className="quizo-label text-[#ffb77d] block mb-2">Question {currentQuestionIndex + 1}</span>
            <h2 className="text-3xl font-black text-white leading-tight">{currentQuestion.text}</h2>

            {/* Answer Options Grid */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {currentQuestion.options.map((option, idx) => {
                const colorMap = ['border-red-500/20 bg-red-500/5 text-red-200', 'border-sky-500/20 bg-sky-500/5 text-sky-200', 'border-amber-500/20 bg-amber-500/5 text-amber-200', 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200'];
                const revealClass = status === 'reveal' && option.isCorrect 
                  ? 'border-emerald-400 bg-emerald-500/20 text-white font-extrabold ring-4 ring-emerald-400/30' 
                  : status === 'reveal'
                  ? 'opacity-40 grayscale-[30%]'
                  : '';
                
                // Letters (A, B, C, D)
                const letter = ['▲ A', '◆ B', '● C', '■ D'][idx];

                return (
                  <div
                    key={option.id}
                    className={cn(
                      'flex items-center justify-between p-5 rounded-2xl border transition-all duration-300',
                      colorMap[idx],
                      revealClass
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-sm tracking-wider opacity-70">{letter} :</span>
                      <span className="text-base font-medium">{option.text}</span>
                    </div>

                    {/* Stats revealed */}
                    {status === 'reveal' && (
                      <span className="bg-black/35 px-3 py-1 rounded-full text-xs font-bold font-mono">
                        {idx === 0 && `${questionAnswersStats.a} joueurs`}
                        {idx === 1 && `${questionAnswersStats.b} joueurs`}
                        {idx === 2 && `${questionAnswersStats.c} joueurs`}
                        {idx === 3 && `${questionAnswersStats.d} joueurs`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </PremiumPanel>

          {/* Answer details for Reveal state */}
          {status === 'reveal' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="grid gap-6 sm:grid-cols-2"
            >
              <PremiumPanel className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">Statistiques de Réussite</h3>
                <p className="text-3xl font-black text-[#ffb77d]">{currentAccuracy}%</p>
                <p className="text-sm text-[#a79d96] mt-1">des joueurs ont répondu correctement à cette question.</p>
              </PremiumPanel>

              {currentQuestion.explanation && (
                <PremiumPanel className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">Explication pédagogique</h3>
                  <p className="text-sm text-[#a79d96] italic">"{currentQuestion.explanation}"</p>
                </PremiumPanel>
              )}
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.05]">
            {status === 'question' ? (
              <Button onClick={handleRevealAnswers} className="quizo-copper-button px-8 h-12 text-base font-bold">
                Révéler la bonne réponse
              </Button>
            ) : (
              <Button onClick={handleShowLeaderboard} className="quizo-copper-button px-8 h-12 text-base font-bold flex items-center gap-2">
                Voir le classement <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 4. TEMPORARY LEADERBOARD BETWEEN QUESTIONS */}
      {status === 'leaderboard' && (
        <div className="space-y-6">
          <PremiumPanel className="p-6 text-center">
            <h3 className="text-xl font-extrabold text-white">Classement Intermédiaire</h3>
            <p className="text-sm text-[#a79d96] mt-1">Tableau des scores après la question {currentQuestionIndex + 1}</p>
          </PremiumPanel>

          <LiveLeaderboard participants={participants} showConfetti={false} />

          <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.05]">
            <Button onClick={handleNextQuestion} className="quizo-copper-button px-8 h-12 text-base font-bold flex items-center gap-2">
              {currentQuestionIndex + 1 >= quiz.questions.length ? 'Terminer le quiz' : 'Question suivante'} 
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* 5. GAME COMPLETED PODIUM */}
      {status === 'completed' && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border-4 border-amber-400 text-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-bounce mb-6">
              <Trophy className="h-10 w-10" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">Quiz Terminé !</h2>
            <p className="text-md text-[#a79d96] mt-2 max-w-md mx-auto">
              Félicitations à tous les participants. Voici le podium final des champions !
            </p>
          </div>

          <LiveLeaderboard participants={participants} showConfetti={true} />

          <div className="flex justify-center gap-3 pt-8 border-t border-white/[0.05]">
            <Button onClick={handleCloseSession} className="quizo-copper-button px-10 h-12 text-base font-bold">
              Fermer la session
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default LiveSessionDashboard;
