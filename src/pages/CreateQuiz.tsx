import { Link, Navigate } from 'react-router-dom';
import { BookOpen, PenLine, Sparkles, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { QuizForm } from '@/components/QuizForm';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

const CreateQuiz = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement de votre studio" description="Préparation du module de création IA." />
      </AppShell>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Création de quiz"
        title={t('createQuiz.title')}
        description="Choisissez votre mode de création, puis importez un cours pour générer des questions prêtes à utiliser."
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-[#d77a36]/35 bg-[#d77a36]/12 p-4">
          <Sparkles className="mb-3 h-5 w-5 text-[#f7c693]" />
          <h2 className="font-semibold text-white">Quiz IA</h2>
          <p className="mt-1 text-sm text-slate-400">Génération depuis PDF, DOCX ou TXT.</p>
        </div>
        <Link
          to="/create-manual-quiz"
          className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#d77a36]/35 hover:bg-white/[0.065]"
        >
          <PenLine className="mb-3 h-5 w-5 text-[#f7c693]" />
          <h2 className="font-semibold text-white">Quiz manuel</h2>
          <p className="mt-1 text-sm text-slate-400">Éditez vos questions vous-même.</p>
        </Link>
        <Link
          to="/join"
          className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#d77a36]/35 hover:bg-white/[0.065]"
        >
          <Users className="mb-3 h-5 w-5 text-[#f7c693]" />
          <h2 className="font-semibold text-white">Rejoindre</h2>
          <p className="mt-1 text-sm text-slate-400">Entrez un code de compétition.</p>
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <QuizForm />
        </div>
        <aside className="rounded-lg border border-white/10 bg-[#0f141c] p-5">
          <BookOpen className="mb-4 h-6 w-6 text-[#f7c693]" />
          <h2 className="text-lg font-semibold text-white">Conseil de création</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Un fichier clair avec titres, définitions et exemples donne des questions plus fiables. Gardez un seul chapitre par quiz.
          </p>
          <Button asChild variant="outline" className="mt-5 w-full border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]">
            <Link to="/history">Voir mes quiz</Link>
          </Button>
        </aside>
      </section>
    </AppShell>
  );
};

export default CreateQuiz;
