
import { useQuiz } from '@/hooks/useQuiz';
import { QuizCard } from './QuizCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';

export const SharedQuizzes = () => {
  const { sharedQuizzes } = useQuiz();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredQuizzes = sharedQuizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (sharedQuizzes.length === 0) {
    return null;
  }
  
  return (
    <section className={`py-16 px-6 ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-muted/20'}`}>
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-6">
            <Users className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-2xl font-bold">Quizzes Partagés avec Vous</h2>
          </div>
          
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un quiz partagé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <AnimatePresence>
            {filteredQuizzes.length > 0 ? (
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
                      isShared={true}
                      index={index}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`text-center py-10 border border-dashed rounded-lg ${theme === 'dark' ? 'bg-slate-800/20' : 'bg-muted/30'}`}
              >
                <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucun quiz partagé trouvé</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Aucun quiz partagé ne correspond à votre recherche." : "Vous n'avez pas encore de quiz partagés avec vous."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
