import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PremiumPanel } from '@/components/ui/premium';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      toast.success('Votre message a été envoyé avec succès !');
      setName('');
      setEmail('');
      setMessage('');
      setIsSubmitting(false);
    }, 900);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Support"
        title="Contactez-nous"
        description="Vous avez des questions, des suggestions ou besoin d’assistance ? Notre équipe vous répondra dans les plus brefs délais."
      />

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <PremiumPanel className="p-6">
          <Mail className="mb-5 h-7 w-7 text-[#ffb77d]" />
          <h2 className="text-2xl font-bold text-white">Support QUIZO</h2>
          <p className="mt-3 text-sm leading-6 text-[#a79d96]">
            Pour les problèmes de génération IA, de partage, de realtime ou de déploiement, ajoutez le plus de contexte possible dans votre message.
          </p>
          <div className="mt-8 space-y-4 text-sm text-[#d8d2ce]">
            <p>
              <span className="quizo-label block">Email</span>
              omarelkali@gmail.com
            </p>
            <p>
              <span className="quizo-label block">Disponibilité</span>
              Lundi - Vendredi: 9h00 - 18h00
            </p>
          </div>
        </PremiumPanel>

        <PremiumPanel className="p-6">
          <h3 className="mb-6 text-2xl font-bold text-white">Envoyer un message</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#e5e2e1]">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className="quizo-input" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#e5e2e1]">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="quizo-input" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-[#e5e2e1]">Message</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Votre message" rows={6} className="quizo-input" required />
            </div>
            <Button type="submit" className="w-full quizo-copper-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer le message
                </>
              )}
            </Button>
          </form>
        </PremiumPanel>
      </section>
    </AppShell>
  );
};

export default Contact;
