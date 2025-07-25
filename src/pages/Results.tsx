import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuiz } from '@/hooks/useQuiz';
import { Navbar } from '@/components/Navbar';
import { Check, X, BarChart2, Home, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const Results = () => {
  const { quizId, submissionId } = useParams<{ quizId: string; submissionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getQuiz } = useQuiz();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const score = location.state?.score ?? 0;
  const userAnswers = location.state?.answers ?? {};

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) {
        toast.error("ID du quiz non spécifié");
        navigate('/');
        return;
      }

      try {
        const quizData = await getQuiz(quizId);
        if (!quizData) {
          toast.error("Quiz introuvable");
          navigate('/');
          return;
        }
        
        setQuiz(quizData);
      } catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
        toast.error("Impossible de charger les résultats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, getQuiz, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-4 text-lg">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">Résultats introuvables</p>
            <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
          </div>
        </div>
      </div>
    );
  }

  let scoreText = "Besoin d'amélioration";
  let scoreColor = "text-red-500";
  
  if (score >= 80) {
    scoreText = "Excellent !";
    scoreColor = "text-green-500";
  } else if (score >= 60) {
    scoreText = "Bon travail";
    scoreColor = "text-yellow-500";
  } else if (score >= 40) {
    scoreText = "Moyen";
    scoreColor = "text-orange-500";
  }

  const progressBarClass = cn(
    "h-3 mt-6",
    score >= 80 ? "bg-green-500" : 
    score >= 60 ? "bg-yellow-500" : 
    score >= 40 ? "bg-orange-500" : 
    "bg-red-500"
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 pt-16 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full mb-4">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Résultats du Quiz</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Voici vos résultats pour le quiz "{quiz.title}".
            </p>
          </motion.div>
          
          <Card className="border border-[#D2691E]/20 mb-12 overflow-hidden">
            <div className="bg-gradient-to-r from-[#D2691E]/10 to-[#D2691E]/5 p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-3">Votre score</h2>
                <div className="inline-flex items-center justify-center bg-white p-6 rounded-full mb-4 shadow-md">
                  <span className={`text-4xl font-bold ${scoreColor}`}>{score}%</span>
                </div>
                <p className={`text-lg font-semibold ${scoreColor}`}>{scoreText}</p>
                
                <div className="relative w-full mt-6">
                  <Progress value={score} className={progressBarClass} />
                </div>
              </div>
            </div>
            
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6">Détails des réponses</h3>
              
              <div className="space-y-6">
                {quiz.questions.map((question: any, index: number) => {
                  const userAnswerId = userAnswers[question.id];
                  const userAnswer = question.options.find((opt: any) => opt.id === userAnswerId);
                  const correctAnswer = question.options.find((opt: any) => opt.isCorrect);
                  const isCorrect = userAnswerId === correctAnswer?.id;
                  
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 p-1 rounded-full ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isCorrect ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            {index + 1}. {question.text}
                          </p>
                          
                          <div className="pl-4 border-l-2 border-muted mb-3">
                            <p className="text-sm mb-1">
                              <span className="font-medium">Votre réponse:</span>{" "}
                              <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                                {userAnswer ? userAnswer.text : "Non répondu"}
                              </span>
                            </p>
                            
                            {!isCorrect && (
                              <p className="text-sm text-green-600">
                                <span className="font-medium">Réponse correcte:</span>{" "}
                                {correctAnswer ? correctAnswer.text : "Pas de réponse correcte"}
                              </p>
                            )}
                          </div>
                          
                          <div className="bg-muted/50 p-3 rounded text-sm">
                            <p className="font-medium mb-1">Explication:</p>
                            <p>{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            
            <CardFooter className="p-6 bg-muted/20 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full sm:w-auto"
              >
                <Home className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
              
              <Button 
                onClick={() => navigate(`/quiz/${quizId}`)}
                className="w-full sm:w-auto bg-[#D2691E] hover:bg-[#D2691E]/90"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Refaire le quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Results;
