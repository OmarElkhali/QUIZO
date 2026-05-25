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
    <div className="quizo-panel flex min-h-[320px] items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-orange-300/25 bg-orange-500/15 text-[#ffb77d]">
          <Icon className={state === 'loading' ? 'h-6 w-6 animate-spin' : 'h-6 w-6'} />
        </div>
        <h2 className="text-xl font-semibold text-[var(--quizo-heading)]">{title}</h2>
        {description && <p className="mt-3 text-sm leading-6 text-[var(--quizo-muted)]">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
};

export const StateActionButton = Button;
