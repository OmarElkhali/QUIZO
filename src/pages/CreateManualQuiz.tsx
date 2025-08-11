import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { createManualQuiz } from '@/services/manualQuizService';

const CreateManualQuiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/" />;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Veuillez saisir un titre pour votre quiz');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const quizId = await createManualQuiz(user.id, title, description);
      toast.success('Quiz créé avec succès');
      navigate(`/manual-quiz-builder/${quizId}`);
    } catch (error: any) {
      console.error('Erreur lors de la création du quiz:', error);
      toast.error(error.message || 'Erreur lors de la création du quiz');
    } finally {
      setIsLoading(false);
    }
  };
  
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
              <PenLine className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Créer un Quiz Manuel</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Créez votre propre quiz en ajoutant des questions et des réponses personnalisées.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 md:p-8 max-w-xl mx-auto"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du Quiz</Label>
                <Input
                  id="title"
                  placeholder="Entrez le titre de votre quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre quiz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Création en cours...' : 'Créer et continuer'}
              </Button>
            </form>
          </motion.div>
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

export default CreateManualQuiz;