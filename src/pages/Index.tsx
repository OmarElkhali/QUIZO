import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, FileText, RotateCcw, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useAuth } from '@/context/AuthContext';
import { AuthDialog } from '@/components/AuthDialog';
import { motion, useReducedMotion } from 'framer-motion';
import { revealMotion } from '@/utils/animations';

const answers = [8, 9, 10, 11];

const QuizPreview = () => {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);

  return <motion.section
    className="quizo-home-preview"
    aria-label={t('quiz.question')}
    initial={reduced ? false : { opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 180, damping: 26, delay: 0.1 }}
  >
    <div className="flex items-center justify-between border-b border-[var(--quizo-border)] pb-5 text-xs font-semibold text-[var(--quizo-muted)]"><span>{t('quiz.question')}</span><span className="quizo-tabular">01 / 01</span></div>
    <p className="mt-9 text-sm font-semibold text-orange-400">{t('quiz.question')} 01</p>
    <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[var(--quizo-heading)] sm:text-4xl">2³ + 1 = ?</h2>
    <div className="mt-9 grid grid-cols-2 gap-2.5">{answers.map((answer, index) => <button
      type="button"
      key={answer}
      disabled={selected !== null}
      onClick={() => setSelected(answer)}
      className="quizo-preview-answer"
      data-result={selected === null ? undefined : answer === 9 ? 'correct' : answer === selected ? 'incorrect' : undefined}
      aria-label={`${String.fromCharCode(65 + index)}. ${answer}`}
    ><span>{String.fromCharCode(65 + index)}</span><strong>{answer}</strong></button>)}</div>
    <div className="mt-6 flex min-h-11 items-center justify-between gap-3 border-t border-[var(--quizo-border)] pt-5 text-sm" aria-live="polite">
      {selected === null ? <span className="text-[var(--quizo-muted)]">{t('quiz.selectAnswer')}</span> : <>
        <span className="font-semibold text-[var(--quizo-heading)]">{t('results.correctAnswer')} : 9</span>
        <button type="button" onClick={() => setSelected(null)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-semibold text-orange-400 hover:bg-orange-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"><RotateCcw aria-hidden="true" className="h-4 w-4" />{t('results.tryAgain')}</button>
      </>}
    </div>
  </motion.section>;
};

const Index = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [authOpen, setAuthOpen] = useState(false);
  const reduced = useReducedMotion();


  return <AppShell>{user ? <Dashboard /> : <>
    <section className="quizo-home-hero grid gap-10 py-10 md:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <motion.div {...revealMotion(!!reduced)}><p className="quizo-label mb-5">{t('home.badge')}</p><h1 className="max-w-[12ch] text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.055em] text-[var(--quizo-heading)] sm:text-6xl xl:text-7xl">{t('dashboardHome.titleGuest')}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[var(--quizo-muted)]">{t('dashboardHome.descGuest')}</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="quizo-copper-button"><Link to="/join">{t('nav.joinByCode')}<ArrowRight aria-hidden="true" /></Link></Button><Button size="lg" variant="outline" className="quizo-outline-button" onClick={() => setAuthOpen(true)}>{t('nav.createQuiz')}</Button></div></motion.div>
      <QuizPreview />
    </section>
    <section aria-labelledby="quizo-home-features" className="grid gap-8 border-t border-[var(--quizo-border)] py-12 lg:grid-cols-[minmax(15rem,.8fr)_minmax(0,1.2fr)] lg:gap-20 lg:py-20">
      <div><p className="quizo-label">QUIZO</p><h2 id="quizo-home-features" className="mt-4 max-w-[16ch] text-balance text-3xl font-semibold leading-tight tracking-tight text-[var(--quizo-heading)] sm:text-4xl">{t('home.featuresTitle')}</h2><p className="mt-4 max-w-md text-base leading-7 text-[var(--quizo-muted)]">{t('dashboardHome.descGuest')}</p></div>
      <div>{[
        { icon: FileText, title: t('home.feature1Title'), description: t('home.feature1Description') },
        { icon: Users, title: t('home.feature2Title'), description: t('home.feature2Description') },
        { icon: BarChart3, title: t('home.feature3Title'), description: t('home.feature3Description') },
      ].map(({ icon: Icon, title, description }) => <article key={title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-b border-[var(--quizo-border)] py-6 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
        <Icon aria-hidden="true" className="h-5 w-5 text-orange-400" />
        <div><h3 className="text-xl font-semibold text-[var(--quizo-heading)]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--quizo-muted)]">{description}</p></div>
      </article>)}</div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--quizo-border)] pt-8"><p className="text-sm text-[var(--quizo-muted)]">Un code suffit pour rejoindre une partie.</p><Link to="/pricing" className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-[var(--quizo-heading)] hover:text-orange-400">{t('dashboardHome.seeTariffs')} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
  </>}<AuthDialog open={authOpen} onOpenChange={setAuthOpen} /></AppShell>;
};

export default Index;
