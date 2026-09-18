import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ensureParticipantSession } from '@/services/manualQuizCore';
import { liveCapabilities, liveRequest } from '@/services/liveClient';
import { QuestionStage, type StageQuestion } from '@/components/live/QuestionStage';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { toast } from 'sonner';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Crown, Flame, Gauge, Medal, Shield, Swords, Trophy, Zap } from 'lucide-react';
import { type LiveCompetitionConfig, type LiveEventType, type LivePower } from '@/domain/liveCompetition';
import { cn } from '@/lib/utils';

interface Ranking { uid: string; name: string; rank: number; gameScore: number; gamePoints?: number; academicAccuracy: number; pedagogicalScore?: number; streak?: number; longestStreak?: number; biggestClimb?: number; averageResponseTimeMs?: number }
interface LiveEvent { type: LiveEventType; at: number; message: string; uid?: string; targetUid?: string; meta?: Record<string, unknown> }
interface Award { key: string; label: string; uid: string; name: string; value: string }
interface LiveView {
  ownerId: string; title: string; code: string; phase: string; revision: number;
  index: number; totalQuestions: number; openedAt: number; deadlineAt: number;
  participantCount: number; participants: { uid: string; name: string }[];
  question: StageQuestion | null; leaderboard: Ranking[];
  correction?: { correctOptionId: string; explanation: string };
  distribution?: Record<string, number>; omissions?: number;
  config: LiveCompetitionConfig; events?: LiveEvent[]; ceremonyStep?: 'podium' | 'awards' | 'analytics' | null; awards?: Award[];
  responseCount?: number; roundAnalytics?: { questionId: string; answered: number; correct: number; omissions: number; accuracy?: number };
  questionAnalytics?: Array<{ index: number; questionId: string; answered: number; correct: number; incorrect: number; omissions: number; accuracy: number }>;
}
interface PlayerView {
  gameScore: number; gamePoints?: number; academicAccuracy: number; pedagogicalScore?: number; streak?: number; rank?: number | null;
  powerInventory?: LivePower[]; activePower?: 'double' | 'shield' | null; frozenUntil?: number | null;
  receipt?: { questionId: string; selectedOptionId: string; submissionId: string };
  lastResponse?: { questionId: string; status: string; correct: boolean; awardedGamePoints: number; basePoints?: number; speedBonus?: number; streakBonus?: number };
}
interface Pending { operation: 'answer'; sessionId: string; questionId: string; selectedOptionId: string; submissionId: string }

