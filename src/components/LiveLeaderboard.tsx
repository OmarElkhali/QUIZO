import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Clock, User } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Participant } from '@/types/quiz';

interface LiveLeaderboardProps {
  competitionId: string;
}

const LiveLeaderboard = ({ competitionId }: LiveLeaderboardProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!competitionId) return;
    
    setIsLoading(true);
    
    // Créer une requête pour les participants de cette compétition
    const q = query(
      collection(db, 'participants'),
      where('competitionId', '==', competitionId),
      orderBy('score', 'desc'),
      orderBy('completedAt')
    );
    
    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participantsData: Participant[] = [];
      
      let index = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        participantsData.push({
          id: doc.id,
          competitionId: data.competitionId,
          userId: data.userId,
          name: data.name,
          joinedAt: data.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          score: data.score || 0,
          completedAt: data.completedAt?.toDate?.()?.toISOString(),
          rank: index + 1,
          progress: data.progress || 0,
          totalTimeSec: data.totalTimeSec || 0
        });
        index++;
      });
      
      setParticipants(participantsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Erreur lors de l\'écoute des participants:', error);
      setIsLoading(false);
    });
    
    // Nettoyer l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, [competitionId]);
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-amber-500" />
            Classement en direct
          </CardTitle>
          <CardDescription>Chargement des participants...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-amber-500" />
          Classement en direct
        </CardTitle>
        <CardDescription>
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Aucun participant pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Nom</div>
              <div className="col-span-3">Progression</div>
              <div className="col-span-2 text-right">Temps</div>
              <div className="col-span-3 text-right">Score</div>
            </div>
            
            {participants.map((participant) => {
              let medalColor = '';
              let medalIcon = null;
              
              if (participant.rank === 1) {
                medalColor = 'text-yellow-500';
                medalIcon = <Medal className="h-4 w-4 mr-1 text-yellow-500" />;
              } else if (participant.rank === 2) {
                medalColor = 'text-gray-400';
                medalIcon = <Medal className="h-4 w-4 mr-1 text-gray-400" />;
              } else if (participant.rank === 3) {
                medalColor = 'text-amber-700';
                medalIcon = <Medal className="h-4 w-4 mr-1 text-amber-700" />;
              }
              
              return (
                <div 
                  key={participant.id} 
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-md ${participant.rank <= 3 ? 'bg-muted/50' : ''}`}
                >
                  <div className={`col-span-1 font-bold ${medalColor}`}>
                    {medalIcon || participant.rank}
                  </div>
                  
                  <div className="col-span-3 font-medium truncate">
                    {participant.name}
                  </div>
                  
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Progress value={participant.progress || 0} className="h-2" />
                      <span className="text-xs">{participant.progress || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-right flex items-center justify-end">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span>{formatTime(participant.totalTimeSec || 0)}</span>
                  </div>
                  
                  <div className="col-span-3 text-right">
                    {participant.completedAt ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900">
                        {participant.score?.toFixed(1)}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                        En cours
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveLeaderboard;