import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  getQuizByShareCode, 
  addParticipantToQuiz,
  createQuizAttempt 
} from '@/services/manualQuizService';

const JoinQuiz = () => {
  const { shareCode: urlShareCode } = useParams<{ shareCode?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shareCode, setShareCode] = useState(urlShareCode || '');
  const [name, setName] = useState(user?.email?.split('@')[0] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shareCode.trim()) {
      toast.error('Veuillez entrer un code de partage');
      return;
    }

    if (!name.trim()) {
      toast.error('Veuillez entrer votre nom');
      return;
    }

    setIsLoading(true);

    try {
      // Récupérer le quiz
      const quiz = await getQuizByShareCode(shareCode.toUpperCase());

      if (!quiz) {
        toast.error('Code de partage invalide');
        setIsLoading(false);
        return;
      }

      // Vérifier si le quiz est actif
      if (quiz.status === 'completed') {
        toast.error('Ce quiz est terminé');
        setIsLoading(false);
        return;
      }

      if (quiz.status === 'draft' && quiz.mode === 'realtime') {
        toast.info('Ce quiz n\'a pas encore démarré. Veuillez patienter...');
        setIsLoading(false);
        return;
      }

      // Utiliser l'ID utilisateur ou générer un ID temporaire
      const userId = user?.id || `temp_${Date.now()}`;

      // Ajouter le participant
      const participantId = await addParticipantToQuiz(quiz.id, userId, name, email);

      // Créer une tentative
      const attemptId = await createQuizAttempt(quiz.id, participantId, userId);

      toast.success('Bienvenue ! Le quiz va commencer.');

      // Rediriger vers la page du quiz avec les IDs nécessaires
      navigate(`/take-quiz/${quiz.id}`, {
        state: {
          participantId,
          attemptId,
          quizMode: quiz.mode
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de la participation:', error);
      toast.error(error.message || 'Erreur lors de la participation au quiz');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Rejoindre un Quiz</CardTitle>
              <CardDescription>
                Entrez le code de partage pour participer au quiz
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleJoinQuiz} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shareCode">Code de Partage</Label>
                  <Input
                    id="shareCode"
                    type="text"
                    placeholder="Ex: ABC123"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-2xl font-mono font-bold tracking-wider"
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Le code est fourni par l'organisateur du quiz
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Votre Nom</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (optionnel)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pour recevoir vos résultats par email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Rejoindre le Quiz
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas de code ?{' '}
                  <button
                    onClick={() => navigate('/')}
                    className="text-primary hover:underline"
                  >
                    Retour à l'accueil
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default JoinQuiz;
