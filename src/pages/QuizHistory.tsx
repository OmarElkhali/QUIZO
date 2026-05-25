import { useContext, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart4,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  History,
  PlusCircle,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Users2,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateCard } from '@/components/ui/StateCard';
import { StatCard } from '@/components/ui/StatCard';
import { PremiumPanel } from '@/components/ui/premium';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import QuizContext from '@/context/QuizContext';
import { useQuiz } from '@/hooks/useQuiz';
import { Quiz } from '@/types/quiz';

const formatDate = (value?: string) => {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const difficultyLabels: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

const QuizHistoryCard = ({ quiz, index }: { quiz: Quiz; index: number }) => {
  const navigate = useNavigate();
  const completionRate = quiz.completionRate || 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.24) }}
      className="quizo-panel quizo-panel-hover flex h-full flex-col p-5"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-orange-400/25 bg-orange-500/12 text-[#d97706] dark:text-[#ffb77d]">
            {quiz.questions.length} questions
          </Badge>
          {quiz.isShared && (
            <Badge variant="outline" className="border-sky-400/25 bg-sky-500/10 text-sky-400">
              <Users2 className="mr-1 h-3.5 w-3.5" />
              Partagé
            </Badge>
          )}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-[var(--quizo-muted)] hover:bg-orange-500/10 hover:text-[#d97706]"
          onClick={() => navigate(`/quiz-preview/${quiz.id}`)}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>

      <h2 className="line-clamp-2 text-xl font-bold tracking-tight text-[var(--quizo-heading)]">{quiz.title}</h2>
      <p className="mt-3 line-clamp-2 min-h-[44px] text-sm leading-6 text-[var(--quizo-muted)]">
        {quiz.description || 'Quiz sans description.'}
      </p>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--quizo-text)]">Progression</span>
          <span className="font-bold text-[#d97706]">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
      </div>

      <div className="mt-6 grid gap-2 text-xs text-[var(--quizo-muted)] sm:grid-cols-2">
        <span className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[#d97706]" />
          {formatDate(quiz.createdAt)}
        </span>
        <span className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[#d97706]" />
          {quiz.duration || 'Durée libre'}
        </span>
        <span className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#d97706]" />
          {difficultyLabels[quiz.difficulty || 'medium'] || 'Moyen'}
        </span>
        <span className="flex items-center gap-2">
          <Share2 className="h-3.5 w-3.5 text-[#d97706]" />
          {quiz.shareCode || 'Privé'}
        </span>
      </div>

      <div className="mt-auto pt-6">
        <Button className="quizo-copper-button w-full" onClick={() => navigate(`/quiz-preview/${quiz.id}`)}>
          Ouvrir le quiz
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.article>
  );
};

const QuizHistory = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { quizzes, isLoading } = useQuiz();
  const quizContext = useContext(QuizContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCompletion, setFilterCompletion] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = useMemo(() => {
    const completed = quizzes.filter((quiz) => quiz.completionRate === 100).length;
    const totalQuestions = quizzes.reduce((acc, quiz) => acc + quiz.questions.length, 0);
    const averageScore = quizzes.length
      ? Math.round(quizzes.reduce((acc, quiz) => acc + (quiz.completionRate || 0), 0) / quizzes.length)
      : 0;

    return {
      totalQuizzes: quizzes.length,
      completedQuizzes: completed,
      averageScore,
      totalQuestions,
    };
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      const matchesSearch = !normalizedSearch
        || quiz.title.toLowerCase().includes(normalizedSearch)
        || (quiz.description || '').toLowerCase().includes(normalizedSearch)
        || (quiz.shareCode || '').toLowerCase().includes(normalizedSearch);

      const matchesDifficulty = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
      const completion = quiz.completionRate || 0;
      const matchesCompletion =
        filterCompletion === 'all'
        || (filterCompletion === 'completed' && completion === 100)
        || (filterCompletion === 'inProgress' && completion > 0 && completion < 100)
        || (filterCompletion === 'notStarted' && completion === 0);
      const matchesTab =
        activeTab === 'all'
        || (activeTab === 'shared' && quiz.isShared)
        || (activeTab === 'personal' && !quiz.isShared);

      return matchesSearch && matchesDifficulty && matchesCompletion && matchesTab;
    });
  }, [activeTab, filterCompletion, filterDifficulty, quizzes, searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await quizContext?.fetchQuizzes?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDifficulty('all');
    setFilterCompletion('all');
    setActiveTab('all');
  };

  if (authLoading) {
    return (
      <AppShell>
        <StateCard state="loading" title="Chargement de votre espace" description="Synchronisation de votre session QUIZO." />
      </AppShell>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Historique"
        title="Mes quiz"
        description="Retrouvez vos quiz générés, manuels et partagés avec une vue claire sur la progression."
        actions={
          <>
            <Button variant="outline" className="quizo-outline-button" onClick={handleRefresh}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button className="quizo-copper-button" onClick={() => navigate('/create-quiz')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau quiz
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Quiz totaux" value={stats.totalQuizzes} icon={History} detail="Tous vos contenus" />
        <StatCard label="Complétés" value={stats.completedQuizzes} icon={CheckCircle2} detail="Progression à 100%" />
        <StatCard label="Progression moyenne" value={`${stats.averageScore}%`} icon={BarChart4} detail="Sur tous les quiz" />
        <StatCard label="Questions" value={stats.totalQuestions} icon={Sparkles} detail="Banque active" />
      </section>

      <PremiumPanel className="mt-6 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--quizo-muted)]" />
            <Input
              placeholder="Rechercher par titre, description ou code..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="quizo-input pl-10"
            />
          </div>

          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="quizo-input min-w-[150px]">
              <SelectValue placeholder="Difficulté" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="easy">Facile</SelectItem>
              <SelectItem value="medium">Moyen</SelectItem>
              <SelectItem value="hard">Difficile</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCompletion} onValueChange={setFilterCompletion}>
            <SelectTrigger className="quizo-input min-w-[170px]">
              <SelectValue placeholder="Progression" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes progressions</SelectItem>
              <SelectItem value="completed">Complétés</SelectItem>
              <SelectItem value="inProgress">En cours</SelectItem>
              <SelectItem value="notStarted">Non commencés</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="quizo-outline-button" onClick={resetFilters}>
            Réinitialiser
          </Button>
        </div>
      </PremiumPanel>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-3 border border-[var(--quizo-border)] bg-[var(--quizo-surface-soft)] p-1 md:w-[520px]">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="personal">Mes quiz</TabsTrigger>
          <TabsTrigger value="shared">Partagés</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="mt-6">
        {isLoading ? (
          <StateCard state="loading" title="Chargement des quiz" description="Lecture de votre historique Firestore." />
        ) : filteredQuizzes.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredQuizzes.map((quiz, index) => (
              <QuizHistoryCard key={quiz.id} quiz={quiz} index={index} />
            ))}
          </div>
        ) : (
          <StateCard
            state="empty"
            title="Aucun quiz trouvé"
            description={
              searchTerm || filterDifficulty !== 'all' || filterCompletion !== 'all'
                ? "Aucun quiz ne correspond à vos filtres actuels."
                : "Créez votre premier quiz IA ou manuel pour alimenter l'historique."
            }
            action={
              searchTerm || filterDifficulty !== 'all' || filterCompletion !== 'all' ? (
                <Button variant="outline" className="quizo-outline-button" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button className="quizo-copper-button" onClick={() => navigate('/create-quiz')}>
                  Créer un quiz
                </Button>
              )
            }
          />
        )}
      </section>
    </AppShell>
  );
};

export default QuizHistory;
