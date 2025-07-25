
export interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  correctAnswer?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  completionRate?: number;
  duration: string;
  participants?: number;
  collaborators?: string[];
  isShared?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

export type ProgressCallback = (stage: string, percent: number, message?: string) => void;

export interface QuizContextType {
  quizzes: Quiz[];
  sharedQuizzes: Quiz[];
  currentQuiz: Quiz | null;
  isLoading: boolean;
  createQuiz: (
    file: File, 
    numQuestions: number, 
    difficulty?: 'easy' | 'medium' | 'hard', 
    timeLimit?: number, 
    additionalInfo?: string, 
    apiKey?: string,
    modelType?: 'qwen' | 'gemini',
    progressCallback?: ProgressCallback
  ) => Promise<string>;
  getQuiz: (id: string) => Promise<Quiz | null>;
  submitQuizAnswers: (quizId: string, answers: Record<string, string>) => Promise<number>;
  deleteQuiz: (id: string) => Promise<void>;
  shareQuiz: (id: string, email: string) => Promise<void>;
  removeCollaborator: (quizId: string, collaboratorId: string) => Promise<void>;
}

export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string>;
  score: number;
  completedAt: string;
}
