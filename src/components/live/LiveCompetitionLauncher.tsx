import { useState } from 'react';
import { Gamepad2, Loader2, Shield, Swords, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DEFAULT_LIVE_COMPETITION_CONFIG, liveModeLabel, type LiveCompetitionConfig, type LiveMode, type LivePower } from '@/domain/liveCompetition';
import { liveRequest } from '@/services/liveClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const modes: Array<{ value: LiveMode; icon: typeof Gamepad2; detail: string }> = [
  { value: 'classic', icon: Gamepad2, detail: 'QCM, chrono, vitesse, séries et classement.' },
  { value: 'battle_pure', icon: Swords, detail: 'Même intensité compétitive, sans pouvoirs.' },
  { value: 'battle', icon: Zap, detail: 'Compétition avec Double score, Bouclier et duels.' },
];
const powerLabels: Record<LivePower, string> = { double: 'Double score', shield: 'Bouclier de série', freeze: 'Gel express' };

function Toggle({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return <label className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--quizo-border)] px-3 py-2.5 text-sm', disabled && 'cursor-not-allowed opacity-45')}>
    <span>{label}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} className="h-4 w-4 accent-orange-500" />
  </label>;
}

export function LiveCompetitionLauncher({ quizId, disabled = false }: { quizId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<LiveCompetitionConfig>(DEFAULT_LIVE_COMPETITION_CONFIG);
  const navigate = useNavigate();
  const battle = config.mode === 'battle';
  const update = <K extends keyof LiveCompetitionConfig>(key: K, value: LiveCompetitionConfig[K]) => setConfig(previous => ({ ...previous, [key]: value }));
  const togglePower = (power: LivePower) => update('powers', config.powers.includes(power) ? config.powers.filter(item => item !== power) : [...config.powers, power]);
  async function launch() {
    setBusy(true);
    try {
      const result = await liveRequest<{ sessionId: string }>({ operation: 'create', quizId, commandId: crypto.randomUUID(), config });
      setOpen(false); navigate(`/session/${result.sessionId}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Création de la compétition impossible.'); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button disabled={disabled} className="quizo-copper-button"><Swords className="mr-2 h-4 w-4" />Lancer en live</Button></DialogTrigger>
    <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-[var(--quizo-border)] bg-[var(--quizo-surface)] text-[var(--quizo-heading)]">
      <DialogHeader><DialogTitle className="text-2xl font-black">Configurer la compétition</DialogTitle><DialogDescription>Le moteur serveur verrouille le chrono, les scores, le classement et les pouvoirs.</DialogDescription></DialogHeader>
      <div className="space-y-5 py-2">
        <div className="grid gap-3 md:grid-cols-3">{modes.map(({ value, icon: Icon, detail }) => <button key={value} type="button" onClick={() => update('mode', value)} className={cn('rounded-2xl border p-4 text-left transition', config.mode === value ? 'border-orange-400 bg-orange-500/10 ring-1 ring-orange-400' : 'border-[var(--quizo-border)] hover:border-orange-400/50')}><Icon className="mb-3 h-5 w-5 text-orange-400" /><p className="font-black">{liveModeLabel(value)}</p><p className="mt-1 text-xs leading-5 text-[var(--quizo-muted)]">{detail}</p></button>)}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="rounded-xl border border-[var(--quizo-border)] p-3 text-sm"><span className="mb-2 block font-semibold">Temps / question</span><select value={config.timePerQuestion ?? ''} onChange={event => update('timePerQuestion', event.target.value ? Number(event.target.value) : null)} className="w-full bg-transparent"><option value="">Selon le quiz</option>{[10, 15, 20, 30, 45, 60, 90].map(value => <option key={value} value={value}>{value} secondes</option>)}</select></label>
          <label className="rounded-xl border border-[var(--quizo-border)] p-3 text-sm"><span className="mb-2 block font-semibold">Classement</span><select value={config.leaderboardFrequency} onChange={event => update('leaderboardFrequency', event.target.value as LiveCompetitionConfig['leaderboardFrequency'])} className="w-full bg-transparent"><option value="each_round">Après chaque manche</option><option value="final_only">Final seulement</option></select></label>
          <label className="rounded-xl border border-[var(--quizo-border)] p-3 text-sm"><span className="mb-2 block font-semibold">Animations</span><select value={config.animationIntensity} onChange={event => update('animationIntensity', event.target.value as LiveCompetitionConfig['animationIntensity'])} className="w-full bg-transparent"><option value="calm">Calmes</option><option value="standard">Standard</option><option value="intense">Intenses</option></select></label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><Toggle label="Bonus vitesse" checked={config.speedBonus} onChange={value => update('speedBonus', value)} /><Toggle label="Bonus de série" checked={config.streakBonus} onChange={value => update('streakBonus', value)} /><Toggle label="Question suivante auto" checked={config.autoNext} onChange={value => update('autoNext', value)} /><Toggle label="Sons de jeu" checked={config.sounds} onChange={value => update('sounds', value)} /></div>
        {battle && <section className="space-y-3 rounded-2xl border border-orange-400/25 bg-orange-500/5 p-4"><div className="flex items-center gap-2"><Shield className="h-5 w-5 text-orange-300" /><h3 className="font-black">Pouvoirs Battle</h3></div><div className="grid gap-2 sm:grid-cols-3">{(Object.keys(powerLabels) as LivePower[]).map(power => <Toggle key={power} label={powerLabels[power]} checked={config.powers.includes(power)} onChange={() => togglePower(power)} />)}</div><Toggle label="Autoriser les duels (Gel express)" checked={config.duels} disabled={!config.powers.includes('freeze')} onChange={value => update('duels', value)} /></section>}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/15 p-3 text-xs text-[var(--quizo-muted)]"><span>Flux : Lobby → Countdown → Questions → Results → Leaderboard → Podium → Awards → Analytics</span><span>Score de jeu ≠ réussite pédagogique</span></div>
        <Button className="quizo-copper-button w-full" disabled={busy} onClick={() => void launch()}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}Créer le lobby {liveModeLabel(config.mode)}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
