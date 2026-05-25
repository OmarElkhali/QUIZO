import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Minus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { PremiumPanel } from '@/components/ui/premium';
import { PricingCard } from '@/components/pricing/PricingCard';

const freeFeatures = [
  '5 générations IA / jour',
  '3 uploads / jour',
  'Quiz manuels illimités',
  '50 participants max',
  'Leaderboard temps réel',
];

const proFeatures = [
  'Générations IA étendues',
  'Assistant IA complet (OpenRouter)',
  'Mode Teacher-Led',
  'Mode Team',
  'Analytics avancés',
  'Export des résultats',
  '200 participants max',
];

const comparison = [
  { feature: 'Générations IA', free: '5 / jour', pro: 'Étendues' },
  { feature: 'Uploads de documents', free: '3 / jour', pro: 'Étendus' },
  { feature: 'Quiz manuels', free: 'Illimités', pro: 'Illimités' },
  { feature: 'Participants maximum', free: '50', pro: '200' },
  { feature: 'Leaderboard temps réel', free: true, pro: true },
  { feature: 'Assistant IA OpenRouter', free: false, pro: true },
  { feature: 'Mode Teacher-Led', free: false, pro: true },
  { feature: 'Mode Team', free: false, pro: true },
  { feature: 'Analytics avancés', free: false, pro: true },
  { feature: 'Export des résultats', free: false, pro: true },
];

const renderCell = (value: string | boolean) => {
  if (value === true) return <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500 dark:text-emerald-300" />;
  if (value === false) return <Minus className="mx-auto h-5 w-5 text-[var(--quizo-muted)]" />;
  return <span className="text-sm font-medium text-[var(--quizo-text)]">{value}</span>;
};

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <AppShell
      actions={
        <Button type="button" className="hidden quizo-copper-button sm:inline-flex" onClick={() => navigate('/create-quiz')}>
          <Sparkles className="mr-2 h-4 w-4" />
          Essayer
        </Button>
      }
    >
      <section className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Tarifs"
          title="Choisissez votre plan"
          description="Commencez gratuitement, évoluez quand vous en avez besoin."
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
            onClick={() => navigate('/create-quiz')}
          />
          <PricingCard
            name="Pro"
            price="5€/mois"
            badge="Le plus populaire"
            features={proFeatures}
            cta="Passer au Pro"
            highlighted
            onClick={() => toast.info("Le paiement Pro arrive bientôt. Aucun paiement n'est activé pour le moment.")}
          />
        </div>

        <PremiumPanel className="mt-8 overflow-hidden">
          <div className="border-b border-[var(--quizo-border)] p-6">
            <p className="quizo-label">Comparaison</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--quizo-heading)]">Free beta vs Pro</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-[var(--quizo-border)] text-left">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--quizo-muted)]">Fonctionnalité</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-[var(--quizo-muted)]">Gratuit</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#d97706] dark:text-[#ffb77d]">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--quizo-border)] last:border-b-0">
                    <td className="px-6 py-4 text-sm font-medium text-[var(--quizo-heading)]">{row.feature}</td>
                    <td className="px-6 py-4 text-center">{renderCell(row.free)}</td>
                    <td className="px-6 py-4 text-center">{renderCell(row.pro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumPanel>

        <p className="py-8 text-center text-sm font-medium text-[var(--quizo-muted)]">
          Aucune carte requise pour commencer
        </p>
      </section>
    </AppShell>
  );
};

export default Pricing;
