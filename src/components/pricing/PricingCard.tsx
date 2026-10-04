import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, useReducedMotion } from 'framer-motion';
import { revealMotion } from '@/utils/animations';

interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  cta: string;
  onClick: () => void;
}

export const PricingCard = ({ name, price, features, cta, onClick }: PricingCardProps) => {
  const reduced = useReducedMotion();
  return <motion.article
    {...revealMotion(!!reduced)}
    whileHover={reduced ? undefined : { y: -5, scale: 1.008 }}
    className="quizo-panel relative flex h-full flex-col overflow-hidden p-7"
  >
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

    <Button type="button" onClick={onClick} className="mt-8 w-full" variant="secondary">{cta}</Button>
  </motion.article>;
};
