export const LIVE_EVENT_TYPES = [
  'NEW_LEADER', 'OVERTAKE', 'HOT_STREAK', 'LIGHTNING_ANSWER', 'POWER_USED', 'ROUND_END', 'GAME_END',
] as const;

export type LiveEventType = typeof LIVE_EVENT_TYPES[number];
export type LiveMode = 'classic' | 'battle' | 'battle_pure';
export type LiveTimerMode = 'host' | 'countdown';
export type LeaderboardFrequency = 'each_round' | 'final_only';
export type AnimationIntensity = 'calm' | 'standard' | 'intense';
export type LivePower = 'double' | 'shield' | 'freeze';

export interface LiveCompetitionConfig {
  mode: LiveMode;
  /** Host-paced rounds deliberately have no deadline and no speed scoring. */
  timerMode: LiveTimerMode;
  timePerQuestion: number | null;
  speedBonus: boolean;
  streakBonus: boolean;
  leaderboardFrequency: LeaderboardFrequency;
  autoNext: boolean;
  sounds: boolean;
  animationIntensity: AnimationIntensity;
  powers: LivePower[];
  duels: boolean;
}

export const DEFAULT_LIVE_COMPETITION_CONFIG: LiveCompetitionConfig = {
  mode: 'classic',
  timerMode: 'host',
  timePerQuestion: null,
  speedBonus: false,
  streakBonus: true,
  leaderboardFrequency: 'each_round',
  autoNext: false,
  sounds: true,
  animationIntensity: 'intense',
  powers: [],
  duels: false,
};

const MODES: LiveMode[] = ['classic', 'battle', 'battle_pure'];
const FREQUENCIES: LeaderboardFrequency[] = ['each_round', 'final_only'];
const INTENSITIES: AnimationIntensity[] = ['calm', 'standard', 'intense'];
const POWERS: LivePower[] = ['double', 'shield', 'freeze'];

/** Shared input gate used by the server before a session snapshot is created. */
export function parseLiveCompetitionConfig(value: unknown): LiveCompetitionConfig {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const mode = MODES.includes(raw.mode as LiveMode) ? raw.mode as LiveMode : DEFAULT_LIVE_COMPETITION_CONFIG.mode;
  const requestedPowers = Array.isArray(raw.powers) ? raw.powers.filter((power): power is LivePower => typeof power === 'string' && POWERS.includes(power as LivePower)) : [];
  const uniquePowers = [...new Set(requestedPowers)];
  const timePerQuestion = raw.timePerQuestion == null ? null : Number(raw.timePerQuestion);
  if (timePerQuestion !== null && (!Number.isInteger(timePerQuestion) || timePerQuestion < 5 || timePerQuestion > 180)) throw new Error('Le temps par question doit être compris entre 5 et 180 secondes.');
  const timerMode: LiveTimerMode = raw.timerMode === 'countdown' ? 'countdown' : 'host';
  const battle = mode === 'battle';
  const timed = timerMode === 'countdown';
  return {
    mode,
    timerMode: timed ? 'countdown' : 'host',
    timePerQuestion: timed ? (timePerQuestion ?? 20) : null,
    speedBonus: timed && (raw.speedBonus === undefined ? true : raw.speedBonus === true),
    streakBonus: raw.streakBonus === undefined ? true : raw.streakBonus === true,
    leaderboardFrequency: FREQUENCIES.includes(raw.leaderboardFrequency as LeaderboardFrequency) ? raw.leaderboardFrequency as LeaderboardFrequency : 'each_round',
    autoNext: raw.autoNext === true,
    sounds: raw.sounds === undefined ? true : raw.sounds === true,
    animationIntensity: INTENSITIES.includes(raw.animationIntensity as AnimationIntensity) ? raw.animationIntensity as AnimationIntensity : 'intense',
    powers: battle ? uniquePowers : [],
    duels: battle && raw.duels === true && uniquePowers.includes('freeze'),
  };
}

export function liveModeLabel(mode: LiveMode) {
  return mode === 'battle' ? 'Battle' : mode === 'battle_pure' ? 'Battle Pure' : 'Classic';
}
