import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileUp, PenLine, Sparkles, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { QuizForm } from '@/components/QuizForm';
import { PremiumPanel } from '@/components/ui/premium';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { AuthDialog } from '@/components/AuthDialog';

const CreateQuiz = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title={t('common.loading')} description={t('common.loading')} />
      </AppShell>
    );
  }

  if (!user) {
    return <AppShell><StateCard state="empty" title="Connectez-vous pour créer un quiz" description="Votre espace de création sera disponible après la connexion." action={<Button className="quizo-copper-button" onClick={() => setAuthOpen(true)}>Se connecter</Button>} /><AuthDialog open={authOpen} onOpenChange={setAuthOpen} /></AppShell>;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={t('createQuiz.eyebrow')}
        title={t('createQuiz.title')}
        description={t('createQuiz.description')}
        actions={
          <Button asChild variant="outline" className="quizo-outline-button">
            <Link to="/create-manual-quiz">
              <PenLine className="mr-2 h-4 w-4" />
              {t('nav.createQuizManual')}
            </Link>
          </Button>
        }
      />

      <nav aria-label="Parcours de création" className="mb-7 flex flex-wrap gap-2 border-b border-[var(--quizo-border)] pb-4 text-sm">
        <span aria-current="page" className="inline-flex items-center gap-2 rounded-lg bg-orange-500/10 px-4 py-2 font-semibold text-orange-500"><Sparkles className="h-4 w-4" />{t('nav.createQuizAI')}</span>
        <Link to="/create-manual-quiz" className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[var(--quizo-muted)] hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)]"><PenLine className="h-4 w-4" />{t('nav.createQuizManual')}</Link>
        <Link to="/join" className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[var(--quizo-muted)] hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)]"><Users className="h-4 w-4" />{t('nav.joinByCode')}</Link>
      </nav>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PremiumPanel className="p-4 sm:p-6">
          <QuizForm />
        </PremiumPanel>
        <aside className="space-y-4">
          <PremiumPanel className="p-6">
            <FileUp className="mb-5 h-7 w-7 text-orange-500" />
            <h2 className="text-xl font-semibold text-[var(--quizo-heading)]">{t('createQuiz.configTitle')}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--quizo-muted)]">
              {t('createQuiz.configDesc')}
            </p>
          </PremiumPanel>
          <PremiumPanel className="p-6">
            <BookOpen className="mb-5 h-7 w-7 text-orange-500" />
            <h2 className="text-xl font-semibold text-[var(--quizo-heading)]">{t('createQuiz.modelsTitle')}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--quizo-muted)]">
              {t('createQuiz.modelsDesc')}
            </p>
            <Button asChild variant="outline" className="mt-6 w-full quizo-outline-button">
              <Link to="/history">{t('createQuiz.viewMyQuizzes')}</Link>
            </Button>
          </PremiumPanel>
        </aside>
      </section>
    </AppShell>
  );
};

export default CreateQuiz;
