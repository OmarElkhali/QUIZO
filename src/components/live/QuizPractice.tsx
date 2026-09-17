import { useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculatePersonalScore, type QuizQuestionInput } from '@/domain/quizRules';
import { QuestionStage } from './QuestionStage';
import { AIAnswerExplanation } from '@/components/quiz/AIAnswerExplanation';

export function QuizPractice({ questions, onClose }: { questions: QuizQuestionInput[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const question = questions[index];
  const personalScore = useMemo(() => calculatePersonalScore(questions, answers), [answers, questions]);
  const points = personalScore.points;
  const selectedIsCorrect = question?.options.some((option) => option.id === selected && option.isCorrect) || false;

  const answer = (optionId: string) => {
    if (revealed || !question) return;
    setSelected(optionId);
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    setRevealed(true);
  };

  const next = () => {
    if (index === questions.length - 1) {
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
  };

  if (!question) return <p>Ajoutez des questions avant de tester.</p>;
  const successRate = Math.round(personalScore.percentage);

  return (
    <section className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-[var(--quizo-border)] p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--quizo-muted)]">Quiz personnel · aucune statistique enregistrée</p>
          <p className="mt-1 text-xs text-[var(--quizo-muted)]">Barème simple : 1 bonne réponse = 1 point. Aucun bonus de vitesse.</p>
        </div>
        <Button variant="outline" onClick={onClose}>Quitter le test</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-orange-500/10 p-3"><p className="text-xs text-[var(--quizo-muted)]">Score personnel</p><p className="text-xl font-black">{points} / {questions.length}</p></div>
        <div className="rounded-xl bg-emerald-500/10 p-3"><p className="text-xs text-[var(--quizo-muted)]">Réussite</p><p className="text-xl font-black">{successRate} %</p></div>
        <div className="rounded-xl bg-violet-500/10 p-3"><p className="text-xs text-[var(--quizo-muted)]">Barème</p><p className="text-xl font-black">1 pt / question</p></div>
      </div>

      {finished ? (
        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <BookOpenCheck className="mx-auto h-12 w-12 text-orange-300" />
            <h2 className="text-3xl font-bold">Correction complète</h2>
            <p>{points} point{points === 1 ? '' : 's'} sur {questions.length} · {successRate} % de réussite.</p>
            <p className="text-sm text-[var(--quizo-muted)]">Retrouvez toutes les réponses ci-dessous. L’explication IA reste optionnelle et se lance question par question.</p>
            <Button onClick={restart}><RotateCcw className="mr-2 h-4 w-4" />Recommencer</Button>
          </div>

          <div className="space-y-5 text-left">
            {questions.map((reviewQuestion, reviewIndex) => {
              const selectedId = answers[reviewQuestion.id];
              const selectedOption = reviewQuestion.options.find((option) => option.id === selectedId);
              const correctOption = reviewQuestion.options.find((option) => option.isCorrect);
              const correct = selectedOption?.isCorrect === true;
              return (
                <article key={reviewQuestion.id} className={`rounded-2xl border p-5 sm:p-6 ${correct ? 'border-emerald-400/25 bg-emerald-500/[0.08]' : 'border-red-400/25 bg-red-500/[0.08]'}`}>
                  <div className="flex items-start gap-3">
                    {correct ? <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-300" /> : <XCircle className="mt-1 h-6 w-6 shrink-0 text-red-300" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-[var(--quizo-heading)]">{reviewIndex + 1}. {reviewQuestion.text}</p>
                      <div className="mt-4 space-y-2 text-sm leading-6">
                        <p><strong>Votre réponse :</strong> {selectedOption?.text || 'Aucune réponse'}</p>
                        {!correct && <p className="text-emerald-200"><strong>Bonne réponse :</strong> {correctOption?.text || 'Correction indisponible'}</p>}
                      </div>
                      {reviewQuestion.explanation && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6"><strong>Explication du quiz :</strong> {reviewQuestion.explanation}</div>}
                      <AIAnswerExplanation question={{ ...reviewQuestion, points: 1 }} selectedOptionId={selectedId} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          <QuestionStage
            question={{ ...question, points: 1 }}
            index={index}
            total={questions.length}
            remaining={null}
            selected={selected}
            correctOptionId={revealed ? question.options.find((option) => option.isCorrect)?.id : undefined}
            disabled={revealed}
            onAnswer={answer}
            compact
          />
          {revealed && (
            <div role="status" className={`space-y-3 rounded-2xl border p-4 ${selectedIsCorrect ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-red-400/30 bg-red-500/10'}`}>
              <p className="flex items-center gap-2 text-xl font-bold">
                {selectedIsCorrect ? <CheckCircle2 className="h-6 w-6 text-emerald-300" /> : <XCircle className="h-6 w-6 text-red-300" />}
                {selectedIsCorrect ? 'Bonne réponse · +1 point' : 'Réponse incorrecte · +0 point'}
              </p>
              <p>{question.explanation || 'La correction complète sera disponible à la fin.'}</p>
              <Button onClick={next}>{index === questions.length - 1 ? 'Voir la correction complète' : 'Question suivante'}</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
