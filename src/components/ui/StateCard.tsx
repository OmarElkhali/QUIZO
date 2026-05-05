import { ReactNode } from 'react';
import { AlertCircle, Loader2, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StateCardProps {
  state: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  action?: ReactNode;
}

export const StateCard = ({ state, title, description, action }: StateCardProps) => {
  const Icon = state === 'loading' ? Loader2 : state === 'error' ? AlertCircle : SearchX;

  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#d77a36]/15 text-[#f7c693]">
          <Icon className={state === 'loading' ? 'h-6 w-6 animate-spin' : 'h-6 w-6'} />
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
};

export const StateActionButton = Button;
