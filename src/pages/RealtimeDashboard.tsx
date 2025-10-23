import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Users, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Activity,
  Play,
  Pause,
  BarChart3,
  Share2,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  getManualQuiz, 
  getQuizParticipants, 
  getQuizAttempts,
  updateQuizStatus,
  listenToParticipants,
  listenToAttempts
} from '@/services/manualQuizService';
import { ManualQuiz, Participant, Attempt } from '@/types/quiz';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const RealtimeDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<ManualQuiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id || !user) return;

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

        setQuiz(quizData);
        setIsLoading(false);

        // Charger les participants et tentatives initiales
        const [participantsData, attemptsData] = await Promise.all([
          getQuizParticipants(id),
          getQuizAttempts(id)
        ]);

        setParticipants(participantsData);
        setAttempts(attemptsData);

        // Écouter les changements en temps réel
        const unsubscribeParticipants = listenToParticipants(id, (updatedParticipants) => {
          setParticipants(updatedParticipants);
        });

        const unsubscribeAttempts = listenToAttempts(id, (updatedAttempts) => {
          setAttempts(updatedAttempts);
        });

        return () => {
          unsubscribeParticipants();
          unsubscribeAttempts();
        };
      } catch (error: any) {
        console.error('Erreur lors du chargement:', error);
        toast.error('Erreur lors du chargement du quiz');
        setIsLoading(false);
      }
    };

    loadQuizData();
  }, [id, user, navigate]);

  const handleStartQuiz = async () => {
    if (!id) return;
    
    try {
      await updateQuizStatus(id, 'active');
      setQuiz(prev => prev ? { ...prev, status: 'active' } : null);
      toast.success('Quiz démarré ! Les participants peuvent maintenant commencer.');
    } catch (error) {
      toast.error('Erreur lors du démarrage du quiz');
    }
  };

  const handleEndQuiz = async () => {
    if (!id) return;
    
    try {
      await updateQuizStatus(id, 'completed');
      setQuiz(prev => prev ? { ...prev, status: 'completed' } : null);
      toast.success('Quiz terminé !');
    } catch (error) {
      toast.error('Erreur lors de la fermeture du quiz');
    }
  };

  const copyShareLink = () => {
    if (!quiz?.shareCode) return;
    
    const link = `${window.location.origin}/join-quiz/${quiz.shareCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Lien copié dans le presse-papier !');
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

  const getActiveParticipants = () => {
    return participants.filter(p => p.isActive && !p.completedAt).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement du dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
                <p className="text-muted-foreground">{quiz.description}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant={quiz.status === 'active' ? 'default' : quiz.status === 'completed' ? 'secondary' : 'outline'}>
                  {quiz.status === 'active' ? 'En cours' : quiz.status === 'completed' ? 'Terminé' : 'Brouillon'}
                </Badge>
                
                {quiz.mode === 'realtime' && (
                  <Badge variant="outline" className="gap-1">
                    <Activity className="h-3 w-3" />
                    Temps Réel
                  </Badge>
                )}
                
                {quiz.status !== 'completed' && (
                  <>
                    {quiz.status === 'draft' || quiz.status === 'active' ? (
                      <Button
                        onClick={quiz.status === 'draft' ? handleStartQuiz : handleEndQuiz}
                        className="gap-2"
                      >
                        {quiz.status === 'draft' ? (
                          <>
                            <Play className="h-4 w-4" />
                            Démarrer
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4" />
                            Terminer
                          </>
                        )}
                      </Button>
                    ) : null}
                    
                    <Button variant="outline" onClick={copyShareLink} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copier le lien
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{participants.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getActiveParticipants()} actifs maintenant
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getCompletionRate()}%</div>
                  <Progress value={getCompletionRate()} className="mt-2" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getAverageScore()}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sur {attempts.filter(a => a.completedAt).length} tentatives
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Questions</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quiz.questions.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {quiz.timeLimit ? `${quiz.timeLimit} min` : 'Pas de limite'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contenu avec onglets */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="results">Résultats</TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Participants en temps réel</CardTitle>
                  <CardDescription>
                    Suivez la progression de vos participants en direct
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {participants.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucun participant pour le moment</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Partagez le code : <span className="font-mono font-bold">{quiz.shareCode}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {participants.map((participant, index) => (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-3 w-3 rounded-full ${participant.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <div>
                              <p className="font-medium">{participant.name}</p>
                              <p className="text-sm text-muted-foreground">{participant.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            {quiz.mode === 'realtime' && participant.currentQuestionIndex !== undefined && (
                              <div className="text-sm text-muted-foreground">
                                Question {participant.currentQuestionIndex + 1}/{quiz.questions.length}
                              </div>
                            )}
                            
                            {participant.completedAt ? (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Terminé
                              </Badge>
                            ) : participant.isActive ? (
                              <Badge className="gap-1">
                                <Activity className="h-3 w-3" />
                                En cours
                              </Badge>
                            ) : (
                              <Badge variant="outline">En attente</Badge>
                            )}
                            
                            {participant.score !== undefined && (
                              <div className="text-right">
                                <div className="text-2xl font-bold">{participant.score}%</div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Liste des participants */}
            <TabsContent value="participants">
              <Card>
                <CardHeader>
                  <CardTitle>Liste des participants</CardTitle>
                  <CardDescription>
                    {participants.length} participant(s) inscrit(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rejoint le</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.name}</TableCell>
                          <TableCell>{participant.email || '-'}</TableCell>
                          <TableCell>{new Date(participant.joinedAt).toLocaleString()}</TableCell>
                          <TableCell>
                            {participant.completedAt ? (
                              <Badge variant="secondary">Terminé</Badge>
                            ) : participant.isActive ? (
                              <Badge>En cours</Badge>
                            ) : (
                              <Badge variant="outline">En attente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {participant.score !== undefined ? `${participant.score}%` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Résultats détaillés */}
            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Résultats détaillés</CardTitle>
                  <CardDescription>
                    Analyse des performances de chaque participant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attempts.filter(a => a.completedAt).length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucun résultat disponible</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Participant</TableHead>
                          <TableHead>Début</TableHead>
                          <TableHead>Fin</TableHead>
                          <TableHead>Durée</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attempts
                          .filter(a => a.completedAt)
                          .sort((a, b) => (b.score || 0) - (a.score || 0))
                          .map((attempt) => {
                            const participant = participants.find(p => p.id === attempt.participantId);
                            return (
                              <TableRow key={attempt.id}>
                                <TableCell className="font-medium">{participant?.name || 'Inconnu'}</TableCell>
                                <TableCell>{new Date(attempt.startedAt).toLocaleTimeString()}</TableCell>
                                <TableCell>{attempt.completedAt ? new Date(attempt.completedAt).toLocaleTimeString() : '-'}</TableCell>
                                <TableCell>
                                  {attempt.timeSpent 
                                    ? `${Math.floor(attempt.timeSpent / 60)}:${String(attempt.timeSpent % 60).padStart(2, '0')}`
                                    : '-'
                                  }
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-bold ${
                                    (attempt.score || 0) >= 80 ? 'text-green-600' :
                                    (attempt.score || 0) >= 60 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {attempt.score}%
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default RealtimeDashboard;
