import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Copy, FileText, PenLine, Search, Sparkles, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StateCard } from '@/components/ui/StateCard';
import { useAuth } from '@/context/AuthContext';
import { useQuiz } from '@/hooks/useQuiz';
import { revealMotion } from '@/utils/animations';

export function Dashboard() {
  const { quizzes, isLoading } = useQuiz();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const [search, setSearch] = useState('');
  const name = user?.name?.trim().split(/\s+/)[0];
  const count = new Intl.NumberFormat(i18n.language);
  const query = search.trim().toLocaleLowerCase(i18n.language);
  const recentQuizzes = [...quizzes]
    .filter((quiz) => !query || `${quiz.title} ${quiz.description || ''} ${quiz.shareCode || ''}`.toLocaleLowerCase(i18n.language).includes(query))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, query ? 8 : 6);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => toast.success(t('share.codeCopied')))
      .catch(() => toast.error(t('dashboardHome.copyFailed')));
  };

  return <div className="quizo-workspace space-y-8 pb-8 sm:space-y-10">
    <motion.header {...revealMotion(!!reduced)} className="flex flex-col gap-6 border-b border-[var(--quizo-border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {name && <p className="mb-3 text-sm font-medium text-[var(--quizo-muted)]">{t('dashboardHome.welcomeBack', { name })}</p>}
        <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-.05em] text-[var(--quizo-heading)] sm:text-5xl">{t('dashboardHome.workspace')}</h1>
        <p className="mt-3 max-w-[55ch] text-sm leading-6 text-[var(--quizo-muted)] sm:text-base">{t('dashboardHome.myQuizzesDesc')}</p>
      </div>
      <Button asChild size="lg" className="quizo-copper-button h-12 w-full shrink-0 px-5 sm:w-auto">
        <Link to="/create-quiz"><Sparkles aria-hidden="true" className="h-4 w-4" />{t('nav.createQuizAI')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </Button>
    </motion.header>

    <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:gap-12">
      <motion.section {...revealMotion(!!reduced, .05)} className="min-w-0" aria-labelledby="recent-quizzes">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-quizzes" className="text-2xl font-semibold tracking-tight text-[var(--quizo-heading)] sm:text-3xl">{t('dashboardHome.myQuizzes')}</h2>
          <Link to="/history" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-orange-400 hover:text-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400">{t('dashboardHome.viewHistory')}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>

        {!isLoading && quizzes.length > 0 && <label className="quizo-workspace-search mb-4 flex items-center gap-3">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--quizo-muted)]" />
          <span className="sr-only">{t('common.search')}</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`${t('common.search')}…`} autoComplete="off" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--quizo-heading)] outline-none placeholder:text-[var(--quizo-muted)]" />
        </label>}

        {isLoading ? <StateCard state="loading" title={t('dashboardHome.loadingQuizzes')} description={t('dashboardHome.loadingQuizzesDesc')} /> : quizzes.length === 0 ?
          <StateCard state="empty" title={t('dashboardHome.emptyQuizzes')} description={t('dashboardHome.emptyQuizzesDesc')} action={<Button asChild className="quizo-copper-button"><Link to="/create-quiz">{t('nav.createQuizAI')}</Link></Button>} /> : recentQuizzes.length === 0 ?
          <StateCard state="empty" title={t('dashboardHome.noSearchResults')} description={t('dashboardHome.noSearchResultsDesc')} /> :
          <div className="quizo-workspace-list">{recentQuizzes.map((quiz, index) => <motion.article {...revealMotion(!!reduced, index * .05)} key={quiz.id} className="quizo-workspace-row flex min-w-0 items-center gap-2 border-b border-[var(--quizo-border)] py-2 sm:gap-3">
            <Link to={`/quiz-preview/${quiz.id}`} className="group flex min-h-[4.75rem] min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 sm:gap-4 sm:px-3">
              <span className="quizo-workspace-file grid h-11 w-11 shrink-0 place-items-center rounded-xl"><FileText aria-hidden="true" className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-semibold text-[var(--quizo-heading)] group-hover:text-orange-400 sm:text-base">{quiz.title || t('dashboardHome.untitledQuiz')}</strong>
                <span className="mt-1 block truncate text-xs text-[var(--quizo-muted)] sm:text-sm">{quiz.description || t('dashboardHome.questionsCount', { count: quiz.questions.length })}</span>
              </span>
              <span className="quizo-tabular hidden shrink-0 whitespace-nowrap text-xs text-[var(--quizo-muted)] md:block">{t('dashboardHome.questionsCount', { count: quiz.questions.length })}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-orange-400 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            {quiz.shareCode && <button type="button" onClick={() => copyCode(quiz.shareCode)} aria-label={`${t('share.copyCode')}: ${quiz.shareCode}`} title={t('dashboardHome.shareCode')} className="quizo-workspace-copy grid h-11 w-11 shrink-0 place-items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><Copy aria-hidden="true" className="h-4 w-4" /></button>}
          </motion.article>)}</div>}
      </motion.section>

      <motion.aside {...revealMotion(!!reduced, .1)} aria-label={t('dashboardHome.quickActions')} className="quizo-workspace-rail">
        <div className="quizo-workspace-glass p-6 sm:p-7">
          <span className="quizo-workspace-rail-icon grid h-12 w-12 place-items-center rounded-xl"><PenLine aria-hidden="true" className="h-5 w-5" /></span>
          <h2 className="mt-6 max-w-[16ch] text-balance text-2xl font-semibold leading-tight tracking-tight text-[var(--quizo-heading)]">{t('dashboardHome.nextQuiz')}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--quizo-muted)]">{t('dashboardHome.createManualDesc')}</p>
          <div className="mt-7 space-y-2">
            <Link to="/create-manual-quiz" className="quizo-workspace-action"><PenLine aria-hidden="true" className="h-4 w-4" /><span>{t('dashboardHome.createManual')}</span><ArrowRight aria-hidden="true" className="ml-auto h-4 w-4" /></Link>
            <Link to="/join" className="quizo-workspace-action"><Users aria-hidden="true" className="h-4 w-4" /><span>{t('nav.joinByCode')}</span><ArrowRight aria-hidden="true" className="ml-auto h-4 w-4" /></Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-5 border-t border-[var(--quizo-border)] pt-6">
            <div><p className="quizo-tabular text-2xl font-semibold text-[var(--quizo-heading)]">{count.format(quizzes.length)}</p><p className="mt-1 text-xs text-[var(--quizo-muted)]">{t('dashboardHome.totalQuiz')}</p></div>
            <div><p className="quizo-tabular text-2xl font-semibold text-[var(--quizo-heading)]">{count.format(quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0))}</p><p className="mt-1 text-xs text-[var(--quizo-muted)]">{t('dashboardHome.questions')}</p></div>
          </div>
        </div>
      </motion.aside>
    </div>
  </div>;
}
