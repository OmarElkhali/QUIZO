import { createHash, randomBytes } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { calculateQuestionScore, calculatePedagogicalScore, validateQuizQuestions, type QuizQuestionInput } from '../src/domain/quizRules.js';
import { parseLiveCompetitionConfig, type LiveCompetitionConfig, type LiveEventType, type LivePower } from '../src/domain/liveCompetition.js';

export class LiveError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
function requireValue(condition: unknown, status: number, code: string, message: string): asserts condition {
  if (!condition) throw new LiveError(status, code, message);
}
function id(value: unknown): string {
  requireValue(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value), 400, 'INVALID_ID', 'Identifiant invalide.');
  return value;
}
function text(value: unknown, max: number): string {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= max, 400, 'INVALID_TEXT', 'Texte absent ou trop long.');
  return value.trim();
}
export interface LivePlayer {
  uid: string; name: string; gamePoints: number; earnedWeight: number; correctCount: number;
  responseTimeMs: number; streak: number; longestStreak: number; lastAnsweredIndex: number; joinedAt: number;
  powerInventory: LivePower[]; activePower?: 'double' | 'shield'; frozenUntil?: number; bestRankGain?: number;
}
export function rankPlayers(players: LivePlayer[], possibleWeight: number) {
  return [...players].sort((a, b) => b.gamePoints - a.gamePoints || b.correctCount - a.correctCount ||
    b.earnedWeight - a.earnedWeight || a.responseTimeMs - b.responseTimeMs ||
    (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0))
    .map((p, index) => {
      const academicAccuracy = calculatePedagogicalScore(p.earnedWeight, possibleWeight);
      return { uid: p.uid, name: p.name, rank: index + 1, gameScore: p.gamePoints, gamePoints: p.gamePoints,
        academicAccuracy, pedagogicalScore: academicAccuracy, correctCount: p.correctCount, streak: p.streak,
        longestStreak: p.longestStreak, biggestClimb: p.bestRankGain || 0, averageResponseTimeMs: p.correctCount ? Math.round(p.responseTimeMs / Math.max(1, p.correctCount)) : 0 };
    });
}

interface LiveEvent { type: LiveEventType; at: number; message: string; uid?: string; targetUid?: string; meta?: Record<string, unknown> }
function event(type: LiveEventType, at: number, message: string, uid?: string, targetUid?: string, meta?: Record<string, unknown>): LiveEvent {
  return { type, at, message, ...(uid ? { uid } : {}), ...(targetUid ? { targetUid } : {}), ...(meta ? { meta } : {}) };
}
function publicEvents(previous: unknown, additions: LiveEvent[]) {
  const existing = Array.isArray(previous) ? previous : [];
  return [...existing, ...additions].slice(-12);
}
function buildAwards(board: Array<{ uid: string; name: string; gameScore: number; academicAccuracy: number; longestStreak: number; biggestClimb: number; averageResponseTimeMs: number; rank: number }>) {
  if (!board.length) return [];
  const first = <T,>(items: T[], score: (item: T) => number, lowest = false) => items.reduce((best, item) => (lowest ? score(item) < score(best) : score(item) > score(best)) ? item : best, items[0]);
  const champion = board[0];
  const accurate = first(board, item => item.academicAccuracy);
  const timedPlayers = board.filter(item => item.averageResponseTimeMs > 0);
  const fastest = first(timedPlayers.length ? timedPlayers : board, item => item.averageResponseTimeMs || Number.MAX_SAFE_INTEGER, true);
  const streak = first(board, item => item.longestStreak || 0);
  const comeback = first(board, item => item.biggestClimb || 0);
  return [
    { key: 'champion', label: 'Champion', uid: champion.uid, name: champion.name, value: `#1 · ${champion.gameScore ?? ''} pts` },
    { key: 'accurate', label: 'Most Accurate', uid: accurate.uid, name: accurate.name, value: `${accurate.academicAccuracy.toFixed(1)} %` },
    { key: 'fastest', label: 'Fastest', uid: fastest.uid, name: fastest.name, value: `${(fastest.averageResponseTimeMs / 1000).toFixed(1)} s` },
    { key: 'streak', label: 'Longest Streak', uid: streak.uid, name: streak.name, value: `${streak.longestStreak} réponses` },
    { key: 'comeback', label: 'Biggest Comeback', uid: comeback.uid, name: comeback.name, value: `+${comeback.biggestClimb} places` },
  ];
}

/** All authoritative records remain private. Only phase-safe projections are readable by clients. */
export class LiveEngine {
  constructor(private db: Firestore, private clock: () => number = Date.now) {}

  async create(uid: string, input: Record<string, unknown>) {
    const quizId = id(input.quizId);
    const commandId = id(input.commandId);
    let config: LiveCompetitionConfig;
    try { config = parseLiveCompetitionConfig(input.config); }
    catch (error) { throw new LiveError(400, 'INVALID_CONFIG', error instanceof Error ? error.message : 'Configuration invalide.'); }
    const sessionId = createHash('sha256').update(`${uid}:${commandId}`).digest('hex').slice(0, 32);
    const sessionRef = this.db.doc(`liveSessionsV2/${sessionId}`);
    const code = 'L' + randomBytes(4).toString('hex').slice(0, 7).toUpperCase();
    const now = this.clock();
    return this.db.runTransaction(async tx => {
      const old = await tx.get(sessionRef);
      if (old.exists) {
        requireValue(old.data()!.quizId === quizId, 409, 'IDEMPOTENCY_CONFLICT', 'Commande déjà utilisée pour un autre quiz.');
        return { sessionId, code: old.data()!.code };
      }
      const quizSnap = await tx.get(this.db.doc(`quizzes/${quizId}`));
      requireValue(quizSnap.exists, 404, 'QUIZ_NOT_FOUND', 'Quiz introuvable.');
      const quiz = quizSnap.data()!;
      requireValue(quiz.creatorId === uid || quiz.ownerId === uid, 403, 'OWNER_REQUIRED', 'Seul le créateur peut lancer ce quiz.');
      requireValue(Array.isArray(quiz.questions), 400, 'INVALID_QUIZ', 'Questions invalides.');
      const questions: QuizQuestionInput[] = quiz.questions.map((q: QuizQuestionInput) => ({
        id: id(q.id), text: text(q.text, 3000), points: q.points, timeLimit: config.timePerQuestion ?? q.timeLimit ?? 20,
        explanation: typeof q.explanation === 'string' ? q.explanation.slice(0, 5000) : '',
        options: Array.isArray(q.options) ? q.options.map(o => ({ id: id(o.id), text: text(o.text, 1000), isCorrect: o.isCorrect === true })) : [],
      }));
      const errors = validateQuizQuestions(questions, 'teacher_led');
      requireValue(!errors.length, 400, 'INVALID_QUIZ', errors.join(' '));
      requireValue(Buffer.byteLength(JSON.stringify(questions)) < 700_000, 400, 'QUIZ_TOO_LARGE', 'Ce quiz dépasse la taille maximale de publication.');
      const codeRef = this.db.doc(`liveCodesV2/${code}`);
      requireValue(!(await tx.get(codeRef)).exists, 409, 'CODE_COLLISION', 'Réessayez de créer la session.');
      const session = { ownerId: uid, quizId, code, title: text(quiz.title, 200), phase: 'waiting', index: -1,
        revision: 0, versionId: sessionId, createdAt: now, expiresAt: now + 24 * 3600_000,
        participantCount: 0, maxParticipants: 100, deadlineAt: null, openedAt: null,
        possibleWeight: questions.reduce((sum, q) => sum + q.points, 0), scoringVersion: 'weighted-speed-streak-v1',
        config, ceremonyStep: null, eventSequence: 0 };
      tx.create(this.db.doc(`quizVersionsV2/${sessionId}`), { ownerId: uid, quizId, questions, createdAt: now, schemaVersion: 1 });
      tx.create(sessionRef, session);
      tx.create(codeRef, { sessionId, expiresAt: session.expiresAt, active: true });
      tx.create(this.db.doc(`liveSessionViews/${sessionId}`), { ...session, totalQuestions: questions.length, question: null, leaderboard: [], participants: [], events: [] });
      return { sessionId, code };
    });
  }

