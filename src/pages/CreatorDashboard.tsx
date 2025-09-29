import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, BarChart, Clock, Share2, Copy, CheckCircle, XCircle } from 'lucide-react';
import { 
  getCompetitionByShareCode, 
  getCompetitionById,
  subscribeToCompetitionStats, 
  subscribeToCompetitionParticipants 
} from '@/services/manualQuizService';
import { Competition, Participant } from '@/types/quiz';
import LiveLeaderboard from '@/components/LiveLeaderboard';

const CreatorDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const fetchCompetitionAndStats = async () => {
      if (!id) return;
      
      try {
        // Récupérer la compétition
        let competitionData: Competition | null = null;
        
        if (id.length === 6) {
          competitionData = await getCompetitionByShareCode(id);
        } else {
          competitionData = await getCompetitionById(id);
        }
        
        if (!competitionData) {
          toast.error('Compétition non trouvée');
          navigate('/history');
          return;
        }
        
        // Vérifier que l'utilisateur est le créateur
        if (competitionData.creatorId !== user?.id) {
          toast.error('Vous n\'avez pas accès à ce tableau de bord');
          navigate('/history');
          return;
        }
        
        setCompetition(competitionData);
        
        // Abonnement aux statistiques en temps réel
        const unsubscribeStats = subscribeToCompetitionStats(
          competitionData.id,
          (statsData) => {
            setStats(statsData);
          }
        );
        
        // Abonnement aux participants en temps réel
        const unsubscribeParticipants = subscribeToCompetitionParticipants(
          competitionData.id,
          (participantsData) => {
            setParticipants(participantsData);
          }
        );
        
        setIsLoading(false);
        
        // Nettoyer les abonnements lors du démontage
        return () => {
          unsubscribeStats();
          unsubscribeParticipants();
        };
      } catch (error: any) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error(error.message || 'Une erreur est survenue');
        setIsLoading(false);
      }
    };
    
    fetchCompetitionAndStats();
  }, [id, user, navigate]);
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/" />;
  }
  
  const copyShareCode = () => {
    if (!competition) return;
    
    navigator.clipboard.writeText(competition.shareCode)
      .then(() => {
        setCopied(true);
        toast.success('Code copié dans le presse-papier!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Impossible de copier le code'));
  };
  
  const handleShare = () => {
    if (!competition) return;
    
    const shareText = `Rejoignez ma compétition "${competition.title}" avec le code: ${competition.shareCode}`;
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
  
  if (!competition || !stats) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Erreur</CardTitle>
              <CardDescription>Impossible de charger les données</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center">Les données de la compétition n'ont pas pu être chargées.</p>
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
  const isActive = now >= startDate && now <= endDate;
  
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
                <Button onClick={() => navigate(`/leaderboard/${competition.id}`)}>
                  Voir le classement
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">
                  {isActive ? 'Compétition active' : 'Compétition inactive'}
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  Du {startDate.toLocaleDateString()} au {endDate.toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex-1"></div>
              
              <div className="flex items-center bg-primary/10 px-3 py-1.5 rounded-md">
                <span className="font-mono font-bold text-lg tracking-wider mr-2">{competition.shareCode}</span>
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
                  {stats.completedAttempts} ont terminé ({Math.round(stats.participationRate)}%)
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
                  Basé sur {stats.completedAttempts} tentative{stats.completedAttempts !== 1 ? 's' : ''} complétée{stats.completedAttempts !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-amber-500" />
                  Taux de complétion
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
              <CardDescription>
                Liste des participants et leurs scores
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucun participant n'a encore terminé le quiz.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Rang</th>
                        <th className="text-left py-3 px-4 font-medium">Nom</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-right py-3 px-4 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => (
                        <tr key={participant.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">{index + 1}</td>
                          <td className="py-3 px-4 font-medium">{participant.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {participant.completedAt 
                              ? new Date(participant.completedAt).toLocaleString() 
                              : <XCircle className="h-4 w-4 text-red-500" />}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {participant.score !== undefined 
                              ? `${participant.score.toFixed(1)}%` 
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Remplacer le tableau de participants par le LiveLeaderboard */}
          <div className="mt-8">
            <LiveLeaderboard competitionId={competition?.id || ''} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatorDashboard;