import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { revealMotion } from '@/utils/animations';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => {
  const reduced = useReducedMotion();
  return <motion.header {...revealMotion(!!reduced)} className="mb-9 flex flex-col gap-6 border-b border-[var(--quizo-border)] pb-8 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="quizo-label mb-4 inline-flex items-center gap-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-orange-500">
          {eyebrow}
        </p>
      )}
      <h1 className="break-words text-balance text-3xl font-semibold tracking-[-0.04em] text-[var(--quizo-heading)] sm:text-4xl xl:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--quizo-muted)]">{description}</p>}
    </div>
    {actions && <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">{actions}</div>}
  </motion.header>;
};
