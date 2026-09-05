import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { LiveEngine } from '../../.test-build/server/liveEngine.js';
import { initializeApp as initializeWebApp, deleteApp as deleteWebApp } from 'firebase/app';
import { getFirestore as getWebFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, collection, setDoc, terminate } from 'firebase/firestore';

// This suite refuses to contact a real Firebase project.
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8180') throw new Error('Start the isolated emulator on 127.0.0.1:8180 first.');
const app = initializeApp({ projectId: 'demo-quizo-live-tests' });
const db = getFirestore(app);
const questions = [0, 1].map(i => ({ id: `q${i}`, text: `Question ${i}`, points: 2, timeLimit: 20,
  options: [{ id: 'a', text: 'Correct', isCorrect: true }, { id: 'b', text: 'Wrong', isCorrect: false }] }));
let now = 100000;
const engine = new LiveEngine(db, () => now);
const postCommand = (sessionId, action, revision, commandId) => engine.command('host', { sessionId, action, revision, commandId });

test('multiplayer lifecycle, retries, timeout, privacy, host concurrency, immutable snapshot', async () => {
  await db.doc('quizzes/demo').set({ creatorId: 'host', title: 'Fixture', questions });
  const created = await engine.create('host', { quizId: 'demo', commandId: 'create1' });
  assert.deepEqual(await engine.create('host', { quizId: 'demo', commandId: 'create1' }), created);
  await assert.rejects(engine.create('outsider', { quizId: 'demo', commandId: 'create2' }), /créateur/);
  const { sessionId, code } = created;
  await engine.join('alice', { code, name: 'Alice' });
  await engine.join('bob', { code, name: 'Bob' });
  await engine.join('alice', { code, name: 'Alice' });
  assert.equal((await db.doc(`liveSessionsV2/${sessionId}`).get()).data().participantCount, 2);
  await assert.rejects(engine.join('eve', { code, name: 'alice' }), /pseudonyme/);
  await db.doc('quizzes/demo').update({ questions: [] });
  await postCommand(sessionId, 'start', 0, 'start1');
  await assert.rejects(engine.command('alice', { sessionId, action: 'reveal', revision: 1, commandId: 'hack' }), /animateur/);
  const viewBefore = (await db.doc(`liveSessionViews/${sessionId}`).get()).data();
  assert.equal(JSON.stringify(viewBefore.question).includes('isCorrect'), false);
  assert.equal(viewBefore.question.id, 'q0');
  const answer = { sessionId, questionId: 'q0', selectedOptionId: 'a', submissionId: 'answer1' };
  await assert.rejects(engine.answer('alice', answer), /fermées/); // countdown
  now = 107000; // 4 seconds after openedAt
  const results = await Promise.all(Array.from({ length: 10 }, () => engine.answer('alice', answer)));
  assert.ok(results.every(r => JSON.stringify(r) === JSON.stringify(results[0])));
  assert.equal((await db.doc(`liveSessionsV2/${sessionId}/participants/alice`).get()).data().gamePoints, 280);
  assert.equal((await db.doc(`livePlayerViews/${sessionId}/players/alice`).get()).data().gamePoints, 0);
  await assert.rejects(engine.answer('alice', { ...answer, submissionId: 'second-id' }), /verrouillée/);
  await assert.rejects(engine.answer('alice', { ...answer, selectedOptionId: 'b' }), /verrouillée/);
  const race = await Promise.allSettled([postCommand(sessionId, 'reveal', 1, 'reveal1'), postCommand(sessionId, 'reveal', 1, 'reveal2')]);
  assert.equal(race.filter(r => r.status === 'fulfilled').length, 1);
  let view = (await db.doc(`liveSessionViews/${sessionId}`).get()).data();
  assert.equal(view.omissions, 1);
  assert.equal(view.leaderboard[0].gamePoints, 280);
  assert.equal(view.leaderboard[0].pedagogicalScore, 50);
  assert.equal((await db.doc(`liveSessionsV2/${sessionId}/participants/bob/responses/q0`).get()).data().status, 'timeout');
  await postCommand(sessionId, 'advance', 2, 'advance1');
  now = 114000;
  await engine.answer('alice', { ...answer, questionId: 'q1', submissionId: 'answer2' });
  now = 133000; // after q1 deadline
  await assert.rejects(engine.answer('bob', { ...answer, questionId: 'q1', submissionId: 'bob-late' }), /fermées/);
  await postCommand(sessionId, 'reveal', 3, 'reveal3');
  view = (await db.doc(`liveSessionViews/${sessionId}`).get()).data();
  assert.equal(view.leaderboard[0].gamePoints, 580); // 280 + 300
  await postCommand(sessionId, 'finish', 4, 'finish1');
  const final = (await db.doc(`liveSessionViews/${sessionId}`).get()).data();
  assert.deepEqual(final.leaderboard, view.leaderboard);
  assert.equal(final.phase, 'completed');
  assert.equal(final.leaderboard[0].pedagogicalScore, 100);
  assert.deepEqual(await engine.answer('alice', { ...answer, questionId: 'q1', submissionId: 'answer2' }), { accepted: true, submissionId: 'answer2', questionId: 'q1', answeredAt: 114000 });
});

