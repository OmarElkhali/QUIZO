import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
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
import { ActionCard, PremiumPanel } from '@/components/ui/premium';

const CreateManualQuiz = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement du builder" description="Préparation de la création manuelle." />
      </AppShell>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
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

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Link to="/create-quiz">
          <ActionCard title="Quiz IA" description="Génération depuis un fichier." icon={Sparkles} className="min-h-0" />
        </Link>
        <ActionCard title="Quiz manuel" description="Contrôle complet des questions." icon={PenLine} accent className="min-h-0" />
        <Link to="/join">
          <ActionCard title="Rejoindre" description="Participer avec un code." icon={Users} className="min-h-0" />
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <PremiumPanel className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[#e5e2e1]">Titre du quiz</Label>
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
              <Label htmlFor="description" className="text-[#e5e2e1]">Description optionnelle</Label>
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
          <BookOpen className="mb-5 h-7 w-7 text-[#ffb77d]" />
          <h2 className="text-xl font-bold text-white">Structure recommandée</h2>
          <p className="mt-3 text-sm leading-6 text-[#a79d96]">
            Commencez par un titre précis. Vous pourrez ensuite ajouter des questions, créer un code de partage et lancer une compétition.
          </p>
        </PremiumPanel>
      </section>
    </AppShell>
  );
};

export default CreateManualQuiz;
