
import { useQuiz } from '@/hooks/useQuiz';
import { QuizCard } from './QuizCard';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export const SharedQuizzes = () => {
  const { sharedQuizzes } = useQuiz();
  
  if (sharedQuizzes.length === 0) {
    return null;
  }
  
  return (
    <section className="py-16 px-6 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center mb-8">
          <Users className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-2xl font-bold">Quizzes Partagés avec Vous</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharedQuizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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
      </div>
    </section>
  );
};
