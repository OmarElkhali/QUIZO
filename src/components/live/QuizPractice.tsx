import { useMemo, useState } from 'react';
import { Award, Brain, CheckCircle2, RotateCcw, Sparkles, Target, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculatePersonalScore, randomizeQuestionOptionOrder, type QuizQuestionInput } from '@/domain/quizRules';
import { QuestionStage } from './QuestionStage';
import { AIAnswerExplanation } from '@/components/quiz/AIAnswerExplanation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export function QuizPractice({ questions, onClose }: { questions: QuizQuestionInput[]; onClose: () => void }) {
  const reduced = useReducedMotion();
  const [presentedQuestions, setPresentedQuestions] = useState(() => randomizeQuestionOptionOrder(questions));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [reviewingMistakes, setReviewingMistakes] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const question = presentedQuestions[index];
  const personalScore = useMemo(() => calculatePersonalScore(presentedQuestions, answers), [answers, presentedQuestions]);
  const points = personalScore.points;
  const selectedIsCorrect = question?.options.some((option) => option.id === selected && option.isCorrect) || false;
  const missedQuestions = useMemo(
    () => presentedQuestions.filter((item) => !item.options.some((option) => option.id === answers[item.id] && option.isCorrect)),
    [answers, presentedQuestions],
  );

  const answer = (optionId: string) => {
    if (revealed || !question) return;
    setSelected(optionId);
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    setRevealed(true);
  };

  const next = () => {
    if (index === presentedQuestions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(undefined);
    setRevealed(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(undefined);
    setRevealed(false);
    setAnswers({});
    setFinished(false);
    setReviewingMistakes(false);
    setPresentedQuestions(randomizeQuestionOptionOrder(questions));
  };

  const reviewMistakes = () => {
    if (!missedQuestions.length) return;
    setPresentedQuestions(randomizeQuestionOptionOrder(missedQuestions));
    setIndex(0);
    setSelected(undefined);
    setRevealed(false);
    setAnswers({});
    setFinished(false);
    setReviewingMistakes(true);
  };

  if (!question) return <p>Ajoutez des questions avant de tester.</p>;
  const successRate = Math.round(personalScore.percentage);

  return (
    <section className="quizo-play-surface min-h-[calc(100dvh-7rem)] w-full space-y-7 rounded-[1.25rem] px-4 py-6 sm:space-y-9 sm:px-8 sm:py-9 xl:px-12 xl:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {reviewingMistakes && <p className="mb-1 inline-flex rounded-full border border-sky-300/25 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-200">Révision ciblée</p>}
          <p className="text-sm text-[var(--quizo-muted)]">Quiz personnel · aucune statistique enregistrée</p>
          <p className="mt-1 hidden text-xs text-[var(--quizo-muted)] sm:block">Barème simple : 1 bonne réponse = 1 point. Aucun bonus de vitesse.</p>
        </div>
        <Button variant="outline" className="quizo-outline-button min-h-11" onClick={onClose}>Quitter le test</Button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--quizo-border)] border-y border-[var(--quizo-border)] py-4 sm:py-6">
        <div className="pr-3 sm:pr-8"><p className="text-xs text-[var(--quizo-muted)]">Score</p><p className="quizo-tabular mt-1 text-2xl font-bold text-orange-400 sm:text-4xl">{points}/{presentedQuestions.length}</p></div>
        <div className="px-3 sm:px-8"><p className="text-xs text-[var(--quizo-muted)]">Réussite</p><p className="quizo-tabular mt-1 text-2xl font-bold text-[var(--quizo-heading)] sm:text-4xl">{successRate}%</p></div>
        <div className="pl-3 sm:pl-8"><p className="text-xs text-[var(--quizo-muted)]">À revoir</p><p className="quizo-tabular mt-1 text-2xl font-bold text-[var(--quizo-heading)] sm:text-4xl">{missedQuestions.length}</p></div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
      {finished ? (
        <motion.div key="results" initial={reduced ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 150, damping: 24 }} className="space-y-8">
          <div className="relative overflow-hidden rounded-[1.4rem] border border-orange-300/25 bg-gradient-to-r from-orange-500/20 via-orange-500/5 to-transparent p-6 sm:p-9 xl:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />
            <div className="relative grid items-center gap-7 md:grid-cols-[180px_1fr] 2xl:grid-cols-[220px_1fr]">
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full p-3 shadow-[0_0_48px_rgba(251,146,60,.18)]" style={{ background: `conic-gradient(#fb923c ${successRate}%, rgba(255,255,255,.09) 0)` }}>
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#101010]">
                  <Award className="mb-1 h-7 w-7 text-amber-300" />
                  <span className="text-4xl font-black">{points}/{presentedQuestions.length}</span>
                  <span className="text-xs text-[var(--quizo-muted)]">{successRate} %</span>
                </div>
              </div>
              <div className="space-y-4 text-center sm:text-left">
                <p className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-200"><Sparkles className="h-3.5 w-3.5" />Quiz terminé</p>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Correction complète</h2>
                <p className="max-w-2xl text-sm leading-6 text-[var(--quizo-muted)]">Toutes les questions, vos choix et les bonnes réponses sont réunis ci-dessous. L’explication IA reste optionnelle et se lance uniquement sur la question qui vous intéresse.</p>
                <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                  <Button onClick={restart}><RotateCcw className="mr-2 h-4 w-4" />Tout recommencer</Button>
                  {missedQuestions.length > 0 && <Button variant="outline" onClick={reviewMistakes}><Target className="mr-2 h-4 w-4" />Réviser {missedQuestions.length} erreur{missedQuestions.length > 1 ? 's' : ''}</Button>}
                </div>
              </div>
            </div>
          </div>

          {missedQuestions.length > 0 && (
            <aside className="rounded-2xl border border-sky-300/20 bg-sky-500/[0.07] p-5 sm:p-6" aria-label="Plan de révision">
              <p className="flex items-center gap-2 font-bold text-sky-100"><Brain className="h-5 w-5 text-sky-300" />Plan de révision gratuit</p>
              <p className="mt-2 text-sm leading-6 text-[var(--quizo-muted)]">Refaites uniquement les {missedQuestions.length} notion{missedQuestions.length > 1 ? 's' : ''} non maîtrisée{missedQuestions.length > 1 ? 's' : ''}, puis consultez l’explication du quiz ou l’IA seulement si nécessaire.</p>
            </aside>
          )}

          <div className="space-y-5 text-left">
            {presentedQuestions.map((reviewQuestion, reviewIndex) => {
              const selectedId = answers[reviewQuestion.id];
              const selectedOption = reviewQuestion.options.find((option) => option.id === selectedId);
              const correctOption = reviewQuestion.options.find((option) => option.isCorrect);
              const correct = selectedOption?.isCorrect === true;
              return (
                <article key={reviewQuestion.id} className={`scroll-mt-36 rounded-2xl border p-5 shadow-[0_16px_48px_rgba(0,0,0,.18)] sm:p-6 ${correct ? 'border-emerald-400/25 bg-emerald-500/[0.08]' : 'border-red-400/25 bg-red-500/[0.08]'}`}>
                  <div className="flex items-start gap-3">
                    {correct ? <CheckCircle2 className="mt-1 hidden h-6 w-6 shrink-0 text-emerald-300 sm:block" /> : <XCircle className="mt-1 hidden h-6 w-6 shrink-0 text-red-300 sm:block" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                        <p className="min-w-0 flex-1 break-words text-base font-bold leading-6 text-[var(--quizo-heading)] sm:text-lg sm:leading-7"><span className="mr-2 text-[var(--quizo-muted)]">Q{reviewIndex + 1}</span>{reviewQuestion.text}</p>
                        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${correct ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200' : 'border-red-300/30 bg-red-400/10 text-red-200'}`}>{correct ? '✓ 1 / 1 point' : '✕ 0 / 1 point'}</span>
                      </div>
                      <div className="mt-5 grid gap-3 text-sm leading-6">
                        <div className={`rounded-xl border p-4 ${correct ? 'border-emerald-300/20 bg-emerald-500/10' : 'border-red-300/20 bg-red-500/10'}`}><p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--quizo-muted)]">Votre réponse</p><p>{selectedOption?.text || 'Aucune réponse'}</p></div>
                        {!correct && <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-emerald-100"><p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">Bonne réponse</p><p>{correctOption?.text || 'Correction indisponible'}</p></div>}
                      </div>
                      {reviewQuestion.explanation && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6"><strong>Explication du quiz :</strong> {reviewQuestion.explanation}</div>}
                      <AIAnswerExplanation question={{ ...reviewQuestion, points: 1 }} selectedOptionId={selectedId} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div key={`question-${question.id}`} initial={reduced ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -24 }} transition={{ duration: .24 }} className="space-y-7 pb-20 sm:pb-0">
          <QuestionStage
            question={{ ...question, points: 1 }}
            index={index}
            total={presentedQuestions.length}
            remaining={null}
            selected={selected}
            correctOptionId={revealed ? question.options.find((option) => option.isCorrect)?.id : undefined}
            disabled={revealed}
            onAnswer={answer}
            compact
          />
          {revealed && (
            <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} role="status" className={`space-y-3 rounded-2xl border p-5 ${selectedIsCorrect ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-red-400/30 bg-red-500/10'}`}>
              <p className="flex items-center gap-2 text-xl font-bold">
                {selectedIsCorrect ? <CheckCircle2 className="h-6 w-6 text-emerald-300" /> : <XCircle className="h-6 w-6 text-red-300" />}
                {selectedIsCorrect ? 'Bonne réponse · +1 point' : 'Réponse incorrecte · +0 point'}
              </p>
              <p>{question.explanation || 'La correction complète sera disponible à la fin.'}</p>
            </motion.div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
      {revealed && !finished && <div className="quizo-bottom-dock max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:z-40 max-sm:w-full max-sm:border-t max-sm:border-[var(--quizo-border)] max-sm:bg-[var(--quizo-header)] max-sm:p-4 max-sm:backdrop-blur-xl"><Button onClick={next} className="quizo-copper-button min-h-12 w-full sm:w-auto">{index === presentedQuestions.length - 1 ? 'Voir la correction complète' : 'Question suivante'}</Button></div>}
    </section>
  );
}
