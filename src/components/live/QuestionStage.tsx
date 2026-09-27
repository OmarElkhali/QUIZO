import { useEffect, useMemo, useRef } from 'react';
import { Check, Circle, Timer, Weight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StageQuestion {
  id: string;
  text: string;
  points: number;
  timeLimit?: number;
  options: { id: string; text: string; isCorrect?: boolean }[];
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

export function QuestionStage({ question, index, total, remaining, timerTotal, selected, correctOptionId, disabled, compact = false, onAnswer }: Props) {
  const reducedMotion = useReducedMotion();
  const answerHandler = useRef(onAnswer);
  const optionOrders = useRef(new Map<string, string[]>());
  useEffect(() => { answerHandler.current = onAnswer; }, [onAnswer]);
  const orderedOptions = useMemo(() => {
    if (question.options.some((option) => typeof option.isCorrect === 'boolean')) return question.options;
    const currentIds = new Set(question.options.map((option) => option.id));
    let order = optionOrders.current.get(question.id);
    if (!order || order.length !== question.options.length || order.some((id) => !currentIds.has(id))) {
      order = question.options.map((option) => option.id);
      for (let optionIndex = order.length - 1; optionIndex > 0; optionIndex -= 1) {
        const targetIndex = Math.floor(Math.random() * (optionIndex + 1));
        [order[optionIndex], order[targetIndex]] = [order[targetIndex], order[optionIndex]];
      }
      optionOrders.current.set(question.id, order);
    }
    const byId = new Map(question.options.map((option) => [option.id, option]));
    return order.map((id) => byId.get(id)).filter((option): option is StageQuestion['options'][number] => Boolean(option));
  }, [question.id, question.options]);
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
      if (event.key.length === 1 && optionIndex >= 0 && optionIndex < orderedOptions.length) {
        event.preventDefault();
        answerHandler.current(orderedOptions[optionIndex].id);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [orderedOptions, disabled]);

  return (
    <motion.section key={question.id} initial={reducedMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 170, damping: 24 }} className="space-y-5 sm:space-y-8" aria-labelledby={`question-${question.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--quizo-muted)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] px-3 py-1.5 font-semibold">Question {index + 1} / {total}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--quizo-border)] px-3 py-1.5"><Weight className="h-3.5 w-3.5" />{question.points} {question.points > 1 ? 'points' : 'point'}</span>
        </div>
        {remaining !== null && remaining !== undefined && <span className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-lg font-bold transition-colors', urgent ? 'border-red-400/50 bg-red-500/15 text-red-200' : 'border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] text-[var(--quizo-heading)]')} aria-live={urgent ? 'polite' : 'off'} aria-label={`${remaining} secondes restantes`}><Timer className={cn('h-4 w-4', urgent && !reducedMotion && 'animate-pulse')} />{remaining} s</span>}
      </div>
      <div className="space-y-2" role="progressbar" aria-label="Progression du quiz" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1}>
        <div className="flex justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--quizo-muted)]"><span>Progression</span><span>{Math.round(questionProgress)} %</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div initial={false} animate={{ scaleX: questionProgress / 100 }} transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }} className="h-full origin-left rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 shadow-[0_0_16px_rgba(251,146,60,.45)]" /></div>
      </div>
      {timerProgress !== null && <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true"><motion.div initial={false} animate={{ scaleX: timerProgress / 100 }} transition={{ duration: reducedMotion ? 0 : 0.3 }} className={cn('h-full origin-left rounded-full transition-colors', urgent ? 'bg-red-400' : 'bg-orange-400')} /></div>}
      <h2 id={`question-${question.id}`} className={cn('max-w-[38ch] break-words text-balance font-bold leading-[1.12] tracking-[-.045em] text-[var(--quizo-heading)]', compact ? 'text-[clamp(1.65rem,2.5vw,2.8rem)]' : 'text-[clamp(1.65rem,3vw,3.4rem)]')}>{question.text}</h2>
      <div role="group" aria-label="Réponses possibles" className="live-answer-grid grid gap-3 md:grid-cols-2 xl:gap-4">
        {orderedOptions.map((option, optionIndex) => {
          const correct = option.id === correctOptionId;
          const chosen = option.id === selected;
          const incorrectChoice = Boolean(chosen && correctOptionId && !correct);
          return <motion.button key={option.id} type="button" disabled={disabled || !onAnswer} onClick={() => onAnswer?.(option.id)} aria-pressed={chosen} data-result={correct ? 'correct' : incorrectChoice ? 'incorrect' : undefined}
            initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: optionIndex * 0.045 }}
            whileHover={reducedMotion || disabled ? undefined : { y: -2 }} whileTap={reducedMotion || disabled ? undefined : { scale: 0.985 }}
            className={cn('quizo-answer-choice group flex items-center gap-3 p-4 text-start text-[var(--quizo-heading)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 disabled:cursor-default sm:gap-5 sm:p-5', !disabled && 'cursor-pointer', correct && 'border-emerald-300 bg-emerald-500/15 ring-2 ring-emerald-400/50', incorrectChoice && 'border-red-300 bg-red-500/15 ring-2 ring-red-400/50')}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-lg font-bold text-orange-300 sm:h-12 sm:w-12" aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span>
            <span className="min-w-0 flex-1 break-words text-base font-medium leading-relaxed">{option.text}</span>
            {correct ? <Check className="h-6 w-6 shrink-0 text-emerald-300" aria-label="Bonne réponse" /> : chosen ? <Circle className="h-5 w-5 shrink-0 fill-current text-orange-300" aria-label="Votre choix" /> : null}
          </motion.button>;
        })}
      </div>
      {!disabled && onAnswer && <p className="hidden text-center text-xs text-[var(--quizo-muted)] sm:block">Astuce : utilisez les touches A à {String.fromCharCode(64 + orderedOptions.length)} pour répondre.</p>}
    </motion.section>
  );
}
