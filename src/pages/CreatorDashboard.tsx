import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BarChart, CheckCircle, Clock, Copy, Share2, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  getCompetitionById,
  getCompetitionByShareCode,
  listenToCompetitionAttempts,
  listenToCompetitionParticipants,
} from '@/services/manualQuizService';
import { Attempt, Competition, Participant } from '@/types/quiz';
import { PremiumMetric, PremiumPanel } from '@/components/ui/premium';

const formatDateTime = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
};

const CreatorDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribeParticipants: (() => void) | undefined;
    let unsubscribeAttempts: (() => void) | undefined;

    const loadCompetition = async () => {
      setIsLoading(true);

      try {
        const competitionData = id.length === 6 ? await getCompetitionByShareCode(id) : await getCompetitionById(id);

        if (!competitionData) {
          toast.error('Compétition non trouvée');
          navigate('/history');
          return;
        }

        if (competitionData.creatorId !== user.id) {
          toast.error("Vous n’avez pas accès à ce tableau de bord");
          navigate('/history');
          return;
        }

        if (cancelled) return;

        setCompetition(competitionData);
        unsubscribeParticipants = listenToCompetitionParticipants(competitionData.id, setParticipants);
        unsubscribeAttempts = listenToCompetitionAttempts(competitionData.id, setAttempts);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadCompetition();

    return () => {
      cancelled = true;
      unsubscribeParticipants?.();
      unsubscribeAttempts?.();
    };
  }, [id, navigate, user]);

  const stats = useMemo(() => {
    const completedAttempts = attempts.filter(attempt => attempt.completedAt && attempt.score !== undefined);
    const totalScore = completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    const totalParticipants = participants.length;

    return {
      totalParticipants,
      activeParticipants: participants.filter(participant => participant.isActive && !participant.completedAt).length,
      completedAttempts: completedAttempts.length,
      averageScore: completedAttempts.length ? totalScore / completedAttempts.length : 0,
      participationRate: totalParticipants ? (completedAttempts.length / totalParticipants) * 100 : 0,
    };
  }, [attempts, participants]);

  const rankedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.joinedAt || '').localeCompare(b.joinedAt || '');
    });
  }, [participants]);

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du dashboard" description="Vérification de votre session." />
      </AppShell>
    );
  }

  if (!user) return <Navigate to="/" />;

  const copyShareCode = () => {
    if (!competition) return;

    navigator.clipboard
      .writeText(competition.shareCode)
      .then(() => {
        setCopied(true);
        toast.success('Code copié dans le presse-papier');
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Impossible de copier le code'));
  };

  const handleShare = () => {
    if (!competition) return;

    const shareUrl = `${window.location.origin}/join/${competition.shareCode}`;
    const shareText = `Rejoignez ma compétition "${competition.title}" avec le code: ${competition.shareCode}`;

    if (navigator.share) {
      navigator.share({ title: `Compétition: ${competition.title}`, text: shareText, url: shareUrl }).catch(err => console.error('Erreur lors du partage:', err));
      return;
    }

    navigator.clipboard
      .writeText(`${shareText}\n\n${shareUrl}`)
      .then(() => toast.success('Lien copié dans le presse-papier'))
      .catch(() => toast.error('Impossible de copier le lien'));
  };

  if (isLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement des données" description="Connexion aux participants et tentatives en direct." />
      </AppShell>
    );
  }

  if (!competition) {
    return (
      <AppShell>
        <StateCard
          state="error"
          title="Impossible de charger les données"
          description="Les données de la compétition n’ont pas pu être chargées."
          action={<Button className="quizo-copper-button" onClick={() => navigate('/history')}>Retour</Button>}
        />
      </AppShell>
    );
  }

  const startDate = new Date(competition.startDate);
  const endDate = new Date(competition.endDate);
  const now = new Date();
  const isActive = competition.status !== 'completed' && competition.isActive && now >= startDate && now <= endDate;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard créateur"
        title={competition.title}
        description={competition.description || 'Suivi live des participants, scores et tentatives.'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="quizo-outline-button" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
            <Button className="quizo-copper-button" onClick={() => navigate(`/leaderboard/${competition.id}`)}>
              Voir le classement
            </Button>
          </div>
        }
      />

      <PremiumPanel className="mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center">
          <div className={`mr-2 h-3 w-3 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="font-semibold text-white">{isActive ? 'Compétition active' : 'Compétition inactive'}</span>
        </div>
        <div className="flex items-center text-sm text-[#a79d96]">
          <Clock className="mr-2 h-4 w-4" />
          Du {startDate.toLocaleDateString()} au {endDate.toLocaleDateString()}
        </div>
        <div className="flex-1" />
        <div className="flex items-center rounded-xl border border-orange-300/25 bg-orange-500/10 px-3 py-2">
          <span data-testid="competition-share-code" className="mr-2 font-mono text-lg font-bold tracking-wider text-white">{competition.shareCode}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#ffb77d] hover:bg-orange-500/10" onClick={copyShareCode}>
            {copied ? <CheckCircle className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </PremiumPanel>

      <section className="mb-6 grid gap-5 md:grid-cols-3">
        <PremiumMetric label="Participants" value={stats.totalParticipants} detail={`${stats.activeParticipants} actifs`} icon={Users} tone="blue" />
        <PremiumMetric label="Score moyen" value={`${stats.averageScore.toFixed(1)}%`} detail={`${stats.completedAttempts} tentatives`} icon={BarChart} tone="green" />
        <PremiumMetric label="Complétion" value={`${Math.round(stats.participationRate)}%`} icon={CheckCircle} tone="copper" />
      </section>

      <PremiumPanel className="overflow-hidden">
        <div className="border-b border-white/[0.07] p-6">
          <h2 className="flex items-center text-2xl font-bold text-white">
            <Users className="mr-2 h-6 w-6 text-[#ffb77d]" />
            Participants ({participants.length})
          </h2>
          <p className="mt-1 text-sm text-[#a79d96]">Progression, activité et scores en direct.</p>
        </div>
        {rankedParticipants.length === 0 ? (
          <div className="p-6">
            <StateCard state="empty" title="Aucun participant" description="Aucun participant n’a encore rejoint la compétition." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/[0.07] text-left">
                  <th className="px-6 py-4 quizo-label">Rang</th>
                  <th className="px-6 py-4 quizo-label">Nom</th>
                  <th className="px-6 py-4 quizo-label">Statut</th>
                  <th className="px-6 py-4 quizo-label">Dernière activité</th>
                  <th className="px-6 py-4 text-right quizo-label">Score</th>
                </tr>
              </thead>
              <tbody>
                {rankedParticipants.map((participant, index) => (
                  <tr key={participant.id} className="border-b border-white/[0.055] last:border-0 hover:bg-white/[0.035]">
                    <td className="px-6 py-4 text-[#d8d2ce]">{participant.completedAt ? index + 1 : '-'}</td>
                    <td className="px-6 py-4 font-semibold text-white">{participant.name}</td>
                    <td className="px-6 py-4 text-[#a79d96]">
                      {participant.completedAt ? (
                        'Terminé'
                      ) : participant.isActive ? (
                        `Question ${(participant.currentQuestionIndex || 0) + 1}`
                      ) : (
                        <XCircle className="h-4 w-4 text-red-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#a79d96]">{formatDateTime(participant.lastActivityAt || participant.completedAt || participant.joinedAt) || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {participant.score !== undefined ? `${participant.score.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PremiumPanel>
    </AppShell>
  );
};

export default CreatorDashboard;
