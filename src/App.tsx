
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from '@/context/index';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Lazy-loaded page components
const Index = React.lazy(() => import('./pages/Index'));
const CreateQuiz = React.lazy(() => import('./pages/CreateQuiz'));
const QuizPreview = React.lazy(() => import('./pages/QuizPreview'));
const Quiz = React.lazy(() => import('./pages/Quiz'));
const Results = React.lazy(() => import('./pages/Results'));
const QuizHistory = React.lazy(() => import('./pages/QuizHistory'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const Contact = React.lazy(() => import('./pages/Contact'));
const JoinByCode = React.lazy(() => import('./pages/JoinByCode'));
const CreateManualQuiz = React.lazy(() => import('./pages/CreateManualQuiz'));
const ManualQuizBuilder = React.lazy(() => import('./pages/ManualQuizBuilder'));
const CompetitionPlay = React.lazy(() => import('./pages/Competition'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const CreatorDashboard = React.lazy(() => import('./pages/CreatorDashboard'));
const SharedQuiz = React.lazy(() => import('./pages/SharedQuiz'));
const RealtimeDashboard = React.lazy(() => import('./pages/RealtimeDashboard'));
const JoinQuiz = React.lazy(() => import('./pages/JoinQuiz'));
const QuizSession = React.lazy(() => import('./pages/QuizSession'));

const queryClient = new QueryClient()

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <QuizProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/create-quiz" element={<CreateQuiz />} />
                    <Route path="/create-manual-quiz" element={<CreateManualQuiz />} />
                    <Route path="/manual-quiz-builder/:id" element={<ManualQuizBuilder />} />
                    <Route path="/join/:shareCode?" element={<JoinByCode />} />
                    <Route path="/competition/share/:shareCode" element={<CompetitionPlay />} />
                    <Route path="/competition/:competitionId" element={<CompetitionPlay />} />
                    <Route path="/leaderboard/:id" element={<Leaderboard />} />
                    <Route path="/creator-dashboard/:id" element={<CreatorDashboard />} />
                    <Route path="/quiz-preview/:id" element={<QuizPreview />} />
                    <Route path="/quiz/:id" element={<Quiz />} />
                    <Route path="/shared-quiz/:quizId" element={<SharedQuiz />} />
                    <Route path="/quiz-dashboard/:id" element={<RealtimeDashboard />} />
                    <Route path="/join-quiz/:shareCode?" element={<JoinQuiz />} />
                    <Route path="/quiz-session/:quizId/:attemptId" element={<QuizSession />} />
                    <Route path="/results/:quizId/:submissionId" element={<Results />} />
                    <Route path="/history" element={<QuizHistory />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </QuizProvider>
            </AuthProvider>
          </QueryClientProvider>
        </TooltipProvider>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
