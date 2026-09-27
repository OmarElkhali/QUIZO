import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BarChart3, FileText, PenLine, Sparkles, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StateCard } from '@/components/ui/StateCard';
import { useQuiz } from '@/hooks/useQuiz';
import { revealMotion } from '@/utils/animations';

export function Dashboard() {
  const { quizzes, sharedQuizzes, isLoading } = useQuiz();
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => toast.success('Code de partage copié'))
      .catch(() => toast.error('Impossible de copier le code'));
  };

  return <div className="space-y-7 pb-8 sm:space-y-9">
    <motion.header {...revealMotion(!!reduced)} className="quizo-dashboard-hero flex flex-col justify-between gap-10 rounded-[1.35rem] px-5 py-7 sm:px-9 sm:py-10 xl:flex-row xl:items-end xl:px-12">
      <div className="relative z-10 max-w-4xl">
        <p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-400"><span className="h-2 w-2 rounded-full bg-orange-500" />{t('dashboardHome.workspace')}</p>
        <h1 className="text-balance text-4xl font-bold leading-[1.04] tracking-[-.055em] text-[var(--quizo-heading)] sm:text-6xl 2xl:text-7xl">{t('dashboardHome.titleUser')}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--quizo-muted)] sm:text-lg">{t('dashboardHome.descUser')}</p>
        <Button asChild size="lg" className="quizo-copper-button mt-8 h-12 px-6 text-sm font-bold"><Link to="/create-quiz"><Sparkles aria-hidden="true" className="mr-2 h-5 w-5" />{t('nav.createQuizAI')}<ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link></Button>
      </div>
      <div className="hidden shrink-0 text-right xl:block" aria-hidden="true">
        <span className="block text-[8rem] font-bold leading-none tracking-[-.1em] text-orange-500/25 2xl:text-[11rem]">{String(quizzes.length).padStart(2, '0')}</span>
        <span className="text-sm font-semibold tracking-[.18em] text-orange-400">APPRENDRE · JOUER · PROGRESSER</span>
      </div>
    </motion.header>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,.75fr)]">
      <motion.section {...revealMotion(!!reduced, .05)} aria-label="Votre activité" className="quizo-dashboard-metrics">
        {[
          { label: t('dashboardHome.totalQuiz'), value: quizzes.length, icon: FileText },
          { label: t('dashboardHome.questions'), value: quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0), icon: PenLine },
          { label: t('dashboardHome.participations'), value: sharedQuizzes.length, icon: Users },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 p-4 sm:p-6 xl:p-7">
          <Icon aria-hidden="true" className="mb-4 h-5 w-5 text-orange-400" />
          <p className="quizo-tabular text-3xl font-bold leading-none tracking-tight text-[var(--quizo-heading)] sm:text-5xl">{value}</p>
          <p className="mt-2 text-xs text-[var(--quizo-muted)] sm:text-sm">{label}</p>
        </div>)}
      </motion.section>
      <motion.div {...revealMotion(!!reduced, .12)} className="relative hidden overflow-hidden rounded-[1.2rem] border border-orange-300/30 bg-gradient-to-br from-orange-600 to-orange-500 p-6 text-[#281305] shadow-[0_18px_42px_rgba(249,115,22,.15)] sm:p-7 xl:block">
        <Sparkles aria-hidden="true" className="h-8 w-8" />
        <h2 className="mt-5 text-2xl font-bold tracking-tight">{t('dashboardHome.generateAi')}</h2>
        <p className="mt-2 max-w-sm pr-12 text-sm leading-6">{t('dashboardHome.generateAiDesc')}</p>
        <Link to="/create-quiz" aria-label={t('dashboardHome.generateAi')} className="absolute bottom-5 right-5 grid h-11 w-11 place-items-center rounded-full bg-[#281305] text-white transition-transform hover:translate-x-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#281305]"><ArrowRight aria-hidden="true" className="h-5 w-5" /></Link>
      </motion.div>
    </div>

    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,.75fr)]">
      <section className="min-w-0" aria-labelledby="recent-quizzes">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><h2 id="recent-quizzes" className="text-2xl font-bold tracking-tight text-[var(--quizo-heading)] sm:text-3xl">{t('dashboardHome.myQuizzes')}</h2><p className="mt-1 text-sm text-[var(--quizo-muted)]">{t('dashboardHome.myQuizzesDesc')}</p></div>
          <Link to="/history" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300">{t('dashboardHome.viewHistory')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        {isLoading ? <StateCard state="loading" title="Chargement des quiz" description="Synchronisation avec votre espace QUIZO." /> : quizzes.length === 0 ?
          <StateCard state="empty" title="Aucun quiz pour le moment" description="Créez un quiz IA ou manuel pour commencer votre bibliothèque." action={<Button asChild className="quizo-copper-button"><Link to="/create-quiz">Créer un quiz</Link></Button>} /> :
          <div className="overflow-hidden rounded-[1.2rem] border border-[var(--quizo-border)] bg-[var(--quizo-surface)]">{quizzes.slice(0, 6).map((quiz, index) => <motion.article {...revealMotion(!!reduced, index * .055)} key={quiz.id} className="quizo-dashboard-row group flex min-w-0 items-center gap-4 border-b border-[var(--quizo-border)] p-4 last:border-0 sm:gap-5 sm:p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><FileText aria-hidden="true" className="h-5 w-5" /></span>
            <Link to={`/quiz-preview/${quiz.id}`} className="min-w-0 flex-1 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><h3 className="truncate text-sm font-bold text-[var(--quizo-heading)] group-hover:text-orange-400 sm:text-base">{quiz.title}</h3><p className="mt-1 line-clamp-1 text-sm text-[var(--quizo-muted)]">{quiz.description || t('dashboardHome.questionsCount', { count: quiz.questions.length })}</p></Link>
            <span className="hidden whitespace-nowrap text-sm text-[var(--quizo-muted)] sm:block">{t('dashboardHome.questionsCount', { count: quiz.questions.length })}</span>
            {quiz.shareCode && <button type="button" onClick={() => copyCode(quiz.shareCode)} aria-label={`Copier le code ${quiz.shareCode}`} className="hidden rounded-md border border-[var(--quizo-border)] px-2.5 py-1.5 font-mono text-xs text-[var(--quizo-heading)] hover:border-orange-400 lg:block">{quiz.shareCode}</button>}
            <Link to={`/quiz-preview/${quiz.id}`} aria-label={`Ouvrir ${quiz.title}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-orange-400 hover:bg-orange-500/10"><ArrowRight aria-hidden="true" className="h-5 w-5" /></Link>
          </motion.article>)}</div>}
      </section>
      <aside aria-label="Actions rapides" className="rounded-[1.2rem] border border-[var(--quizo-border)] bg-[var(--quizo-surface)] p-5 sm:p-6">
        <h2 className="text-lg font-bold text-[var(--quizo-heading)]">Que voulez-vous faire ?</h2>
        <div className="mt-4 space-y-1">{[
          { href: '/create-manual-quiz', icon: PenLine, title: t('dashboardHome.createManual'), description: t('dashboardHome.createManualDesc') },
          { href: '/join', icon: Users, title: t('dashboardHome.joinLive'), description: 'Entrez le code de votre animateur.' },
          { href: '/history', icon: BarChart3, title: t('dashboardHome.viewHistory'), description: 'Retrouvez vos quiz et vos résultats.' },
        ].map(({ href, icon: Icon, title, description }) => <Link key={href} to={href} className="quizo-quick-link"><Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-orange-400" /><span className="min-w-0"><strong>{title}</strong><small>{description}</small></span><ArrowRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0" /></Link>)}</div>
      </aside>
    </div>
  </div>;
}
