import type { IncomingMessage, ServerResponse } from 'node:http';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { LiveEngine, LiveError } from '../server/liveEngine.js';

interface ApiRequest extends IncomingMessage { body?: unknown }
export default async function handler(req: ApiRequest, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status: number, value: unknown) => { res.statusCode = status; res.end(JSON.stringify(value)); };
  if (req.method === 'GET') return send(200, { ready: process.env.ENABLE_LIVE_V2 === 'true' && !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON, version: 2, serverNow: Date.now() });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(405, { error: 'Méthode non autorisée.' }); }
  if (process.env.ENABLE_LIVE_V2 !== 'true') return send(503, { code: 'LIVE_NOT_READY', error: 'Le nouveau moteur live est en cours de préparation.' });
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return send(401, { code: 'AUTH_REQUIRED', error: 'Authentification requise.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 8192) return send(400, { error: 'Requête invalide.' });
    if (!getApps().length) initializeApp({ credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault() });
    let uid: string;
    try { uid = (await getAuth().verifyIdToken(authorization.slice(7))).uid; }
    catch { return send(401, { code: 'INVALID_TOKEN', error: 'Session expirée. Reconnectez-vous.' }); }
    const input = body as Record<string, unknown>;
    const permitted: Record<string, string[]> = {
      create: ['operation', 'quizId', 'commandId'], join: ['operation', 'code', 'name'],
      answer: ['operation', 'sessionId', 'questionId', 'selectedOptionId', 'submissionId'],
      command: ['operation', 'sessionId', 'action', 'revision', 'commandId'],
    };
    const keys = permitted[String(input.operation)];
    if (!keys || Object.keys(input).some(key => !keys.includes(key))) return send(400, { code: 'INVALID_FIELDS', error: 'Champs non autorisés.' });
    const now = Date.now();
    const bucket = Math.floor(now / 60_000);
    const rateRef = getFirestore().doc(`liveRateLimits/${uid}`);
    const allowed = await getFirestore().runTransaction(async tx => {
      const previous = (await tx.get(rateRef)).data();
      const count = previous?.bucket === bucket ? previous.count : 0;
      if (count >= 90) return false;
      tx.set(rateRef, { bucket, count: count + 1 });
      return true;
    });
    if (!allowed) { res.setHeader('Retry-After', '60'); return send(429, { code: 'RATE_LIMITED', error: 'Trop de requêtes. Patientez une minute.' }); }
    const engine = new LiveEngine(getFirestore());
    switch (input.operation) {
      case 'create': return send(200, await engine.create(uid, input));
      case 'join': return send(200, await engine.join(uid, input));
      case 'answer': return send(200, await engine.answer(uid, input));
      case 'command': return send(200, await engine.command(uid, input));
      default: return send(400, { code: 'INVALID_OPERATION', error: 'Opération inconnue.' });
    }
  } catch (error) {
    if (error instanceof LiveError) return send(error.status, { code: error.code, error: error.message });
    if (error instanceof SyntaxError) return send(400, { error: 'JSON invalide.' });
    console.error('live_request_failed', error instanceof Error ? error.name : 'UnknownError');
    return send(503, { code: 'LIVE_UNAVAILABLE', error: 'Le moteur live est indisponible. Réessayez avec la même requête.' });
  }
}
