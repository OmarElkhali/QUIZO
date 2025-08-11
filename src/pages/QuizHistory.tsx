
import { useState, useEffect, useContext } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useQuiz } from '@/hooks/useQuiz';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { History, PlusCircle, Filter, Search, RefreshCw, BarChart4, Calendar, Clock } from 'lucide-react';
import { QuizCard } from '@/components/QuizCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SharedQuizzes } from '@/components/SharedQuizzes';
import QuizContext from '@/context/QuizContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const QuizHistory = () => {
  const { user } = useAuth();
  const { quizzes, isLoading } = useQuiz();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCompletion, setFilterCompletion] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalQuestions: 0,
  });
  
  // Ajouter cette fonction
  const handleRefresh = async () => {
    // Accéder à fetchQuizzes via le contexte
    setIsRefreshing(true);
    const quizContext = useContext(QuizContext);
    if (quizContext && quizContext.fetchQuizzes) {
      await quizContext.fetchQuizzes();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };
  
  // Calculer les statistiques
  useEffect(() => {
    if (quizzes.length > 0) {
      const completed = quizzes.filter(quiz => quiz.completionRate === 100).length;
      const totalQuestions = quizzes.reduce((acc, quiz) => acc + quiz.questions.length, 0);
      const avgScore = completed > 0 
        ? quizzes.filter(quiz => quiz.completionRate === 100)
            .reduce((acc, quiz) => acc + quiz.completionRate, 0) / completed
        : 0;
      
      setStats({
        totalQuizzes: quizzes.length,
        completedQuizzes: completed,
        averageScore: Math.round(avgScore),
        totalQuestions,
      });
    }
  }, [quizzes]);
  
  // Filtrer les quiz
  const filteredQuizzes = quizzes.filter(quiz => {
    // Filtre de recherche
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre de difficulté - Correction ici
    const matchesDifficulty = filterDifficulty === 'all' || 
                           (quiz.difficulty && quiz.difficulty.toLowerCase() === filterDifficulty.toLowerCase());
    
    // Filtre de complétion
    const matchesCompletion = 
      filterCompletion === 'all' ||
      (filterCompletion === 'completed' && quiz.completionRate === 100) ||
      (filterCompletion === 'inProgress' && quiz.completionRate > 0 && quiz.completionRate < 100) ||
      (filterCompletion === 'notStarted' && quiz.completionRate === 0);
    
    // Filtre par onglet
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'shared' && quiz.isShared) ||
      (activeTab === 'personal' && !quiz.isShared);
    
    return matchesSearch && matchesDifficulty && matchesCompletion && matchesTab;
  });
  
  // Rediriger si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Mes Quiz</h1>
              </div>
              
              <Button 
                onClick={() => navigate('/create-quiz')}
                className="bg-[#D2691E] hover:bg-[#D2691E]/90"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Nouveau Quiz
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Retrouvez tous vos quiz générés et partagés, classés par date de création.
            </p>
            
            {/* Statistiques */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'}`}
            >
              <div className="flex flex-col items-center justify-center p-4 rounded-md bg-primary/5">
                <span className="text-3xl font-bold text-primary">{stats.totalQuizzes}</span>
                <span className="text-sm text-muted-foreground">Quiz Totaux</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-md bg-green-500/5">
                <span className="text-3xl font-bold text-green-500">{stats.completedQuizzes}</span>
                <span className="text-sm text-muted-foreground">Quiz Complétés</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-md bg-blue-500/5">
                <span className="text-3xl font-bold text-blue-500">{stats.averageScore}%</span>
                <span className="text-sm text-muted-foreground">Score Moyen</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-md bg-amber-500/5">
                <span className="text-3xl font-bold text-amber-500">{stats.totalQuestions}</span>
                <span className="text-sm text-muted-foreground">Questions Totales</span>
              </div>
            </motion.div>
            
            {/* Filtres et recherche */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col md:flex-row gap-4 mb-8"
            >
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un quiz..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
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
                  <SelectTrigger className="w-[140px]">
                    <BarChart4 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Progression" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="completed">Complétés</SelectItem>
                    <SelectItem value="inProgress">En cours</SelectItem>
                    <SelectItem value="notStarted">Non commencés</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefresh}
                  className={`${isRefreshing ? 'animate-spin' : ''}`}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
            
            {/* Onglets */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Tous les Quiz</TabsTrigger>
                <TabsTrigger value="personal">Mes Quiz</TabsTrigger>
                <TabsTrigger value="shared">Quiz Partagés</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredQuizzes.length > 0 ? (
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="transform transition-all duration-300"
                  >
                    <QuizCard 
                      id={quiz.id}
                      title={quiz.title}
                      description={quiz.description}
                      questions={quiz.questions.length}
                      completionRate={quiz.completionRate}
                      date={quiz.createdAt}
                      duration={quiz.duration}
                      participants={quiz.participants}
                      isHistory={true}
                      isShared={quiz.isShared}
                      index={index}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`text-center py-16 border border-dashed rounded-lg ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-muted/30'}`}
            >
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-medium mb-2">Aucun quiz trouvé</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterDifficulty !== 'all' || filterCompletion !== 'all' 
                  ? "Aucun quiz ne correspond à vos critères de recherche."
                  : "Commencez par créer votre premier quiz en téléchargeant un document."}
              </p>
              {searchTerm || filterDifficulty !== 'all' || filterCompletion !== 'all' ? (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDifficulty('all');
                    setFilterCompletion('all');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/create-quiz')}
                  className="bg-[#D2691E] hover:bg-[#D2691E]/90"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Créer un Quiz
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </main>
      
      <footer className={`py-8 px-6 border-t ${theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-muted/30'}`}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-center items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 QUIZO. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuizHistory;
