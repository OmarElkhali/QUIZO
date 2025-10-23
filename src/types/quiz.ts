
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
    modelType?: 'chatgpt' | 'gemini',
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


// Types existants...

// Nouveaux types pour le mode manuel
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
  mode?: 'realtime' | 'async'; // Mode de passage du quiz
  status?: 'draft' | 'active' | 'completed'; // Statut du quiz
  invitedEmails?: string[]; // Liste des emails invités
  maxParticipants?: number; // Nombre maximum de participants
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
}

export interface Participant {
  id: string;
  competitionId: string;
  quizId?: string; // ID du quiz manuel
  userId: string;
  email?: string;
  name: string;
  joinedAt: string;
  score?: number;
  completedAt?: string;
  rank?: number;
  isActive?: boolean; // Pour le mode temps réel
  currentQuestionIndex?: number; // Progression en temps réel
}

export interface Attempt {
  id: string;
  competitionId?: string;
  quizId?: string; // ID du quiz manuel
  participantId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  answers: Record<string, string>;
  timeSpent?: number; // Temps passé en secondes
}
