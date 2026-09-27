import { ReactNode } from 'react';
import { AlertCircle, Loader2, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useReducedMotion } from 'framer-motion';
import { revealMotion } from '@/utils/animations';

interface StateCardProps {
  state: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  action?: ReactNode;
}

export const StateCard = ({ state, title, description, action }: StateCardProps) => {
  const Icon = state === 'loading' ? Loader2 : state === 'error' ? AlertCircle : SearchX;
  const reduced = useReducedMotion();

  return (
    <motion.div {...revealMotion(!!reduced)} role={state === 'error' ? 'alert' : 'status'} className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-[var(--quizo-border)] bg-[var(--quizo-surface)] p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
          <Icon className={state === 'loading' ? 'h-6 w-6 animate-spin' : 'h-6 w-6'} />
        </div>
        <h2 className="text-xl font-semibold text-[var(--quizo-heading)]">{title}</h2>
        {description && <p className="mt-3 text-sm leading-6 text-[var(--quizo-muted)]">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </motion.div>
  );
};

export const StateActionButton = Button;
