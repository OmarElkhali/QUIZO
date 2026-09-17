import { useState } from 'react';
import { Bot, Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuizQuestionInput } from '@/domain/quizRules';
import { requestAnswerExplanation, type AnswerExplanation } from '@/services/answerExplanationService';

interface Props {
  question: QuizQuestionInput;
  selectedOptionId?: string;
}

export function AIAnswerExplanation({ question, selectedOptionId }: Props) {
  const [result, setResult] = useState<AnswerExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await requestAnswerExplanation(question, selectedOptionId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Explication indisponible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold text-violet-100"><Bot className="h-4 w-4" />Explication IA à la demande</p>
          <p className="mt-1 text-xs text-[var(--quizo-muted)]">L’API n’est appelée que si vous cliquez.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void explain()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : result ? <RefreshCw className="mr-2 h-4 w-4" /> : <Bot className="mr-2 h-4 w-4" />}
          {loading ? 'Analyse…' : result ? 'Regénérer' : 'Demander à l’IA'}
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {result && (
        <div aria-live="polite" className="mt-4 space-y-3 text-sm leading-6 text-[var(--quizo-text)]">
          <p>{result.explanation}</p>
          {result.keyPoint && <p className="flex gap-2 rounded-lg bg-black/20 p-3"><Lightbulb className="mt-1 h-4 w-4 shrink-0 text-amber-300" /><span><strong>À retenir :</strong> {result.keyPoint}</span></p>}
          <p className="text-[11px] text-[var(--quizo-muted)]">{result.fallback ? 'Explication de secours' : 'Généré par IA'} · {result.provider} · {result.model}</p>
        </div>
      )}
    </div>
  );
}
