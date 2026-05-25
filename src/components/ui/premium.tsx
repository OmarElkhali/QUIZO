import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumPanelProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export const PremiumPanel = ({ children, className, interactive = false }: PremiumPanelProps) => (
  <div className={cn('quizo-panel', interactive && 'quizo-panel-hover', className)}>{children}</div>
);

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: boolean;
  children?: ReactNode;
  className?: string;
}

export const ActionCard = ({ title, description, icon: Icon, accent = false, children, className }: ActionCardProps) => (
  <div
    className={cn(
      'quizo-panel quizo-panel-hover flex h-full flex-col p-6',
      accent && 'border-orange-400/35 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.16),transparent_34%),rgba(217,119,6,0.06)]',
      className
    )}
  >
    <div
      className={cn(
        'mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[#ffb77d]',
        accent && 'border-orange-400/30 bg-orange-500/15 shadow-[0_0_28px_rgba(217,119,6,0.18)]'
      )}
    >
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-2xl font-bold tracking-tight text-[var(--quizo-heading)]">{title}</h3>
    <p className="mt-3 flex-1 text-sm leading-6 text-[var(--quizo-muted)]">{description}</p>
    {children && <div className="mt-6 border-t border-[var(--quizo-border)] pt-5">{children}</div>}
  </div>
);

interface PremiumMetricProps {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'copper' | 'green' | 'blue' | 'violet';
  className?: string;
}

const toneClasses: Record<NonNullable<PremiumMetricProps['tone']>, string> = {
  default: 'text-[#ffb77d] bg-white/[0.06]',
  copper: 'text-[#ffb77d] bg-orange-500/15',
  green: 'text-emerald-300 bg-emerald-500/12',
  blue: 'text-sky-300 bg-sky-500/12',
  violet: 'text-violet-300 bg-violet-500/12',
};

export const PremiumMetric = ({ label, value, detail, icon: Icon, tone = 'default', className }: PremiumMetricProps) => (
  <div className={cn('quizo-panel-subtle quizo-panel-hover p-6', className)}>
    <div className="mb-8 flex items-center justify-between gap-3">
      {Icon ? (
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--quizo-border)]', toneClasses[tone])}>
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
    <div className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--quizo-heading)]">{value}</div>
  </div>
);

interface QuizAnswerCardProps {
  selected: boolean;
  children: ReactNode;
  className?: string;
}

export const QuizAnswerCard = ({ selected, children, className }: QuizAnswerCardProps) => (
  <div
    className={cn(
      'flex min-h-[72px] items-center gap-4 rounded-2xl border p-5 text-left transition duration-300',
      selected
        ? 'border-orange-300/55 bg-orange-500/12 text-[var(--quizo-heading)] shadow-[0_0_30px_rgba(255,183,125,0.12),inset_0_0_20px_rgba(255,183,125,0.05)]'
        : 'border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[var(--quizo-text)] hover:border-orange-300/35 hover:bg-[var(--quizo-surface-hover)]',
      className
    )}
  >
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
        selected ? 'border-orange-200 shadow-[0_0_12px_rgba(255,183,125,0.45)]' : 'border-[#8d8178]'
      )}
    >
      <span className={cn('h-2 w-2 rounded-full transition', selected ? 'bg-orange-200' : 'bg-transparent')} />
    </span>
    <span className={cn('text-base leading-6', selected && 'font-semibold')}>{children}</span>
  </div>
);

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

  return (
    <div className="grid gap-5 md:grid-cols-3 md:items-end">
      {ordered.map((participant) => {
        const rank = participants.findIndex((item) => item.id === participant.id) + 1;
        const isWinner = rank === 1;
        return (
          <div
            key={participant.id}
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
          </div>
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
