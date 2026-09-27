import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { revealMotion } from '@/utils/animations';

interface StatCardProps {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: LucideIcon;
  className?: string;
}

export const StatCard = ({ label, value, detail, icon: Icon, className }: StatCardProps) => {
  const reduced = useReducedMotion();
  return <motion.div
    {...revealMotion(!!reduced)}
    className={cn(
      'quizo-panel-subtle p-6',
      className
    )}
  >
    <div className="mb-6 flex items-center justify-between gap-3">
      <p className="quizo-label">{label}</p>
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
    <div className="quizo-tabular text-3xl font-semibold tracking-tight text-[var(--quizo-heading)]">{value}</div>
    {detail && <p className="mt-2 text-sm text-[var(--quizo-muted)]">{detail}</p>}
  </motion.div>;
};
