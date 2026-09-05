import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { AlertCircle, Clock, Check, X, Flame, Trophy, Award, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  createCompetitionAttempt,
  getCompetitionById,
  getManualQuiz,
  recordCompetitionAttemptAnswer,
  submitCompetitionAttempt,
  updateCompetitionParticipantProgress,
  updateCompetitionParticipantScore,
  listenToCompetition,
  listenToCompetitionParticipants,
} from '@/services/manualQuizService';
import { mapParticipant } from '@/services/manualQuizCore';
import { Competition, ManualQuiz, Participant, Attempt } from '@/types/quiz';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { LiveLeaderboard } from '@/components/LiveLeaderboard';
import { cn } from '@/lib/utils';

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const CompetitionPlay = () => {
  const { competitionId, shareCode } = useParams<{ competitionId?: string; shareCode?: string }>();
  const [searchParams] = useSearchParams();
  const participantId = searchParams.get('participant');
  const navigate = useNavigate();

  // Basic Game States
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [quiz, setQuiz] = useState<ManualQuiz | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // Real-Time Sync States
  const [liveCountdown, setLiveCountdown] = useState(3);
  const [streak, setStreak] = useState(0);
  const [pointsEarnedThisQuestion, setPointsEarnedThisQuestion] = useState(0);
  const [wasCorrectThisQuestion, setWasCorrectThisQuestion] = useState(false);
  const [lastCalculatedIndex, setLastCalculatedIndex] = useState(-1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (shareCode) {
      navigate(`/join/${shareCode}`, { replace: true });
    }
  }, [navigate, shareCode]);

  // Load initial settings and attempt
  useEffect(() => {
    let cancelled = false;

    const fetchCompetitionAndQuiz = async () => {
      if (!competitionId || !participantId || shareCode) {
        setIsLoading(false);
        return;
      }

      try {
        const competitionData = await getCompetitionById(competitionId);
        if (!competitionData) {
          toast.error('Compétition introuvable');
          navigate('/join');
          return;
        }

        // Load participant profile
        const partSnap = await getDoc(doc(db, 'competitions', competitionId, 'participants', participantId));
        if (partSnap.exists()) {
          setParticipant(mapParticipant(partSnap.id, partSnap.data()));
        }

        const quizData = await getManualQuiz(competitionData.quizId);
        if (!quizData) {
          toast.error('Quiz introuvable');
          navigate('/join');
          return;
        }

        // Initialize attempt
        const newAttemptId = await createCompetitionAttempt(competitionId, participantId);

        if (cancelled) return;
        setCompetition(competitionData);
        setQuiz(quizData);
        setAttemptId(newAttemptId);
        
        if (competitionData.mode !== 'teacher_led' && quizData.timeLimit) {
          setTimeLeft(quizData.timeLimit * 60);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la compétition:', error);
        toast.error('Une erreur est survenue lors du chargement.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCompetitionAndQuiz();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [competitionId, navigate, participantId, shareCode]);

  // Handle Real-Time Synchronous Listeners
  useEffect(() => {
    if (!competitionId || !competition || competition.mode !== 'teacher_led') return;

    // Listen to live state changes from the host
    const unsubscribeComp = listenToCompetition(competitionId, (updatedComp) => {
      setCompetition(updatedComp);

      const liveState = updatedComp.liveState;
      if (liveState) {
        // Sync question index
        setCurrentQuestionIndex(liveState.currentQuestionIndex);

        // Transition states based on host status
        if (liveState.status === 'question') {
          // Set question timer left
          if (quiz?.questions[liveState.currentQuestionIndex]) {
            const timeLimit = quiz.questions[liveState.currentQuestionIndex].timeLimit || 20;
            const elapsed = (Date.now() - new Date(liveState.questionStartTime || Date.now()).getTime()) / 1000;
            setTimeLeft(Math.max(0, Math.floor(timeLimit - elapsed)));
          }
        }
      }
    });

    // Listen to participants (for lobby count)
    const unsubscribeParts = listenToCompetitionParticipants(competitionId, (parts) => {
      setParticipants(parts);
      // Keep participant reference updated
      const self = parts.find(p => p.id === participantId);
      if (self) setParticipant(self);
    });

    return () => {
      unsubscribeComp();
      unsubscribeParts();
    };
  }, [competitionId, competition, quiz, participantId]);

  // Synchronous countdown helper
  useEffect(() => {
    if (competition?.mode === 'teacher_led' && competition.liveState?.status === 'countdown') {
      setLiveCountdown(3);
      const interval = setInterval(() => {
        setLiveCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [competition?.liveState?.status, competition?.mode]);

  // Answer submission and calculation for synchronous mode
  useEffect(() => {
    const liveState = competition?.liveState;
    if (
      competition?.mode === 'teacher_led' && 
      liveState?.status === 'reveal' && 
      quiz && 
      lastCalculatedIndex !== currentQuestionIndex
    ) {
      // Calculate score for this question
      const currentQuestion = quiz.questions[currentQuestionIndex];
      const selectedOptionId = answers[currentQuestion.id];
      const correctOption = currentQuestion.options.find(opt => opt.isCorrect);
      
      let earned = 0;
      let isCorrect = false;

      if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
        isCorrect = true;
        // Base score
        const base = 1000;
        
        // Speed bonus
        const startTime = new Date(liveState.questionStartTime || Date.now()).getTime();
        // Fallback or calculate time spent
        const timeLimit = currentQuestion.timeLimit || 20;
        const timeSpent = Math.max(0.1, (Date.now() - startTime) / 1000);
        const speedRatio = Math.max(0, 1 - timeSpent / timeLimit);
        const speedBonus = Math.max(0, Math.min(500, Math.floor(500 * speedRatio)));

        // Streak bonus
        const streakBonus = streak * 100;
        earned = base + speedBonus + streakBonus;

        setStreak(prev => prev + 1);
        setWasCorrectThisQuestion(true);
      } else {
        setStreak(0);
        setWasCorrectThisQuestion(false);
      }

      setPointsEarnedThisQuestion(earned);
      setLastCalculatedIndex(currentQuestionIndex);

      // Save updated score to Firestore
      const newCumulativeScore = (participant?.score || 0) + earned;
      void updateCompetitionParticipantScore(
        competition.id, 
        participantId!, 
        newCumulativeScore, 
        currentQuestionIndex
      );
    }
  }, [
    competition?.liveState?.status, 
    competition?.mode, 
    quiz, 
    currentQuestionIndex, 
    answers, 
    streak, 
    participant?.score, 
    participantId, 
    competition?.id, 
    lastCalculatedIndex
  ]);

  // Submit attempt at the end of synchronous game
  useEffect(() => {
    if (
      competition?.mode === 'teacher_led' && 
      competition.liveState?.status === 'completed' && 
      !submittedRef.current && 
      attemptId && 
      quiz
    ) {
      submittedRef.current = true;
      void submitCompetitionAttempt(
        competition.id, 
        attemptId, 
        participantId!, 
        answers, 
        quiz.id
      ).then(() => {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });
    }
  }, [competition?.liveState?.status, competition?.mode, attemptId, quiz, answers, competition?.id, participantId]);

  // Regular Async Mode timer countdown
  useEffect(() => {
    if (competition?.mode === 'teacher_led' || timeLeft === null || timeLeft <= 0 || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current === null || current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void handleSubmitQuiz();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [competition?.mode, isSubmitting, timeLeft]);

  // Active question timer countdown (Synchronous mode)
  useEffect(() => {
    if (competition?.mode !== 'teacher_led' || competition?.liveState?.status !== 'question' || timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((current) => {
        if (current === null || current <= 1) {
          clearInterval(interval);
          if (quiz?.questions[currentQuestionIndex] && !answers[quiz.questions[currentQuestionIndex].id]) {
            handleAnswerChange(quiz.questions[currentQuestionIndex].id, '__timeout__');
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [competition?.mode, competition?.liveState?.status, timeLeft, quiz, currentQuestionIndex, answers]);

  // Sync Progress in self-paced mode
  useEffect(() => {
    if (!competition?.id || !participantId || isSubmitting || competition.mode === 'teacher_led') return;
    void updateCompetitionParticipantProgress(competition.id, participantId, currentQuestionIndex).catch((error) => {
      console.error('Unable to update competition progress:', error);
    });
  }, [competition?.id, currentQuestionIndex, isSubmitting, participantId, competition?.mode]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz || !attemptId || !competition || !participantId || submittedRef.current) return;

    submittedRef.current = true;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const score = await submitCompetitionAttempt(competition.id, attemptId, participantId, answers, quiz.id);
      toast.success('Quiz soumis avec succès');
      navigate(`/leaderboard/${competition.id}?score=${score.toFixed(2)}`);
    } catch (error) {
      console.error('Erreur lors de la soumission du quiz:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue lors de la soumission');
      submittedRef.current = false;
      setIsSubmitting(false);
    }
  }, [answers, attemptId, competition, navigate, participantId, quiz]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    if (!competition?.id || !attemptId) return;
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    


    void recordCompetitionAttemptAnswer(competition.id, attemptId, questionId, optionId).catch((error) => {
      console.error('Unable to save competition answer:', error);
    });
  };

  const handleNextAsyncQuestion = () => {
    if (!quiz) return;
    if (currentQuestionIndex + 1 >= quiz.questions.length) {
      void handleSubmitQuiz();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#ffb77d]" />
        </main>
      </div>
    );
  }

  if (!quiz || !competition || !participantId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Erreur</CardTitle>
              <CardDescription>Impossible de charger le quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-[#a79d96]">Le quiz ou la compétition n'a pas pu être trouvé.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/join')} className="quizo-copper-button">Retour</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isAnsweredThisQuestion = currentQuestion ? !!answers[currentQuestion.id] : false;

  // ──────────────────────────────────────────────────────────
  // SYNCHRONOUS FLOW RENDERING
  // ──────────────────────────────────────────────────────────
  if (competition.mode === 'teacher_led') {
    const liveStatus = competition.liveState?.status || 'waiting';

    return (
      <div className="dark quizo-app-bg min-h-screen flex flex-col">
        <div className="pointer-events-none fixed inset-0 quizo-ambient" />
        <header className="relative z-10 flex h-20 items-center justify-between px-5 md:px-10 border-b border-white/[0.05] bg-black/20">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold tracking-wide text-orange-300">{competition.title}</span>
          </div>
          {participant && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white">{participant.name}</span>
              <span className="bg-orange-500/20 text-[#ffb77d] px-3 py-1 rounded-full text-xs font-black">
                {Math.round(participant.score || 0)} pts
              </span>
            </div>
          )}
        </header>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
          <AnimatePresence mode="wait">
            
            {/* LOBBY LITE FOR PARTICIPANTS */}
            {liveStatus === 'waiting' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full text-center py-10"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 border-2 border-orange-500 text-orange-400 mb-6 animate-pulse">
                  <Loader2 className="animate-spin h-8 w-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Prêt à jouer, {participant?.name} ?</h2>
                <p className="text-sm text-[#a79d96] mt-2">
                  L'animateur va bientôt lancer le quiz. Installez-vous bien !
                </p>
                <div className="mt-8 bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl max-w-xs mx-auto">
                  <span className="text-xs text-[#a79d96]">Autres joueurs connectés :</span>
                  <span className="block text-2xl font-black text-white mt-1">{participants.length}</span>
                </div>
              </motion.div>
            )}

            {/* COUNTDOWN */}
            {liveStatus === 'countdown' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  key={liveCountdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-9xl font-black text-[#ffb77d]"
                >
                  {liveCountdown > 0 ? liveCountdown : 'C\'est parti !'}
                </motion.div>
              </motion.div>
            )}

            {/* QUESTION PHASE */}
            {liveStatus === 'question' && currentQuestion && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
                {/* Timer Bar */}
                <div className="w-full mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="quizo-label text-orange-300">Question {currentQuestionIndex + 1} / {totalQuestions}</span>
                    {timeLeft !== null && (
                      <span className={cn(
                        "font-bold text-sm px-3 py-1 rounded-full border", 
                        timeLeft <= 5 ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" : "bg-white/5 text-[#a79d96] border-white/10"
                      )}>
                        Temps restant : {timeLeft}s
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10 w-full">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        timeLeft !== null && timeLeft <= 5 ? "bg-red-500" : "bg-orange-500"
                      )} 
                      style={{ width: `${Math.max(0, Math.min(100, (timeLeft ?? 0) / (currentQuestion.timeLimit || 20) * 100))}%` }}
                    />
                  </div>
                </div>

                {isAnsweredThisQuestion ? (
                  <div className="text-center py-16">
                    <Loader2 className="animate-spin h-10 w-10 text-[#ffb77d] mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white">Réponse bien enregistrée !</h3>
                    <p className="text-sm text-[#a79d96] mt-2">En attente des autres joueurs ou de la fin du temps...</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white text-center leading-tight mb-8">
                      {currentQuestion.text}
                    </h1>

                    {/* Gamepad styled buttons */}
                    <div className="grid gap-4 sm:grid-cols-2 w-full">
                      {currentQuestion.options.map((option, idx) => {
                        const colorMap = [
                          'border-red-500/30 bg-red-500/10 text-white hover:bg-red-500/20 active:scale-95',
                          'border-sky-500/30 bg-sky-500/10 text-white hover:bg-sky-500/20 active:scale-95',
                          'border-amber-500/30 bg-amber-500/10 text-white hover:bg-amber-500/20 active:scale-95',
                          'border-emerald-500/30 bg-emerald-500/10 text-white hover:bg-emerald-500/20 active:scale-95'
                        ];
                        const iconLetter = ['▲', '◆', '●', '■'][idx];

                        return (
                          <button
                            key={option.id}
                            onClick={() => handleAnswerChange(currentQuestion.id, option.id)}
                            className={cn(
                              'flex items-center gap-4 p-6 rounded-2xl border text-left text-lg font-bold transition duration-300 w-full shadow-lg',
                              colorMap[idx]
                            )}
                          >
                            <span className="text-2xl shrink-0 opacity-70">{iconLetter}</span>
                            <span>{option.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* REVEAL FEEDBACK */}
            {liveStatus === 'reveal' && currentQuestion && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full text-center max-w-md mx-auto"
              >
                {wasCorrectThisQuestion ? (
                  <div className="py-6 flex flex-col items-center">
                    <div className="h-20 w-20 bg-emerald-500/20 border-4 border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                      <Check className="h-10 w-10 stroke-[3]" />
                    </div>
                    <h2 className="text-3xl font-black text-emerald-400">CORRECT !</h2>
                    <p className="text-5xl font-black text-white mt-4">+{pointsEarnedThisQuestion}</p>
                    <p className="text-xs text-[#a79d96] mt-1">points gagnés</p>
                    
                    {streak > 1 && (
                      <div className="mt-6 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full text-orange-400 font-bold text-sm">
                        <Flame className="h-4 w-4 fill-current animate-bounce" />
                        Série x{streak} !
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center">
                    <div className="h-20 w-20 bg-red-500/20 border-4 border-red-400 text-red-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(248,113,113,0.3)]">
                      <X className="h-10 w-10 stroke-[3]" />
                    </div>
                    <h2 className="text-3xl font-black text-red-400">INCORRECT</h2>
                    <p className="text-sm text-[#a79d96] mt-4">
                      La bonne réponse était :
                    </p>
                    <div className="mt-3 bg-white/5 border border-white/10 px-6 py-3 rounded-xl font-bold text-white max-w-xs">
                      {currentQuestion.options.find(o => o.isCorrect)?.text}
                    </div>
                  </div>
                )}
                
                {currentQuestion.explanation && (
                  <div className="mt-8 bg-black/20 border border-white/[0.05] p-5 rounded-2xl text-sm text-[#a79d96] italic text-left">
                    "{currentQuestion.explanation}"
                  </div>
                )}
              </motion.div>
            )}

            {/* INTERMEDIATE LEADERBOARD */}
            {liveStatus === 'leaderboard' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Classement en Direct</h2>
                  <p className="text-xs text-[#a79d96] mt-1">Suivez les meilleurs scores</p>
                </div>
                <LiveLeaderboard participants={participants} showConfetti={false} />
              </motion.div>
            )}

            {/* COMPLETED/PODIUM */}
            {liveStatus === 'completed' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border-2 border-amber-400 text-amber-200 mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Trophy className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-black text-white">Podium Final !</h2>
                <p className="text-sm text-[#a79d96] mt-2 mb-8">
                  Super partie ! Félicitations à tous les finalistes.
                </p>
                
                <LiveLeaderboard participants={participants} showConfetti={true} />
                
                <Button onClick={() => navigate('/history')} className="quizo-copper-button px-8 h-12 text-sm font-bold mt-10">
                  Retour à l'historique
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // CLASSIC ASYNCHRONOUS PLAY FLOW
  // ──────────────────────────────────────────────────────────
  return (
    <div className="dark quizo-app-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 quizo-ambient" />
      <header className="relative z-10 flex h-20 items-center justify-between px-5 md:px-10 border-b border-white/[0.05] bg-black/20">
        <div className="flex items-center gap-5">
          <span className="text-sm font-semibold tracking-wide text-orange-300">{competition.title}</span>
        </div>
        {timeLeft !== null && (
          <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.055] px-5 py-2 text-[#ffb77d] shadow-[0_0_20px_rgba(255,183,125,0.08)]">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm font-bold tracking-widest">{formatTime(timeLeft)}</span>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col px-4 pb-32 pt-8 md:px-10">
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <span className="quizo-label">Question {currentQuestionIndex + 1} / {totalQuestions}</span>
            <span className="quizo-label text-[#ffb77d]">{Math.round(progress)}%</span>
          </div>
          <div className="h-px overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#ffb77d] shadow-[0_0_12px_rgba(255,183,125,0.9)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="quizo-panel relative overflow-hidden p-6 sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-transparent" />
          <div className="relative">
            <h1 className="max-w-4xl text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
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
                    <div
                      className={cn(
                        'flex min-h-[72px] items-center gap-4 rounded-2xl border p-5 text-left transition duration-300',
                        selected
                          ? 'border-orange-300/55 bg-orange-500/12 text-white shadow-[0_0_30px_rgba(255,183,125,0.12)]'
                          : 'border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[var(--quizo-text)] hover:border-orange-300/35 hover:bg-[var(--quizo-surface-hover)]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
                          selected ? 'border-orange-200' : 'border-[#8d8178]'
                        )}
                      >
                        <span className={cn('h-2 w-2 rounded-full transition', selected ? 'bg-orange-200' : 'bg-transparent')} />
                      </span>
                      <span className={cn('text-base leading-6', selected && 'font-semibold')}>{option.text}</span>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>

            <div className="mt-12 flex justify-end gap-3">
              <Button
                onClick={handleNextAsyncQuestion}
                disabled={!answers[currentQuestion.id]}
                className="quizo-copper-button px-8 h-12 text-sm font-bold disabled:opacity-50"
              >
                {currentQuestionIndex + 1 >= totalQuestions ? 'Terminer' : 'Suivant'}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CompetitionPlay;
