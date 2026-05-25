import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Activity, BarChart3, CheckCircle, Copy, Pause, Play, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import {
  getManualQuiz,
  getQuizParticipants,
  getQuizAttempts,
  updateQuizStatus,
  listenToParticipants,
  listenToAttempts,
} from '@/services/manualQuizService';
import { ManualQuiz, Participant, Attempt } from '@/types/quiz';
import { PremiumMetric, PremiumPanel } from '@/components/ui/premium';

const RealtimeDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<ManualQuiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribeParticipants: (() => void) | undefined;
    let unsubscribeAttempts: (() => void) | undefined;

    const loadQuizData = async () => {
      try {
        const quizData = await getManualQuiz(id);

        if (!quizData) {
          toast.error('Quiz non trouvé');
          navigate('/history');
          return;
        }

        if (quizData.creatorId !== user.id) {
          toast.error('Accès non autorisé');
          navigate('/history');
          return;
        }

        if (cancelled) return;

        setQuiz(quizData);
        const [participantsData, attemptsData] = await Promise.all([
          getQuizParticipants(id),
          getQuizAttempts(id),
        ]);

        if (cancelled) return;
        setParticipants(participantsData);
        setAttempts(attemptsData);
        unsubscribeParticipants = listenToParticipants(id, setParticipants);
        unsubscribeAttempts = listenToAttempts(id, setAttempts);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        toast.error('Erreur lors du chargement du quiz');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadQuizData();

    return () => {
      cancelled = true;
      unsubscribeParticipants?.();
      unsubscribeAttempts?.();
    };
  }, [id, user, navigate]);

  const handleStartQuiz = async () => {
    if (!id) return;

    try {
      await updateQuizStatus(id, 'active');
      setQuiz(prev => prev ? { ...prev, status: 'active' } : null);
      toast.success('Quiz démarré. Les participants peuvent commencer.');
    } catch {
      toast.error('Erreur lors du démarrage du quiz');
    }
  };

  const handleEndQuiz = async () => {
    if (!id) return;

    try {
      await updateQuizStatus(id, 'completed');
      setQuiz(prev => prev ? { ...prev, status: 'completed' } : null);
      toast.success('Quiz terminé.');
    } catch {
      toast.error('Erreur lors de la fermeture du quiz');
    }
  };

  const copyShareLink = () => {
    if (!quiz?.shareCode) return;

    const link = `${window.location.origin}/join-quiz/${quiz.shareCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Lien copié dans le presse-papier');
  };

  const getCompletionRate = () => {
    if (participants.length === 0) return 0;
    const completed = participants.filter(p => p.completedAt).length;
    return Math.round((completed / participants.length) * 100);
  };

  const getAverageScore = () => {
    const completedAttempts = attempts.filter(a => a.completedAt && a.score !== undefined);
    if (completedAttempts.length === 0) return 0;
    const totalScore = completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
    return Math.round(totalScore / completedAttempts.length);
  };

  const getActiveParticipants = () => participants.filter(p => p.isActive && !p.completedAt).length;

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du dashboard" description="Vérification de votre session." />
      </AppShell>
    );
  }

  if (!user) return <Navigate to="/" />;

  if (isLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du dashboard" description="Connexion aux participants en temps réel." />
      </AppShell>
    );
  }

  if (!quiz) return null;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Suivi en direct"
        title={quiz.title}
        description={quiz.description || 'Suivez la progression, les scores et l’activité des participants en temps réel.'}
        actions={
          <div className="flex flex-wrap gap-2">
            {quiz.status !== 'completed' && (
              <Button onClick={quiz.status === 'draft' ? handleStartQuiz : handleEndQuiz} className="quizo-copper-button">
                {quiz.status === 'draft' ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {quiz.status === 'draft' ? 'Démarrer' : 'Terminer'}
              </Button>
            )}
            <Button variant="outline" onClick={copyShareLink} className="quizo-outline-button">
              <Copy className="mr-2 h-4 w-4" />
              Copier le lien
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge className="border border-orange-300/25 bg-orange-500/10 text-[#ffb77d] hover:bg-orange-500/10">
          {quiz.status === 'active' ? 'En cours' : quiz.status === 'completed' ? 'Terminé' : 'Brouillon'}
        </Badge>
        {quiz.mode === 'realtime' && (
          <Badge variant="outline" className="gap-1 border-white/[0.07] text-[#d8d2ce]">
            <Activity className="h-3 w-3" />
            Temps réel
          </Badge>
        )}
        {quiz.shareCode && <span className="rounded-lg border border-white/[0.07] bg-white/[0.045] px-3 py-1.5 font-mono text-sm text-white">{quiz.shareCode}</span>}
      </div>

      <section className="mb-6 grid gap-5 md:grid-cols-4">
        <PremiumMetric label="Participants" value={participants.length} detail={`${getActiveParticipants()} actifs`} icon={Users} tone="blue" />
        <PremiumMetric label="Complétion" value={`${getCompletionRate()}%`} icon={CheckCircle} tone="green" />
        <PremiumMetric label="Score moyen" value={`${getAverageScore()}%`} icon={Trophy} tone="copper" />
        <PremiumMetric label="Questions" value={quiz.questions.length} icon={BarChart3} tone="violet" />
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid h-auto grid-cols-3 gap-2 bg-transparent">
          <TabsTrigger value="overview" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">Vue d’ensemble</TabsTrigger>
          <TabsTrigger value="participants" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">Participants</TabsTrigger>
          <TabsTrigger value="results" className="border border-white/[0.07] bg-white/[0.045] data-[state=active]:bg-orange-500/15 data-[state=active]:text-[#ffb77d]">Résultats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PremiumPanel className="p-6">
            <h2 className="text-2xl font-bold text-white">Participants en temps réel</h2>
            <p className="mt-1 text-sm text-[#a79d96]">Progression live et présence des apprenants.</p>
            <ParticipantList participants={participants} quiz={quiz} />
          </PremiumPanel>
        </TabsContent>

        <TabsContent value="participants">
          <PremiumPanel className="overflow-hidden">
            <DashboardTable
              participants={participants}
              attempts={attempts}
              mode="participants"
            />
          </PremiumPanel>
        </TabsContent>

        <TabsContent value="results">
          <PremiumPanel className="overflow-hidden">
            <DashboardTable
              participants={participants}
              attempts={attempts.filter(a => a.completedAt).sort((a, b) => (b.score || 0) - (a.score || 0))}
              mode="results"
            />
          </PremiumPanel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

const ParticipantList = ({ participants, quiz }: { participants: Participant[]; quiz: ManualQuiz }) => {
  if (participants.length === 0) {
    return (
      <div className="py-12 text-center">
        <Users className="mx-auto mb-4 h-12 w-12 text-[#6f6760]" />
        <p className="text-[#a79d96]">Aucun participant pour le moment</p>
        <p className="mt-2 text-sm text-[#8f8580]">Partagez le code : <span className="font-mono font-bold text-white">{quiz.shareCode}</span></p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {participants.map((participant) => (
        <div key={participant.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className={`h-3 w-3 rounded-full ${participant.isActive ? 'animate-pulse bg-emerald-400' : 'bg-[#6f6760]'}`} />
            <div>
              <p className="font-semibold text-white">{participant.name}</p>
              <p className="text-sm text-[#8f8580]">{participant.email || 'Invité'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#a79d96]">
            {quiz.mode === 'realtime' && participant.currentQuestionIndex !== undefined && (
              <span>Question {participant.currentQuestionIndex + 1}/{quiz.questions.length}</span>
            )}
            <span className="rounded-full border border-white/[0.07] bg-black/25 px-3 py-1">
              {participant.completedAt ? 'Terminé' : participant.isActive ? 'En cours' : 'En attente'}
            </span>
            {participant.score !== undefined && <span className="text-xl font-bold text-white">{participant.score}%</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardTable = ({ participants, attempts, mode }: { participants: Participant[]; attempts: Attempt[]; mode: 'participants' | 'results' }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[760px]">
      <thead>
        <tr className="border-b border-white/[0.07] text-left">
          {mode === 'participants' ? (
            <>
              <th className="px-6 py-4 quizo-label">Nom</th>
              <th className="px-6 py-4 quizo-label">Email</th>
              <th className="px-6 py-4 quizo-label">Rejoint le</th>
              <th className="px-6 py-4 quizo-label">Statut</th>
              <th className="px-6 py-4 text-right quizo-label">Score</th>
            </>
          ) : (
            <>
              <th className="px-6 py-4 quizo-label">Participant</th>
              <th className="px-6 py-4 quizo-label">Début</th>
              <th className="px-6 py-4 quizo-label">Fin</th>
              <th className="px-6 py-4 quizo-label">Durée</th>
              <th className="px-6 py-4 text-right quizo-label">Score</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {mode === 'participants'
          ? participants.map((participant) => (
              <tr key={participant.id} className="border-b border-white/[0.055] last:border-0 hover:bg-white/[0.035]">
                <td className="px-6 py-4 font-semibold text-white">{participant.name}</td>
                <td className="px-6 py-4 text-[#a79d96]">{participant.email || '-'}</td>
                <td className="px-6 py-4 text-[#a79d96]">{new Date(participant.joinedAt).toLocaleString()}</td>
                <td className="px-6 py-4 text-[#a79d96]">{participant.completedAt ? 'Terminé' : participant.isActive ? 'En cours' : 'En attente'}</td>
                <td className="px-6 py-4 text-right font-bold text-white">{participant.score !== undefined ? `${participant.score}%` : '-'}</td>
              </tr>
            ))
          : attempts.map((attempt) => {
              const participant = participants.find(p => p.id === attempt.participantId);
              return (
                <tr key={attempt.id} className="border-b border-white/[0.055] last:border-0 hover:bg-white/[0.035]">
                  <td className="px-6 py-4 font-semibold text-white">{participant?.name || 'Inconnu'}</td>
                  <td className="px-6 py-4 text-[#a79d96]">{new Date(attempt.startedAt).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 text-[#a79d96]">{attempt.completedAt ? new Date(attempt.completedAt).toLocaleTimeString() : '-'}</td>
                  <td className="px-6 py-4 text-[#a79d96]">{attempt.timeSpent ? `${Math.floor(attempt.timeSpent / 60)}:${String(attempt.timeSpent % 60).padStart(2, '0')}` : '-'}</td>
                  <td className="px-6 py-4 text-right font-bold text-white">{attempt.score}%</td>
                </tr>
              );
            })}
      </tbody>
    </table>
  </div>
);

export default RealtimeDashboard;