  async join(uid: string, input: Record<string, unknown>) {
    const code = text(input.code, 8).toUpperCase();
    requireValue(/^L[A-F0-9]{7}$/.test(code), 404, 'CODE_NOT_FOUND', 'Code live introuvable.');
    const name = text(input.name, 40);
    const now = this.clock();
    return this.db.runTransaction(async tx => {
      const codeDoc = await tx.get(this.db.doc(`liveCodesV2/${code}`));
      requireValue(codeDoc.exists, 404, 'CODE_NOT_FOUND', 'Code live introuvable.');
      const registry = codeDoc.data()!;
      requireValue(registry.active && registry.expiresAt > now, 410, 'CODE_EXPIRED', 'Ce code est fermé ou expiré.');
      const sessionId = registry.sessionId as string;
      const ref = this.db.doc(`liveSessionsV2/${sessionId}`);
      const session = (await tx.get(ref)).data()!;
      const playerRef = ref.collection('participants').doc(uid);
      const existing = await tx.get(playerRef);
      if (existing.exists) return { sessionId };
      requireValue(session.phase === 'waiting', 409, 'JOIN_CLOSED', 'La partie a commencé. Les arrivées tardives sont fermées.');
      requireValue(session.participantCount < session.maxParticipants, 409, 'SESSION_FULL', 'La session est complète.');
      const nicknameRef = ref.collection('nicknames').doc(createHash('sha256').update(name.normalize('NFKC').toLowerCase()).digest('hex'));
      requireValue(!(await tx.get(nicknameRef)).exists, 409, 'NAME_TAKEN', 'Ce pseudonyme est déjà utilisé.');
      const viewRef = this.db.doc(`liveSessionViews/${sessionId}`);
      const view = (await tx.get(viewRef)).data()!;
      const config = session.config as LiveCompetitionConfig;
      const player: LivePlayer = { uid, name, gamePoints: 0, earnedWeight: 0, correctCount: 0, responseTimeMs: 0, streak: 0, longestStreak: 0, bestRankGain: 0, lastAnsweredIndex: -1, joinedAt: now,
        powerInventory: config.mode === 'battle' ? config.powers : [] };
      tx.create(playerRef, player);
      tx.create(nicknameRef, { uid });
      tx.update(ref, { participantCount: session.participantCount + 1 });
      tx.update(viewRef, { participantCount: session.participantCount + 1, participants: [...view.participants, { uid, name }] });
      tx.create(this.db.doc(`livePlayerViews/${sessionId}/players/${uid}`), { uid, name, gameScore: 0, gamePoints: 0, academicAccuracy: 0, pedagogicalScore: 0,
        streak: 0, rank: null, powerInventory: player.powerInventory, activePower: null, frozenUntil: null, lastResponse: null });
      return { sessionId };
    });
  }

