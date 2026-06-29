import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Copy,
  Crown,
  Flame,
  Play,
  Sparkles,
  Square,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PremiumMetric, PremiumPanel, LeaderboardPodium } from '@/components/ui/premium';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────
   Types matching the Python live_session.py data structures
   ────────────────────────────────────────────────────────── */

interface LivePlayer {
  id: string;
  name: string;
  avatarColor: string;
  score: number;
  streak: number;
  isConnected: boolean;
  badges: string[];
  answeredCount: number;
}

interface QuestionOption {
  id: string;
  text: string;
}

interface LiveQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
  correctOptionId: string;
  points: number;
  timeLimit: number;
}

interface PlayerAnswer {
  playerId: string;
  playerName: string;
  selectedOption: string;
  isCorrect: boolean;
  timeSpent: number;
  pointsEarned: number;
}

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  name: string;
  avatarColor: string;
  score: number;
  correctAnswers: number;
  totalAnswered: number;
  averageTime: number;
  streak: number;
  badges: string[];
}

interface ActivityEvent {
  id: string;
  type: 'join' | 'answer' | 'start' | 'question' | 'complete';
  message: string;
  timestamp: number;
  color?: string;
}

type SessionStatus = 'waiting' | 'active' | 'question' | 'revealing' | 'completed';

/* ──────────────────────────────────────────────────────────
   Demo data — simulated session for standalone preview
   ────────────────────────────────────────────────────────── */

const DEMO_PLAYERS: LivePlayer[] = [
  { id: 'p1', name: 'Player_A (Expert)', avatarColor: '#4ECDC4', score: 6200, streak: 3, isConnected: true, badges: ['gold', 'streak-master'], answeredCount: 5 },
  { id: 'p2', name: 'Player_B (Average)', avatarColor: '#FFD93D', score: 3800, streak: 0, isConnected: true, badges: ['silver'], answeredCount: 5 },
  { id: 'p3', name: 'Player_C (Beginner)', avatarColor: '#FF6B6B', score: 1900, streak: 0, isConnected: true, badges: ['bronze'], answeredCount: 5 },
];

const DEMO_QUESTIONS: LiveQuestion[] = [
  { id: 'q1', text: 'Quel langage est principalement utilise pour le developpement web frontend ?', options: [{ id: 'a', text: 'Python' }, { id: 'b', text: 'JavaScript' }, { id: 'c', text: 'Java' }, { id: 'd', text: 'C++' }], correctOptionId: 'b', points: 1000, timeLimit: 20 },
  { id: 'q2', text: 'Que signifie HTML ?', options: [{ id: 'a', text: 'Hyper Text Markup Language' }, { id: 'b', text: 'High Tech Modern Language' }, { id: 'c', text: 'Hyper Transfer Markup Language' }, { id: 'd', text: 'Home Tool Markup Language' }], correctOptionId: 'a', points: 1000, timeLimit: 20 },
  { id: 'q3', text: 'Quelle base de donnees est de type NoSQL ?', options: [{ id: 'a', text: 'PostgreSQL' }, { id: 'b', text: 'MySQL' }, { id: 'c', text: 'MongoDB' }, { id: 'd', text: 'Oracle' }], correctOptionId: 'c', points: 1000, timeLimit: 20 },
  { id: 'q4', text: 'Quel protocole est utilise pour les communications web securisees ?', options: [{ id: 'a', text: 'FTP' }, { id: 'b', text: 'HTTP' }, { id: 'c', text: 'HTTPS' }, { id: 'd', text: 'SMTP' }], correctOptionId: 'c', points: 1000, timeLimit: 20 },
  { id: 'q5', text: 'Quel framework React est utilise pour le Server-Side Rendering ?', options: [{ id: 'a', text: 'Angular' }, { id: 'b', text: 'Vue.js' }, { id: 'c', text: 'Next.js' }, { id: 'd', text: 'Svelte' }], correctOptionId: 'c', points: 1000, timeLimit: 20 },
];

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerId: 'p1', name: 'Player_A (Expert)', avatarColor: '#4ECDC4', score: 6200, correctAnswers: 4, totalAnswered: 5, averageTime: 3.2, streak: 3, badges: ['gold', 'streak-master'] },
  { rank: 2, playerId: 'p2', name: 'Player_B (Average)', avatarColor: '#FFD93D', score: 3800, correctAnswers: 3, totalAnswered: 5, averageTime: 6.1, streak: 0, badges: ['silver'] },
  { rank: 3, playerId: 'p3', name: 'Player_C (Beginner)', avatarColor: '#FF6B6B', score: 1900, correctAnswers: 2, totalAnswered: 5, averageTime: 9.4, streak: 0, badges: ['bronze'] },
];

