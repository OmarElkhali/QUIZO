import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Home, Medal, Share2, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompetitionById, getCompetitionLeaderboard } from '@/services/manualQuizService';
import { Competition, Participant } from '@/types/quiz';
import { cn } from '@/lib/utils';

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
          description="La compétition n'a pas pu être trouvée."
          action={
            <Button className="bg-[#d77a36] text-white hover:bg-[#b85f26]" onClick={() => navigate('/')}>
              Retour à l’accueil
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Classement"
        title={competition.title}
        description={competition.description || 'Scores finaux et rangs des participants.'}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
            <Button variant="outline" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          </div>
        }
      />

      {userScore && (
        <div className="mb-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100">
          Votre score : <span className="font-semibold">{userScore}%</span>
        </div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Participants" value={participants.length} detail="Avec tentative terminée" icon={Users} />
        <StatCard label="Score moyen" value={`${averageScore}%`} detail="Moyenne du classement" icon={Trophy} />
        <StatCard label="Code" value={competition.shareCode} detail="Invitation active" icon={Share2} />
      </section>

      <Card className="border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        <CardHeader className="border-b border-white/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center text-white">
                <Trophy className="mr-2 h-5 w-5 text-[#f7c693]" />
                Classement live
              </CardTitle>
              <CardDescription className="text-slate-500">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-slate-300 hover:bg-white/[0.08] hover:text-white"
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {sortOrder === 'desc' ? 'Score décroissant' : 'Score croissant'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {sortedParticipants.length === 0 ? (
            <StateCard state="empty" title="Aucun résultat" description="Aucun participant n'a encore terminé le quiz." />
          ) : (
            <div className="space-y-3">
              {sortedParticipants.map((participant, index) => {
                const rank = index + 1;
                const medalClass =
                  rank === 1
                    ? 'text-yellow-300'
                    : rank === 2
                      ? 'text-slate-300'
                      : rank === 3
                        ? 'text-[#f7c693]'
                        : 'text-slate-500';

                return (
                  <div
                    key={participant.id}
                    className={cn(
                      'flex items-center justify-between gap-4 rounded-lg border p-4 transition',
                      rank <= 3
                        ? 'border-[#d77a36]/30 bg-[#d77a36]/10'
                        : 'border-white/10 bg-[#0f141c] hover:bg-white/[0.055]'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#0b0f14] font-semibold', medalClass)}>
                        {rank <= 3 ? <Medal className="h-5 w-5" /> : rank}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{participant.name}</p>
                        <p className="text-xs text-slate-500">
                          {participant.completedAt ? new Date(participant.completedAt).toLocaleString() : 'En cours'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-white">{(participant.score || 0).toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">Rang #{rank}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default Leaderboard;