  async answer(uid: string, input: Record<string, unknown>) {
    const sessionId = id(input.sessionId), questionId = id(input.questionId), optionId = id(input.selectedOptionId), submissionId = id(input.submissionId);
    const receivedAt = this.clock();
    const sessionRef = this.db.doc(`liveSessionsV2/${sessionId}`);
    return this.db.runTransaction(async tx => {
      const sessionSnap = await tx.get(sessionRef);
      requireValue(sessionSnap.exists, 404, 'SESSION_NOT_FOUND', 'Session introuvable.');
      const session = sessionSnap.data()!;
      const playerRef = sessionRef.collection('participants').doc(uid);
      const playerSnap = await tx.get(playerRef);
      requireValue(playerSnap.exists, 403, 'JOIN_REQUIRED', 'Rejoignez d’abord cette session.');
      const responseRef = playerRef.collection('responses').doc(questionId);
      const previous = await tx.get(responseRef);
      if (previous.exists) {
        const answer = previous.data()!;
        requireValue(answer.submissionId === submissionId && answer.selectedOptionId === optionId, 409, 'ANSWER_LOCKED', 'Une réponse est déjà verrouillée pour cette question.');
        return { accepted: true, submissionId, questionId, answeredAt: answer.answeredAt };
      }
      const keyRef = playerRef.collection('submissions').doc(submissionId);
      requireValue(!(await tx.get(keyRef)).exists, 409, 'IDEMPOTENCY_CONFLICT', 'Identifiant de soumission déjà utilisé.');
      requireValue(session.phase === 'question' && receivedAt >= session.openedAt && receivedAt < session.deadlineAt, 409, 'QUESTION_CLOSED', 'Les réponses sont fermées pour cette question.');
      const version = (await tx.get(this.db.doc(`quizVersionsV2/${session.versionId}`))).data()!;
      const question = (version.questions as QuizQuestionInput[])[session.index];
      const viewRef = this.db.doc(`liveSessionViews/${sessionId}`);
      const view = (await tx.get(viewRef)).data()!;
      requireValue(question.id === questionId, 409, 'WRONG_QUESTION', 'Cette question n’est pas active.');
      const option = question.options.find(o => o.id === optionId);
      requireValue(option, 400, 'INVALID_OPTION', 'Option inconnue.');
      const player = playerSnap.data() as LivePlayer;
      requireValue(!player.frozenUntil || player.frozenUntil <= receivedAt, 409, 'PLAYER_FROZEN', 'Un duel vous immobilise encore un instant.');
      const responseTimeMs = receivedAt - session.openedAt;
      const previousStreak = player.lastAnsweredIndex === session.index - 1 ? player.streak : 0;
      const rawScore = calculateQuestionScore({ weight: question.points, correct: option.isCorrect, responseTimeMs, timeLimitMs: question.timeLimit! * 1000, previousStreak });
      const config = session.config as LiveCompetitionConfig;
      const speedBonus = config.speedBonus ? rawScore.speedBonus : 0;
      const streakBonus = config.streakBonus ? rawScore.streakBonus : 0;
      const multiplier = player.activePower === 'double' && option.isCorrect ? 2 : 1;
      const shielded = player.activePower === 'shield' && !option.isCorrect && previousStreak > 0;
      const score = { ...rawScore, speedBonus, streakBonus,
        awardedGamePoints: Math.round((rawScore.basePoints + speedBonus + streakBonus) * multiplier),
        resultingStreak: shielded ? previousStreak : rawScore.resultingStreak, multiplier, shielded };
      const record = { sessionId, questionId, participantId: uid, selectedOptionId: optionId, submissionId,
        status: 'answered', correct: option.isCorrect, baseWeight: question.points, ...score,
        previousStreak, questionOpenedAt: session.openedAt, answeredAt: receivedAt, responseTimeMs, createdAt: receivedAt };
      tx.create(responseRef, record);
      tx.create(keyRef, { questionId });
      tx.update(playerRef, { gamePoints: player.gamePoints + score.awardedGamePoints,
        earnedWeight: player.earnedWeight + score.earnedWeight, correctCount: player.correctCount + (option.isCorrect ? 1 : 0),
        responseTimeMs: player.responseTimeMs + responseTimeMs, streak: score.resultingStreak, longestStreak: Math.max(player.longestStreak || 0, score.resultingStreak),
        activePower: null, lastAnsweredIndex: session.index });
      // No correctness or score is published before reveal.
      tx.update(this.db.doc(`livePlayerViews/${sessionId}/players/${uid}`), { receipt: { questionId, submissionId, selectedOptionId: optionId, answeredAt: receivedAt }, activePower: null });
      tx.update(viewRef, { responseCount: (typeof view.responseCount === 'number' ? view.responseCount : 0) + 1 });
      return { accepted: true, submissionId, questionId, answeredAt: receivedAt };
    });
  }

