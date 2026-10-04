import { Mail, Send } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PremiumPanel } from '@/components/ui/premium';

const Contact = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    const subject = encodeURIComponent('Support QUIZO');
    const body = encodeURIComponent(`Nom : ${fields.get('name')}\nEmail : ${fields.get('email')}\n\n${fields.get('message')}`);
    window.location.href = `mailto:omarelkhali@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Support"
        title="Contactez-nous"
        description="Une question, une suggestion ou besoin d’aide ? Préparez votre message et envoyez-le depuis votre messagerie."
      />

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <PremiumPanel className="p-6">
          <Mail className="mb-5 h-7 w-7 text-[#ffb77d]" />
          <h2 className="text-2xl font-bold text-[var(--quizo-heading)]">Support QUIZO</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--quizo-muted)]">
            Pour un problème de création, de partage ou de partie en direct, décrivez ce qui s’est passé et le message affiché.
          </p>
          <div className="mt-8 space-y-4 text-sm text-[var(--quizo-text)]">
            <p>
              <span className="quizo-label block">Email</span>
              <a href="mailto:omarelkhali@gmail.com" className="hover:text-orange-400">omarelkhali@gmail.com</a>
            </p>
            <p>Votre messagerie vous permettra de vérifier le contenu avant l’envoi.</p>
          </div>
        </PremiumPanel>

        <PremiumPanel className="p-6">
          <h3 className="mb-2 text-2xl font-bold text-[var(--quizo-heading)]">Préparer un message</h3>
          <p className="mb-6 text-sm text-[var(--quizo-muted)]">Après avoir rempli le formulaire, confirmez l’envoi dans votre application de messagerie.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" placeholder="Votre nom" className="quizo-input" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="votre@email.com" className="quizo-input" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" placeholder="Votre message" rows={6} className="quizo-input" required />
            </div>
            <Button type="submit" className="w-full quizo-copper-button">
              <Send className="mr-2 h-4 w-4" />
              Ouvrir ma messagerie
            </Button>
          </form>
        </PremiumPanel>
      </section>
    </AppShell>
  );
};

export default Contact;
