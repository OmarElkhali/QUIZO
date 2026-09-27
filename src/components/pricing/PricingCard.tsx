import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { revealMotion } from '@/utils/animations';

interface PricingCardProps {
  name: string;
  price: string;
  badge?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  onClick?: () => void;
  href?: string;
}

export const PricingCard = ({ name, price, badge, features, cta, highlighted = false, onClick, href }: PricingCardProps) => {
  const reduced = useReducedMotion();
  return <motion.article
    {...revealMotion(!!reduced, highlighted ? 0.08 : 0)}
    whileHover={reduced ? undefined : { y: -5, scale: 1.008 }}
    className={cn(
      'quizo-panel relative flex h-full flex-col overflow-hidden p-7',
      highlighted
        ? 'border-orange-500/65'
        : ''
    )}
  >
    {badge && (
      <span className="absolute right-5 top-5 rounded-md bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-500">
        {badge}
      </span>
    )}

    <div className="mb-8">
      <p className="quizo-label">{name}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="quizo-tabular text-5xl font-semibold tracking-tight text-[var(--quizo-heading)]">
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

    {href ? <Button asChild className={cn('mt-8 w-full', highlighted && 'quizo-copper-button')} variant={highlighted ? 'default' : 'secondary'}>
      <a href={href} className="lemonsqueezy-button" aria-label={`${cta} — paiement sécurisé par Lemon Squeezy`}>{cta}</a>
    </Button> : <Button type="button" onClick={onClick} className={cn('mt-8 w-full', highlighted && 'quizo-copper-button')} variant={highlighted ? 'default' : 'secondary'}>{cta}</Button>}
  </motion.article>;
};