  async power(uid: string, input: Record<string, unknown>) {
    const sessionId = id(input.sessionId), power = text(input.power, 12) as LivePower;
    const targetUid = input.targetUid === undefined ? undefined : id(input.targetUid);
    requireValue(['double', 'shield', 'freeze'].includes(power), 400, 'INVALID_POWER', 'Pouvoir inconnu.');
    const now = this.clock();
    const ref = this.db.doc(`liveSessionsV2/${sessionId}`);
    return this.db.runTransaction(async tx => {
      const sessionSnap = await tx.get(ref);
      requireValue(sessionSnap.exists, 404, 'SESSION_NOT_FOUND', 'Session introuvable.');
      const session = sessionSnap.data()!;
      const config = session.config as LiveCompetitionConfig;
      requireValue(config.mode === 'battle' && config.powers.includes(power), 403, 'POWER_DISABLED', 'Ce pouvoir n’est pas disponible dans ce mode.');
      requireValue(session.phase === 'question' && now >= session.openedAt && now < session.deadlineAt, 409, 'QUESTION_CLOSED', 'Les pouvoirs sont fermés pour cette manche.');
      const playerRef = ref.collection('participants').doc(uid);
      const playerSnap = await tx.get(playerRef);
      requireValue(playerSnap.exists, 403, 'JOIN_REQUIRED', 'Rejoignez d’abord cette session.');
      const player = playerSnap.data() as LivePlayer;
      const inventory = player.powerInventory || [];
      requireValue(inventory.includes(power), 409, 'POWER_SPENT', 'Ce pouvoir a déjà été utilisé.');
      const viewRef = this.db.doc(`liveSessionViews/${sessionId}`);
      const view = (await tx.get(viewRef)).data()!;
      if (power === 'freeze') {
        requireValue(config.duels && targetUid && targetUid !== uid, 400, 'TARGET_REQUIRED', 'Choisissez un adversaire pour ce duel.');
        const targetRef = ref.collection('participants').doc(targetUid!);
        const targetSnap = await tx.get(targetRef);
        requireValue(targetSnap.exists, 404, 'TARGET_NOT_FOUND', 'Adversaire introuvable.');
        tx.update(targetRef, { frozenUntil: now + 2500 });
        tx.update(this.db.doc(`livePlayerViews/${sessionId}/players/${targetUid}`), { frozenUntil: now + 2500 });
      }
      tx.update(playerRef, { powerInventory: inventory.filter(item => item !== power), activePower: power === 'freeze' ? null : power });
      tx.update(this.db.doc(`livePlayerViews/${sessionId}/players/${uid}`), { powerInventory: inventory.filter(item => item !== power), activePower: power === 'freeze' ? null : power });
      const item = event('POWER_USED', now, `${player.name} active ${power === 'double' ? 'Double score' : power === 'shield' ? 'Bouclier de série' : 'Gel express'}.`, uid, targetUid, { power });
      tx.create(ref.collection('events').doc(`${session.eventSequence + 1}`), item);
      tx.update(ref, { eventSequence: session.eventSequence + 1 });
      tx.update(viewRef, { events: publicEvents(view.events, [item]) });
      return { accepted: true, power, targetUid };
    });
  }

