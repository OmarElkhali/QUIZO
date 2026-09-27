import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, FileText, Sparkles, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useAuth } from '@/context/AuthContext';
import { AuthDialog } from '@/components/AuthDialog';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { revealMotion } from '@/utils/animations';

const QuizPreviewVisual = () => {
  const reduced = useReducedMotion();
  const bounds = useRef<DOMRect | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-1, 1], [3, -3]), { stiffness: 160, damping: 22 });
  const rotateY = useSpring(useTransform(pointerX, [-1, 1], [-4, 4]), { stiffness: 160, damping: 22 });

  return <motion.div
    className="quizo-home-preview"
    aria-hidden="true"
    initial={reduced ? false : { opacity: 0, y: 32, rotateZ: 3 }}
    animate={{ opacity: 1, y: 0, rotateZ: reduced ? 0 : 1.5 }}
    transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.12 }}
    style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
    onPointerEnter={(event) => { if (event.pointerType === 'mouse') bounds.current = event.currentTarget.getBoundingClientRect(); }}
    onPointerMove={(event) => {
      if (reduced || event.pointerType !== 'mouse' || !bounds.current) return;
      pointerX.set(((event.clientX - bounds.current.left) / bounds.current.width - 0.5) * 2);
      pointerY.set(((event.clientY - bounds.current.top) / bounds.current.height - 0.5) * 2);
    }}
    onPointerLeave={() => { bounds.current = null; pointerX.set(0); pointerY.set(0); }}
  >
    <div className="flex items-center justify-between border-b border-[var(--quizo-border)] pb-5 text-xs font-semibold text-[var(--quizo-muted)]"><span>APERÇU D’UNE PARTIE</span><span className="quizo-tabular">01 / 04</span></div>
    <p className="mt-10 text-sm font-medium text-orange-400">Question 01</p>
    <p className="mt-3 max-w-[18ch] text-3xl font-semibold leading-tight tracking-tight text-[var(--quizo-heading)]">Apprendre devient plus simple quand on participe.</p>
    <div className="mt-9 space-y-2.5"><div className="quizo-preview-answer">A <span>Lire et relire</span></div><div className="quizo-preview-answer quizo-preview-answer-active">B <span>Répondre et échanger</span></div><div className="quizo-preview-answer">C <span>Attendre la correction</span></div></div>
    <div className="mt-8 h-1 overflow-hidden rounded-full bg-[var(--quizo-surface-soft)]"><div className="h-full w-1/4 bg-orange-500" /></div>
  </motion.div>;
};

const Index = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [authOpen, setAuthOpen] = useState(false);
  const reduced = useReducedMotion();


  return <AppShell>{user ? <Dashboard /> : <>
    <section className="quizo-home-hero grid gap-10 py-10 md:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <motion.div {...revealMotion(!!reduced)}><p className="quizo-label mb-5">{t('home.badge')}</p><h1 className="max-w-[12ch] text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.055em] text-[var(--quizo-heading)] sm:text-6xl xl:text-7xl">{t('dashboardHome.titleGuest')}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[var(--quizo-muted)]">{t('dashboardHome.descGuest')}</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="quizo-copper-button"><Link to="/join">{t('nav.joinByCode')}<ArrowRight aria-hidden="true" /></Link></Button><Button size="lg" variant="outline" className="quizo-outline-button" onClick={() => setAuthOpen(true)}>{t('nav.createQuiz')}</Button></div></motion.div>
      <QuizPreviewVisual />
    </section>
    <section aria-label="Parcours" className="grid border-t border-[var(--quizo-border)] py-8 md:grid-cols-3">{[
      { icon: FileText, title: t('home.feature1Title'), description: t('home.feature1Description') },
      { icon: Users, title: t('home.feature2Title'), description: t('home.feature2Description') },
      { icon: BarChart3, title: t('home.feature3Title'), description: t('home.feature3Description') },
    ].map(({ icon: Icon, title, description }, index) => <motion.div {...revealMotion(!!reduced, index * 0.08)} key={title} className="border-b border-[var(--quizo-border)] py-6 last:border-0 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"><span className="mb-5 flex items-center gap-3 text-sm text-orange-500"><Icon aria-hidden="true" className="h-5 w-5" />0{index + 1}</span><h2 className="text-xl font-semibold text-[var(--quizo-heading)]">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[var(--quizo-muted)]">{description}</p></motion.div>)}</section>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--quizo-border)] pt-8"><p className="text-sm text-[var(--quizo-muted)]">Un code suffit pour rejoindre une partie.</p><Link to="/pricing" className="text-sm font-semibold text-[var(--quizo-heading)] hover:text-orange-400">{t('dashboardHome.seeTariffs')} <ArrowRight aria-hidden="true" className="ml-1 inline h-4 w-4" /></Link></div>
  </>}<AuthDialog open={authOpen} onOpenChange={setAuthOpen} /></AppShell>;
};

export default Index;