const DEMO_EVENTS: ActivityEvent[] = [
  { id: 'e1', type: 'join', message: 'Player_A (Expert) a rejoint la session', timestamp: Date.now() - 60000, color: '#4ECDC4' },
  { id: 'e2', type: 'join', message: 'Player_B (Average) a rejoint la session', timestamp: Date.now() - 55000, color: '#FFD93D' },
  { id: 'e3', type: 'join', message: 'Player_C (Beginner) a rejoint la session', timestamp: Date.now() - 50000, color: '#FF6B6B' },
  { id: 'e4', type: 'start', message: 'Quiz demarre!', timestamp: Date.now() - 45000 },
  { id: 'e5', type: 'question', message: 'Question 1 envoyee', timestamp: Date.now() - 40000 },
  { id: 'e6', type: 'answer', message: 'Player_A a repondu en 2.3s ✓', timestamp: Date.now() - 38000, color: '#4ECDC4' },
  { id: 'e7', type: 'answer', message: 'Player_B a repondu en 5.1s ✓', timestamp: Date.now() - 35000, color: '#FFD93D' },
  { id: 'e8', type: 'answer', message: 'Player_C a repondu en 9.2s ✗', timestamp: Date.now() - 31000, color: '#FF6B6B' },
  { id: 'e9', type: 'question', message: 'Question 2 envoyee', timestamp: Date.now() - 25000 },
  { id: 'e10', type: 'complete', message: 'Quiz termine - Resultats finaux affiches', timestamp: Date.now() - 5000 },
];

/* ──────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────── */

const BadgeIcon = ({ badge }: { badge: string }) => {
  const badgeMap: Record<string, { icon: string; label: string; className: string }> = {
    gold: { icon: '🥇', label: '1st Place', className: 'bg-amber-500/15 text-amber-300 border-amber-400/30' },
    silver: { icon: '🥈', label: '2nd Place', className: 'bg-gray-400/15 text-gray-300 border-gray-400/30' },
    bronze: { icon: '🥉', label: '3rd Place', className: 'bg-orange-700/15 text-orange-300 border-orange-600/30' },
    perfect: { icon: '💯', label: 'Parfait', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
    'speed-demon': { icon: '⚡', label: 'Rapide', className: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30' },
    'streak-master': { icon: '🔥', label: 'Serie', className: 'bg-red-500/15 text-red-300 border-red-400/30' },
  };

  const info = badgeMap[badge] || { icon: '🏅', label: badge, className: 'bg-white/10 text-white/70 border-white/20' };

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', info.className)}>
      {info.icon} {info.label}
    </span>
  );
};

const AccessCodeDisplay = ({ code, onCopy }: { code: string; onCopy: () => void }) => (
  <div className="flex items-center gap-4">
    <div className="relative overflow-hidden rounded-2xl border border-orange-300/30 bg-gradient-to-br from-orange-500/15 via-orange-500/8 to-transparent px-8 py-5 shadow-[0_0_40px_rgba(255,150,50,0.08)]">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,183,125,0.03)_50%,transparent_75%)] animate-[shimmer_3s_infinite]" />
      <div className="relative text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-orange-300/70">Code d'acces</p>
        <p className="font-mono text-4xl font-black tracking-[0.3em] text-white">{code}</p>
      </div>
    </div>
    <Button
      variant="outline"
      size="icon"
      className="h-12 w-12 rounded-xl border-white/10 bg-white/5 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200"
      onClick={onCopy}
    >
      <Copy className="h-5 w-5" />
    </Button>
  </div>
);

const PlayerCard = ({ player, rank }: { player: LivePlayer | LeaderboardEntry; rank?: number }) => {
  const score = player.score;
  const name = player.name;
  const avatarColor = player.avatarColor;
  const badges = player.badges;

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all duration-300 hover:border-orange-300/20 hover:bg-white/[0.055]">
      {rank !== undefined && (
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold',
          rank === 1 ? 'bg-amber-500/20 text-amber-300' :
          rank === 2 ? 'bg-gray-400/20 text-gray-300' :
          rank === 3 ? 'bg-orange-600/20 text-orange-300' :
          'bg-white/10 text-white/60'
        )}>
          {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
        </div>
      )}
      <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: avatarColor + '40', borderColor: avatarColor, borderWidth: 2 }}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white">{name}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {badges.map((b) => <BadgeIcon key={b} badge={b} />)}
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black text-white">{score.toLocaleString('fr-FR')}</p>
        <p className="text-xs text-[#a79d96]">points</p>
      </div>
    </div>
  );
};