test('100 simultaneous answers do not share a mutable score document', async () => {
  now = 200000;
  await db.doc('quizzes/load').set({ creatorId: 'host', title: 'Load fixture', questions: questions.slice(0, 1) });
  const { sessionId, code } = await engine.create('host', { quizId: 'load', commandId: 'load-create' });
  // Joining is intentionally serialized: the cap and unique-name reservation are atomic.
  for (let i = 0; i < 100; i++) await engine.join(`p${i}`, { code, name: `Player ${i}` });
  await assert.rejects(engine.join('overflow', { code, name: 'Overflow' }), /complète/);
  await postCommand(sessionId, 'start', 0, 'load-start');
  now = 207000;
  await Promise.all(Array.from({ length: 100 }, (_, i) => engine.answer(`p${i}`, { sessionId, questionId: 'q0', selectedOptionId: 'a', submissionId: `load-${i}` })));
  await postCommand(sessionId, 'reveal', 1, 'load-reveal');
  const view = (await db.doc(`liveSessionViews/${sessionId}`).get()).data();
  assert.equal(view.leaderboard.length, 100);
  assert.ok(view.leaderboard.every(p => p.gamePoints === 280 && p.pedagogicalScore === 100));
  assert.equal(view.distribution.a, 100);
  assert.equal(view.omissions, 0);
});

test.after(async () => { await db.terminate(); });

test('V2 security rules deny private records, foreign views, listing and forged scores', async () => {
  await db.doc('liveSessionsV2/rules/participants/rules-player').set({ uid: 'rules-player' });
  await db.doc('liveSessionViews/rules').set({ ownerId: 'host', phase: 'waiting' });
  await db.doc('livePlayerViews/rules/players/rules-player').set({ uid: 'rules-player', gamePoints: 0 });
  await db.doc('quizVersionsV2/private-version').set({ questions });
  const clientApp = initializeWebApp({ projectId: 'demo-quizo-live-tests', apiKey: 'fake' }, 'rules-player');
  const client = getWebFirestore(clientApp);
  connectFirestoreEmulator(client, '127.0.0.1', 8180, { mockUserToken: { sub: 'rules-player', user_id: 'rules-player' } });
  const denied = async operation => assert.rejects(operation, error => error.code === 'permission-denied');
  try {
    assert.equal((await getDoc(doc(client, 'liveSessionViews/rules'))).exists(), true);
    assert.equal((await getDoc(doc(client, 'livePlayerViews/rules/players/rules-player'))).exists(), true);
    await denied(getDoc(doc(client, 'quizVersionsV2/private-version')));
    await denied(getDocs(collection(client, 'liveSessionViews')));
    await denied(getDocs(collection(client, 'quizVersionsV2')));
    await denied(getDocs(collection(client, 'quizzes')));
    await denied(getDoc(doc(client, 'liveSessionsV2/rules/participants/rules-player')));
    await denied(getDoc(doc(client, 'livePlayerViews/rules/players/another-user')));
    await denied(getDoc(doc(client, 'liveSessionViews/foreign-session')));
    await denied(setDoc(doc(client, 'livePlayerViews/rules/players/rules-player'), { gamePoints: 999999 }));
    await denied(setDoc(doc(client, 'liveSessionsV2/rules/participants/rules-player'), { gamePoints: 999999 }));
    await denied(setDoc(doc(client, 'liveSessionViews/rules'), { phase: 'completed' }));
  } finally {
    await terminate(client);
    await deleteWebApp(clientApp);
  }
});
