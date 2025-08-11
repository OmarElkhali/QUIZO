import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trophy, Medal, Share2, Home, ArrowUpDown } from 'lucide-react';
import { getCompetitionByShareCode, getCompetitionLeaderboard } from '@/services/manualQuizService';
import { Competition, Participant } from '@/types/quiz';

const Leaderboard = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const userScore = searchParams.get('score');
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    const fetchCompetitionAndLeaderboard = async () => {
      if (!id) return;
      
      try {
        // Récupérer la compétition
        const competitionData = await getCompetitionByShareCode(id);
        
        if (!competitionData) {
          toast.error('Compétition non trouvée');
          navigate('/join');
          return;
        }
        
        setCompetition(competitionData);
        
        // Récupérer le classement
        const leaderboardData = await getCompetitionLeaderboard(competitionData.id);
        setParticipants(leaderboardData);
      } catch (error: any) {
        console.error('Erreur lors du chargement du classement:', error);
        toast.error(error.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompetitionAndLeaderboard();
  }, [id, navigate]);
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  const sortedParticipants = [...participants].sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
  });
  
  const handleShare = () => {
    if (!competition) return;
    
    const shareText = `Rejoignez la compétition "${competition.title}" avec le code: ${competition.shareCode}`;
    const shareUrl = `${window.location.origin}/join`;
    
    if (navigator.share) {
      navigator.share({
        title: `Compétition: ${competition.title}`,
        text: shareText,
        url: shareUrl
      }).catch(err => console.error('Erreur lors du partage:', err));
    } else {
      navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        .then(() => toast.success('Lien copié dans le presse-papier!'))
        .catch(() => toast.error('Impossible de copier le lien'));
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
              <CardDescription>Impossible de charger la compétition</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center">La compétition n'a pas pu être trouvée.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
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
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                  Classement
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={toggleSortOrder}>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === 'desc' ? 'Score décroissant' : 'Score croissant'}
                </Button>
              </div>
              <CardDescription>
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {sortedParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun participant n'a encore terminé le quiz.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedParticipants.map((participant, index) => {
                    const rank = sortOrder === 'desc' ? index + 1 : participants.length - index;
                    let medalColor = '';
                    let medalIcon = null;
                    
                    if (rank === 1) {
                      medalColor = 'text-yellow-500';
                      medalIcon = <Medal className="h-5 w-5 mr-2 text-yellow-500" />;
                    } else if (rank === 2) {
                      medalColor = 'text-gray-400';
                      medalIcon = <Medal className="h-5 w-5 mr-2 text-gray-400" />;
                    } else if (rank === 3) {
                      medalColor = 'text-amber-700';
                      medalIcon = <Medal className="h-5 w-5 mr-2 text-amber-700" />;
                    }
                    
                    return (
                      <div 
                        key={participant.id} 
                        className={`flex items-center justify-between p-4 rounded-lg ${rank <= 3 ? 'bg-muted/50' : ''}`}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${medalColor} ${rank <= 3 ? 'bg-muted' : 'bg-muted/30'}`}>
                            {medalIcon || rank}
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(participant.completedAt || '').toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">
                          {participant.score?.toFixed(1)}%
                        </div>
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