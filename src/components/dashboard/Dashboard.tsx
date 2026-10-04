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
  const recentQuizzes = [...quizzes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const latestQuiz = recentQuizzes[0];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => toast.success('Code de partage copié'))
      .catch(() => toast.error('Impossible de copier le code'));
  };

  return <div className="space-y-9 pb-8 sm:space-y-12">
    <motion.header {...revealMotion(!!reduced)} className="quizo-dashboard-hero grid overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
      <div className="px-6 py-9 sm:px-10 sm:py-12 xl:px-14 xl:py-14">
        <p className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-400"><span className="h-2 w-2 rounded-full bg-orange-500" />{t('dashboardHome.workspace')}</p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-.05em] text-[var(--quizo-heading)] sm:text-5xl xl:text-6xl">{t('dashboardHome.titleUser')}</h1>
        <p className="mt-5 max-w-[54ch] text-base leading-7 text-[var(--quizo-muted)] sm:text-lg">{t('dashboardHome.descUser')}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button asChild size="lg" className="quizo-copper-button h-12 px-6"><Link to="/create-quiz"><Sparkles aria-hidden="true" className="h-4 w-4" />{t('nav.createQuizAI')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
          <Link to="/create-manual-quiz" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[var(--quizo-heading)] hover:text-orange-400">{t('dashboardHome.createManual')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </div>
      <div className="quizo-dashboard-feature flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-8 xl:px-10">
        <p className="text-xs font-semibold tracking-wide text-orange-400">{t('dashboardHome.myQuizzes')}</p>
        {isLoading ? <p className="mt-8 text-sm text-[var(--quizo-muted)]">Chargement des quiz…</p> : latestQuiz ? <div className="mt-8 min-w-0">
          <p className="text-sm text-[var(--quizo-muted)]">{t('dashboardHome.questionsCount', { count: latestQuiz.questions.length })}</p>
          <h2 className="mt-3 line-clamp-3 text-balance text-2xl font-semibold leading-tight tracking-tight text-[var(--quizo-heading)] sm:text-3xl">{latestQuiz.title}</h2>
          <Link to={`/quiz-preview/${latestQuiz.id}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-orange-400 hover:text-orange-300">{t('results.viewDetails')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div> : <div className="mt-8">
          <p className="max-w-xs text-sm leading-6 text-[var(--quizo-muted)]">Créez votre premier quiz pour le retrouver ici.</p>
          <Link to="/create-manual-quiz" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-orange-400 hover:text-orange-300">{t('dashboardHome.createManual')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>}
      </div>
    </motion.header>

    <motion.section {...revealMotion(!!reduced, .05)} aria-label="Votre activité" className="quizo-dashboard-metrics">
      {[
        { label: t('dashboardHome.totalQuiz'), value: quizzes.length, icon: FileText },
        { label: t('dashboardHome.questions'), value: quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0), icon: PenLine },
        { label: t('dashboardHome.participations'), value: sharedQuizzes.length, icon: Users },
      ].map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 px-3 py-5 sm:px-8 sm:py-7 first:pl-0 last:pr-0">
        <div className="flex items-center gap-2 text-[var(--quizo-muted)]"><Icon aria-hidden="true" className="h-4 w-4 text-orange-400" /><span className="text-xs font-medium sm:text-sm">{label}</span></div>
        <p className="quizo-tabular mt-4 text-3xl font-semibold leading-none tracking-tight text-[var(--quizo-heading)] sm:text-4xl">{value}</p>
      </div>)}
    </motion.section>

    <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,.7fr)] xl:gap-16">
      <section className="min-w-0" aria-labelledby="recent-quizzes">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><h2 id="recent-quizzes" className="text-2xl font-semibold tracking-tight text-[var(--quizo-heading)] sm:text-3xl">{t('dashboardHome.myQuizzes')}</h2><p className="mt-1 text-sm text-[var(--quizo-muted)]">{t('dashboardHome.myQuizzesDesc')}</p></div>
          <Link to="/history" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-orange-400 hover:text-orange-300">{t('dashboardHome.viewHistory')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        {isLoading ? <StateCard state="loading" title="Chargement des quiz" description="Synchronisation avec votre espace QUIZO." /> : recentQuizzes.length === 0 ?
          <StateCard state="empty" title="Aucun quiz pour le moment" description="Créez un quiz IA ou manuel pour commencer votre bibliothèque." action={<Button asChild className="quizo-copper-button"><Link to="/create-quiz">Créer un quiz</Link></Button>} /> :
          <div className="border-t border-[var(--quizo-border)]">{recentQuizzes.map((quiz, index) => <motion.article {...revealMotion(!!reduced, index * .055)} key={quiz.id} className="quizo-dashboard-row group flex min-w-0 items-center gap-3 border-b border-[var(--quizo-border)] px-2 py-4 sm:gap-5 sm:px-3 sm:py-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--quizo-surface-soft)] text-orange-400"><FileText aria-hidden="true" className="h-5 w-5" /></span>
            <Link to={`/quiz-preview/${quiz.id}`} className="min-w-0 flex-1 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><h3 className="truncate text-sm font-semibold text-[var(--quizo-heading)] group-hover:text-orange-400 sm:text-base">{quiz.title}</h3><p className="mt-1 line-clamp-1 text-sm text-[var(--quizo-muted)]">{quiz.description || t('dashboardHome.questionsCount', { count: quiz.questions.length })}</p></Link>
            <span className="hidden whitespace-nowrap text-sm text-[var(--quizo-muted)] sm:block">{t('dashboardHome.questionsCount', { count: quiz.questions.length })}</span>
            {quiz.shareCode && <button type="button" onClick={() => copyCode(quiz.shareCode)} aria-label={`Copier le code ${quiz.shareCode}`} className="hidden min-h-10 rounded-lg border border-[var(--quizo-border)] px-3 font-mono text-xs text-[var(--quizo-heading)] hover:border-orange-400 lg:block">{quiz.shareCode}</button>}
            <Link to={`/quiz-preview/${quiz.id}`} aria-label={`Ouvrir ${quiz.title}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-orange-400 hover:bg-orange-500/10"><ArrowRight aria-hidden="true" className="h-5 w-5" /></Link>
          </motion.article>)}</div>}
      </section>
      <aside aria-label="Actions rapides" className="border-t-2 border-orange-500 pt-5">
        <h2 className="text-lg font-semibold text-[var(--quizo-heading)]">Que voulez-vous faire ?</h2>
        <div className="mt-4 space-y-1">{[
          { href: '/create-manual-quiz', icon: PenLine, title: t('dashboardHome.createManual'), description: t('dashboardHome.createManualDesc') },
          { href: '/join', icon: Users, title: t('dashboardHome.joinLive'), description: 'Entrez le code de votre animateur.' },
          { href: '/history', icon: BarChart3, title: t('dashboardHome.viewHistory'), description: 'Retrouvez vos quiz et vos résultats.' },
        ].map(({ href, icon: Icon, title, description }) => <Link key={href} to={href} className="quizo-quick-link"><Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-orange-400" /><span className="min-w-0"><strong>{title}</strong><small>{description}</small></span><ArrowRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0" /></Link>)}</div>
      </aside>
    </div>
  </div>;
}
