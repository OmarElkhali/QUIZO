
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuiz } from '@/hooks/useQuiz';
import { toast } from 'sonner';
import { Mail, Share2, Copy, Check, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ShareQuizDialogProps {
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareQuizDialog = ({ quizId, open, onOpenChange }: ShareQuizDialogProps) => {
  const { shareQuiz, isLoading } = useQuiz();
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }
    
    try {
      await shareQuiz(quizId, email);
      setEmail('');
      // Nous ne fermons pas le dialogue car l'utilisateur pourrait vouloir partager avec plusieurs personnes
    } catch (error) {
      // Errors are handled in the quiz context
    }
  };
  
  const copyShareLink = async () => {
    const shareLink = `${window.location.origin}/shared-quiz/${quizId}`;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Lien copié dans le presse-papier');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Impossible de copier le lien');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl">Partager le Quiz</DialogTitle>
          <DialogDescription>
            Invitez d'autres personnes à participer à ce quiz
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Lien de partage</Label>
            <div className="flex gap-2">
              <Input 
                value={`${window.location.origin}/shared-quiz/${quizId}`} 
                readOnly
                className="bg-muted/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyShareLink}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou inviter par email
              </span>
            </div>
          </div>
          
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ami@exemple.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full hover-scale" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Partage en cours...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Inviter
                </>
              )}
            </Button>
          </form>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-start space-x-2">
              <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium">Quiz collaboratif</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Les personnes invitées pourront voir et participer au quiz. Ils auront également accès aux résultats.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <DialogFooter className="text-xs text-muted-foreground">
          Vous pouvez gérer les accès à tout moment dans les paramètres du quiz.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
