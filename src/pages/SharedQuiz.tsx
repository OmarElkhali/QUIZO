import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { joinQuizByShareCode } from '@/services/quizService';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SharedQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validQuizId, setValidQuizId] = useState<string | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        setLoading(true);
        setError(null);

        const code = searchParams.get('code');
        
        if (!code) {
          setError('Code de partage manquant');
          return;
        }

        console.log(`🔍 Vérification du code: ${code}`);
        
        // Vérifier que le code correspond bien au quiz
        const foundQuizId = await joinQuizByShareCode(code);
        
        if (foundQuizId !== quizId) {
          setError('Le code de partage ne correspond pas à ce quiz');
          return;
        }

        setValidQuizId(foundQuizId);
        toast.success('Accès au quiz autorisé !');
      } catch (err: any) {
        console.error('Erreur lors de la vérification:', err);
        setError(err.message || 'Code de partage invalide');
        toast.error('Impossible d\'accéder au quiz');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      verifyAccess();
    }
  }, [quizId, searchParams]);

  const startQuiz = () => {
    if (validQuizId) {
      navigate(`/quiz/${validQuizId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-24 px-6">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-primary/20">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full mb-4 mx-auto">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Quiz Partagé</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {loading && (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Vérification du code de partage...
                    </p>
                  </div>
                )}

                {!loading && error && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center bg-destructive/10 p-3 rounded-full mb-4">
                      <XCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Retour à l'accueil
                    </Button>
                  </div>
                )}

                {!loading && !error && validQuizId && (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      className="inline-flex items-center justify-center bg-green-500/10 p-3 rounded-full mb-4"
                    >
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">
                      Accès autorisé !
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Vous pouvez maintenant participer à ce quiz.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={startQuiz} size="lg" className="hover-scale">
                        Commencer le Quiz
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/')}>
                        Retour à l'accueil
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    💡 <strong>Astuce:</strong> Si vous avez des difficultés, demandez à la personne qui a partagé le quiz de vérifier le lien.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SharedQuiz;
