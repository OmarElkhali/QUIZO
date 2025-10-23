import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserQuizResults, getQuizResults, QuizResult } from '@/services/quizService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuizResultsHistoryProps {
  quizId?: string; // Si fourni, affiche uniquement les résultats pour ce quiz
}

export const QuizResultsHistory = ({ quizId }: QuizResultsHistoryProps) => {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadResults();
    }
  }, [user?.id, quizId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let fetchedResults: QuizResult[];
      
      if (quizId && user?.id) {
        // Récupérer les résultats pour un quiz spécifique
        fetchedResults = await getQuizResults(quizId, user.id);
      } else if (user?.id) {
        // Récupérer tous les résultats de l'utilisateur
        fetchedResults = await getUserQuizResults(user.id);
      } else {
        fetchedResults = [];
      }
      
      setResults(fetchedResults);
    } catch (err: any) {
      console.error('Erreur lors du chargement des résultats:', err);
      setError(err.message || 'Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (resultId: string) => {
    setExpandedResults((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={loadResults} 
            className="mt-4"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-2">
              Aucun résultat pour le moment
            </p>
            <p className="text-sm text-muted-foreground">
              Complétez des quiz pour voir vos résultats ici
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcul des statistiques
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const bestScore = Math.max(...results.map(r => r.score));
  const totalQuizzes = results.length;

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      {!quizId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Score Moyen</CardDescription>
              <CardTitle className={`text-3xl ${getScoreColor(averageScore)}`}>
                {averageScore.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Meilleur Score</CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {bestScore}%
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Quiz Complétés</CardDescription>
              <CardTitle className="text-3xl">
                {totalQuizzes}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Liste des résultats */}
      <div className="space-y-4">
        <AnimatePresence>
          {results.map((result, index) => {
            const isExpanded = expandedResults.has(result.id!);
            
            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="cursor-pointer" onClick={() => toggleExpanded(result.id!)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{result.quizTitle}</CardTitle>
                          <Badge variant={getScoreBadgeVariant(result.score)}>
                            {result.score}%
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(result.completedAt, {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>
                              {result.correctAnswers}/{result.totalQuestions} correctes
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(result.timeSpent)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(result.id!);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Separator />
                        <CardContent className="pt-6">
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Détails des réponses
                          </h4>
                          
                          <div className="space-y-3">
                            {result.answers.map((answer, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border ${
                                  answer.isCorrect
                                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                                    : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {answer.isCorrect ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                  )}
                                  <span className="text-sm font-medium">
                                    Question {idx + 1}: {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4" />
                              <span>
                                Taux de réussite: {result.correctAnswers}/{result.totalQuestions} (
                                {((result.correctAnswers / result.totalQuestions) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
