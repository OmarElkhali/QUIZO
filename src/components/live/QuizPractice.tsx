import { useEffect, useRef, useState } from 'react';
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
  const possibleWeight = questions.reduce((sum, q) => sum + q.points, 0);
  function answer(optionId?: string) {
    if (answered.current || !question) return;
    answered.current = true;
    const correct = question.options.some(o => o.id === optionId && o.isCorrect);
    const score = calculateQuestionScore({ weight: question.points, correct,
      responseTimeMs: Math.max(0, Date.now() - openedAt.current), timeLimitMs: (question.timeLimit || 20) * 1000, previousStreak: streak });
    setSelected(optionId); setRevealed(true); setLastPoints(score.awardedGamePoints);
    setPoints(total => total + score.awardedGamePoints); setEarnedWeight(total => total + score.earnedWeight); setStreak(score.resultingStreak);
  }
  useEffect(() => {
    if (!question || revealed || finished) return;
    const timer = setInterval(() => {
      const value = remainingSeconds(openedAt.current + (question.timeLimit || 20) * 1000, Date.now());
      setRemaining(value);
      if (value === 0) answer();
    }, 200);
    return () => clearInterval(timer);
  }, [index, revealed, finished]);
  if (!question) return <p>Ajoutez des questions avant de tester.</p>;
  return <section className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-[var(--quizo-border)] p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--quizo-muted)]">Essai local · aucune statistique enregistrée</p><Button variant="outline" onClick={onClose}>Quitter le test</Button></div>
    <p className="text-xl font-bold">{points} points de jeu · {calculatePedagogicalScore(earnedWeight, possibleWeight).toFixed(1)} % pédagogique</p>
    {finished ? <><h2 className="text-3xl font-bold">Test terminé</h2><p>Ces résultats restent uniquement dans cet écran.</p></> : <>
      <QuestionStage question={question} index={index} total={questions.length} remaining={remaining} selected={selected} correctOptionId={revealed ? question.options.find(o => o.isCorrect)?.id : undefined} disabled={revealed} onAnswer={answer} />
      {revealed && <div role="status" className="space-y-3 rounded-2xl bg-orange-500/10 p-4"><p className="text-xl font-bold">+{lastPoints} points</p><p>{question.explanation || 'Comparez votre réponse avec la correction.'}</p>
        <Button onClick={() => {
          if (index === questions.length - 1) { setFinished(true); return; }
          openedAt.current = Date.now(); answered.current = false; setIndex(index + 1); setSelected(undefined); setRevealed(false); setRemaining(questions[index + 1].timeLimit || 20);
        }}>{index === questions.length - 1 ? 'Voir le résultat' : 'Question suivante'}</Button>
      </div>}
    </>}
  </section>;
}
