
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { QuizCard } from '@/components/QuizCard';
import { SharedQuizzes } from '@/components/SharedQuizzes';
import { Separator } from '@/components/ui/separator';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { quizzes } = useQuiz();
  const { user } = useAuth();
  
  const recentQuizzes = quizzes.slice(0, 3); // Prendre les quiz les plus récents
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        
        {user && recentQuizzes.length > 0 && (
          <section className="py-16 px-6">
            <div className="container mx-auto max-w-6xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Quizzes Récents</h2>
                <a 
                  href="/history" 
                  className="text-primary font-medium underline-animation"
                >
                  Voir tout
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentQuizzes.map((quiz, index) => (
                  <QuizCard 
                    key={quiz.id}
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
                ))}
              </div>
            </div>
          </section>
        )}
        
        {user && <SharedQuizzes />}
      </main>
      
      <footer className="bg-muted/30 py-8 px-6 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">QUIZO</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Apprentissage optimisé par l'IA
              </p>
            </div>
            
            <div className="flex space-x-6">
              <a href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground underline-animation">
                Politique de confidentialité
              </a>
              <a href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground underline-animation">
                Conditions d'utilisation
              </a>
              <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground underline-animation">
                Contact
              </a>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <p className="text-xs text-muted-foreground text-center">
            © 2025 QUIZO. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
