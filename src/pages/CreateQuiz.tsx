import { Link, Navigate } from 'react-router-dom';
import { BookOpen, FileUp, PenLine, Sparkles, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { QuizForm } from '@/components/QuizForm';
import { ActionCard, PremiumPanel } from '@/components/ui/premium';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

const CreateQuiz = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title={t('common.loading')} description={t('common.loading')} />
      </AppShell>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
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

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <ActionCard title={t('nav.createQuizAI')} description="PDF, DOCX, TXT" icon={Sparkles} accent className="min-h-0" />
        <Link to="/create-manual-quiz">
          <ActionCard title={t('nav.createQuizManual')} description="Control editor" icon={PenLine} className="min-h-0" />
        </Link>
        <Link to="/join">
          <ActionCard title={t('nav.joinByCode')} description="Join" icon={Users} className="min-h-0" />
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PremiumPanel className="p-4 sm:p-6">
          <QuizForm />
        </PremiumPanel>
        <aside className="space-y-4">
          <PremiumPanel className="p-6">
            <FileUp className="mb-5 h-7 w-7 text-[#ffb77d]" />
            <h2 className="text-xl font-bold text-white">{t('createQuiz.configTitle')}</h2>
            <p className="mt-3 text-sm leading-6 text-[#a79d96]">
              {t('createQuiz.configDesc')}
            </p>
          </PremiumPanel>
          <PremiumPanel className="p-6">
            <BookOpen className="mb-5 h-7 w-7 text-[#ffb77d]" />
            <h2 className="text-xl font-bold text-white">{t('createQuiz.modelsTitle')}</h2>
            <p className="mt-3 text-sm leading-6 text-[#a79d96]">
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
