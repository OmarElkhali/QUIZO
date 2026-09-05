/** Shared rules for publication, preview and the authoritative live engine. */
export const SCORING_VERSION = 'weighted-speed-streak-v1';

export interface QuizQuestionInput {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  points: number;
  timeLimit?: number;
  explanation?: string;
}

export function validateQuizQuestions(questions: QuizQuestionInput[], mode: 'teacher_led' | 'async' = 'async'): string[] {
  const errors: string[] = [];
  if (!questions.length) errors.push('Ajoutez au moins une question.');
  if (questions.length > 100) errors.push('Un quiz peut contenir au maximum 100 questions.');
  const ids = new Set<string>();
  questions.forEach((q, index) => {
    const label = `Question ${index + 1}`;
    if (!q.id || ids.has(q.id)) errors.push(`${label} : identifiant absent ou dupliqué.`);
    ids.add(q.id);
    if (!q.text.trim() || q.text.length > 3000) errors.push(`${label} : texte requis, 3 000 caractères maximum.`);
    const maximum = mode === 'teacher_led' ? 4 : 6;
    if (q.options.length < 2 || q.options.length > maximum) errors.push(`${label} : entre 2 et ${maximum} options sont requises${mode === 'teacher_led' ? ' en live' : ''}.`);
    const normalized = q.options.map(o => o.text.normalize('NFKC').trim().toLocaleLowerCase('fr'));
    if (normalized.some(t => !t) || q.options.some(o => o.text.length > 1000)) errors.push(`${label} : remplissez les options (1 000 caractères maximum).`);
    if (new Set(normalized).size !== normalized.length) errors.push(`${label} : les options doivent être différentes.`);
    if (new Set(q.options.map(o => o.id)).size !== q.options.length || q.options.some(o => !o.id)) errors.push(`${label} : identifiants des options invalides.`);
    if (q.options.filter(o => o.isCorrect === true).length !== 1) errors.push(`${label} : sélectionnez exactement une bonne réponse.`);
    if (!Number.isInteger(q.points) || q.points < 1 || q.points > 100) errors.push(`${label} : le poids doit être un entier de 1 à 100.`);
    if (q.timeLimit !== undefined && (!Number.isInteger(q.timeLimit) || q.timeLimit < 5 || q.timeLimit > 600)) errors.push(`${label} : la durée doit être comprise entre 5 et 600 secondes.`);
  });
  return errors;
}

export interface QuestionScoreInput {
  weight: number;
  correct: boolean;
  responseTimeMs: number;
  timeLimitMs: number;
  previousStreak: number;
}

export function calculateQuestionScore(input: QuestionScoreInput) {
  const { weight, correct, responseTimeMs, timeLimitMs, previousStreak } = input;
  if (!Number.isInteger(weight) || weight < 1 || weight > 100 ||
      !Number.isFinite(responseTimeMs) || responseTimeMs < 0 ||
      !Number.isFinite(timeLimitMs) || timeLimitMs <= 0 ||
      !Number.isInteger(previousStreak) || previousStreak < 0) {
    throw new Error('Paramètres de score invalides');
  }
  const basePoints = correct ? weight * 100 : 0;
  const speedBonus = basePoints * 0.5 * Math.max(0, Math.min(1, 1 - responseTimeMs / timeLimitMs));
  const streakBonus = basePoints * 0.1 * Math.min(previousStreak, 3);
  return {
    scoringVersion: SCORING_VERSION,
    basePoints,
    speedBonus,
    streakBonus,
    awardedGamePoints: Math.round(basePoints + speedBonus + streakBonus),
    earnedWeight: correct ? weight : 0,
    resultingStreak: correct ? previousStreak + 1 : 0,
  };
}

export function calculatePedagogicalScore(earnedWeight: number, possibleWeight: number): number {
  if (!Number.isFinite(earnedWeight) || !Number.isFinite(possibleWeight) || earnedWeight < 0 || possibleWeight < 0 || earnedWeight > possibleWeight) {
    throw new Error('Poids pédagogiques invalides');
  }
  return possibleWeight === 0 ? 0 : earnedWeight / possibleWeight * 100;
}

export function remainingSeconds(deadlineMs: number, nowMs: number): number {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(nowMs)) throw new Error('Échéance invalide');
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}
