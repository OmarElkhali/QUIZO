import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="group"
          aria-label="Changer le theme"
          className="flex items-center rounded-full border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-1 shadow-sm"
        >
          <button
            type="button"
            aria-label="Mode sombre"
            aria-pressed={isDark}
            onClick={() => setTheme('dark')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70',
              isDark
                ? 'bg-orange-500 text-[#241000] shadow-[0_8px_24px_rgba(217,119,6,0.25)]'
                : 'text-[var(--quizo-muted)] hover:text-[var(--quizo-text)]'
            )}
          >
            <Moon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Mode clair"
            aria-pressed={!isDark}
            onClick={() => setTheme('light')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70',
              !isDark
                ? 'bg-orange-500 text-[#241000] shadow-[0_8px_24px_rgba(217,119,6,0.25)]'
                : 'text-[var(--quizo-muted)] hover:text-[var(--quizo-text)]'
            )}
          >
            <Sun className="h-4 w-4" />
          </button>
          <span className="sr-only">Basculer le theme</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Basculer le theme</p>
      </TooltipContent>
    </Tooltip>
  );
}
