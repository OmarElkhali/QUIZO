import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BarChart, CheckCircle, Clock, Copy, Share2, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getCompetitionById,
  getCompetitionByShareCode,
  listenToCompetitionAttempts,
  listenToCompetitionParticipants,
} from '@/services/manualQuizService';
import { Attempt, Competition, Participant } from '@/types/quiz';

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
        const competitionData =
          id.length === 6 ? await getCompetitionByShareCode(id) : await getCompetitionById(id);

        if (!competitionData) {
          toast.error('Competition non trouvee');
          navigate('/history');
          return;
        }

        if (competitionData.creatorId !== user.id) {
          toast.error("Vous n'avez pas acces a ce tableau de bord");
          navigate('/history');
          return;
        }

        if (cancelled) return;

        setCompetition(competitionData);
        unsubscribeParticipants = listenToCompetitionParticipants(competitionData.id, updatedParticipants => {
          setParticipants(updatedParticipants);
        });
        unsubscribeAttempts = listenToCompetitionAttempts(competitionData.id, updatedAttempts => {
          setAttempts(updatedAttempts);
        });
      } catch (error) {
        console.error('Erreur lors du chargement des donnees:', error);
        toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  const copyShareCode = () => {
    if (!competition) return;

    navigator.clipboard
      .writeText(competition.shareCode)
      .then(() => {
        setCopied(true);
        toast.success('Code copie dans le presse-papier');
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Impossible de copier le code'));
  };

  const handleShare = () => {
    if (!competition) return;

    const shareUrl = `${window.location.origin}/join/${competition.shareCode}`;
    const shareText = `Rejoignez ma competition "${competition.title}" avec le code: ${competition.shareCode}`;

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
              <CardDescription>Impossible de charger les donnees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center">Les donnees de la competition n'ont pas pu etre chargees.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/history')}>Retour</Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  const startDate = new Date(competition.startDate);
  const endDate = new Date(competition.endDate);
  const now = new Date();
  const isActive = competition.status !== 'completed' && competition.isActive && now >= startDate && now <= endDate;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold">{competition.title}</h1>
                <p className="text-muted-foreground">{competition.description}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
                <Button onClick={() => navigate(`/leaderboard/${competition.id}`)}>Voir le classement</Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">{isActive ? 'Competition active' : 'Competition inactive'}</span>
              </div>

              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  Du {startDate.toLocaleDateString()} au {endDate.toLocaleDateString()}
                </span>
              </div>

              <div className="flex-1" />

              <div className="flex items-center bg-primary/10 px-3 py-1.5 rounded-md">
                <span data-testid="competition-share-code" className="font-mono font-bold text-lg tracking-wider mr-2">{competition.shareCode}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyShareCode}>
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalParticipants}</div>
                <p className="text-muted-foreground text-sm">
                  {stats.activeParticipants} actif{stats.activeParticipants !== 1 ? 's' : ''} maintenant
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-green-500" />
                  Score moyen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.averageScore.toFixed(1)}%</div>
                <p className="text-muted-foreground text-sm">
                  Base sur {stats.completedAttempts} tentative{stats.completedAttempts !== 1 ? 's' : ''} terminee
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-amber-500" />
                  Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(stats.participationRate)}%</div>
                <p className="text-muted-foreground text-sm">
                  {stats.completedAttempts} sur {stats.totalParticipants} participant{stats.totalParticipants !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Participants ({participants.length})
              </CardTitle>
              <CardDescription>Progression, activite et scores en direct</CardDescription>
            </CardHeader>

            <CardContent>
              {rankedParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun participant n'a encore rejoint la competition.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Rang</th>
                        <th className="text-left py-3 px-4 font-medium">Nom</th>
                        <th className="text-left py-3 px-4 font-medium">Statut</th>
                        <th className="text-left py-3 px-4 font-medium">Derniere activite</th>
                        <th className="text-right py-3 px-4 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedParticipants.map((participant, index) => (
                        <tr key={participant.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">{participant.completedAt ? index + 1 : '-'}</td>
                          <td className="py-3 px-4 font-medium">{participant.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {participant.completedAt ? (
                              'Termine'
                            ) : participant.isActive ? (
                              `Question ${(participant.currentQuestionIndex || 0) + 1}`
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {formatDateTime(participant.lastActivityAt || participant.completedAt || participant.joinedAt) || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {participant.score !== undefined ? `${participant.score.toFixed(1)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreatorDashboard;
