import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuiz } from '@/hooks/useQuiz';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FileText, HelpCircle, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const QuizPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuiz } = useQuiz();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFallbackQuestions, setHasFallbackQuestions] = useState(false);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) {
        toast.error("ID du quiz non spécifié");
        navigate('/');
        return;
      }

      try {
        console.log("Chargement du quiz avec ID:", id);
        const quizData = await getQuiz(id);
        
        if (!quizData) {
          toast.error("Quiz introuvable");
          navigate('/');
          return;
        }
        
        // Vérifier si les questions sont des questions de secours
        const hasBackupQuestions = quizData.questions?.some(q => 
          q.text.includes('(générée') || 
          q.text.includes('mode secours') ||
          q.text.includes('générée automatiquement') ||
          q.explanation?.includes('secours')
        );
        
        setHasFallbackQuestions(hasBackupQuestions);
        setQuiz(quizData);
        console.log("Quiz chargé avec succès:", quizData);
      } catch (error: any) {
        console.error('Erreur lors du chargement du quiz:', error);
        setError(error.message || "Erreur inconnue");
        toast.error("Impossible de charger le quiz");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [id, getQuiz, navigate]);

  const handleStartQuiz = () => {
    navigate(`/quiz/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-4 text-lg">Chargement du quiz...</p>
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
            <p className="text-xl font-semibold mb-4">Quiz introuvable</p>
            <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
          </div>
        </div>
      </div>
    );
  }

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
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Aperçu du Quiz</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Préparez-vous à tester vos connaissances avec ce quiz.
            </p>
          </motion.div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur de chargement</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {hasFallbackQuestions && (
            <Alert variant="default" className="mb-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Mode de secours activé</AlertTitle>
              <AlertDescription className="text-amber-700">
                Nous avons utilisé des questions de secours car l'IA n'a pas pu générer des questions personnalisées. 
                Vous pouvez toujours utiliser ce quiz ou retourner pour en créer un nouveau.
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="border border-[#D2691E]/20 mb-12 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#D2691E]/10 to-[#D2691E]/5 p-8">
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              <p className="text-muted-foreground mt-2">{quiz.description}</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center">
                  <div className="bg-primary/10 p-2 rounded-full mb-3">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Nombre de questions</h3>
                  <p className="text-2xl font-bold">{quiz.questions.length}</p>
                </div>
                
                {quiz.timeLimit && (
                  <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center">
                    <div className="bg-primary/10 p-2 rounded-full mb-3">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">Durée maximale</h3>
                    <p className="text-2xl font-bold">{quiz.timeLimit} min</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-amber-800 font-medium mb-2 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Comment jouer
                </h3>
                <ul className="list-disc pl-5 text-amber-700 space-y-1">
                  <li>Lisez attentivement chaque question</li>
                  <li>Sélectionnez la réponse qui vous semble correcte</li>
                  <li>Utilisez les boutons Précédent et Suivant pour naviguer</li>
                  <li>Soumettez vos réponses à la fin pour voir votre score</li>
                </ul>
              </div>
              
              {quiz.questions && quiz.questions.length > 0 && (
                <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-green-800 font-medium mb-2 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Quiz prêt à être utilisé
                  </h3>
                  <p className="text-green-700">
                    Votre quiz contient {quiz.questions.length} questions et peut être démarré à tout moment.
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="p-6 bg-muted/20 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full sm:w-auto"
              >
                Retour à l'accueil
              </Button>
              
              <Button 
                onClick={handleStartQuiz}
                className="w-full sm:w-auto bg-[#D2691E] hover:bg-[#D2691E]/90"
              >
                Commencer le quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QuizPreview;
