import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Clock, Copy, FileText, PenLine, Sparkles, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { ActionCard, PremiumMetric, PremiumPanel } from '@/components/ui/premium';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { quizzes, sharedQuizzes, isLoading } = useQuiz();
  const { user } = useAuth();

  const recentQuizzes = quizzes.slice(0, 4);
  const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
  const sharedCount = sharedQuizzes.length;
  const averageCompletion = quizzes.length
    ? Math.round(quizzes.reduce((sum, quiz) => sum + (quiz.completionRate || 0), 0) / quizzes.length)
    : 0;

  const copyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success('Code de partage copié'))
      .catch(() => toast.error('Impossible de copier le code'));
  };

  return (
    <AppShell
      actions={
        user ? (
          <Button asChild className="hidden quizo-copper-button sm:inline-flex">
            <Link to="/create-quiz">
              <Sparkles className="mr-2 h-4 w-4" />
              Générer
            </Link>
          </Button>
        ) : null
      }
    >
      <PageHeader
        eyebrow="Espace de travail"
        title={user ? 'Tableau de bord' : 'QUIZO, studio moderne de quiz'}
        description={
          user
            ? 'Gérez votre contenu pédagogique et analysez les performances de vos cohortes.'
            : 'Créez des quiz à partir de cours, lancez des compétitions live et suivez les résultats dans une interface SaaS premium.'
        }
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild className="quizo-copper-button">
              <Link to={user ? '/create-quiz' : '/join'}>
                Commencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="quizo-outline-button">
              <Link to="/pricing">Voir les tarifs</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <PremiumMetric label="Total quiz" value={quizzes.length} detail="+3" icon={FileText} tone="blue" />
        <PremiumMetric label="Questions" value={totalQuestions} icon={PenLine} tone="copper" />
        <PremiumMetric label="Participations" value={sharedCount} detail="+12%" icon={Users} tone="violet" />
        <PremiumMetric label="Complétion" value={`${averageCompletion}%`} icon={BarChart3} tone="green" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PremiumPanel className="p-6">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Mes Quiz</h2>
              <p className="mt-1 text-sm text-[#a79d96]">Vos derniers quiz prêts à être repris, partagés ou analysés.</p>
            </div>
            <Button asChild variant="ghost" className="text-[#ffb77d] hover:bg-orange-500/10 hover:text-[#ffdcc3]">
              <Link to="/history">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <StateCard state="loading" title="Chargement des quiz" description="Synchronisation avec votre espace QUIZO." />
          ) : recentQuizzes.length === 0 ? (
            <StateCard
              state="empty"
              title="Aucun quiz pour le moment"
              description="Créez un quiz IA ou manuel pour commencer à construire votre bibliothèque."
              action={
                <Button asChild className="quizo-copper-button">
                  <Link to="/create-quiz">Créer un quiz</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recentQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/quiz-preview/${quiz.id}`}
                  className="quizo-panel-subtle quizo-panel-hover flex min-h-[220px] flex-col p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-xl font-bold text-white group-hover:text-[#ffb77d]">{quiz.title}</h3>
                    <span className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">
                      Actif
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#a79d96]">{quiz.description || 'Quiz sans description'}</p>
                  <div className="mt-auto flex items-end justify-between border-t border-white/[0.07] pt-5">
                    <div>
                      <p className="quizo-label">Code de partage</p>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          copyCode(quiz.shareCode);
                        }}
                        className="mt-2 inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white"
                      >
                        {quiz.shareCode || '-----'}
                        <Copy className="h-3.5 w-3.5 text-[#ffb77d]" />
                      </button>
                    </div>
                    <div className="text-right text-sm text-[#a79d96]">
                      <p>{quiz.questions.length} questions</p>
                      <p>{quiz.duration}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </PremiumPanel>

        <div className="grid gap-4">
          <ActionCard
            title="Générer avec l’IA"
            description="Importez un cours et générez un QCM structuré avec Gemini, OpenRouter, Groq, Qwen ou Ollama."
            icon={Sparkles}
            accent
          >
            <Button asChild className="w-full quizo-copper-button">
              <Link to="/create-quiz">Créer un Quiz IA</Link>
            </Button>
          </ActionCard>
          <ActionCard
            title="Créer manuellement"
            description="Construisez vos questions, options, explications et modes de partage avec un contrôle complet."
            icon={PenLine}
          >
            <Button asChild variant="outline" className="w-full quizo-outline-button">
              <Link to="/create-manual-quiz">Nouveau manuel</Link>
            </Button>
          </ActionCard>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/join" className="quizo-panel-subtle quizo-panel-hover p-5 text-sm font-semibold text-[#d8d2ce]">
              <Trophy className="mb-4 h-5 w-5 text-[#ffb77d]" />
              Rejoindre un live
            </Link>
            <Link to="/history" className="quizo-panel-subtle quizo-panel-hover p-5 text-sm font-semibold text-[#d8d2ce]">
              <Clock className="mb-4 h-5 w-5 text-[#ffb77d]" />
              Voir l’historique
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Index;
