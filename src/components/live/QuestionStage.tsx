import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface StageQuestion { id: string; text: string; points: number; timeLimit?: number; options: { id: string; text: string }[] }
interface Props {
  question: StageQuestion; index: number; total: number; remaining: number;
  selected?: string; correctOptionId?: string; disabled?: boolean;
  onAnswer?: (optionId: string) => void;
}
const identities = [
  { symbol: '▲', className: 'border-red-400/50 bg-red-500/10' },
  { symbol: '◆', className: 'border-blue-400/50 bg-blue-500/10' },
  { symbol: '●', className: 'border-yellow-400/50 bg-yellow-500/10' },
  { symbol: '■', className: 'border-green-400/50 bg-green-500/10' },
  { symbol: '★', className: 'border-purple-400/50 bg-purple-500/10' },
  { symbol: '⬟', className: 'border-cyan-400/50 bg-cyan-500/10' },
];
export function QuestionStage({ question, index, total, remaining, selected, correctOptionId, disabled, onAnswer }: Props) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (disabled || !onAnswer || event.repeat || event.ctrlKey || event.metaKey || event.altKey || target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      const index = event.key.toUpperCase().charCodeAt(0) - 65;
      if (event.key.length === 1 && index >= 0 && index < question.options.length) {
        event.preventDefault(); onAnswer(question.options[index].id);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [question.options, disabled, onAnswer]);
  return <motion.section key={question.id} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }} className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--quizo-muted)]">
      <span>Question {index + 1} / {total} · Poids {question.points}</span>
      <span className="rounded-full border border-[var(--quizo-border)] px-4 py-2 font-mono text-lg" aria-label={`${remaining} secondes restantes`}>{remaining} s</span>
    </div>
    <h2 className="break-words text-2xl font-bold leading-relaxed text-[var(--quizo-heading)] sm:text-3xl">{question.text}</h2>
    <div role="group" aria-label="Réponses" className="grid gap-3 sm:grid-cols-2">
      {question.options.map((option, i) => {
        const identity = identities[i % identities.length];
        const correct = option.id === correctOptionId;
        const chosen = option.id === selected;
        return <button key={option.id} type="button" disabled={disabled || !onAnswer} onClick={() => onAnswer?.(option.id)} aria-pressed={chosen}
          className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 p-4 text-start text-[var(--quizo-heading)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 disabled:cursor-default ${identity.className} ${chosen ? 'ring-2 ring-orange-400' : ''} ${correct ? 'ring-2 ring-emerald-400' : ''}`}>
          <span className="flex shrink-0 flex-col items-center font-bold"><span aria-hidden="true">{identity.symbol}</span>{String.fromCharCode(65 + i)}</span>
          <span className="min-w-0 flex-1 break-words">{option.text}</span>
          {correct && <span aria-label="Bonne réponse">✓</span>}
          {chosen && !correctOptionId && <span aria-label="Votre choix">●</span>}
        </button>;
      })}
    </div>
  </motion.section>;
}
