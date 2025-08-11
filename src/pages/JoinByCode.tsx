import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCompetitionByShareCode, addParticipantToCompetition } from '@/services/manualQuizService';

const JoinByCode = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [shareCode, setShareCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareCode.trim()) {
      toast.error('Veuillez saisir un code de partage');
      return;
    }
    
    if (!participantName.trim()) {
      toast.error('Veuillez saisir votre nom');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Récupérer la compétition par code de partage
      const competition = await getCompetitionByShareCode(shareCode.toUpperCase());
      
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
                <Input
                  id="share-code"
                  placeholder="Entrez le code à 6 caractères"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg tracking-wider uppercase"
                  required
                />
              </div>
              
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
                disabled={isLoading}
              >
                {isLoading ? 'Chargement...' : 'Rejoindre la compétition'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
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