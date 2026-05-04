import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Home, Medal, Share2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompetitionById, getCompetitionLeaderboard } from '@/services/manualQuizService';
import { Competition, Participant } from '@/types/quiz';

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
          toast.error('Competition non trouvee');
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

  const handleShare = () => {
    if (!competition) return;

    const shareUrl = `${window.location.origin}/join/${competition.shareCode}`;
    const shareText = `Rejoignez la competition "${competition.title}" avec le code: ${competition.shareCode}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Competition: ${competition.title}`,
          text: shareText,
          url: shareUrl,
        })
        .catch(err => console.error('Erreur lors du partage:', err));
      return;
    }

    navigator.clipboard
      .writeText(`${shareText}\n\n${shareUrl}`)
      .then(() => toast.success('Lien copie dans le presse-papier'))
      .catch(() => toast.error('Impossible de copier le lien'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Erreur</CardTitle>
              <CardDescription>Impossible de charger la competition</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center">La competition n'a pas pu etre trouvee.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/')}>Retour a l'accueil</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{competition.title}</h1>
            <p className="text-muted-foreground mb-4">{competition.description}</p>

            {userScore && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 mb-6 inline-block">
                <p className="text-green-800 dark:text-green-300 font-medium">Votre score: {userScore}%</p>
              </div>
            )}

            <div className="flex justify-center gap-4 mt-4">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center gap-4">
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                  Classement
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === 'desc' ? 'Score decroissant' : 'Score croissant'}
                </Button>
              </div>
              <CardDescription>
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {sortedParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun participant n'a encore termine le quiz.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedParticipants.map((participant, index) => {
                    const rank = index + 1;
                    const medalClass =
                      rank === 1
                        ? 'text-yellow-500'
                        : rank === 2
                          ? 'text-gray-400'
                          : rank === 3
                            ? 'text-amber-700'
                            : '';

                    return (
                      <div
                        key={participant.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${rank <= 3 ? 'bg-muted/50' : ''}`}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${medalClass} ${rank <= 3 ? 'bg-muted' : 'bg-muted/30'}`}>
                            {rank <= 3 ? <Medal className={`h-5 w-5 ${medalClass}`} /> : rank}
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {participant.completedAt ? new Date(participant.completedAt).toLocaleString() : 'En cours'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">{(participant.score || 0).toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
