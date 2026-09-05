import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle2, Clock, FileText, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuiz } from '@/hooks/useQuiz';
import { PremiumMetric, PremiumPanel } from '@/components/ui/premium';
import { QuizPractice } from '@/components/live/QuizPractice';
import { validateQuizQuestions, type QuizQuestionInput } from '@/domain/quizRules';

const QuizPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuiz } = useQuiz();

  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFallbackQuestions, setHasFallbackQuestions] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) {
        toast.error('ID du quiz non spécifié');
        navigate('/');
        return;
      }

      try {
        const quizData = await getQuiz(id);

        if (!quizData) {
          toast.error('Quiz introuvable');
          navigate('/');
          return;
        }

        const hasBackupQuestions = quizData.questions?.some((q: any) =>
          q.text.includes('(générée') ||
          q.text.includes('mode secours') ||
          q.text.includes('générée automatiquement') ||
          q.explanation?.includes('secours')
        );

        setHasFallbackQuestions(hasBackupQuestions);
        setQuiz(quizData);
      } catch (fetchError: any) {
        console.error('Erreur lors du chargement du quiz:', fetchError);
        setError(fetchError.message || 'Erreur inconnue');
        toast.error('Impossible de charger le quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [id, getQuiz, navigate]);

  if (isLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du quiz" description="Préparation de la prévisualisation." />
      </AppShell>
    );
  }

  if (!quiz) {
    return (
      <AppShell>
        <StateCard
          state="error"
          title="Quiz introuvable"
          description="Ce quiz n’a pas pu être chargé."
          action={<Button className="quizo-copper-button" onClick={() => navigate('/')}>Retour à l’accueil</Button>}
        />
      </AppShell>
    );
  }

  const practiceQuestions: QuizQuestionInput[] = quiz.questions.map((q: QuizQuestionInput) => ({ ...q, points: q.points ?? 1 }));
  const startPreview = () => {
    const errors = validateQuizQuestions(practiceQuestions);
    if (errors.length) { toast.error(errors[0]); return; }
    setTesting(true);
  };
  if (testing) return <AppShell><QuizPractice questions={practiceQuestions} onClose={() => setTesting(false)} /></AppShell>;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Prévisualisation"
        title={quiz.title}
        description={quiz.description || 'Préparez-vous à tester vos connaissances avec ce quiz.'}
        actions={
          <Button onClick={startPreview} className="quizo-copper-button">
            Tester sans enregistrer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasFallbackQuestions && (
        <Alert className="mb-6 border-amber-400/25 bg-amber-500/10 text-amber-100">
          <AlertCircle className="h-4 w-4 text-amber-200" />
          <AlertTitle>Mode de secours activé</AlertTitle>
          <AlertDescription className="text-amber-100/80">
            Des questions de secours ont été utilisées car le modèle IA n’a pas pu générer des questions personnalisées.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <PremiumPanel className="p-6">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-300/30 bg-orange-500/15 text-[#ffb77d]">
            <FileText className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-black text-white">Quiz prêt à être utilisé</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a79d96]">
            Lisez chaque question attentivement, sélectionnez la réponse correcte puis soumettez vos réponses à la fin.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <PremiumMetric label="Questions" value={quiz.questions.length} icon={HelpCircle} tone="copper" />
            {quiz.timeLimit && <PremiumMetric label="Durée maximale" value={`${quiz.timeLimit} min`} icon={Clock} tone="blue" />}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => navigate('/')} className="w-full quizo-outline-button sm:w-auto">
              Retour à l’accueil
            </Button>
            <Button onClick={startPreview} className="w-full quizo-copper-button sm:w-auto">
              Tester sans enregistrer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </PremiumPanel>

        <PremiumPanel className="p-6">
          <CheckCircle2 className="mb-5 h-7 w-7 text-emerald-300" />
          <h3 className="text-xl font-bold text-white">Checklist participant</h3>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-[#d8d2ce]">
            <li>• Vérifiez votre connexion avant de démarrer.</li>
            <li>• Le test utilise les questions et les points de ce quiz.</li>
            <li>• Aucune tentative ni statistique réelle n’est créée.</li>
            <li>• Recharger la page quitte cet essai local.</li>
          </ul>
        </PremiumPanel>
      </section>
    </AppShell>
  );
};

export default QuizPreview;
