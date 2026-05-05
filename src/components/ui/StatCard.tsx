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
      'rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition hover:border-[#d77a36]/35 hover:bg-white/[0.065]',
      className
    )}
  >
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
      {Icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#d77a36]/15 text-[#f7c693]">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
    <div className="text-2xl font-semibold text-white">{value}</div>
    {detail && <p className="mt-2 text-sm text-slate-400">{detail}</p>}
  </div>
);
