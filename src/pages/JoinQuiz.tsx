import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { addParticipantToQuiz, createQuizAttempt, ensureParticipantSession, getQuizByShareCode } from '@/services/manualQuizService';

const JoinQuiz = () => {
  const { t } = useTranslation();
  const { shareCode: urlShareCode } = useParams<{ shareCode?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shareCode, setShareCode] = useState(urlShareCode || '');
  const [name, setName] = useState(user?.name || user?.email?.split('@')[0] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinQuiz = async (event: React.FormEvent) => {
    event.preventDefault();

    const code = shareCode.trim().toUpperCase();
    if (!code) {
      toast.error('Veuillez entrer un code de partage');
      return;
    }

    if (!name.trim()) {
      toast.error('Veuillez entrer votre nom');
      return;
    }

    setIsLoading(true);

    try {
      await ensureParticipantSession();
      const quiz = await getQuizByShareCode(code);
      if (!quiz) {
        toast.error('Code de partage invalide');
        setIsLoading(false);
        return;
      }

      if (quiz.status === 'completed') {
        toast.error('Ce quiz est termine');
        setIsLoading(false);
        return;
      }

      if (quiz.status === 'draft') {
        toast.info("Ce quiz n'a pas encore demarre. Veuillez patienter.");
        setIsLoading(false);
        return;
      }

      const participantId = await addParticipantToQuiz(quiz.id, user?.id || '', name.trim(), email.trim());
      const attemptId = await createQuizAttempt(quiz.id, participantId, user?.id || '');

      toast.success('Bienvenue ! Le quiz va commencer.');
      navigate(`/quiz-session/${quiz.id}/${attemptId}`, {
        state: {
          participantId,
          attemptId,
          quizMode: quiz.mode,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la participation:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la participation au quiz');
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
              <CardTitle className="text-2xl">{t('join.title')}</CardTitle>
              <CardDescription>{t('join.enterCode')}</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleJoinQuiz} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shareCode">{t('share.shareCode')}</Label>
                  <Input
                    id="shareCode"
                    type="text"
                    placeholder={t('join.codePlaceholder')}
                    value={shareCode}
                    onChange={(event) => setShareCode(event.target.value.toUpperCase())}
                    maxLength={8}
                    className="text-center text-2xl font-mono font-bold tracking-wider"
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Le code est fourni par l'organisateur du quiz
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t('join.yourName')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('join.namePlaceholder')}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('join.yourEmail')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('join.emailPlaceholder')}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pour recevoir vos resultats par email
                  </p>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      {t('join.joinQuiz')}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas de code ?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-primary hover:underline"
                  >
                    {t('results.backToHome')}
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
