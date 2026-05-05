import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Clock, FileText, PenLine, Sparkles, Trophy, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
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

  return (
    <AppShell
      actions={
        user ? (
          <Button asChild className="hidden bg-[#d77a36] text-white hover:bg-[#b85f26] sm:inline-flex">
            <Link to="/create-quiz">
              <Sparkles className="mr-2 h-4 w-4" />
              Créer
            </Link>
          </Button>
        ) : null
      }
    >
      <PageHeader
        eyebrow="Tableau de bord"
        title={user ? 'Pilotez vos quiz et compétitions' : 'QUIZO, studio moderne de quiz'}
        description={
          user
            ? 'Un espace centralisé pour créer, partager, rejoindre et suivre vos expériences de quiz en temps réel.'
            : 'Créez des quiz à partir de cours, lancez des compétitions live et suivez les résultats dans une interface SaaS premium.'
        }
        actions={
          <div className="flex gap-2">
            <Button asChild className="bg-[#d77a36] text-white hover:bg-[#b85f26]">
              <Link to={user ? '/create-quiz' : '/join'}>
                Commencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]">
              <Link to="/join">Rejoindre</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quiz créés" value={quizzes.length} detail="Bibliothèque personnelle" icon={FileText} />
        <StatCard label="Questions" value={totalQuestions} detail="Contenu disponible" icon={PenLine} />
        <StatCard label="Partagés" value={sharedCount} detail="Quiz collaboratifs" icon={Users} />
        <StatCard label="Complétion" value={`${averageCompletion}%`} detail="Moyenne historique" icon={BarChart3} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Activité récente</h2>
              <p className="text-sm text-slate-500">Vos derniers quiz prêts à être repris ou partagés.</p>
            </div>
            <Button asChild variant="ghost" className="text-[#f7c693] hover:bg-[#d77a36]/10 hover:text-[#ffd9ad]">
              <Link to="/history">Tout voir</Link>
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
                <Button asChild className="bg-[#d77a36] text-white hover:bg-[#b85f26]">
                  <Link to="/create-quiz">Créer un quiz</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/quiz-preview/${quiz.id}`}
                  className="group flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#0f141c] p-4 transition hover:border-[#d77a36]/40 hover:bg-[#121923]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white group-hover:text-[#f7c693]">{quiz.title}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{quiz.description || 'Quiz sans description'}</p>
                  </div>
                  <div className="hidden items-center gap-4 text-sm text-slate-400 sm:flex">
                    <span>{quiz.questions.length} questions</span>
                    <span>{quiz.duration}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-[#f7c693]" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link
            to="/create-quiz"
            className="block rounded-lg border border-[#d77a36]/25 bg-[#d77a36]/10 p-5 transition hover:border-[#d77a36]/50 hover:bg-[#d77a36]/15"
          >
            <Sparkles className="mb-4 h-6 w-6 text-[#f7c693]" />
            <h3 className="text-lg font-semibold text-white">Créer avec IA</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Importez un cours et générez un QCM structuré.</p>
          </Link>
          <Link
            to="/create-manual-quiz"
            className="block rounded-lg border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#d77a36]/35 hover:bg-white/[0.065]"
          >
            <PenLine className="mb-4 h-6 w-6 text-[#f7c693]" />
            <h3 className="text-lg font-semibold text-white">Construire manuellement</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Préparez vos questions, options et explications.</p>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/join" className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300 transition hover:bg-white/[0.065]">
              <Trophy className="mb-3 h-5 w-5 text-[#f7c693]" />
              Rejoindre un live
            </Link>
            <Link to="/history" className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300 transition hover:bg-white/[0.065]">
              <Clock className="mb-3 h-5 w-5 text-[#f7c693]" />
              Voir l’historique
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Index;
