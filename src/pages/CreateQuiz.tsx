
import { Navbar } from '@/components/Navbar';
import { QuizForm } from '@/components/QuizForm';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

const CreateQuiz = () => {
  const { user } = useAuth();
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Créer votre Quiz</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Téléchargez vos documents, définissez vos paramètres, et notre IA générera un quiz personnalisé.
            </p>
          </motion.div>
          
          <QuizForm />
        </div>
      </main>
      
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

export default CreateQuiz;
