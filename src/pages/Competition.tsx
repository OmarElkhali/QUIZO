import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { AlertCircle, Clock } from 'lucide-react';
import {
  createCompetitionAttempt,
  getCompetitionById,
  getManualQuiz,
  recordCompetitionAttemptAnswer,
  submitCompetitionAttempt,
  updateCompetitionParticipantProgress,
} from '@/services/manualQuizService';
import { Competition, ManualQuiz } from '@/types/quiz';

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

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [quiz, setQuiz] = useState<ManualQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (shareCode) {
      navigate(`/join/${shareCode}`, { replace: true });
    }
  }, [navigate, shareCode]);

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
          toast.error('Competition non trouvee');
          navigate('/join');
          return;
        }

        const now = new Date();
        const startDate = new Date(competitionData.startDate);
        const endDate = new Date(competitionData.endDate);
        if (now < startDate) {
          toast.error(`Cette competition n'a pas encore commence.`);
          navigate(`/join/${competitionData.shareCode}`);
          return;
        }
        if (now > endDate || competitionData.status === 'completed') {
          toast.error('Cette competition est terminee.');
          navigate(`/leaderboard/${competitionData.id}`);
          return;
        }

        const quizData = await getManualQuiz(competitionData.quizId);
        if (!quizData) {
          toast.error('Quiz non trouve');
          navigate('/join');
          return;
        }

        const newAttemptId = await createCompetitionAttempt(competitionData.id, participantId);

        if (cancelled) return;
        setCompetition(competitionData);
        setQuiz(quizData);
        setAttemptId(newAttemptId);
        if (quizData.timeLimit) setTimeLeft(quizData.timeLimit * 60);
      } catch (error) {
        console.error('Erreur lors du chargement de la competition:', error);
        toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
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

  useEffect(() => {
    if (!competition?.id || !participantId || isSubmitting) return;
    void updateCompetitionParticipantProgress(competition.id, participantId, currentQuestionIndex).catch((error) => {
      console.error('Unable to update competition progress:', error);
    });
  }, [competition?.id, currentQuestionIndex, isSubmitting, participantId]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz || !attemptId || !competition || !participantId || submittedRef.current) return;

    submittedRef.current = true;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const score = await submitCompetitionAttempt(competition.id, attemptId, participantId, answers, quiz.id);
      toast.success('Quiz soumis avec succes');
      navigate(`/leaderboard/${competition.id}?score=${score.toFixed(2)}`);
    } catch (error) {
      console.error('Erreur lors de la soumission du quiz:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue lors de la soumission');
      submittedRef.current = false;
      setIsSubmitting(false);
    }
  }, [answers, attemptId, competition, navigate, participantId, quiz]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitting) return;

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
  }, [handleSubmitQuiz, isSubmitting, timeLeft]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    if (!competition?.id || !attemptId) return;
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    void recordCompetitionAttemptAnswer(competition.id, attemptId, questionId, optionId).catch((error) => {
      console.error('Unable to save competition answer:', error);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!quiz || !competition || !participantId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Erreur</CardTitle>
              <CardDescription>Impossible de charger le quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center">Le quiz ou la competition n'a pas pu etre trouve.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/join')}>Retour</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{competition.title}</h1>
            <p className="text-muted-foreground">{quiz.title}</p>
          </div>

          {timeLeft !== null && (
            <div className="mb-6 flex items-center justify-between bg-amber-100 dark:bg-amber-900/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                <span className="font-medium text-amber-700 dark:text-amber-300">Temps restant:</span>
              </div>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300">{formatTime(timeLeft)}</span>
            </div>
          )}

          <div className="mb-4 flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">Question {currentQuestionIndex + 1} sur {totalQuestions}</span>
              <div className="w-full bg-muted h-2 rounded-full mt-1">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {answeredCount} sur {totalQuestions} repondues
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>{currentQuestion.text}</div>
                <div className="text-sm font-normal text-muted-foreground ml-4">
                  {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 p-3 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer py-2">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((current) => Math.max(0, current - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Precedent
              </Button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button onClick={() => setCurrentQuestionIndex((current) => Math.min(totalQuestions - 1, current + 1))}>
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Soumission...' : 'Terminer le quiz'}
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
                className={`w-10 h-10 ${answers[question.id] ? 'border-green-500 dark:border-green-400' : ''}`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          {answeredCount < totalQuestions && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-100 dark:border-amber-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300">Attention</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Vous n'avez pas repondu a toutes les questions.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompetitionPlay;