  async command(uid: string, input: Record<string, unknown>) {
    const sessionId = id(input.sessionId), commandId = id(input.commandId);
    const action = text(input.action, 20);
    requireValue(['start', 'reveal', 'leaderboard', 'advance', 'finish', 'ceremony', 'cancel'].includes(action), 400, 'INVALID_ACTION', 'Commande inconnue.');
    requireValue(Number.isInteger(input.revision), 400, 'INVALID_REVISION', 'Révision requise.');
    const now = this.clock();
    const ref = this.db.doc(`liveSessionsV2/${sessionId}`);
    return this.db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      requireValue(snap.exists, 404, 'SESSION_NOT_FOUND', 'Session introuvable.');
      const session = snap.data()!;
      requireValue(session.ownerId === uid, 403, 'OWNER_REQUIRED', 'Commande réservée à l’animateur.');
      const commandRef = ref.collection('commands').doc(commandId);
      const previous = await tx.get(commandRef);
      if (previous.exists) {
        requireValue(previous.data()!.action === action && previous.data()!.requestedRevision === input.revision, 409, 'IDEMPOTENCY_CONFLICT', 'Identifiant de commande déjà utilisé.');
        return previous.data()!.result;
      }
      requireValue(session.revision === input.revision, 409, 'STALE_REVISION', 'La session a changé. Rechargez son état.');
      requireValue(action === 'ceremony' ? session.phase === 'completed' : !['completed', 'cancelled'].includes(session.phase), 409, 'SESSION_CLOSED', 'Session terminée.');
      const version = (await tx.get(this.db.doc(`quizVersionsV2/${session.versionId}`))).data()!;
      const questions = version.questions as QuizQuestionInput[];
      const update: Record<string, unknown> = { revision: session.revision + 1 };
      const viewUpdate: Record<string, unknown> = { ...update };
      if (action === 'start' || action === 'advance') {
        requireValue(action === 'start' ? session.phase === 'waiting' && session.participantCount > 0 : ['reveal', 'leaderboard'].includes(session.phase), 409, 'INVALID_PHASE', 'Impossible de démarrer cette question maintenant.');
        const index = session.index + 1;
        requireValue(index < questions.length, 409, 'NO_MORE_QUESTIONS', 'Toutes les questions ont été jouées. Terminez la session.');
        const question = questions[index];
        const openedAt = now + 3000;
        Object.assign(update, { phase: 'question', index, openedAt, deadlineAt: openedAt + question.timeLimit! * 1000, ceremonyStep: null });
        Object.assign(viewUpdate, update, { question: { id: question.id, text: question.text, points: question.points, timeLimit: question.timeLimit,
          options: question.options.map(({ id, text }) => ({ id, text })) }, correction: null, distribution: null, responseCount: 0 });
      } else if (action === 'reveal') {
        requireValue(session.phase === 'question', 409, 'INVALID_PHASE', 'Aucune question à révéler.');
        const question = questions[session.index];
        const players = await tx.get(ref.collection('participants'));
        const responseSnaps = await tx.getAll(...players.docs.map(p => p.ref.collection('responses').doc(question.id)));
        const distribution = Object.fromEntries(question.options.map(o => [o.id, 0]));
        let omissions = 0;
        const finalPlayers: LivePlayer[] = [];
        const currentView = (await tx.get(this.db.doc(`liveSessionViews/${sessionId}`))).data()!;
        const previousBoard = Array.isArray(currentView.leaderboard) ? currentView.leaderboard : [];
        players.docs.forEach((p, i) => {
          const player = p.data() as LivePlayer;
          const response = responseSnaps[i].data();
          const finalPlayer = { ...player };
          if (response) distribution[response.selectedOptionId] += 1;
          else {
            omissions++;
            finalPlayer.streak = 0;
            finalPlayer.responseTimeMs += question.timeLimit! * 1000;
            tx.create(responseSnaps[i].ref, { questionId: question.id, sessionId, participantId: p.id, status: 'timeout', correct: false,
              awardedGamePoints: 0, baseWeight: question.points, questionOpenedAt: session.openedAt, answeredAt: null,
              responseTimeMs: question.timeLimit! * 1000, createdAt: now });
            tx.update(p.ref, { streak: 0, responseTimeMs: finalPlayer.responseTimeMs });
          }
          finalPlayers.push(finalPlayer);
          const academicAccuracy = calculatePedagogicalScore(finalPlayer.earnedWeight, session.possibleWeight);
          tx.update(this.db.doc(`livePlayerViews/${sessionId}/players/${p.id}`), { gameScore: finalPlayer.gamePoints, gamePoints: finalPlayer.gamePoints,
            academicAccuracy, pedagogicalScore: academicAccuracy, streak: finalPlayer.streak,
            lastResponse: response || { questionId: question.id, status: 'timeout', correct: false, awardedGamePoints: 0 } });
        });
        const leaderboard = rankPlayers(finalPlayers, session.possibleWeight);
        leaderboard.forEach(entry => {
          const before = previousBoard.find((item: { uid?: string }) => item.uid === entry.uid) as { rank?: number } | undefined;
          const gain = before?.rank ? Math.max(0, before.rank - entry.rank) : 0;
          const player = finalPlayers.find(item => item.uid === entry.uid)!;
          player.bestRankGain = Math.max(player.bestRankGain || 0, gain);
          entry.biggestClimb = player.bestRankGain;
          if (gain || entry.rank !== before?.rank) tx.update(ref.collection('participants').doc(entry.uid), { bestRankGain: player.bestRankGain, rank: entry.rank });
        });
        const events: LiveEvent[] = [event('ROUND_END', now, `Manche ${session.index + 1} terminée.`)];
        const leader = leaderboard[0];
        const oldLeader = previousBoard[0] as { uid?: string } | undefined;
        if (leader && leader.uid !== oldLeader?.uid) events.push(event('NEW_LEADER', now, `${leader.name} prend la tête !`, leader.uid));
        leaderboard.forEach(entry => {
          const old = previousBoard.find((item: { uid?: string }) => item.uid === entry.uid) as { rank?: number; name?: string } | undefined;
          if (old && typeof old.rank === 'number' && entry.rank < old.rank) events.push(event('OVERTAKE', now, `${entry.name} gagne ${old.rank - entry.rank} place${old.rank - entry.rank > 1 ? 's' : ''}.`, entry.uid, undefined, { from: old.rank, to: entry.rank }));
          if (entry.streak >= 3) events.push(event('HOT_STREAK', now, `${entry.name} est en série de ${entry.streak} !`, entry.uid, undefined, { streak: entry.streak }));
        });
        const answered = responseSnaps.map((snap, i) => ({ player: players.docs[i].data() as LivePlayer, response: snap.data() as { answeredAt?: number; responseTimeMs?: number } | undefined }))
          .filter((item): item is { player: LivePlayer; response: { answeredAt: number; responseTimeMs: number } } => typeof item.response?.answeredAt === 'number' && typeof item.response.responseTimeMs === 'number');
        answered.sort((a, b) => a.response.answeredAt - b.response.answeredAt);
        if (answered[0] && answered[0].response.responseTimeMs <= Math.max(1500, question.timeLimit! * 100)) events.push(event('LIGHTNING_ANSWER', now, `${answered[0].player.name} répond en éclair !`, answered[0].player.uid, undefined, { responseTimeMs: answered[0].response.responseTimeMs }));
        Object.assign(update, { phase: 'reveal' });
        const correctCount = responseSnaps.filter(item => item.data()?.correct === true).length;
        const analytics = { index: session.index, questionId: question.id, answered: players.size - omissions, correct: correctCount, incorrect: players.size - omissions - correctCount, omissions,
          accuracy: players.size - omissions ? Math.round(correctCount / (players.size - omissions) * 100) : 0 };
        Object.assign(viewUpdate, update, { correction: { correctOptionId: question.options.find(o => o.isCorrect)!.id, explanation: question.explanation },
          distribution, omissions, leaderboard, events: publicEvents(currentView.events, events),
          roundAnalytics: analytics, questionAnalytics: [...(Array.isArray(currentView.questionAnalytics) ? currentView.questionAnalytics : []), analytics] });
        events.forEach((item, index) => tx.create(ref.collection('events').doc(`${session.eventSequence + index + 1}`), item));
        update.eventSequence = session.eventSequence + events.length;
      } else if (action === 'leaderboard') {
        requireValue(session.phase === 'reveal', 409, 'INVALID_PHASE', 'Le classement est disponible après la correction.');
        Object.assign(update, { phase: 'leaderboard' });
        Object.assign(viewUpdate, update);
      } else {
        if (action === 'ceremony') {
          requireValue(session.phase === 'completed', 409, 'INVALID_PHASE', 'La cérémonie est disponible à la fin de la partie.');
          const next = session.ceremonyStep === 'podium' ? 'awards' : session.ceremonyStep === 'awards' ? 'analytics' : 'podium';
          Object.assign(update, { ceremonyStep: next }); Object.assign(viewUpdate, update);
        } else {
          requireValue(action === 'cancel' || (['reveal', 'leaderboard'].includes(session.phase) && session.index === questions.length - 1), 409, 'INVALID_PHASE', 'Révélez la dernière question avant de terminer.');
          const finished = action !== 'cancel';
          const finalBoard = (await tx.get(this.db.doc(`liveSessionViews/${sessionId}`))).data()!.leaderboard || [];
          const awards = finished ? buildAwards(finalBoard) : [];
          const events = finished ? [event('GAME_END', now, 'La compétition est terminée.')] : [];
          Object.assign(update, { phase: action === 'cancel' ? 'cancelled' : 'completed', completedAt: now, ceremonyStep: finished ? 'podium' : null, awards });
          Object.assign(viewUpdate, update, { events: publicEvents((await tx.get(this.db.doc(`liveSessionViews/${sessionId}`))).data()!.events, events) });
          events.forEach((item, index) => tx.create(ref.collection('events').doc(`${session.eventSequence + index + 1}`), item));
          update.eventSequence = session.eventSequence + events.length;
          tx.update(this.db.doc(`liveCodesV2/${session.code}`), { active: false });
        }
      }
      tx.set(ref, update, { merge: true });
      tx.set(this.db.doc(`liveSessionViews/${sessionId}`), viewUpdate, { merge: true });
      const result = { revision: session.revision + 1, action };
      tx.create(commandRef, { action, requestedRevision: input.revision, issuedAt: now, uid, result });
      return result;
    });
  }
}
