import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useQuiz } from '@/hooks/useQuiz';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Quiz as QuizType } from '@/types/quiz';

interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}

interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit?: number;
}

const Quiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitQuizAnswers, getQuiz } = useQuiz();
  const { user } = useAuth();
  const userId = user?.id || '';

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  // Chargement du quiz
  useEffect(() => {
    let isMounted = true;
    const loadQuiz = async () => {
      if (!id) {
        setError('ID manquant');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getQuiz(id);
        if (!isMounted) return;

        if (!data || !data.questions || !data.questions.length) {
          setError('Quiz introuvable ou sans questions');
          setIsLoading(false);
          return;
        }

        // Initialiser le quiz et les réponses
        setQuiz({
          id: data.id,
          title: data.title,
          questions: data.questions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options.map(opt => ({
              id: opt.id,
              text: opt.text
            }))
          })),
          timeLimit: data.timeLimit
        });

        // Initialiser les réponses avec un objet vide
        const initialAnswers: Record<string, string> = {};
        data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);

        // Définir le temps restant
        const calculatedTimeLimit = data.timeLimit || Math.ceil(data.questions.length * 1.5);
        setTimeLeft(calculatedTimeLimit * 60);
        
        setIsLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Erreur inconnue');
          setIsLoading(false);
        }
      }
    };

    loadQuiz();
    return () => { 
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id]);

  // Timer pour le décompte du temps
  useEffect(() => {
    if (isLoading || !quiz || isSubmitting || timeLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLoading, isSubmitting, quiz, timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !quiz || !id) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const unansweredQuestions = quiz.questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0 && timeLeftRef.current > 10) {
      const confirmSubmit = window.confirm(
        `Il reste ${unansweredQuestions.length} question(s) sans réponse. Voulez-vous vraiment soumettre le quiz ?`
      );
      if (!confirmSubmit) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (!id) throw new Error("Quiz ID is missing");
      const result = await submitQuizAnswers(id, answers);
      
      if (result) {
        navigate(`/results/${result.quizId}/${result.submissionId}`, {
          state: {
            score: result.score,
            answers,
            totalQuestions: quiz.questions.length,
            timeSpent: (quiz.timeLimit ?? Math.ceil(quiz.questions.length * 1.5)) * 60 - timeLeftRef.current
          }
        });
      }
    } catch (error: any) {
      toast.error('Erreur lors de la soumission: ' + (error.message || 'Erreur inconnue'));
      setIsSubmitting(false);
    }
  }, [isSubmitting, quiz, answers, submitQuizAnswers, navigate, id, userId]);

  // Vérifier si le temps est écoulé pour soumettre automatiquement
  useEffect(() => {
    if (timeLeft === 0 && quiz && !isSubmitting && !isLoading) {
      handleSubmit();
    }
  }, [timeLeft, quiz, isSubmitting, isLoading, handleSubmit]);

  // Sélection d'une réponse
  const handleSelectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: optionId
    }));
  }, []);

  // Navigation entre les questions
  const handlePrev = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (!quiz) return;
    setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1));
  }, [quiz]);

  if (!user) return <Navigate to="/login" />;
  if (error) return <ErrorScreen error={error} />;
  if (isLoading || !quiz) return <LoadingScreen />;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-8"
          >
            <QuizHeader
              title={quiz.title}
              timeLeft={timeLeft}
              currentIndex={currentQuestionIndex}
              totalQuestions={quiz.questions.length}
              progress={progress}
            />

            <QuestionCard
              key={`question-${currentQuestionIndex}`}
              question={currentQuestion}
              selectedAnswer={answers[currentQuestion.id] || ''}
              onSelect={handleSelectAnswer}
            />

            <NavigationControls
              currentIndex={currentQuestionIndex}
              totalQuestions={quiz.questions.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

// Composants enfants
const ErrorScreen = ({ error }: { error: string }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Retour
        </Button>
      </div>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse">Chargement...</div>
    </div>
  </div>
);

const QuizHeader = ({
  title, timeLeft, currentIndex, totalQuestions, progress
}: {
  title: string;
  timeLeft: number;
  currentIndex: number;
  totalQuestions: number;
  progress: number;
}) => (
  <>
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md">
        <Clock className="h-4 w-4 mr-2" />
        <span className="font-medium">
          {Math.floor(timeLeft / 60)}:
          {timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
        </span>
      </div>
    </div>
    <div className="flex justify-between items-center mb-2 text-sm">
      <span className="text-muted-foreground">
        Question {currentIndex + 1} sur {totalQuestions}
      </span>
      <span className="font-medium">{Math.round(progress)}%</span>
    </div>
    <Progress value={progress} className="h-2 mb-8" />
  </>
);

const NavigationControls = ({
  currentIndex, totalQuestions, onPrev, onNext, onSubmit, isSubmitting
}: {
  currentIndex: number;
  totalQuestions: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) => (
  <div className="flex justify-between flex-col sm:flex-row gap-2 sm:gap-0">  {/* Ajout de flex-col pour mobile */}
    <Button variant="outline" onClick={onPrev} disabled={currentIndex === 0 || isSubmitting} className="w-full sm:w-auto">
      <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
    </Button>
    {currentIndex === totalQuestions - 1 ? (
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting} 
        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
      >
        {isSubmitting ? 'Soumission...' : 'Terminer le quiz'} 
        <Check className="ml-2 h-4 w-4" />
      </Button>
    ) : (
      <Button onClick={onNext} disabled={isSubmitting} className="w-full sm:w-auto">
        Suivant <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    )}
  </div>
);

const QuestionCard = ({
  question,
  selectedAnswer,
  onSelect,
}: {
  question: QuizQuestion;
  selectedAnswer: string;
  onSelect: (questionId: string, optionId: string) => void;
}) => {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <h2 className="text-xl font-medium mb-6">{question.text}</h2>
          <RadioGroup
            value={selectedAnswer}
            onValueChange={(value) => onSelect(question.id, value)}
            className="space-y-3"
          >
            {question.options.map((option) => (
              <Label
                key={option.id}
                htmlFor={`option-${question.id}-${option.id}`}
                className={`
                  flex items-center space-x-3 border rounded-lg p-3 sm:p-4 transition-all cursor-pointer text-sm sm:text-base
                  ${selectedAnswer === option.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                `}
              >
                <RadioGroupItem value={option.id} id={`option-${question.id}-${option.id}`} />
                <span className="font-normal">{option.text}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};

export default Quiz;