const QuestionResultBar = ({ question, index, answers }: { question: LiveQuestion; index: number; answers: PlayerAnswer[] }) => {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalPlayers = answers.length || 1;
  const accuracy = (correctCount / totalPlayers) * 100;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-sm font-bold text-orange-300">
        Q{index + 1}
      </div>
      <div className="flex-1">
        <p className="mb-2 text-sm text-white/80 line-clamp-1">{question.text}</p>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn('h-full rounded-full transition-all duration-700', accuracy >= 66 ? 'bg-emerald-400' : accuracy >= 33 ? 'bg-amber-400' : 'bg-red-400')}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-white">{Math.round(accuracy)}%</p>
        <p className="text-xs text-[#a79d96]">{correctCount}/{totalPlayers}</p>
      </div>
    </div>
  );
};

const EventFeed = ({ events }: { events: ActivityEvent[] }) => (
  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
    {events.slice().reverse().map((event) => {
      const iconMap: Record<string, { icon: typeof Activity; color: string }> = {
        join: { icon: Users, color: 'text-sky-400' },
        answer: { icon: CheckCircle, color: 'text-emerald-400' },
        start: { icon: Play, color: 'text-orange-400' },
        question: { icon: Sparkles, color: 'text-violet-400' },
        complete: { icon: Trophy, color: 'text-amber-400' },
      };
      const { icon: Icon, color } = iconMap[event.type] || { icon: Activity, color: 'text-white/50' };

      return (
        <div key={event.id} className="flex items-start gap-3 rounded-lg px-3 py-2 transition hover:bg-white/[0.03]">
          <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', color)} />
          <div className="flex-1">
            <p className="text-sm text-white/80">{event.message}</p>
            <p className="text-xs text-[#6f6760]">{new Date(event.timestamp).toLocaleTimeString()}</p>
          </div>
          {event.color && <div className="mt-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: event.color }} />}
        </div>
      );
    })}
  </div>
);

/* ──────────────────────────────────────────────────────────
   Main LiveSessionDashboard Component
   ────────────────────────────────────────────────────────── */

const LiveSessionDashboard = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // In demo mode we use static data; in production these would come from WebSocket
  const [status, setStatus] = useState<SessionStatus>('completed');
  const [players] = useState<LivePlayer[]>(DEMO_PLAYERS);
  const [leaderboard] = useState<LeaderboardEntry[]>(DEMO_LEADERBOARD);
  const [questions] = useState<LiveQuestion[]>(DEMO_QUESTIONS);
  const [events] = useState<ActivityEvent[]>(DEMO_EVENTS);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentQuestionIndex] = useState(4); // last question (0-based)
  const accessCode = sessionId || 'QZ-8492';
  const quizTitle = 'Developpement Web - Quiz Interactif';

  // Simulated per-question answers for the result bars
  const questionAnswers = useMemo((): Record<string, PlayerAnswer[]> => {
    const result: Record<string, PlayerAnswer[]> = {};
    for (const q of DEMO_QUESTIONS) {
      result[q.id] = DEMO_PLAYERS.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        selectedOption: q.correctOptionId,
        isCorrect: Math.random() > (p.id === 'p3' ? 0.5 : p.id === 'p2' ? 0.3 : 0.15),
        timeSpent: Math.random() * 12 + 2,
        pointsEarned: Math.floor(Math.random() * 1500),
      }));
    }
    return result;
  }, []);

  const totalCorrect = useMemo(() => {
    return Object.values(questionAnswers).flat().filter((a) => a.isCorrect).length;
  }, [questionAnswers]);

  const totalAnswers = Object.values(questionAnswers).flat().length;
  const overallAccuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
  const avgScore = players.length > 0 ? Math.round(players.reduce((s, p) => s + p.score, 0) / players.length) : 0;

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(accessCode);
    toast.success('Code copie dans le presse-papier');
  }, [accessCode]);

  const podiumData = leaderboard.slice(0, 3).map((entry) => ({
    id: entry.playerId,
    name: entry.name.split(' ')[0],
    score: entry.score,
    time: `${entry.averageTime.toFixed(1)}s avg`,
  }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Session en direct"
        title={quizTitle}
        description="Tableau de bord du createur — suivi en temps reel des joueurs et des scores."
        actions={
          <div className="flex flex-wrap gap-3">
            {status === 'waiting' && (
              <Button className="quizo-copper-button" onClick={() => setStatus('active')}>
                <Play className="mr-2 h-4 w-4" /> Demarrer
              </Button>
            )}
            {status === 'completed' && (
              <Button variant="outline" className="quizo-outline-button" onClick={() => navigate('/history')}>
                Retour a l'historique
              </Button>
            )}
          </div>
        }
      />

      {/* Status Bar + Access Code */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge className={cn(
            'border px-3 py-1',
            status === 'completed' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' :
            status === 'waiting' ? 'border-amber-400/30 bg-amber-500/10 text-amber-300' :
            'border-sky-400/30 bg-sky-500/10 text-sky-300'
          )}>
            <Activity className="mr-1.5 h-3 w-3" />
            {status === 'completed' ? 'Termine' : status === 'waiting' ? 'En attente' : 'En cours'}
          </Badge>
          {status !== 'waiting' && (
            <span className="text-sm text-[#a79d96]">Question {currentQuestionIndex + 1}/{questions.length}</span>
          )}
        </div>
        <AccessCodeDisplay code={accessCode} onCopy={copyCode} />
      </div>

      {/* Metrics Row */}
      <section className="mb-8 grid gap-5 grid-cols-2 md:grid-cols-4">
        <PremiumMetric label="Joueurs" value={players.length} detail="3 connectes" icon={Users} tone="blue" />
        <PremiumMetric label="Precision" value={`${overallAccuracy}%`} icon={CheckCircle} tone="green" />
        <PremiumMetric label="Score moyen" value={avgScore.toLocaleString('fr-FR')} icon={Trophy} tone="copper" />
        <PremiumMetric label="Questions" value={`${currentQuestionIndex + 1}/${questions.length}`} icon={BarChart3} tone="violet" />
      </section>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8 grid h-auto grid-cols-4 gap-2 bg-transparent">
          <TabsTrigger value="overview" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="leaderboard" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">Classement</TabsTrigger>
          <TabsTrigger value="questions" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">Questions</TabsTrigger>
          <TabsTrigger value="activity" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">Activite</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <PremiumPanel className="p-6">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Crown className="h-5 w-5 text-amber-400" /> Podium
                </h2>
                <div className="mt-6">
                  {podiumData.length >= 3 && <LeaderboardPodium participants={podiumData} />}
                </div>
              </PremiumPanel>
            </div>

            <div className="lg:col-span-2">
              <PremiumPanel className="p-6">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Zap className="h-5 w-5 text-orange-400" /> Joueurs
                </h2>
                <div className="mt-4 space-y-3">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: player.avatarColor + '50' }}>
                        {player.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{player.name}</p>
                        <p className="text-xs text-[#8f8580]">{player.answeredCount} reponses</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-orange-300">{player.score.toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              </PremiumPanel>
            </div>
          </div>
        </TabsContent>

        {/* ── Leaderboard Tab ── */}
        <TabsContent value="leaderboard">
          <PremiumPanel className="overflow-hidden">
            <div className="border-b border-white/[0.07] p-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                <Trophy className="h-6 w-6 text-amber-400" /> Classement Final
              </h2>
              <p className="mt-1 text-sm text-[#a79d96]">Scores finaux avec badges et statistiques detailles.</p>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {leaderboard.map((entry) => (
                <div key={entry.playerId} className="p-4 transition hover:bg-white/[0.03]">
                  <PlayerCard player={entry} rank={entry.rank} />
                  <div className="ml-[4.5rem] mt-2 flex flex-wrap gap-4 text-xs text-[#8f8580]">
                    <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400" /> {entry.correctAnswers}/{entry.totalAnswered} correctes</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-sky-400" /> {entry.averageTime.toFixed(1)}s moyenne</span>
                    {entry.streak > 0 && <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" /> Serie de {entry.streak}</span>}
                  </div>
                </div>
              ))}
            </div>
          </PremiumPanel>
        </TabsContent>

        {/* ── Questions Tab ── */}
        <TabsContent value="questions">
          <PremiumPanel className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <BarChart3 className="h-5 w-5 text-violet-400" /> Resultats par question
            </h2>
            <p className="mt-1 mb-6 text-sm text-[#a79d96]">Taux de reussite pour chaque question du quiz.</p>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionResultBar key={q.id} question={q} index={i} answers={questionAnswers[q.id] || []} />
              ))}
            </div>
          </PremiumPanel>
        </TabsContent>

        {/* ── Activity Tab ── */}
        <TabsContent value="activity">
          <PremiumPanel className="p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Activity className="h-5 w-5 text-sky-400" /> Fil d'activite en direct
            </h2>
            <p className="mt-1 mb-6 text-sm text-[#a79d96]">Tous les evenements de la session en temps reel.</p>
            <EventFeed events={events} />
          </PremiumPanel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default LiveSessionDashboard;
