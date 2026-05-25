import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuiz } from '@/hooks/useQuiz';
import { getOrCreateShareCode } from '@/services/quizService';
import { toast } from 'sonner';
import { Mail, Share2, Copy, Check, Users, Loader2, QrCode, Download, MessageCircle, Link2, Facebook, Twitter, Linkedin, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ShareQuizDialogProps {
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareQuizDialog = ({ quizId, open, onOpenChange }: ShareQuizDialogProps) => {
  const { shareQuiz, isLoading } = useQuiz();
  const [email, setEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string>('');
  const [shareCode, setShareCode] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [shareStats, setShareStats] = useState({ views: 0, joins: 0 });
  
  // Charger ou générer le shareCode et QR code quand le dialog s'ouvre
  useEffect(() => {
    const loadShareCode = async () => {
      if (open && quizId) {
        setLoadingCode(true);
        try {
          const code = await getOrCreateShareCode(quizId);
          setShareCode(code);
          
          // Générer QR code via API externe
          const shareLink = `${window.location.origin}/shared-quiz/${quizId}?code=${code}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}`;
          setQrCodeUrl(qrUrl);
          
          // TODO: Charger les statistiques de partage depuis Firestore
          // const stats = await getShareStats(quizId);
          // setShareStats(stats);
        } catch (error) {
          console.error('Erreur lors du chargement du code de partage:', error);
          toast.error('Impossible de générer le lien de partage');
        } finally {
          setLoadingCode(false);
        }
      }
    };
    
    loadShareCode();
  }, [open, quizId]);
  
  const handleAddEmail = () => {
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Adresse email invalide');
      return;
    }
    
    if (emails.includes(email)) {
      toast.error('Email déjà ajouté');
      return;
    }
    
    setEmails([...emails, email]);
    setEmail('');
    toast.success('Email ajouté');
  };
  
  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(e => e !== emailToRemove));
  };
  
  const handleShareMultiple = async () => {
    if (emails.length === 0) {
      toast.error('Ajoutez au moins une adresse email');
      return;
    }
    
    try {
      const promises = emails.map(email => shareQuiz(quizId, email));
      await Promise.all(promises);
      toast.success(`✉️ ${emails.length} invitation(s) envoyée(s)`);
      setEmails([]);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi des invitations');
    }
  };
  
  const copyShareLink = async (format: 'link' | 'markdown' | 'html' | 'code' = 'link') => {
    const shareLink = `${window.location.origin}/shared-quiz/${quizId}?code=${shareCode}`;
    let textToCopy = shareLink;
    
    switch (format) {
      case 'markdown':
        textToCopy = `[Rejoignez mon quiz](${shareLink})`;
        break;
      case 'html':
        textToCopy = `<a href="${shareLink}">Rejoignez mon quiz</a>`;
        break;
      case 'code':
        textToCopy = shareCode;
        break;
    }
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setCopiedFormat(format);
      toast.success(`${format === 'code' ? 'Code' : 'Lien'} copié dans le presse-papier`);
      
      setTimeout(() => {
        setCopied(false);
        setCopiedFormat('');
      }, 2000);
    } catch (error) {
      toast.error('Impossible de copier');
    }
  };
  
  const downloadQrCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `quiz-qr-${shareCode}.png`;
    link.click();
    toast.success('QR Code téléchargé');
  };
  
  const shareOnSocial = (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp') => {
    const shareLink = `${window.location.origin}/shared-quiz/${quizId}?code=${shareCode}`;
    const text = `Rejoignez mon quiz interactif!`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareLink)}`;
        break;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            🚀 Partager le Quiz
          </DialogTitle>
          <DialogDescription className="text-base">
            Invitez vos étudiants et suivez leur participation en temps réel
          </DialogDescription>
          
          {/* Statistiques */}
          <div className="flex gap-4 pt-2">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Users className="w-4 h-4 mr-1" />
              {shareStats.joins} participant(s)
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              👁️ {shareStats.views} vue(s)
            </Badge>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link">
              <Link2 className="w-4 h-4 mr-2" />
              Lien
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="w-4 h-4 mr-2" />
              Réseaux
            </TabsTrigger>
          </TabsList>
          
          {/* Onglet Lien */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Lien de partage</Label>
                <Badge variant="default" className="font-mono">{shareCode}</Badge>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  value={loadingCode ? 'Génération du lien...' : `${window.location.origin}/shared-quiz/${quizId}?code=${shareCode}`} 
                  readOnly
                  className="bg-muted/50 font-mono text-sm"
                  disabled={loadingCode}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyShareLink('link')}
                  disabled={loadingCode}
                >
                  {copied && copiedFormat === 'link' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Options de copie multiples */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyShareLink('code')}
                  className="text-xs"
                >
                  {copiedFormat === 'code' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  Code seul
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyShareLink('markdown')}
                  className="text-xs"
                >
                  {copiedFormat === 'markdown' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  Markdown
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyShareLink('html')}
                  className="text-xs"
                >
                  {copiedFormat === 'html' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  HTML
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                💡 Partagez ce lien avec vos étudiants pour qu'ils rejoignent le quiz
              </p>
            </div>
          </TabsContent>
          
          {/* Onglet QR Code */}
          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Scannez pour rejoindre</h3>
                <p className="text-sm text-muted-foreground">Les étudiants peuvent scanner ce QR code avec leur smartphone</p>
              </div>
              
              {loadingCode ? (
                <div className="w-[300px] h-[300px] flex items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 bg-white rounded-xl shadow-lg"
                >
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-[300px] h-[300px]"
                  />
                </motion.div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={downloadQrCode}
                  disabled={loadingCode}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimer
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Onglet Email */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Inviter par email</Label>
              
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  className="flex-1"
                />
                <Button onClick={handleAddEmail} variant="secondary">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              
              {/* Liste des emails */}
              {emails.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">
                      {emails.length} email(s) à inviter
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEmails([])}
                      className="text-xs h-7"
                    >
                      Tout effacer
                    </Button>
                  </div>
                  
                  <div className="max-h-[150px] overflow-y-auto space-y-2 p-2 bg-muted/30 rounded-md">
                    <AnimatePresence>
                      {emails.map((email) => (
                        <motion.div
                          key={email}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-2 bg-background rounded border"
                        >
                          <span className="text-sm">{email}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveEmail(email)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  <Button
                    onClick={handleShareMultiple}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Envoyer {emails.length} invitation(s)
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                📝 Les invitations incluront le lien direct vers le quiz
              </p>
            </div>
          </TabsContent>
          
          {/* Onglet Réseaux Sociaux */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Partager sur les réseaux sociaux</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => shareOnSocial('whatsapp')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => shareOnSocial('facebook')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Facebook className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium">Facebook</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => shareOnSocial('twitter')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Twitter className="w-6 h-6 text-sky-500" />
                  <span className="text-sm font-medium">Twitter</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => shareOnSocial('linkedin')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Linkedin className="w-6 h-6 text-blue-700" />
                  <span className="text-sm font-medium">LinkedIn</span>
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Ou copiez le message de partage
                </p>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="mb-2">🎯 Rejoignez mon quiz interactif!</p>
                  <p className="font-mono text-xs text-purple-600">
                    {`${window.location.origin}/shared-quiz/${quizId}?code=${shareCode}`}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
