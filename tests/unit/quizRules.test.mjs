import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Compile the dependency-free domain module in memory; no Firebase or production writes.
const source = await readFile(new URL('../../src/domain/quizRules.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } });
const { calculateQuestionScore, calculatePedagogicalScore, validateQuizQuestions, remainingSeconds } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const input = { weight: 2, correct: true, responseTimeMs: 4000, timeLimitMs: 20000, previousStreak: 2 };
const question = { id: 'q1', text: 'Question', points: 2, options: [{ id: 'a', text: 'A', isCorrect: true }, { id: 'b', text: 'B', isCorrect: false }] };

test('reference score is exactly 320, pedagogical score is separate', () => {
  const score = calculateQuestionScore(input);
  assert.equal(score.awardedGamePoints, 320);
  assert.equal(score.speedBonus, 80);
  assert.equal(score.streakBonus, 40);
  assert.equal(calculatePedagogicalScore(2, 2), 100);
});
test('wrong answer gives zero and resets the streak', () => {
  const score = calculateQuestionScore({ ...input, correct: false });
  assert.equal(score.awardedGamePoints, 0);
  assert.equal(score.resultingStreak, 0);
});
test('streak bonus is capped and speed becomes zero after original duration', () => {
  const score = calculateQuestionScore({ ...input, previousStreak: 100, responseTimeMs: 25000 });
  assert.equal(score.streakBonus, 60);
  assert.equal(score.speedBonus, 0);
  assert.equal(score.awardedGamePoints, 260);
});
test('round only the final game points', () => {
  assert.equal(calculateQuestionScore({ ...input, weight: 1, responseTimeMs: 1234, previousStreak: 0 }).awardedGamePoints, 147);
});
test('reject invalid score inputs', () => {
  for (const invalid of [{ weight: 0 }, { weight: NaN }, { responseTimeMs: -1 }, { timeLimitMs: 0 }, { previousStreak: 0.5 }]) {
    assert.throws(() => calculateQuestionScore({ ...input, ...invalid }));
  }
  assert.throws(() => calculatePedagogicalScore(3, 2));
});
test('reload computes remaining time from the same deadline', () => {
  assert.equal(remainingSeconds(20000, 4000), 16);
  assert.equal(remainingSeconds(20000, 15000), 5);
  assert.equal(remainingSeconds(20000, 20000), 0);
  assert.equal(remainingSeconds(20000, 25000), 0);
});
test('validate empty quiz and valid question', () => {
  assert.ok(validateQuizQuestions([]).length);
  assert.deepEqual(validateQuizQuestions([question]), []);
});
test('live rejects fifth option while async accepts it', () => {
  const q = { ...question, options: [...question.options, ...['c', 'd', 'e'].map(id => ({ id, text: id, isCorrect: false }))] };
  assert.ok(validateQuizQuestions([q], 'teacher_led').length);
  assert.deepEqual(validateQuizQuestions([q], 'async'), []);
});
test('reject duplicate options, missing correct answer, duplicate question IDs', () => {
  assert.ok(validateQuizQuestions([{ ...question, options: [question.options[0], { id: 'b', text: ' a ', isCorrect: false }] }]).length);
  assert.ok(validateQuizQuestions([{ ...question, options: question.options.map(o => ({ ...o, isCorrect: false })) }]).length);
  assert.ok(validateQuizQuestions([question, question]).length);
});
