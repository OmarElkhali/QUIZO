import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <div className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="quizo-label mb-3 inline-flex rounded-full border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] px-3 py-1.5">
          {eyebrow}
        </p>
      )}
      <h1 className="text-4xl font-black tracking-tight text-[var(--quizo-heading)] sm:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--quizo-muted)]">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
