import axios from 'axios';
import { auth } from '@/lib/firebase';
import { BACKEND_API_URL } from '@/lib/backendUrl';
import type { QuizQuestionInput } from '@/domain/quizRules';

export interface AnswerExplanation {
  explanation: string;
  keyPoint?: string;
  provider: string;
  model: string;
  fallback: boolean;
}

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; details?: string } | undefined;
    return data?.error || data?.details || error.message;
  }
  return error instanceof Error ? error.message : String(error);
};

export const requestAnswerExplanation = async (
  question: QuizQuestionInput,
  selectedOptionId?: string,
  explanationRequest = '',
): Promise<AnswerExplanation> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Connectez-vous pour demander une explication à l’IA.');

  try {
    const response = await axios.post(`${BACKEND_API_URL}/explain-answer`, {
      question: question.text,
      options: question.options,
      selectedOptionId,
      existingExplanation: question.explanation || '',
      explanationRequest: explanationRequest.trim(),
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      timeout: 60_000,
    });

    return {
      explanation: String(response.data?.explanation || ''),
      keyPoint: response.data?.keyPoint ? String(response.data.keyPoint) : undefined,
      provider: String(response.data?.provider || 'unknown'),
      model: String(response.data?.model || 'unknown'),
      fallback: response.data?.fallback === true,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
