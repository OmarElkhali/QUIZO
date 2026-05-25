import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: string;
  badge?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  onClick: () => void;
}

export const PricingCard = ({ name, price, badge, features, cta, highlighted = false, onClick }: PricingCardProps) => (
  <article
    className={cn(
      'quizo-panel relative flex h-full flex-col overflow-hidden p-6 transition duration-300 hover:-translate-y-1',
      highlighted
        ? 'border-orange-400/55 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.2),transparent_36%),rgba(217,119,6,0.08)] shadow-[0_30px_120px_rgba(217,119,6,0.18)]'
        : 'hover:border-orange-400/25'
    )}
  >
    {badge && (
      <span className="absolute right-5 top-5 rounded-full border border-orange-300/35 bg-orange-500/15 px-3 py-1 text-xs font-bold text-[#d97706] dark:text-[#ffdcc3]">
        {badge}
      </span>
    )}

    <div className="mb-8">
      <p className="quizo-label">{name}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className={cn('text-5xl font-black tracking-tight', highlighted ? 'quizo-brand-text' : 'text-[var(--quizo-heading)]')}>
          {price.split('/')[0]}
        </span>
        <span className="pb-2 text-sm font-medium text-[var(--quizo-muted)]">/{price.split('/')[1]}</span>
      </div>
    </div>

    <ul className="flex-1 space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-[var(--quizo-text)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706] dark:text-[#ffb77d]" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>

    <Button
      type="button"
      onClick={onClick}
      className={cn('mt-8 w-full', highlighted ? 'quizo-copper-button' : 'quizo-outline-button')}
      variant={highlighted ? 'default' : 'outline'}
    >
      {cta}
    </Button>
  </article>
);
