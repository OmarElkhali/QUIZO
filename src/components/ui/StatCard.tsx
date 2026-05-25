import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: LucideIcon;
  className?: string;
}

export const StatCard = ({ label, value, detail, icon: Icon, className }: StatCardProps) => (
  <div
    className={cn(
      'quizo-panel-subtle quizo-panel-hover p-6',
      className
    )}
  >
    <div className="mb-6 flex items-center justify-between gap-3">
      <p className="quizo-label">{label}</p>
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-orange-500/15 text-[#ffb77d]">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
    <div className="text-3xl font-black tracking-tight text-[var(--quizo-heading)]">{value}</div>
    {detail && <p className="mt-2 text-sm text-[var(--quizo-muted)]">{detail}</p>}
  </div>
);
