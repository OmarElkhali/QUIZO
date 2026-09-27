import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, PenLine, Sparkles, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { createManualQuiz } from '@/services/manualQuizService';
import { PremiumPanel } from '@/components/ui/premium';
import { AuthDialog } from '@/components/AuthDialog';

const CreateManualQuiz = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du builder" description="Préparation de la création manuelle." />
      </AppShell>
    );
  }

  if (!user) {
    return <AppShell><StateCard state="empty" title="Connectez-vous pour créer un quiz" description="Votre espace de création sera disponible après la connexion." action={<Button className="quizo-copper-button" onClick={() => setAuthOpen(true)}>Se connecter</Button>} /><AuthDialog open={authOpen} onOpenChange={setAuthOpen} /></AppShell>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Veuillez saisir un titre pour votre quiz');
      return;
    }

    setIsLoading(true);

    try {
      const quizId = await createManualQuiz(user.id, title, description);
      toast.success('Quiz créé avec succès');
      navigate(`/manual-quiz-builder/${quizId}`);
    } catch (error) {
      console.error('Erreur lors de la création du quiz:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du quiz');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Création manuelle"
        title="Créer un quiz manuel"
        description="Préparez une base solide, puis ajoutez vos questions, options et explications dans le builder."
      />

      <nav aria-label="Parcours de création" className="mb-7 flex flex-wrap gap-2 border-b border-[var(--quizo-border)] pb-4 text-sm">
        <Link to="/create-quiz" className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[var(--quizo-muted)] hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)]"><Sparkles className="h-4 w-4" />Quiz IA</Link>
        <span aria-current="page" className="inline-flex items-center gap-2 rounded-lg bg-orange-500/10 px-4 py-2 font-semibold text-orange-500"><PenLine className="h-4 w-4" />Quiz manuel</span>
        <Link to="/join" className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[var(--quizo-muted)] hover:bg-[var(--quizo-surface-soft)] hover:text-[var(--quizo-heading)]"><Users className="h-4 w-4" />Rejoindre</Link>
      </nav>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <PremiumPanel className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[var(--quizo-heading)]">Titre du quiz</Label>
              <Input
                id="title"
                placeholder="Ex. Réseaux TCP/IP - Chapitre 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="quizo-input"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[var(--quizo-heading)]">Description optionnelle</Label>
              <Textarea
                id="description"
                placeholder="Décrivez l’objectif, le niveau ou le chapitre du quiz..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[160px] resize-none quizo-input"
              />
            </div>

            <Button type="submit" className="w-full quizo-copper-button" disabled={isLoading}>
              {isLoading ? 'Création en cours...' : 'Créer et continuer'}
            </Button>
          </form>
        </PremiumPanel>

        <PremiumPanel className="p-6">
          <BookOpen className="mb-5 h-7 w-7 text-orange-500" />
          <h2 className="text-xl font-semibold text-[var(--quizo-heading)]">Structure recommandée</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--quizo-muted)]">
            Commencez par un titre précis. Vous pourrez ensuite ajouter des questions, créer un code de partage et lancer une compétition.
          </p>
        </PremiumPanel>
      </section>
    </AppShell>
  );
};

export default CreateManualQuiz;
