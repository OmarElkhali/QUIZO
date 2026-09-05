import { auth } from '@/lib/firebase';
import { ensureParticipantSession } from './manualQuizCore';

export async function liveRequest<T>(input: Record<string, unknown>): Promise<T> {
  await ensureParticipantSession();
  const token = await auth.currentUser!.getIdToken();
  const response = await fetch('/api/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'Le serveur ne peut pas traiter cette action.'), { code: result.code, status: response.status });
  return result as T;
}

export async function liveCapabilities(): Promise<{ ready: boolean; serverNow: number }> {
  const response = await fetch('/api/session', { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('Impossible de vérifier le moteur live.');
  return response.json();
}
