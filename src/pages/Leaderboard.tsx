import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Home, Medal, Share2, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { getCompetitionById, getCompetitionLeaderboard } from '@/services/manualQuizService';
import { Competition, Participant } from '@/types/quiz';
import { cn } from '@/lib/utils';
import { LeaderboardPodium, PremiumMetric, PremiumPanel } from '@/components/ui/premium';

const Leaderboard = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userScore = searchParams.get('score');

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;

    const fetchCompetitionAndLeaderboard = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const competitionData = await getCompetitionById(id);

        if (!competitionData) {
          toast.error('Compétition non trouvée');
          navigate('/join');
          return;
        }

        const leaderboardData = await getCompetitionLeaderboard(competitionData.id);

        if (!cancelled) {
          setCompetition(competitionData);
          setParticipants(leaderboardData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du classement:', error);
        toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCompetitionAndLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
  }, [participants, sortOrder]);

  const averageScore = sortedParticipants.length
    ? Math.round(sortedParticipants.reduce((sum, participant) => sum + (participant.score || 0), 0) / sortedParticipants.length)
    : 0;

  const handleShare = () => {
    if (!competition) return;

    const shareUrl = `${window.location.origin}/join/${competition.shareCode}`;
    const shareText = `Rejoignez la compétition "${competition.title}" avec le code: ${competition.shareCode}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Compétition: ${competition.title}`,
          text: shareText,
          url: shareUrl,
        })
        .catch(err => console.error('Erreur lors du partage:', err));
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
        <StateCard state="loading" title="Chargement du classement" description="Calcul des scores et des rangs." />
      </AppShell>
    );
  }

  if (!competition) {
    return (
      <AppShell>
        <StateCard
          state="error"
          title="Impossible de charger la compétition"
          description="La compétition n’a pas pu être trouvée."
          action={
            <Button className="quizo-copper-button" onClick={() => navigate('/')}>
              Retour à l’accueil
            </Button>
          }
        />
      </AppShell>
    );
  }

  const podiumParticipants = sortedParticipants.slice(0, 3).map((participant) => ({
    id: participant.id,
    name: participant.name,
    score: participant.score || 0,
    time: participant.completedAt ? new Date(participant.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
  }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Classement en direct"
        title={competition.title}
        description={`${participants.length} participant${participants.length !== 1 ? 's' : ''} · Scores finaux et rangs de la session.`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="quizo-outline-button" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Partager le quiz
            </Button>
            <Button variant="outline" className="quizo-outline-button" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          </div>
        }
      />

      {userScore && (
        <div className="mb-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100">
          Votre score : <span className="font-semibold">{userScore}%</span>
        </div>
      )}

      <section className="mb-8 grid gap-5 md:grid-cols-3">
        <PremiumMetric label="Participants" value={participants.length} icon={Users} tone="blue" />
        <PremiumMetric label="Score moyen" value={`${averageScore}%`} icon={Trophy} tone="copper" />
        <PremiumMetric label="Code" value={competition.shareCode} icon={Share2} tone="green" />
      </section>

      {podiumParticipants.length >= 3 && (
        <section className="mb-10">
          <LeaderboardPodium participants={podiumParticipants} />
        </section>
      )}

      <PremiumPanel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center text-2xl font-bold text-white">
              <Trophy className="mr-2 h-6 w-6 text-[#ffb77d]" />
              Classement live
            </h2>
            <p className="mt-1 text-sm text-[#a79d96]">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-[#d8d2ce] hover:bg-white/[0.08] hover:text-white"
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {sortOrder === 'desc' ? 'Score décroissant' : 'Score croissant'}
          </Button>
        </div>

        {sortedParticipants.length === 0 ? (
          <div className="p-6">
            <StateCard state="empty" title="Aucun résultat" description="Aucun participant n’a encore terminé le quiz." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-white/[0.07] text-left">
                  <th className="px-6 py-4 quizo-label">Rang</th>
                  <th className="px-6 py-4 quizo-label">Participant</th>
                  <th className="px-6 py-4 text-right quizo-label">Score</th>
                  <th className="px-6 py-4 text-right quizo-label">Statut</th>
                </tr>
              </thead>
              <tbody>
                {sortedParticipants.map((participant, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={participant.id}
                      className={cn(
                        'border-b border-white/[0.055] transition last:border-b-0 hover:bg-white/[0.035]',
                        rank <= 3 && 'bg-orange-500/[0.055]'
                      )}
                    >
                      <td className="px-6 py-5">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30 font-bold', rank <= 3 ? 'text-[#ffb77d]' : 'text-[#a79d96]')}>
                          {rank <= 3 ? <Medal className="h-5 w-5" /> : rank}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-semibold text-white">{participant.name}</p>
                        <p className="text-xs text-[#8f8580]">
                          {participant.completedAt ? new Date(participant.completedAt).toLocaleString() : 'En cours'}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-2xl font-black text-white">{(participant.score || 0).toFixed(1)}%</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={cn('rounded-full px-3 py-1 text-xs font-bold', participant.completedAt ? 'bg-emerald-500/10 text-emerald-300' : 'bg-orange-500/10 text-[#ffb77d]')}>
                          {participant.completedAt ? 'Terminé' : 'En cours'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PremiumPanel>
    </AppShell>
  );
};

export default Leaderboard;
