import axios from 'axios';
import { auth } from '@/lib/firebase';
import { ManualQuestion } from '@/types/quiz';

const FLASK_API_URL = import.meta.env.VITE_BACKEND_URL || '/api';

export type ManualAssistantAction =
  | 'generate_from_course'
  | 'improve_question'
  | 'generate_options'
  | 'generate_explanation'
  | 'adjust_difficulty'
  | 'detect_issues'
  | 'generate_similar';

export interface ManualAssistantRequest {
  action: ManualAssistantAction;
  courseText?: string;
  question?: Partial<ManualQuestion>;
  difficulty?: 'easy' | 'medium' | 'hard';
  numQuestions?: number;
  language?: string;
}

export interface ManualAssistantSuggestion {
  id: string;
  text: string;
  options: ManualQuestion['options'];
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface ManualAssistantResponse {
  summary: string;
  issues: string[];
  suggestions: ManualAssistantSuggestion[];
  provider: string;
  model: string;
  fallback?: boolean;
}

const getAuthHeaders = async (contentType = 'application/json'): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': contentType };
  const user = auth.currentUser;
  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  return headers;
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; details?: string; message?: string } | undefined;
    return data?.error || data?.details || data?.message || error.message;
  }

  return error instanceof Error ? error.message : String(error);
};

const normalizeSuggestion = (suggestion: Partial<ManualAssistantSuggestion>, index: number): ManualAssistantSuggestion | null => {
  if (!suggestion?.text || !Array.isArray(suggestion.options)) {
    return null;
  }

  const options = suggestion.options
    .filter((option) => option && typeof option.text === 'string' && option.text.trim().length > 0)
    .map((option, optionIndex) => ({
      id: option.id || `assistant_${index + 1}_${optionIndex + 1}`,
      text: option.text.trim(),
      isCorrect: option.isCorrect === true,
    }));

  if (options.length < 2) {
    return null;
  }

  if (!options.some((option) => option.isCorrect)) {
    options[0].isCorrect = true;
  }

  let correctSeen = false;
  const normalizedOptions = options.map((option) => {
    if (option.isCorrect && !correctSeen) {
      correctSeen = true;
      return option;
    }

    return { ...option, isCorrect: false };
  });

  return {
    id: suggestion.id || `assistant_${Date.now()}_${index}`,
    text: suggestion.text.trim(),
    options: normalizedOptions,
    explanation: suggestion.explanation || '',
    difficulty: suggestion.difficulty || 'medium',
    points: suggestion.points || 1,
  };
};

export const extractCourseTextFromFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const headers = await getAuthHeaders('multipart/form-data');
  const response = await axios.post(`${FLASK_API_URL}/extract-text`, formData, {
    headers,
    timeout: 120000,
  });

  const text = response.data?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error("Le fichier n'a pas fourni de texte exploitable.");
  }

  return text;
};

export const runManualAssistant = async (request: ManualAssistantRequest): Promise<ManualAssistantResponse> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${FLASK_API_URL}/manual-assistant`, request, {
      headers,
      timeout: 180000,
    });

    const suggestions = Array.isArray(response.data?.suggestions)
      ? response.data.suggestions
        .map((suggestion: Partial<ManualAssistantSuggestion>, index: number) => normalizeSuggestion(suggestion, index))
        .filter((suggestion: ManualAssistantSuggestion | null): suggestion is ManualAssistantSuggestion => suggestion !== null)
      : [];

    if (suggestions.length === 0) {
      throw new Error("L'assistant n'a pas retourne de proposition utilisable.");
    }

    return {
      summary: response.data?.summary || 'Propositions generees.',
      issues: Array.isArray(response.data?.issues) ? response.data.issues.map(String) : [],
      suggestions,
      provider: response.data?.provider || 'openrouter',
      model: response.data?.model || 'unknown',
      fallback: response.data?.fallback === true,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
