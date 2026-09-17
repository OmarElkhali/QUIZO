import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Flame, Gauge, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateQuestionScore, calculatePedagogicalScore, remainingSeconds, type QuizQuestionInput } from '@/domain/quizRules';
import { QuestionStage } from './QuestionStage';

export function QuizPractice({ questions, onClose }: { questions: QuizQuestionInput[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();
  const [revealed, setRevealed] = useState(false);
  const [points, setPoints] = useState(0);
  const [earnedWeight, setEarnedWeight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const openedAt = useRef(Date.now());
  const answered = useRef(false);
  const [remaining, setRemaining] = useState(question?.timeLimit || 20);
  const [lastPoints, setLastPoints] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const possibleWeight = useMemo(() => questions.reduce((sum, q) => sum + q.points, 0), [questions]);
  const answer = useCallback((optionId?: string) => {
    if (answered.current || !question) return;
    answered.current = true;
    const correct = question.options.some(o => o.id === optionId && o.isCorrect);
    const score = calculateQuestionScore({ weight: question.points, correct,
      responseTimeMs: Math.max(0, Date.now() - openedAt.current), timeLimitMs: (question.timeLimit || 20) * 1000, previousStreak: streak });
    setSelected(optionId); setRevealed(true); setLastPoints(score.awardedGamePoints); setLastCorrect(correct);
    setPoints(total => total + score.awardedGamePoints); setEarnedWeight(total => total + score.earnedWeight); setStreak(score.resultingStreak);
    if (correct) setCorrectCount(total => total + 1);
  }, [question, streak]);
  useEffect(() => {
    if (!question || revealed || finished) return;
    const timer = setInterval(() => {
      const value = remainingSeconds(openedAt.current + (question.timeLimit || 20) * 1000, Date.now());
      setRemaining(value);
      if (value === 0) answer();
    }, 200);
    return () => clearInterval(timer);
  }, [answer, question, revealed, finished]);

  const restart = () => {
    openedAt.current = Date.now(); answered.current = false;
    setIndex(0); setSelected(undefined); setRevealed(false); setPoints(0); setEarnedWeight(0); setStreak(0); setCorrectCount(0); setFinished(false); setLastPoints(0); setRemaining(questions[0]?.timeLimit || 20);
  };
  if (!question) return <p>Ajoutez des questions avant de tester.</p>;
  return <section className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-[var(--quizo-border)] p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--quizo-muted)]">Essai local · aucune statistique enregistrée</p><Button variant="outline" onClick={onClose}>Quitter le test</Button></div>
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-orange-500/10 p-3"><p className="text-xs text-[var(--quizo-muted)]">Points de jeu</p><p className="text-xl font-black">{points}</p></div><div className="rounded-xl bg-emerald-500/10 p-3"><p className="text-xs text-[var(--quizo-muted)]">Maîtrise</p><p className="text-xl font-black">{calculatePedagogicalScore(earnedWeight, possibleWeight).toFixed(1)} %</p></div><div className="rounded-xl bg-violet-500/10 p-3"><p className="text-xs text-[var(--quizo-muted)]">Série actuelle</p><p className="flex items-center gap-2 text-xl font-black"><Flame className="h-5 w-5" />{streak}</p></div></div>
    {finished ? <div className="space-y-5 text-center"><Gauge className="mx-auto h-12 w-12 text-orange-300" /><h2 className="text-3xl font-bold">Test terminé</h2><p>{correctCount} bonne{correctCount > 1 ? 's' : ''} réponse{correctCount > 1 ? 's' : ''} sur {questions.length}. Ces résultats restent uniquement dans cet écran.</p><Button onClick={restart}><RotateCcw className="mr-2 h-4 w-4" />Recommencer</Button></div> : <>
      <QuestionStage question={question} index={index} total={questions.length} remaining={remaining} timerTotal={question.timeLimit || 20} selected={selected} correctOptionId={revealed ? question.options.find(o => o.isCorrect)?.id : undefined} disabled={revealed} onAnswer={answer} compact />
      {revealed && <div role="status" className={`space-y-3 rounded-2xl border p-4 ${lastCorrect ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-red-400/30 bg-red-500/10'}`}><p className="flex items-center gap-2 text-xl font-bold">{lastCorrect ? <CheckCircle2 className="h-6 w-6 text-emerald-300" /> : <XCircle className="h-6 w-6 text-red-300" />}{lastCorrect ? 'Bonne réponse' : selected ? 'Réponse incorrecte' : 'Temps écoulé'} · +{lastPoints} points</p><p>{question.explanation || 'Comparez votre réponse avec la correction.'}</p>
        <Button onClick={() => {
          if (index === questions.length - 1) { setFinished(true); return; }
          openedAt.current = Date.now(); answered.current = false; setIndex(index + 1); setSelected(undefined); setRevealed(false); setRemaining(questions[index + 1].timeLimit || 20);
        }}>{index === questions.length - 1 ? 'Voir le résultat' : 'Question suivante'}</Button>
      </div>}
    </>}
  </section>;
}
