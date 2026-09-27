import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { revealMotion } from '@/utils/animations';

interface PremiumPanelProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export const PremiumPanel = ({ children, className, interactive = false }: PremiumPanelProps) => {
  const reduced = useReducedMotion();
  return <motion.div {...revealMotion(!!reduced)} whileHover={interactive && !reduced ? { y: -3 } : undefined} className={cn('quizo-panel', interactive && 'quizo-panel-hover', className)}>{children}</motion.div>;
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: boolean;
  children?: ReactNode;
  className?: string;
}

export const ActionCard = ({ title, description, icon: Icon, accent = false, children, className }: ActionCardProps) => {
  const reduced = useReducedMotion();
  return <motion.div
    {...revealMotion(!!reduced)}
    whileHover={reduced ? undefined : { y: -4, scale: 1.01 }}
    className={cn(
      'quizo-panel quizo-panel-hover flex h-full flex-col p-5 sm:p-7',
      accent && 'border-orange-500/45',
      className
    )}
  >
    <div
      className={cn(
        'mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--quizo-surface-soft)] text-orange-500',
        accent && 'bg-orange-500/10'
      )}
    >
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="break-words text-xl font-semibold tracking-tight text-[var(--quizo-heading)] sm:text-2xl">{title}</h3>
    <p className="mt-3 flex-1 text-sm leading-6 text-[var(--quizo-muted)]">{description}</p>
    {children && <div className="mt-6 border-t border-[var(--quizo-border)] pt-5">{children}</div>}
  </motion.div>;
};

interface PremiumMetricProps {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'copper' | 'green' | 'blue' | 'violet';
  className?: string;
  delay?: number;
}

export const PremiumMetric = ({ label, value, detail, icon: Icon, className, delay = 0 }: PremiumMetricProps) => {
  const reduced = useReducedMotion();
  return <motion.div {...revealMotion(!!reduced, delay)} className={cn('quizo-panel-subtle p-5 sm:p-6', className)}>
    <div className="mb-7 flex items-start justify-between gap-3">
      {Icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
          <Icon className="h-5 w-5" />
        </div>
      ) : (
        <span />
      )}
      {detail && (
        <span className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
          {detail}
        </span>
      )}
    </div>
    <p className="quizo-label">{label}</p>
    <div className="quizo-tabular mt-2 text-3xl font-semibold tracking-tight text-[var(--quizo-heading)]">{value}</div>
  </motion.div>;
};

interface QuizAnswerCardProps {
  selected: boolean;
  children: ReactNode;
  className?: string;
}

export const QuizAnswerCard = ({ selected, children, className }: QuizAnswerCardProps) => {
  const reduced = useReducedMotion();
  return <motion.div
    initial={false}
    animate={reduced ? undefined : { scale: selected ? 1.015 : 1 }}
    transition={{ type: 'spring', stiffness: 360, damping: 24 }}
    className={cn(
      'flex min-h-[72px] items-center gap-4 rounded-xl border p-5 text-left transition-[background-color,border-color] duration-200',
      selected
        ? 'border-orange-500 bg-orange-500/10 text-[var(--quizo-heading)]'
        : 'border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[var(--quizo-text)] hover:border-orange-300/35 hover:bg-[var(--quizo-surface-hover)]',
      className
    )}
  >
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
        selected ? 'border-orange-500' : 'border-[var(--quizo-muted)]'
      )}
    >
      <span className={cn('h-2 w-2 rounded-full transition', selected ? 'bg-orange-500' : 'bg-transparent')} />
    </span>
    <span className={cn('text-base leading-6', selected && 'font-semibold')}>{children}</span>
  </motion.div>;
};

interface PodiumItem {
  id: string;
  name: string;
  score: number;
  time?: string;
}

interface LeaderboardPodiumProps {
  participants: PodiumItem[];
}

export const LeaderboardPodium = ({ participants }: LeaderboardPodiumProps) => {
  const ordered = [participants[1], participants[0], participants[2]].filter(Boolean);
  const reduced = useReducedMotion();

  return (
    <div className="grid gap-5 md:grid-cols-3 md:items-end">
      {ordered.map((participant) => {
        const rank = participants.findIndex((item) => item.id === participant.id) + 1;
        const isWinner = rank === 1;
        return (
          <motion.div
            key={participant.id}
            layout={!reduced}
            initial={reduced ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 23, delay: (rank - 1) * 0.08 }}
            className={cn(
              'quizo-panel flex flex-col items-center justify-end p-6 text-center',
              isWinner ? 'min-h-[300px] border-orange-400/45 bg-orange-500/10' : 'min-h-[250px]'
            )}
          >
            <div className={cn('mb-4 flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-bold', isWinner ? 'border-orange-300/60 bg-orange-500/20 text-orange-100' : 'border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[var(--quizo-heading)]')}>
              {participant.name.slice(0, 1).toUpperCase()}
            </div>
            <div className={cn('mb-3 rounded-full px-3 py-1 text-sm font-bold', isWinner ? 'bg-orange-500 text-[#241000]' : 'bg-white/[0.08] text-[#c8c6c5]')}>#{rank}</div>
            <h3 className="text-xl font-bold text-[var(--quizo-heading)]">{participant.name}</h3>
            <p className={cn('mt-3 text-4xl font-black tracking-tight', isWinner ? 'quizo-brand-text' : 'text-[var(--quizo-heading)]')}>
              {Math.round(participant.score).toLocaleString('fr-FR')}
            </p>
            {participant.time && <p className="mt-3 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-[#c9ad96]">{participant.time}</p>}
          </motion.div>
        );
      })}
    </div>
  );
};

export const PremiumDropzone = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('rounded-2xl border border-dashed border-orange-300/28 bg-[var(--quizo-surface-soft)] p-8 shadow-inner', className)}>
    {children}
  </div>
);
