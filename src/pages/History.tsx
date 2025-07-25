
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { QuizCard } from '@/components/QuizCard';
import { Navbar } from '@/components/Navbar';
import { useQuiz } from '@/hooks/useQuiz';
import { Search, Filter, SortDesc, SortAsc } from 'lucide-react';
import { motion } from 'framer-motion';

const History = () => {
  const { quizzes } = useQuiz();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filtering and sorting
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  // Get the quizzes for "In Progress" tab (completionRate < 100)
  const inProgressQuizzes = sortedQuizzes.filter(quiz => 
    !quiz.completionRate || quiz.completionRate < 100
  );
  
  // Get the quizzes for "Completed" tab (completionRate === 100)
  const completedQuizzes = sortedQuizzes.filter(quiz => 
    quiz.completionRate === 100
  );
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Your Quiz History</h1>
            <p className="text-muted-foreground">
              Track your learning progress and revisit past quizzes
            </p>
          </motion.div>
          
          {/* Search and filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search quizzes..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="hover-scale"
                  onClick={toggleSortOrder}
                >
                  {sortOrder === 'desc' ? (
                    <SortDesc className="h-4 w-4" />
                  ) : (
                    <SortAsc className="h-4 w-4" />
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="hover-scale"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </motion.div>
          
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              {/* All Quizzes */}
              <TabsContent value="all" className="mt-0">
                {sortedQuizzes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedQuizzes.map((quiz, index) => (
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
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">
                      No quizzes found matching your search.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              {/* In Progress */}
              <TabsContent value="in-progress" className="mt-0">
                {inProgressQuizzes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inProgressQuizzes.map((quiz, index) => (
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
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">
                      You don't have any quizzes in progress.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              {/* Completed */}
              <TabsContent value="completed" className="mt-0">
                {completedQuizzes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedQuizzes.map((quiz, index) => (
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
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">
                      You haven't completed any quizzes yet.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default History;
