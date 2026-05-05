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

export type AIModelType = 'gemini' | 'openrouter' | 'groq' | 'ollama' | 'qwen';

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
  collaboratorUids?: string[];
  invitedEmails?: string[];
  isShared?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  shareCode?: string;
  visibility?: 'private' | 'by_code';
  mode?: 'ai' | 'manual' | 'async' | 'realtime';
  status?: 'draft' | 'active' | 'completed';
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
    modelType?: AIModelType,
    progressCallback?: ProgressCallback
  ) => Promise<string>;
  getQuiz: (id: string) => Promise<Quiz | null>;
  submitQuizAnswers: (
    quizId: string,
    answers: Record<string, string>
  ) => Promise<{ quizId: string; submissionId: string; score: number }>;
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

export interface ManualQuestion {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  points: number;
}

export interface ManualQuiz {
  id: string;
  title: string;
  description: string;
  questions: ManualQuestion[];
  createdAt: string;
  creatorId: string;
  isPublic: boolean;
  timeLimit?: number;
  shareCode?: string;
  visibility?: 'private' | 'by_code';
  mode?: 'realtime' | 'async';
  status?: 'draft' | 'active' | 'completed';
  invitedEmails?: string[];
  collaboratorUids?: string[];
  maxParticipants?: number;
  stats?: {
    participantsCount?: number;
    completedAttempts?: number;
    averageScore?: number;
  };
}

export interface Competition {
  id: string;
  quizId: string;
  creatorId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  shareCode: string;
  isActive: boolean;
  participantsCount: number;
  status?: 'active' | 'completed';
}

export interface Participant {
  id: string;
  competitionId?: string;
  quizId?: string;
  userId: string;
  email?: string;
  name: string;
  joinedAt: string;
  score?: number;
  completedAt?: string;
  rank?: number;
  isActive?: boolean;
  currentQuestionIndex?: number;
  lastActivityAt?: string;
}

export interface Attempt {
  id: string;
  competitionId?: string;
  quizId?: string;
  participantId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  answers: Record<string, string>;
  timeSpent?: number;
}

export interface ShareCodeDoc {
  code: string;
  type: 'quiz' | 'competition';
  targetId: string;
  ownerId: string;
  status: 'active' | 'disabled';
  createdAt?: string;
  expiresAt?: string;
}