export default function LiveSessionV2({ display = false }: { display?: boolean }) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<LiveView | null>(null);
  const [player, setPlayer] = useState<PlayerView | null>(null);
  const [uid, setUid] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [now, setNow] = useState(Date.now());
  const offset = useRef(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [sendingState, setSendingState] = useState('');
  const [powerBusy, setPowerBusy] = useState<LivePower | null>(null);
  const sending = useRef(false);
  const commands = useRef<Record<string, string>>({});
  const pendingKey = uid && sessionId ? `quizo-live-answer:v2:${uid}:${sessionId}` : '';
  const host = !!uid && view?.ownerId === uid;

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const stops: (() => void)[] = [];
    void (async () => {
      try {
        const currentUid = await ensureParticipantSession();
        const start = Date.now();
        const capabilities = await liveCapabilities();
        if (cancelled) return;
        offset.current = capabilities.serverNow - (start + Date.now()) / 2;
        setUid(currentUid);
        stops.push(onSnapshot(doc(db, 'liveSessionViews', sessionId), snapshot => {
          if (!snapshot.exists()) { setError('Session introuvable.'); return; }
          const data = snapshot.data() as LiveView;
          setView(data); setError('');
        }, () => setError('Session inaccessible. Rejoignez avec son code ou connectez-vous au compte animateur.')));
        if (!display) stops.push(onSnapshot(doc(db, 'livePlayerViews', sessionId, 'players', currentUid), snapshot => {
          if (snapshot.exists()) setPlayer(snapshot.data() as PlayerView);
        }, () => { /* The owner need not be a participant. The session listener verifies access. */ }));
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Connexion impossible.'); }
    })();
    return () => { cancelled = true; stops.forEach(stop => stop()); };
  }, [sessionId, display]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now() + offset.current), 200);
    const onOnline = () => setOnline(true), onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline);
    return () => { clearInterval(tick); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  useEffect(() => {
    if (!pendingKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(pendingKey) || 'null');
      if (saved && saved.sessionId === sessionId && typeof saved.submissionId === 'string') setPending(saved);
    } catch { /* A malformed local queue never changes server records. */ }
  }, [pendingKey, sessionId]);
  const sendPending = useCallback(async () => {
    if (!pending || !online || sending.current) return;
    sending.current = true; setSendingState('Envoi…');
    try {
      await liveRequest(pending as unknown as Record<string, unknown>);
      localStorage.removeItem(pendingKey); setPending(null); setSendingState('Réponse enregistrée');
    } catch (cause) {
      const status = (cause as { status?: number })?.status;
      const terminal = status === 400 || status === 403 || status === 404 || status === 409;
      if (terminal) {
        localStorage.removeItem(pendingKey);
        setPending(null);
      }
      setSendingState(cause instanceof Error ? `${cause.message}${terminal ? '' : ' Vous pouvez réessayer.'}` : 'Échec — réessayer');
    } finally { sending.current = false; }
  }, [pending, online, pendingKey]);
  useEffect(() => { if (pending && online) void sendPending(); }, [pending, online, sendPending]);

  async function command(action: string) {
    if (!view || !sessionId || busy) return;
    const key = `${view.revision}:${action}`;
    const commandId = commands.current[key] ||= crypto.randomUUID();
    setBusy(true);
    try { await liveRequest({ operation: 'command', sessionId, action, revision: view.revision, commandId }); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Commande impossible.'); }
    finally { setBusy(false); }
  }
  function answer(optionId: string) {
    if (!view?.question || !sessionId || pending || player?.receipt?.questionId === view.question.id) return;
    const payload: Pending = { operation: 'answer', sessionId, questionId: view.question.id, selectedOptionId: optionId, submissionId: crypto.randomUUID() };
    try { localStorage.setItem(pendingKey, JSON.stringify(payload)); }
    catch { toast.warning('La reprise après fermeture du navigateur n’est pas disponible. Gardez cet écran ouvert.'); }
    setPending(payload);
  }
  async function activatePower(power: LivePower, targetUid?: string) {
    if (!sessionId || powerBusy) return;
    setPowerBusy(power);
    try { await liveRequest({ operation: 'power', sessionId, power, ...(targetUid ? { targetUid } : {}) }); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Pouvoir impossible.'); }
    finally { setPowerBusy(null); }
  }
  const remaining = view ? Math.max(0, Math.ceil((view.deadlineAt - now) / 1000)) : 0;
  const countdown = view?.openedAt ? Math.max(0, Math.ceil((view.openedAt - now) / 1000)) : 0;
  const playerReceipt = player?.receipt;
  const selected = pending && pending.questionId === view?.question?.id
    ? pending.selectedOptionId
    : playerReceipt?.questionId && playerReceipt.questionId === view?.question?.id
      ? playerReceipt.selectedOptionId
      : undefined;
  const reducedMotion = useReducedMotion();
  const playerFrozen = Boolean(player?.frozenUntil && player.frozenUntil > now);
  const gameScore = player?.gameScore ?? player?.gamePoints ?? 0;
  const academicAccuracy = player?.academicAccuracy ?? player?.pedagogicalScore ?? 0;
  const latestEvent = view?.events?.at(-1);
  const content = <section className={`w-full space-y-6 ${display ? 'quizo-page-frame py-6 text-base sm:py-10 sm:text-xl' : ''}`}>
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-[var(--quizo-muted)]">{display ? 'Écran de présentation' : host ? 'Dashboard créateur live' : 'Partie en direct'} · {view?.config?.mode === 'battle' ? 'Battle' : view?.config?.mode === 'battle_pure' ? 'Battle Pure' : 'Classic'}</p><h1 className="text-3xl font-bold text-[var(--quizo-heading)]">{view?.title || 'Connexion à la partie…'}</h1></div><span role="status" className="text-sm">{online ? 'Réseau disponible' : 'Hors ligne — reconnexion nécessaire'}</span></header>
    <AnimatePresence>{latestEvent && <motion.div key={`${latestEvent.at}-${latestEvent.type}`} initial={reducedMotion ? false : { opacity: 0, y: -14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-2xl border border-orange-400/35 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-100"><Zap className="h-5 w-5 text-orange-300" />{latestEvent.message}</motion.div>}</AnimatePresence>
    {host && view && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><div className="rounded-2xl border border-[var(--quizo-border)] p-4"><p className="text-xs uppercase tracking-wide text-[var(--quizo-muted)]">Réponses reçues</p><p className="mt-1 text-2xl font-black">{view.responseCount || 0} / {view.participantCount}</p></div><div className="rounded-2xl border border-[var(--quizo-border)] p-4"><p className="text-xs uppercase tracking-wide text-[var(--quizo-muted)]">Taux correct</p><p className="mt-1 text-2xl font-black">{view.roundAnalytics?.accuracy ?? '—'}{view.roundAnalytics ? '%' : ''}</p></div><div className="rounded-2xl border border-[var(--quizo-border)] p-4"><p className="text-xs uppercase tracking-wide text-[var(--quizo-muted)]">Hot streak</p><p className="mt-1 text-2xl font-black">{view.leaderboard.reduce((best, entry) => Math.max(best, entry.streak || 0), 0)}×</p></div><div className="rounded-2xl border border-[var(--quizo-border)] p-4"><p className="text-xs uppercase tracking-wide text-[var(--quizo-muted)]">Fastest player</p><p className="mt-1 truncate text-lg font-black">{[...view.leaderboard].filter(entry => entry.averageResponseTimeMs).sort((a, b) => (a.averageResponseTimeMs || 0) - (b.averageResponseTimeMs || 0))[0]?.name || '—'}</p></div><div className="rounded-2xl border border-[var(--quizo-border)] p-4"><p className="text-xs uppercase tracking-wide text-[var(--quizo-muted)]">Head-to-head</p><p className="mt-1 truncate text-lg font-black">{view.leaderboard.length > 1 ? `${view.leaderboard[0].name} · ${view.leaderboard[0].gameScore - view.leaderboard[1].gameScore} pts` : '—'}</p></div></section>}
    {error && <div role="alert" className="space-y-3 rounded-xl border border-red-400/40 p-5"><p>{error}</p><Button onClick={() => navigate('/join')}>Rejoindre avec un code</Button></div>}
    {view && <>
      {view.phase === 'waiting' && <div className="space-y-6 rounded-3xl border border-[var(--quizo-border)] p-6 text-center">
        <p>Rejoignez sur {window.location.origin}/join</p><p className="break-all font-mono text-4xl font-black tracking-widest sm:text-6xl">{view.code}</p>
        <Button variant="outline" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/join/${view.code}`).then(() => toast.success('Lien copié')).catch(() => toast.error('Copie impossible'))}>Copier le lien</Button>
        <p>{view.participantCount} / 100 participants · {view.totalQuestions} questions</p>
        <p className="text-sm text-[var(--quizo-muted)]">Une réponse verrouillée par question. Points de base + vitesse + série. Les résultats apparaissent à la révélation.</p>
        <div className="flex flex-wrap justify-center gap-2">{view.participants.map(p => <span key={p.uid} className="rounded-full bg-orange-500/10 px-4 py-2">{p.name}{p.uid === uid ? ' · vous' : ''}</span>)}</div>
      </div>}
      {view.phase === 'question' && countdown > 0 && <p role="status" className="text-center text-5xl font-black text-orange-400">{countdown}</p>}
      {view.question && ['question', 'reveal'].includes(view.phase) && <QuestionStage question={view.question} index={view.index} total={view.totalQuestions} remaining={countdown > 0 ? view.question.timeLimit || 20 : remaining}
        selected={selected} correctOptionId={view.phase === 'reveal' ? view.correction?.correctOptionId : undefined}
        disabled={display || host || view.phase !== 'question' || countdown > 0 || remaining === 0 || !!selected || playerFrozen}
        onAnswer={display || host ? undefined : answer} />}
      {!display && !host && <div className="space-y-3 rounded-xl border border-[var(--quizo-border)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span><strong>{gameScore}</strong> score de jeu · <strong>{academicAccuracy.toFixed(1)} %</strong> réussite pédagogique · <strong>×{player?.streak || 0}</strong> série</span><span role="status">{playerFrozen ? 'Gel express actif — reprise imminente' : sendingState || (selected ? 'Réponse verrouillée' : '')}</span>{pending && !sending.current && <Button variant="outline" onClick={() => void sendPending()}>Réessayer l’envoi</Button>}</div>
        {view.config?.mode === 'battle' && view.phase === 'question' && countdown === 0 && !selected && <div className="flex flex-wrap gap-2"><span className="text-xs font-bold uppercase tracking-wide text-orange-200">Pouvoirs</span>{player?.powerInventory?.map(power => <Button key={power} size="sm" variant="outline" disabled={powerBusy !== null || playerFrozen} onClick={() => void activatePower(power, power === 'freeze' ? view.participants.find(participant => participant.uid !== uid)?.uid : undefined)}>{power === 'double' ? <Zap className="mr-1 h-3.5 w-3.5" /> : power === 'shield' ? <Shield className="mr-1 h-3.5 w-3.5" /> : <Swords className="mr-1 h-3.5 w-3.5" />}{power === 'double' ? 'Double' : power === 'shield' ? 'Bouclier' : 'Duel gel'}</Button>)}</div>}</div>}
      {view.phase === 'reveal' && <div className="space-y-3 rounded-2xl bg-orange-500/10 p-5"><h2 className="text-xl font-bold">Correction</h2><p>{view.correction?.explanation || 'La bonne réponse est indiquée ci-dessus.'}</p>
        {!display && player?.lastResponse?.questionId === view.question?.id && <p role="status">{player.lastResponse.status === 'timeout' ? 'Temps écoulé' : player.lastResponse.correct ? 'Bonne réponse' : 'Réponse incorrecte'} · +{player.lastResponse.awardedGamePoints} points</p>}
        <p className="text-sm">{Object.values(view.distribution || {}).reduce((a, b) => a + b, 0)} réponses · {view.omissions || 0} sans réponse</p>
      </div>}
      {['reveal', 'leaderboard', 'completed'].includes(view.phase) && <div className="overflow-hidden rounded-2xl border border-[var(--quizo-border)]"><h2 className="p-5 text-xl font-bold">{view.phase === 'completed' ? 'Classement final' : 'Classement en direct'}</h2><ol>{view.leaderboard.filter(p => host || p.rank <= 5 || p.uid === uid).map(p => <motion.li layout key={p.uid} className={`flex flex-wrap items-center justify-between gap-3 border-t border-[var(--quizo-border)] px-5 py-4 ${p.uid === uid ? 'bg-orange-500/10' : ''}`}><span>#{p.rank} · {p.name}{p.uid === uid ? ' · vous' : ''}{p.streak && p.streak >= 3 ? <Flame className="ml-2 inline h-4 w-4 text-orange-300" /> : null}</span><span>{p.gameScore ?? p.gamePoints ?? 0} pts · {(p.academicAccuracy ?? p.pedagogicalScore ?? 0).toFixed(1)} %</span></motion.li>)}</ol></div>}
      {view.phase === 'completed' && view.ceremonyStep === 'podium' && <motion.section initial={reducedMotion ? false : { opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-amber-300/30 bg-gradient-to-b from-amber-500/15 to-transparent p-7 text-center"><Trophy className="mx-auto h-12 w-12 text-amber-300" /><h2 className="mt-3 text-3xl font-black">Podium final</h2><div className="mt-6 grid gap-3 sm:grid-cols-3">{view.leaderboard.slice(0, 3).map((entry, index) => <div key={entry.uid} className={cn('rounded-2xl border p-4', index === 0 ? 'border-amber-300 bg-amber-500/15 sm:-order-0' : 'border-[var(--quizo-border)]')}><Medal className="mx-auto h-6 w-6 text-amber-300" /><p className="mt-2 font-black">#{entry.rank} {entry.name}</p><p className="text-sm text-[var(--quizo-muted)]">{entry.gameScore} points de jeu</p></div>)}</div></motion.section>}
      {view.phase === 'completed' && view.ceremonyStep === 'awards' && <section className="rounded-3xl border border-[var(--quizo-border)] p-6"><h2 className="flex items-center gap-2 text-2xl font-black"><Crown className="h-6 w-6 text-amber-300" />Awards</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{view.awards?.map(award => <div key={award.key} className="rounded-2xl bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wide text-orange-200">{award.label}</p><p className="mt-2 font-black">{award.name}</p><p className="text-sm text-[var(--quizo-muted)]">{award.value}</p></div>)}</div></section>}
      {view.phase === 'completed' && view.ceremonyStep === 'analytics' && <section className="grid gap-4 rounded-3xl border border-[var(--quizo-border)] p-6 sm:grid-cols-3"><div><p className="text-xs uppercase tracking-wide text-[var(--quizo-muted)]">Participation</p><p className="mt-1 text-3xl font-black">{view.participantCount}</p></div><div><p className="text-xs uppercase tracking-wide text-[var(--quizo-muted)]">Réussite moyenne</p><p className="mt-1 text-3xl font-black">{view.leaderboard.length ? `${Math.round(view.leaderboard.reduce((total, entry) => total + entry.academicAccuracy, 0) / view.leaderboard.length)} %` : '—'}</p></div><div><p className="text-xs uppercase tracking-wide text-[var(--quizo-muted)]">Question la plus difficile</p><p className="mt-1 text-3xl font-black">{view.questionAnalytics?.length ? `Q${[...view.questionAnalytics].sort((a, b) => a.accuracy - b.accuracy)[0].index + 1}` : '—'}</p></div></section>}
      {view.phase === 'cancelled' && <p role="status">Cette session a été annulée par l’animateur.</p>}
      {host && !display && <div className="sticky bottom-3 flex flex-wrap gap-3 rounded-2xl border border-[var(--quizo-border)] bg-[var(--quizo-surface)] p-4 shadow-xl">
        {view.phase === 'waiting' && <Button disabled={busy || !view.participantCount} onClick={() => void command('start')}>Démarrer</Button>}
        {view.phase === 'question' && <Button disabled={busy || countdown > 0} onClick={() => void command('reveal')}>Fermer et révéler</Button>}
        {view.phase === 'reveal' && <Button disabled={busy} onClick={() => void command(view.config?.leaderboardFrequency === 'each_round' ? 'leaderboard' : view.index === view.totalQuestions - 1 ? 'finish' : 'advance')}>{view.config?.leaderboardFrequency === 'each_round' ? 'Afficher le classement' : view.index === view.totalQuestions - 1 ? 'Terminer la partie' : 'Question suivante'}</Button>}
        {view.phase === 'leaderboard' && <Button disabled={busy} onClick={() => void command(view.index === view.totalQuestions - 1 ? 'finish' : 'advance')}>{view.index === view.totalQuestions - 1 ? 'Vers le podium' : 'Question suivante'}</Button>}
        {view.phase === 'completed' && <Button disabled={busy} onClick={() => void command('ceremony')}>{view.ceremonyStep === 'podium' ? 'Voir les awards' : view.ceremonyStep === 'awards' ? 'Voir les analytics' : 'Revoir le podium'}</Button>}
        <Button variant="outline" onClick={() => window.open(`/live-session/${sessionId}/display`, '_blank', 'noopener,noreferrer')}>Écran projecteur</Button>
        {!['completed', 'cancelled'].includes(view.phase) && <Button variant="outline" disabled={busy} onClick={() => { if (window.confirm('Annuler cette session pour tous les joueurs ?')) void command('cancel'); }}>Annuler</Button>}
      </div>}
    </>}
  </section>;
  return display ? <div className="min-h-screen bg-[var(--quizo-bg)] text-[var(--quizo-heading)]">{content}</div> : <AppShell>{content}</AppShell>;
}
