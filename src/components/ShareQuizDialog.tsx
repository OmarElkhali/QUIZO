import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, Mail, Share2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuiz } from '@/hooks/useQuiz';
import { getOrCreateShareCode } from '@/services/quizService';

interface ShareQuizDialogProps {
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareQuizDialog = ({ quizId, open, onOpenChange }: ShareQuizDialogProps) => {
  const { shareQuiz, isLoading } = useQuiz();
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);

  const shareLink = useMemo(() => {
    return shareCode ? `${window.location.origin}/join-quiz/${shareCode}` : '';
  }, [shareCode]);

  useEffect(() => {
    let cancelled = false;

    const loadShareCode = async () => {
      if (!open || !quizId) return;

      setLoadingCode(true);
      try {
        const code = await getOrCreateShareCode(quizId);
        if (!cancelled) {
          setShareCode(code);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du code de partage:', error);
        toast.error('Impossible de generer le lien de partage');
      } finally {
        if (!cancelled) {
          setLoadingCode(false);
        }
      }
    };

    loadShareCode();

    return () => {
      cancelled = true;
    };
  }, [open, quizId]);

  const handleShare = async (event: FormEvent) => {
    event.preventDefault();

    if (!email) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    try {
      await shareQuiz(quizId, email);
      toast.success(`Invitation ajoutee pour ${email}`);
      setEmail('');
    } catch (error) {
      console.error('Erreur lors du partage du quiz:', error);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Lien copie dans le presse-papier');
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Impossible de copier le lien');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl">Partager le Quiz</DialogTitle>
          <DialogDescription>Invitez d'autres personnes a participer a ce quiz</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Lien de partage</Label>
            <div className="flex gap-2">
              <Input
                value={loadingCode ? 'Generation du lien...' : shareLink}
                readOnly
                className="bg-muted/50"
                disabled={loadingCode}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyShareLink}
                className="shrink-0"
                disabled={loadingCode || !shareCode}
              >
                {loadingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {shareCode && (
              <p className="text-xs text-muted-foreground">
                Code de partage: <span className="font-mono font-bold text-primary">{shareCode}</span>
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou inviter par email</span>
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
                  onChange={event => setEmail(event.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full hover-scale" disabled={isLoading}>
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
                <h3 className="text-sm font-medium">Acces par lien</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Les invites rejoignent avec ce lien. Leurs droits viennent du code, pas de leur email.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <DialogFooter className="text-xs text-muted-foreground">
          Le code reste lisible dans les resultats et les dashboards proprietaire.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
