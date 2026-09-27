import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--quizo-muted)] transition-colors hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          {isDark ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Basculer le theme</p>
      </TooltipContent>
    </Tooltip>
  );
}
