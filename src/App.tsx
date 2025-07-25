
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from './context/AuthContext';
import Index from './pages/Index';
import CreateQuiz from './pages/CreateQuiz';
import QuizPreview from './pages/QuizPreview';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import QuizHistory from './pages/QuizHistory';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import { QuizProvider } from '@/context/index';

const queryClient = new QueryClient()

function App() {
  return (
    <React.Fragment>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <TooltipProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <QuizProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/create-quiz" element={<CreateQuiz />} />
                    <Route path="/quiz-preview/:id" element={<QuizPreview />} />
                    <Route path="/quiz/:id" element={<Quiz />} />
                    <Route path="/results/:quizId/:submissionId" element={<Results />} />
                    <Route path="/history" element={<QuizHistory />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </QuizProvider>
              </AuthProvider>
            </QueryClientProvider>
          </TooltipProvider>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </React.Fragment>
  );
}

export default App;
