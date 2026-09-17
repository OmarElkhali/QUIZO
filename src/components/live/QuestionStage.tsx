import { useEffect, useRef } from 'react';
import { Check, Circle, Timer, Weight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StageQuestion {
  id: string;
  text: string;
  points: number;
  timeLimit?: number;
  options: { id: string; text: string }[];
}

interface Props {
  question: StageQuestion;
  index: number;
  total: number;
  remaining?: number | null;
  timerTotal?: number;
  selected?: string;
  correctOptionId?: string;
  disabled?: boolean;
  compact?: boolean;
  onAnswer?: (optionId: string) => void;
}

const identities = [
  { symbol: '▲', color: 'border-rose-400/40 bg-rose-500/10 hover:bg-rose-500/15' },
  { symbol: '◆', color: 'border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/15' },
  { symbol: '●', color: 'border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/15' },
  { symbol: '■', color: 'border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/15' },
  { symbol: '★', color: 'border-violet-400/40 bg-violet-500/10 hover:bg-violet-500/15' },
  { symbol: '⬟', color: 'border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/15' },
];

export function QuestionStage({ question, index, total, remaining, timerTotal, selected, correctOptionId, disabled, compact = false, onAnswer }: Props) {
  const reducedMotion = useReducedMotion();
  const answerHandler = useRef(onAnswer);
  useEffect(() => { answerHandler.current = onAnswer; }, [onAnswer]);
  const timerProgress = remaining !== null && remaining !== undefined && timerTotal
    ? Math.max(0, Math.min(100, (remaining / timerTotal) * 100))
    : null;
  const urgent = remaining !== null && remaining !== undefined && remaining <= Math.min(10, Math.ceil((timerTotal || 20) * 0.2));
  const questionProgress = total > 0 ? Math.max(0, Math.min(100, ((index + 1) / total) * 100)) : 0;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (disabled || !answerHandler.current || event.repeat || event.ctrlKey || event.metaKey || event.altKey || target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      const optionIndex = event.key.toUpperCase().charCodeAt(0) - 65;
      if (event.key.length === 1 && optionIndex >= 0 && optionIndex < question.options.length) {
        event.preventDefault();
        answerHandler.current(question.options[optionIndex].id);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [question.options, disabled]);

  return (
    <motion.section key={question.id} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }} className="space-y-6" aria-labelledby={`question-${question.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--quizo-muted)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] px-3 py-1.5 font-semibold">Question {index + 1} / {total}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--quizo-border)] px-3 py-1.5"><Weight className="h-3.5 w-3.5" />{question.points} {question.points > 1 ? 'points' : 'point'}</span>
        </div>
        {remaining !== null && remaining !== undefined && <span className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-lg font-bold transition-colors', urgent ? 'border-red-400/50 bg-red-500/15 text-red-200' : 'border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[var(--quizo-heading)]')} aria-live={urgent ? 'polite' : 'off'} aria-label={`${remaining} secondes restantes`}><Timer className={cn('h-4 w-4', urgent && !reducedMotion && 'animate-pulse')} />{remaining} s</span>}
      </div>
      <div className="space-y-2" role="progressbar" aria-label="Progression du quiz" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1}>
        <div className="flex justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--quizo-muted)]"><span>Progression</span><span>{Math.round(questionProgress)} %</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div initial={false} animate={{ width: `${questionProgress}%` }} transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 shadow-[0_0_16px_rgba(251,146,60,.45)]" /></div>
      </div>
      {timerProgress !== null && <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true"><div className={cn('h-full rounded-full transition-[width,background-color] duration-300', urgent ? 'bg-red-400' : 'bg-orange-400')} style={{ width: `${timerProgress}%` }} /></div>}
      <h2 id={`question-${question.id}`} className={cn('break-words font-black leading-tight tracking-tight text-[var(--quizo-heading)]', compact ? 'text-xl sm:text-3xl lg:text-4xl 2xl:text-5xl' : 'text-2xl sm:text-4xl xl:text-5xl 2xl:text-6xl')}>{question.text}</h2>
      <div role="group" aria-label="Réponses possibles" className="grid gap-3 md:grid-cols-2 xl:gap-4">
        {question.options.map((option, optionIndex) => {
          const identity = identities[optionIndex % identities.length];
          const correct = option.id === correctOptionId;
          const chosen = option.id === selected;
          const incorrectChoice = Boolean(chosen && correctOptionId && !correct);
          return <motion.button key={option.id} type="button" disabled={disabled || !onAnswer} onClick={() => onAnswer?.(option.id)} aria-pressed={chosen}
            whileHover={reducedMotion || disabled ? undefined : { y: -2 }} whileTap={reducedMotion || disabled ? undefined : { scale: 0.985 }}
            className={cn('group flex min-h-24 items-center gap-3 rounded-2xl border-2 p-4 text-start text-[var(--quizo-heading)] shadow-sm transition-[border-color,background-color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 disabled:cursor-default sm:gap-4 sm:p-5 xl:min-h-28 xl:p-6', identity.color, !disabled && 'cursor-pointer', chosen && !correctOptionId && 'border-orange-300 ring-2 ring-orange-400/50 shadow-[0_0_24px_rgba(251,146,60,.15)]', correct && 'border-emerald-300 bg-emerald-500/15 ring-2 ring-emerald-400/50', incorrectChoice && 'border-red-300 bg-red-500/15 ring-2 ring-red-400/50')}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/15 font-black" aria-hidden="true"><span className="mr-1 text-xs opacity-70">{String.fromCharCode(65 + optionIndex)}</span>{identity.symbol}</span>
            <span className="min-w-0 flex-1 break-words text-sm font-semibold leading-relaxed sm:text-base lg:text-lg 2xl:text-xl">{option.text}</span>
            {correct ? <Check className="h-6 w-6 shrink-0 text-emerald-300" aria-label="Bonne réponse" /> : chosen ? <Circle className="h-5 w-5 shrink-0 fill-current text-orange-300" aria-label="Votre choix" /> : null}
          </motion.button>;
        })}
      </div>
      {!disabled && onAnswer && <p className="text-center text-xs text-[var(--quizo-muted)]">Astuce : utilisez les touches A à {String.fromCharCode(64 + question.options.length)} pour répondre.</p>}
    </motion.section>
  );
}
