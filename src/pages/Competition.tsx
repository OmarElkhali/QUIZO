import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Clock, AlertCircle } from 'lucide-react';
import { getCompetitionByShareCode, getCompetitionById, getManualQuiz, createAttempt, submitAttemptAnswers } from '@/services/manualQuizService';
import { Competition, ManualQuiz, ManualQuestion } from '@/types/quiz';

const CompetitionPlay = () => {
  const { id } = useParams<{ id: string }>();
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
  
  useEffect(() => {
    const fetchCompetitionAndQuiz = async () => {
      if (!id || !participantId) return;
      
      try {
        let competitionData: Competition | null = null;
        
        // Si l'URL contient shareCode, utiliser getCompetitionByShareCode
        if (location.pathname.includes('/competition/share/') && id.length === 6) {
          competitionData = await getCompetitionByShareCode(id);
        } else {
          // Sinon, utiliser getCompetitionById
          competitionData = await getCompetitionById(id);
        }
        
        if (!competitionData) {
          toast.error('Compétition non trouvée');
          navigate('/join');
          return;
        }
        
        setCompetition(competitionData);
        
        // Récupérer le quiz
        const quizData = await getManualQuiz(competitionData.quizId);
        
        if (!quizData) {
          toast.error('Quiz non trouvé');
          navigate('/join');
          return;
        }
        
        setQuiz(quizData);
        
        // Créer une tentative
        const newAttemptId = await createAttempt(competitionData.id, participantId);
        setAttemptId(newAttemptId);
        
        // Initialiser le timer si nécessaire
        if (quizData.timeLimit) {
          setTimeLeft(quizData.timeLimit * 60); // Convertir en secondes
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement de la compétition:', error);
        toast.error(error.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompetitionAndQuiz();
  }, [id, participantId, navigate]);
  
  // Gestion du timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  const handleNextQuestion = () => {
    if (!quiz) return;
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmitQuiz = async () => {
    if (!quiz || !attemptId || !id || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const score = await submitAttemptAnswers(attemptId, answers, quiz.id);
      
      toast.success('Quiz soumis avec succès!');
      navigate(`/leaderboard/${id}?score=${score.toFixed(2)}`);
    } catch (error: any) {
      console.error('Erreur lors de la soumission du quiz:', error);
      toast.error(error.message || 'Une erreur est survenue lors de la soumission');
      setIsSubmitting(false);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }
  
  if (!quiz || !competition) {
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
              <p className="text-center">Le quiz ou la compétition n'a pas pu être trouvé.</p>
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
                ></div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {answeredCount} sur {totalQuestions} répondues
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
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Précédent
              </Button>
              
              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button onClick={handleNextQuestion}>
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
            {quiz.questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? 'default' : answers[quiz.questions[index].id] ? 'outline' : 'ghost'}
                size="sm"
                className={`w-10 h-10 ${answers[quiz.questions[index].id] ? 'border-green-500 dark:border-green-400' : ''}`}
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
                  Vous n'avez pas répondu à toutes les questions. Assurez-vous de compléter toutes les questions avant de terminer le quiz.
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