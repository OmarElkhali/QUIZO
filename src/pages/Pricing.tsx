import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { PremiumPanel } from '@/components/ui/premium';
import { PricingCard } from '@/components/pricing/PricingCard';
import { AuthDialog } from '@/components/AuthDialog';
import { useAuth } from '@/context/AuthContext';

const freeFeatures = [
  'Création de quiz manuels',
  'Génération de questions à partir de documents',
  'Partage et participation par code',
  'Parties en direct et résultats',
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const startFree = () => user ? navigate('/create-quiz') : setAuthOpen(true);

  return (
    <AppShell
      actions={
        <Button type="button" className="hidden quizo-copper-button sm:inline-flex" onClick={startFree}>
          <Sparkles className="mr-2 h-4 w-4" />
          Essayer
        </Button>
      }
    >
      <section className="w-full">
        <PageHeader
          eyebrow="Tarifs"
          title="Commencez gratuitement"
          description="Créez un quiz, partagez son code et lancez une partie. L’offre Pro est en préparation."
          actions={
            <Button type="button" variant="outline" className="quizo-outline-button" onClick={() => navigate('/join')}>
              Rejoindre par code
            </Button>
          }
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <PricingCard
            name="Gratuit"
            price="0€/mois"
            features={freeFeatures}
            cta="Commencer gratuitement"
            onClick={startFree}
          />
          <PremiumPanel className="flex flex-col justify-between p-7">
            <div>
              <p className="quizo-label">Pro</p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--quizo-heading)]">En préparation</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-[var(--quizo-muted)]">
                Le plan payant n’est pas encore disponible. Ses fonctionnalités et son tarif seront annoncés lorsque son activation sera prête.
              </p>
            </div>
            <p className="mt-8 border-t border-[var(--quizo-border)] pt-5 text-sm text-[var(--quizo-text)]">
              Aucun paiement n’est nécessaire pour commencer sur QUIZO.
            </p>
          </PremiumPanel>
        </div>
      </section>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </AppShell>
  );
};

export default Pricing;
