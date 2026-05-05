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

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Link
          to="/create-quiz"
          className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#d77a36]/35 hover:bg-white/[0.065]"
        >
          <Sparkles className="mb-3 h-5 w-5 text-[#f7c693]" />
          <h2 className="font-semibold text-white">Quiz IA</h2>
          <p className="mt-1 text-sm text-slate-400">Génération depuis un fichier.</p>
        </Link>
        <div className="rounded-lg border border-[#d77a36]/35 bg-[#d77a36]/12 p-4">
          <PenLine className="mb-3 h-5 w-5 text-[#f7c693]" />
          <h2 className="font-semibold text-white">Quiz manuel</h2>
          <p className="mt-1 text-sm text-slate-400">Contrôle complet des questions.</p>
        </div>
        <Link
          to="/join"
          className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#d77a36]/35 hover:bg-white/[0.065]"
        >
          <Users className="mb-3 h-5 w-5 text-[#f7c693]" />
          <h2 className="font-semibold text-white">Rejoindre</h2>
          <p className="mt-1 text-sm text-slate-400">Participer avec un code.</p>
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-200">Titre du quiz</Label>
              <Input
                id="title"
                placeholder="Ex. Réseaux TCP/IP - Chapitre 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-white/10 bg-[#0b0f14] text-white placeholder:text-slate-600 focus-visible:ring-[#d77a36]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200">Description optionnelle</Label>
              <Textarea
                id="description"
                placeholder="Décrivez l'objectif, le niveau ou le chapitre du quiz..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[140px] resize-none border-white/10 bg-[#0b0f14] text-white placeholder:text-slate-600 focus-visible:ring-[#d77a36]"
              />
            </div>

            <Button type="submit" className="w-full bg-[#d77a36] text-white hover:bg-[#b85f26]" disabled={isLoading}>
              {isLoading ? 'Création en cours...' : 'Créer et continuer'}
            </Button>
          </div>
        </form>

        <aside className="rounded-lg border border-white/10 bg-[#0f141c] p-5">
          <BookOpen className="mb-4 h-6 w-6 text-[#f7c693]" />
          <h2 className="text-lg font-semibold text-white">Structure recommandée</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Commencez par un titre précis. Vous pourrez ensuite ajouter des questions, créer un code de partage et lancer une compétition.
          </p>
        </aside>
      </section>
    </AppShell>
  );
};

export default CreateManualQuiz;
