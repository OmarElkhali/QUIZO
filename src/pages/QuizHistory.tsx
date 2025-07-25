
// Corriger l'importation de QuizContext (import default au lieu de named import)
import { useState, useEffect, useContext } from 'react'; // Ajouter useContext ici
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useQuiz } from '@/hooks/useQuiz';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, PlusCircle } from 'lucide-react';
import { QuizCard } from '@/components/QuizCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SharedQuizzes } from '@/components/SharedQuizzes';
import QuizContext from '@/context/QuizContext'; // Corriger cette ligne

const QuizHistory = () => {
  const { user } = useAuth();
  const { quizzes, isLoading } = useQuiz();
  const navigate = useNavigate();
  
  // Ajouter cette fonction
  const handleRefresh = () => {
    // Accéder à fetchQuizzes via le contexte
    const quizContext = useContext(QuizContext);
    if (quizContext && quizContext.fetchQuizzes) {
      quizContext.fetchQuizzes();
    }
  };
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Mes Quiz</h1>
              </div>
              
              <Button 
                onClick={() => navigate('/create-quiz')}
                className="bg-[#D2691E] hover:bg-[#D2691E]/90"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Nouveau Quiz
              </Button>
            </div>
            
            <p className="text-muted-foreground">
              Retrouvez tous vos quiz générés et partagés, classés par date de création.
            </p>
          </motion.div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <QuizCard 
                    id={quiz.id}
                    title={quiz.title}
                    description={quiz.description}
                    questions={quiz.questions.length}
                    completionRate={quiz.completionRate}
                    date={quiz.createdAt}
                    duration={quiz.duration}
                    participants={quiz.participants}
                    isHistory={true}
                    isShared={quiz.isShared}
                    index={index}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16 border border-dashed rounded-lg bg-muted/30"
            >
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-medium mb-2">Aucun quiz créé</h3>
              <p className="text-muted-foreground mb-6">
                Commencez par créer votre premier quiz en téléchargeant un document.
              </p>
              <Button 
                onClick={() => navigate('/create-quiz')}
                className="bg-[#D2691E] hover:bg-[#D2691E]/90"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Créer un Quiz
              </Button>
            </motion.div>
          )}
        </div>
      </main>
      
      <SharedQuizzes />
      
      <footer className="bg-muted/30 py-8 px-6 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-center items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 QUIZO. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuizHistory;
