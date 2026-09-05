import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { liveRequest } from '@/services/liveClient';
import { addParticipantToCompetition, addParticipantToQuiz, createQuizAttempt, ensureParticipantSession, getCompetitionById, getManualQuiz, resolveShareCode } from '@/services/manualQuizService';

export default function JoinByCode() {
  const { shareCode: initialCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState(initialCode || '');
  const [name, setName] = useState(user?.name || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function join(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const normalized = code.replace(/\s/g, '').toUpperCase();
    if (!/^(?:[A-Z0-9]{6}|[A-Z0-9]{8})$/.test(normalized)) {
      setError('Saisissez un code de 6 ou 8 lettres et chiffres.');
      return;
    }
    if (!name.trim() || name.trim().length > 40) {
      setError('Choisissez un pseudonyme de 1 à 40 caractères.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const uid = await ensureParticipantSession();
      if (/^L[A-F0-9]{7}$/.test(normalized)) {
        try {
          const result = await liveRequest<{ sessionId: string }>({ operation: 'join', code: normalized, name: name.trim() });
          navigate('/session/' + result.sessionId);
          return;
        } catch (cause) {
          if ((cause as { code?: string }).code !== 'CODE_NOT_FOUND') throw cause;
        }
      }
      const resolved = await resolveShareCode(normalized);
      if (resolved.type === 'competition') {
        const session = await getCompetitionById(resolved.targetId);
        if (!session || !session.isActive || session.status === 'completed' || session.liveState?.status === 'completed') throw new Error('Cette session est terminée ou fermée.');
        if (Date.now() < new Date(session.startDate).getTime()) throw new Error('Cette session n’est pas encore ouverte.');
        if (Date.now() >= new Date(session.endDate).getTime()) throw new Error('Cette session a expiré.');
        const participantId = await addParticipantToCompetition(session.id, uid, name.trim());
        navigate('/competition/' + session.id + '?participant=' + encodeURIComponent(participantId));
      } else {
        const quiz = await getManualQuiz(resolved.targetId);
        if (!quiz || quiz.status !== 'active') throw new Error('Ce quiz n’est pas ouvert aux participations.');
        if (!quiz.questions.length) throw new Error('Ce quiz ne contient pas encore de questions.');
        const participantId = await addParticipantToQuiz(quiz.id, uid, name.trim());
        const attemptId = await createQuizAttempt(quiz.id, participantId, uid);
        navigate('/quiz-session/' + quiz.id + '/' + attemptId, { state: { participantId, quizMode: quiz.mode } });
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Impossible de rejoindre. Réessayez.';
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return <AppShell><div className="mx-auto flex min-h-[65vh] max-w-lg items-center px-4 py-10">
    <section className="w-full rounded-3xl border border-[var(--quizo-border)] bg-[var(--quizo-surface)] p-6 sm:p-9">
      <Ticket className="mb-5 h-9 w-9 text-orange-400" aria-hidden="true" />
      <h1 className="text-3xl font-bold text-[var(--quizo-heading)]">Rejoindre un quiz</h1>
      <p className="mt-3 text-[var(--quizo-muted)]">Quiz partagé ou partie en direct : utilisez le code de votre animateur.</p>
      <form onSubmit={join} className="mt-8 space-y-5">
        <div className="space-y-2"><Label htmlFor="join-code">Code du quiz</Label>
          <Input id="join-code" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={e => setCode(e.target.value.replace(/\s/g, '').toUpperCase())} maxLength={8} placeholder="ABC123" className="h-14 text-center font-mono text-2xl tracking-widest" disabled={busy} aria-describedby="join-code-help" required />
          <p id="join-code-help" className="text-sm text-[var(--quizo-muted)]">6 ou 8 caractères. Vous pouvez coller le code.</p>
        </div>
        <div className="space-y-2"><Label htmlFor="join-name">Votre pseudonyme</Label><Input id="join-name" value={name} onChange={e => setName(e.target.value)} maxLength={40} disabled={busy} required className="h-12" /></div>
        {error && <p role="alert" className="rounded-xl border border-red-400/30 p-3 text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={busy} className="quizo-copper-button h-12 w-full">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion…</> : <>Rejoindre<ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
      </form>
      <p className="mt-5 text-xs text-[var(--quizo-muted)]">Gardez ce navigateur pour retrouver votre participation.</p>
    </section>
  </div></AppShell>;
}
