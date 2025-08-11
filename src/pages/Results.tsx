import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuiz } from '@/hooks/useQuiz';
import { Navbar } from '@/components/Navbar';
import { Check, X, BarChart2, Home, Loader2, BookOpen, Award, Share2, Download, Trophy, Brain, Clock, Target, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Remplacer cette ligne :
// import { useTheme } from '@/context/ThemeProvider';

// Par celle-ci :
import { useTheme } from "next-themes";

const Results = () => {
  const { quizId, submissionId } = useParams<{ quizId: string; submissionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getQuiz } = useQuiz();
  const { theme } = useTheme(); // Récupérer le thème actuel
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const score = location.state?.score ?? 0;
  const userAnswers = location.state?.answers ?? {};
  const controls = useAnimation();

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

  // Effet pour lancer les confettis si le score est bon
  useEffect(() => {
    if (score >= 70 && !isLoading && quiz) {
      setShowConfetti(true);
      setShowCelebration(true);
      
      // Animation séquence
      controls.start({
        scale: [0.8, 1.2, 1],
        rotate: [0, 10, -10, 0],
        transition: { duration: 1.5, ease: "easeInOut" }
      });
      
      // Confetti effect
      const timer = setTimeout(() => {
        const colors = ['#FFC700', '#FF0000', '#2E3191', '#41C9B4'];
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: colors,
          shapes: ['circle', 'square'],
          gravity: 0.8,
          zIndex: 1000,
        });
        
        // Second wave of confetti
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.65 },
            colors: colors,
          });
          
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.65 },
            colors: colors,
          });
        }, 800);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [score, isLoading, quiz, controls]);

  // Fonction pour partager les résultats
  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: `Résultats du Quiz: ${quiz.title}`,
        text: `J'ai obtenu un score de ${score}% au quiz "${quiz.title}"!`,
        url: window.location.href,
      })
      .then(() => toast.success("Partagé avec succès!"))
      .catch((error) => {
        console.error("Erreur lors du partage:", error);
        toast.error("Impossible de partager");
      });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      navigator.clipboard.writeText(
        `J'ai obtenu un score de ${score}% au quiz "${quiz.title}"! Essayez-le: ${window.location.href}`
      )
      .then(() => toast.success("Lien copié dans le presse-papier!"))
      .catch(() => toast.error("Impossible de copier le lien"));
    }
  };

  // Fonction pour télécharger les résultats en PDF (simulation)
  const downloadPDF = () => {
    toast.success("Téléchargement du PDF démarré");
    // Ici vous pourriez implémenter la génération réelle du PDF
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col dark:bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg dark:text-gray-300">Chargement des résultats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col dark:bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <X className="h-16 w-16 text-red-500 mx-auto" />
            </motion.div>
            <p className="text-xl font-semibold mb-4 dark:text-white">Résultats introuvables</p>
            <Button onClick={() => navigate('/')} className="mt-2">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calcul des statistiques
  const totalQuestions = quiz.questions.length;
  const correctAnswers = quiz.questions.filter((question: any) => {
    const userAnswerId = userAnswers[question.id];
    const correctAnswer = question.options.find((opt: any) => opt.isCorrect);
    return userAnswerId === correctAnswer?.id;
  }).length;
  
  const incorrectAnswers = totalQuestions - correctAnswers;
  const unansweredQuestions = quiz.questions.filter((question: any) => !userAnswers[question.id]).length;
  const answeredIncorrectly = incorrectAnswers - unansweredQuestions;

  // Déterminer le badge et le message en fonction du score
  let scoreText = "Besoin d'amélioration";
  let scoreColor = theme === 'dark' ? "text-red-400" : "text-red-500";
  let badgeIcon = null;
  let celebrationMessage = "";
  
  if (score >= 90) {
    scoreText = "Excellent !";
    scoreColor = theme === 'dark' ? "text-green-400" : "text-green-500";
    badgeIcon = "gold";
    celebrationMessage = "Félicitations! Vous avez excellé dans ce quiz!";
  } else if (score >= 75) {
    scoreText = "Très bien !";
    scoreColor = theme === 'dark' ? "text-green-400" : "text-green-500";
    badgeIcon = "silver";
    celebrationMessage = "Bravo! Vous avez très bien réussi ce quiz!";
  } else if (score >= 60) {
    scoreText = "Bon travail";
    scoreColor = theme === 'dark' ? "text-yellow-400" : "text-yellow-500";
    badgeIcon = "bronze";
    celebrationMessage = "Bon travail! Vous avez bien réussi ce quiz.";
  } else if (score >= 40) {
    scoreText = "Moyen";
    scoreColor = theme === 'dark' ? "text-orange-400" : "text-orange-500";
    celebrationMessage = "Vous pouvez faire mieux! Réessayez pour améliorer votre score.";
  } else {
    celebrationMessage = "N'abandonnez pas! Réessayez pour améliorer votre score.";
  }

  const progressBarClass = cn(
    "h-3 mt-6",
    score >= 80 ? "bg-green-500" : 
    score >= 60 ? "bg-yellow-500" : 
    score >= 40 ? "bg-orange-500" : 
    "bg-red-500"
  );

  // Filtrer les questions en fonction de l'onglet actif
  const filteredQuestions = quiz.questions.filter((question: any) => {
    const userAnswerId = userAnswers[question.id];
    const correctAnswer = question.options.find((opt: any) => opt.isCorrect);
    const isCorrect = userAnswerId === correctAnswer?.id;
    
    if (activeTab === 'all') return true;
    if (activeTab === 'correct') return isCorrect;
    if (activeTab === 'incorrect') return !isCorrect && userAnswerId;
    if (activeTab === 'unanswered') return !userAnswerId;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-muted/30 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      
      <main className="flex-1 pt-16 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center bg-primary/10 dark:bg-primary/20 p-3 rounded-full mb-4">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4 dark:text-white">Résultats du Quiz</h1>
            <p className="text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
              Voici vos résultats pour le quiz "{quiz.title}".
            </p>
          </motion.div>
          
          <Card className="border border-[#D2691E]/20 dark:border-[#D2691E]/10 mb-12 overflow-hidden shadow-lg dark:bg-gray-800 dark:text-white transition-all duration-300">
            <div className="bg-gradient-to-r from-[#D2691E]/10 to-[#D2691E]/5 dark:from-[#D2691E]/20 dark:to-[#D2691E]/10 p-8">
              <div className="text-center">
                <AnimatePresence>
                  {showCelebration && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-6 text-lg font-medium text-[#D2691E] dark:text-[#D2691E]">
                      {celebrationMessage}
                    </motion.div>
                  )}
                  
                  {badgeIcon && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={controls}
                      className="mb-4 flex justify-center"
                    >
                      <div className={`inline-flex items-center justify-center p-3 rounded-full ${
                        badgeIcon === 'gold' 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                          : badgeIcon === 'silver' 
                            ? 'bg-gray-100 dark:bg-gray-700/50' 
                            : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        <Trophy className={`h-10 w-10 ${
                          badgeIcon === 'gold' 
                            ? 'text-yellow-500 dark:text-yellow-400' 
                            : badgeIcon === 'silver' 
                              ? 'text-gray-400 dark:text-gray-300' 
                              : 'text-amber-600 dark:text-amber-500'
                        }`} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <h2 className="text-2xl font-bold mb-3 dark:text-white">Votre score</h2>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center bg-white dark:bg-gray-700 p-6 rounded-full mb-4 shadow-md"
                >
                  <span className={`text-5xl font-bold ${scoreColor}`}>{score}%</span>
                </motion.div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-lg font-semibold ${scoreColor}`}
                >
                  {scoreText}
                </motion.p>
                
                <div className="relative w-full mt-6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <Progress value={score} className={progressBarClass} />
                  </motion.div>
                </div>
                
                {/* Statistiques du quiz */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-center mb-2">
                      <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    </div>
                    <div className="text-green-500 dark:text-green-400 font-bold text-xl">{correctAnswers}</div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">Correctes</div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-center mb-2">
                      <X className="h-5 w-5 text-red-500 dark:text-red-400" />
                    </div>
                    <div className="text-red-500 dark:text-red-400 font-bold text-xl">{answeredIncorrectly}</div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">Incorrectes</div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-center mb-2">
                      <Target className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                    </div>
                    <div className="text-orange-500 dark:text-orange-400 font-bold text-xl">{unansweredQuestions}</div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">Sans réponse</div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/80 dark:bg-gray-700/80 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-center mb-2">
                      <Brain className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="text-blue-500 dark:text-blue-400 font-bold text-xl">{totalQuestions}</div>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">Total</div>
                  </motion.div>
                </div>
                
                {/* Actions rapides */}
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all duration-300"
                    onClick={shareResults}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all duration-300"
                    onClick={downloadPDF}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </div>
              </div>
            </div>
            
            <CardContent className="p-8 dark:bg-gray-800">
              <h3 className="text-xl font-semibold mb-6 dark:text-white">Détails des réponses</h3>
              
              {/* Onglets pour filtrer les questions */}
              <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-4 dark:bg-gray-700">
                  <TabsTrigger value="all" className="dark:data-[state=active]:bg-gray-600">Toutes ({quiz.questions.length})</TabsTrigger>
                  <TabsTrigger value="correct" className="dark:data-[state=active]:bg-gray-600">Correctes ({correctAnswers})</TabsTrigger>
                  <TabsTrigger value="incorrect" className="dark:data-[state=active]:bg-gray-600">Incorrectes ({answeredIncorrectly})</TabsTrigger>
                  <TabsTrigger value="unanswered" className="dark:data-[state=active]:bg-gray-600">Sans réponse ({unansweredQuestions})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-0">
                  <div className="space-y-6">
                    {renderQuestions(filteredQuestions, userAnswers, theme)}
                  </div>
                </TabsContent>
                
                <TabsContent value="correct" className="mt-0">
                  <div className="space-y-6">
                    {renderQuestions(filteredQuestions, userAnswers, theme)}
                  </div>
                </TabsContent>
                
                <TabsContent value="incorrect" className="mt-0">
                  <div className="space-y-6">
                    {renderQuestions(filteredQuestions, userAnswers, theme)}
                  </div>
                </TabsContent>
                
                <TabsContent value="unanswered" className="mt-0">
                  <div className="space-y-6">
                    {renderQuestions(filteredQuestions, userAnswers, theme)}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="p-6 bg-muted/20 dark:bg-gray-700/50 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full sm:w-auto dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all duration-300"
              >
                <Home className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
              
              <Button 
                onClick={() => navigate(`/quiz/${quizId}`)}
                className="w-full sm:w-auto bg-[#D2691E] hover:bg-[#D2691E]/90 dark:bg-[#D2691E] dark:hover:bg-[#D2691E]/80 transition-all duration-300"
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

// Fonction pour rendre les questions
const renderQuestions = (questions: any[], userAnswers: Record<string, string>, theme: string = 'light') => {
  return questions.map((question: any, index: number) => {
    const userAnswerId = userAnswers[question.id];
    const userAnswer = question.options.find((opt: any) => opt.id === userAnswerId);
    const correctAnswer = question.options.find((opt: any) => opt.isCorrect);
    const isCorrect = userAnswerId === correctAnswer?.id;
    
    // Couleurs adaptées au mode sombre
    const getBgColor = () => {
      if (theme === 'dark') {
        return isCorrect 
          ? "border-green-600 hover:border-green-500 bg-green-900/20" 
          : !userAnswerId 
            ? "border-orange-600 hover:border-orange-500 bg-orange-900/20" 
            : "border-red-600 hover:border-red-500 bg-red-900/20";
      } else {
        return isCorrect 
          ? "border-green-200 hover:border-green-300 bg-green-50/50" 
          : !userAnswerId 
            ? "border-orange-200 hover:border-orange-300 bg-orange-50/50" 
            : "border-red-200 hover:border-red-300 bg-red-50/50";
      }
    };
    
    const getIconBgColor = () => {
      if (theme === 'dark') {
        return isCorrect 
          ? 'bg-green-800' 
          : !userAnswerId 
            ? 'bg-orange-800' 
            : 'bg-red-800';
      } else {
        return isCorrect 
          ? 'bg-green-100' 
          : !userAnswerId 
            ? 'bg-orange-100' 
            : 'bg-red-100';
      }
    };
    
    const getIconColor = () => {
      if (theme === 'dark') {
        return isCorrect 
          ? "text-green-400" 
          : !userAnswerId 
            ? "text-orange-400" 
            : "text-red-400";
      } else {
        return isCorrect 
          ? "text-green-600" 
          : !userAnswerId 
            ? "text-orange-600" 
            : "text-red-600";
      }
    };
    
    return (
      <motion.div 
        key={question.id} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "border rounded-lg p-4 transition-all duration-200 dark:text-white",
          getBgColor()
        )}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-1 p-1 rounded-full",
            getIconBgColor()
          )}>
            {isCorrect ? (
              <Check className={`h-4 w-4 ${getIconColor()}`} />
            ) : !userAnswerId ? (
              <X className={`h-4 w-4 ${getIconColor()}`} />
            ) : (
              <X className={`h-4 w-4 ${getIconColor()}`} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium mb-2">
              {index + 1}. {question.text}
            </p>
            
            <div className="pl-4 border-l-2 border-muted dark:border-gray-600 mb-3">
              <p className="text-sm mb-1">
                <span className="font-medium">Votre réponse:</span>{" "}
                <span className={isCorrect 
                  ? theme === 'dark' ? "text-green-400" : "text-green-600" 
                  : !userAnswerId 
                    ? theme === 'dark' ? "text-orange-400" : "text-orange-600" 
                    : theme === 'dark' ? "text-red-400" : "text-red-600"}>
                  {userAnswer ? userAnswer.text : "Non répondu"}
                </span>
              </p>
              
              {(!isCorrect) && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  <span className="font-medium">Réponse correcte:</span>{" "}
                  {correctAnswer ? correctAnswer.text : "Pas de réponse correcte"}
                </p>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-3 rounded text-sm shadow-sm">
              <p className="font-medium mb-1">Explication:</p>
              <p className="dark:text-gray-300">{question.explanation}</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  });
};

export default Results;
