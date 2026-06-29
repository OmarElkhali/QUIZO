import axios from 'axios';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { AIModelType, Question } from '@/types/quiz';

// URL de l'API Flask - utiliser le proxy Vite en dev, variable d'env en prod
const FLASK_API_URL = import.meta.env.VITE_BACKEND_URL || '/api';

/** Returns headers with the current user's Firebase ID token for backend auth. */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Token fetch failed — continue without auth (backend will reject in prod)
  }
  return headers;
};

type BackendQuestion = Partial<Question> & {
  options?: Array<{
    id?: string;
    text?: string;
    isCorrect?: boolean;
  }>;
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; details?: string; message?: string } | undefined;
    return data?.error || data?.details || data?.message || error.message;
  }

  return error instanceof Error ? error.message : String(error);
};

const normalizeQuestion = (
  question: BackendQuestion,
  index: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Question | null => {
  if (!question?.text || !Array.isArray(question.options)) {
    return null;
  }

  const options = question.options
    .filter(option => typeof option?.text === 'string' && option.text.trim().length > 0)
    .slice(0, 4)
    .map((option, optionIndex) => ({
      id: option.id || `q${index + 1}_${String.fromCharCode(97 + optionIndex)}`,
      text: option.text || '',
      isCorrect: option.isCorrect === true,
    }));

  if (options.length < 2) {
    return null;
  }

  if (!options.some(option => option.isCorrect)) {
    options[0].isCorrect = true;
  }

  return {
    id: question.id || `q${index + 1}`,
    text: question.text,
    options,
    explanation: question.explanation || 'Explication non disponible.',
    difficulty: question.difficulty || difficulty,
  };
};

const extractTextWithBackend = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const authHeaders = await getAuthHeaders();
  const response = await axios.post(`${FLASK_API_URL}/extract-text`, formData, {
    headers: {
      ...authHeaders,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000,
  });

  const text = response.data?.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Le backend n a pas retourne de texte exploitable.');
  }

  return text;
};

export const getFirebaseBackupQuestions = async (): Promise<Question[]> => {
  try {
    const questionsCollection = collection(db, 'backup-questions');
    const snapshot = await getDocs(questionsCollection);

    if (!snapshot.empty) {
      const questions = snapshot.docs
        .map((doc, index) => normalizeQuestion(doc.data() as BackendQuestion, index, 'medium'))
        .filter((question): question is Question => question !== null);

      if (questions.length > 0) {
        return questions;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la recuperation des questions Firebase:', error);
  }

  return getStaticBackupQuestions();
};

const getStaticBackupQuestions = (): Question[] => [
  {
    id: 'q1',
    text: 'Quel est le role principal du document source dans QUIZO ?',
    options: [
      { id: 'q1_a', text: 'Servir de base pour generer des questions', isCorrect: true },
      { id: 'q1_b', text: 'Remplacer la base de donnees', isCorrect: false },
      { id: 'q1_c', text: 'Creer un compte utilisateur', isCorrect: false },
      { id: 'q1_d', text: 'Modifier les permissions Firebase', isCorrect: false },
    ],
    explanation: 'QUIZO extrait le texte du document puis genere des questions a partir de ce contenu.',
    difficulty: 'medium',
  },
  {
    id: 'q2',
    text: 'Pourquoi faut-il valider les questions generees ?',
    options: [
      { id: 'q2_a', text: 'Pour garantir une structure utilisable par le quiz', isCorrect: true },
      { id: 'q2_b', text: 'Pour supprimer tous les resultats', isCorrect: false },
      { id: 'q2_c', text: 'Pour empecher les utilisateurs invites', isCorrect: false },
      { id: 'q2_d', text: 'Pour desactiver le backend', isCorrect: false },
    ],
    explanation: 'Chaque question doit avoir un texte, des options et une reponse correcte.',
    difficulty: 'medium',
  },
];

export const processFileAndGenerateQuestions = async (
  file: File,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  additionalInfo?: string,
  modelType: AIModelType = 'gemini',
  apiKey?: string,
  progressCallback?: (progress: number) => void
): Promise<Question[]> => {
  progressCallback?.(0.1);
  console.log('=== DEBUT EXTRACTION DE TEXTE ===', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    backendUrl: FLASK_API_URL,
  });

  let extractedText = '';

  try {
    extractedText = await extractTextWithBackend(file);
  } catch (error) {
    console.error('Extraction backend impossible:', error);

    if (file.type.includes('text') || file.name.toLowerCase().endsWith('.txt')) {
      extractedText = await file.text();
    } else {
      throw new Error(`Backend Flask inaccessible ou extraction impossible: ${getErrorMessage(error)}`);
    }
  }

  if (!extractedText.trim()) {
    throw new Error('Le fichier ne contient pas de texte exploitable.');
  }

  console.log(`Texte extrait: ${extractedText.length} caracteres`);
  progressCallback?.(0.3);

  try {
    const questions = await generateQuestionsWithAI(
      extractedText,
      numQuestions,
      difficulty,
      additionalInfo,
      modelType,
      apiKey,
      progress => progressCallback?.(0.3 + progress * 0.7)
    );

    return questions;
  } catch (error) {
    throw new Error(`Texte extrait (${extractedText.length} caracteres), mais generation impossible: ${getErrorMessage(error)}`);
  }
};

export const generateQuestionsWithAI = async (
  text: string,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  additionalInfo?: string,
  modelType: AIModelType = 'gemini',
  apiKey?: string,
  progressCallback?: (progress: number) => void
): Promise<Question[]> => {
  progressCallback?.(0.1);

  // Vérification de l'état du serveur Flask (non bloquant)
  try {
    const health = await axios.get(`${FLASK_API_URL}/health`, { timeout: 5000 });
    console.log('Backend health:', health.data);
  } catch (error) {
    console.warn('Health check backend non bloquant:', error);
  }

  progressCallback?.(0.3);

  const authHeaders = await getAuthHeaders();

  // Timeout adapté au modèle (Groq ultra-rapide, Gemini/OpenRouter plus lents)
  const timeoutMs = modelType === 'groq' ? 60000 : 240000;

  const response = await axios.post(`${FLASK_API_URL}/generate`, {
    text,
    numQuestions,
    difficulty,
    additionalInfo,
    modelType,
    apiKey,
  }, {
    headers: authHeaders,
    timeout: timeoutMs,
  });

  if (response.data?.warning) {
    console.warn('Backend generation warning:', response.data.warning);
  }

  const rawQuestions = response.data?.questions;
  if (!Array.isArray(rawQuestions)) {
    throw new Error('Le backend n a pas retourne de questions.');
  }

  const questions = rawQuestions
    .map((question: BackendQuestion, index: number) => normalizeQuestion(question, index, difficulty))
    .filter((question: Question | null): question is Question => question !== null)
    .slice(0, numQuestions);

  if (questions.length === 0) {
    throw new Error('Aucune question valide n a ete generee.');
  }

  // Compléter avec des questions de secours si nécessaire
  if (questions.length < numQuestions) {
    console.log(`Complétion de ${numQuestions - questions.length} questions manquantes avec la base de secours...`);
    const backupQuestions = await getFirebaseBackupQuestions();
    const remaining = backupQuestions
      .filter(bq => !questions.some(q => q.text === bq.text))
      .slice(0, numQuestions - questions.length)
      .map(bq => ({ ...bq, difficulty }));
    
    const finalQuestions = [...questions, ...remaining];
    progressCallback?.(1);
    return finalQuestions.slice(0, numQuestions);
  }

  progressCallback?.(1);
  return questions;
};
