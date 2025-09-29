import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCompetitionByShareCode, addParticipantToCompetition } from '@/services/manualQuizService';
import { Competition } from '@/types/quiz'; // Importation du type Competition manquant
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
const REGEXP_ONLY_ALPHANUMERIC = /^[a-zA-Z0-9]+$/;

// Interface pour les compétitions récentes
interface RecentCompetition {
  code: string;
  title: string;
  joinedAt: string;
}

const JoinByCode = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [shareCode, setShareCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [recentCompetitions, setRecentCompetitions] = useState<RecentCompetition[]>([]);
  
  // Vérifier le code après un délai d'inactivité
  useEffect(() => {
    if (shareCode.length === 6) {
      const timer = setTimeout(() => {
        checkCompetition();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setCompetition(null);
    }
  }, [shareCode]);
  
  // Fonction pour vérifier le code sans rejoindre
  const checkCompetition = async () => {
    const formattedCode = shareCode;
    
    if (!formattedCode || formattedCode.length !== 6) {
      return;
    }
    
    setIsCheckingCode(true);
    
    try {
      const competitionData = await getCompetitionByShareCode(formattedCode);
      setCompetition(competitionData);
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
    } finally {
      setIsCheckingCode(false);
    }
  };
  
  // Charger les compétitions récentes depuis le localStorage
  useEffect(() => {
    const storedCompetitions = localStorage.getItem('recentCompetitions');
    if (storedCompetitions) {
      try {
        setRecentCompetitions(JSON.parse(storedCompetitions));
      } catch (e) {
        console.error('Erreur lors du chargement des compétitions récentes:', e);
        localStorage.removeItem('recentCompetitions');
      }
    }
  }, []);
  
  // Ajouter une compétition à l'historique
  const addToRecentCompetitions = (code: string, title: string) => {
    const newCompetition: RecentCompetition = {
      code,
      title,
      joinedAt: new Date().toISOString()
    };
    
    const updatedCompetitions = [
      newCompetition,
      ...recentCompetitions.filter(c => c.code !== code).slice(0, 4) // Garder max 5 compétitions
    ];
    
    setRecentCompetitions(updatedCompetitions);
    localStorage.setItem('recentCompetitions', JSON.stringify(updatedCompetitions));
  };
  
  // Supprimer une compétition de l'historique
  const removeFromRecentCompetitions = (code: string) => {
    const updatedCompetitions = recentCompetitions.filter(c => c.code !== code);
    setRecentCompetitions(updatedCompetitions);
    localStorage.setItem('recentCompetitions', JSON.stringify(updatedCompetitions));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedCode = shareCode;
    
    if (!formattedCode) {
      toast.error('Veuillez saisir un code de partage');
      return;
    }
    
    if (formattedCode.length !== 6) {
      toast.error('Le code de partage doit contenir 6 caractères');
      return;
    }
    
    if (!participantName.trim()) {
      toast.error('Veuillez saisir votre nom');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Récupérer la compétition par code de partage
      const competition = await getCompetitionByShareCode(formattedCode);
      
      if (!competition) {
        toast.error('Code de partage invalide ou compétition expirée');
        setIsLoading(false);
        return;
      }
      
      // Vérifier si la compétition est active
      const now = new Date();
      const startDate = new Date(competition.startDate);
      const endDate = new Date(competition.endDate);
      
      if (now < startDate) {
        toast.error(`Cette compétition n'a pas encore commencé. Elle débutera le ${startDate.toLocaleDateString()} à ${startDate.toLocaleTimeString()}.`);
        setIsLoading(false);
        return;
      }
      
      if (now > endDate) {
        toast.error('Cette compétition est terminée.');
        setIsLoading(false);
        return;
      }
      
      // Ajouter le participant à la compétition
      const participantId = await addParticipantToCompetition(
        competition.id,
        user?.id || 'anonymous',
        participantName
      );
      
      toast.success('Vous avez rejoint la compétition avec succès!');
      
      // Rediriger vers la page de la compétition
      navigate(`/competition/${competition.id}?participant=${participantId}`);
      
      // Ajouter à l'historique
      addToRecentCompetitions(formattedCode, competition.title);
    } catch (error: any) {
      console.error('Erreur lors de la tentative de rejoindre la compétition:', error);
      toast.error(error.message || 'Une erreur est survenue');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Rejoindre une compétition</h1>
            <p className="text-muted-foreground">
              Entrez le code de partage fourni par l'organisateur pour participer à une compétition.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6 md:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="share-code">Code de partage</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={shareCode}
                    onChange={(value) => setShareCode(value.toUpperCase())}
                    pattern={REGEXP_ONLY_ALPHANUMERIC.source}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-center text-xs text-muted-foreground">Le code contient 6 caractères alphanumériques</p>
              </div>
              
              {isCheckingCode && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
              
              {competition && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="bg-muted/50 p-4 rounded-lg border border-muted"
                >
                  <h3 className="font-medium text-lg mb-2">{competition.title}</h3>
                  {competition.description && (
                    <p className="text-sm text-muted-foreground mb-2">{competition.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Début:</span>
                      <div>{new Date(competition.startDate).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fin:</span>
                      <div>{new Date(competition.endDate).toLocaleString()}</div>
                    </div>
                    <div className="col-span-2 mt-2">
                      <span className="text-muted-foreground">Participants:</span>
                      <div>{competition.participantsCount}</div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="participant-name">Votre nom</Label>
                <Input
                  id="participant-name"
                  placeholder="Comment souhaitez-vous être identifié?"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !shareCode || shareCode.length !== 6}
              >
                {isLoading ? 'Chargement...' : 'Rejoindre la compétition'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
            
            {recentCompetitions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-muted">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Compétitions récentes</h3>
                <div className="space-y-2">
                  {recentCompetitions.map((comp) => (
                    <div 
                      key={comp.code} 
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-muted-foreground mr-3" />
                        <div>
                          <p className="font-medium">{comp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Code: {comp.code} · {new Date(comp.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShareCode(comp.code)}
                        >
                          Utiliser
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromRecentCompetitions(comp.code)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      
      <footer className="bg-muted/30 py-6 px-6 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-center items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 QUIZO. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default JoinByCode;