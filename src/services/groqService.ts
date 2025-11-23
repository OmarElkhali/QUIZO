/**
 * TypeScript service pour intégration Groq (LLM ultra-rapide et gratuit)
 * Compatible avec QUIZO - Recommandé pour production
 */

import axios from 'axios';
import { Question } from '@/types/quiz';

const FLASK_API_URL = import.meta.env.VITE_BACKEND_URL || '/api';

// Simple in-memory cache pour éviter les requêtes identiques
interface CacheEntry {
  questions: Question[];
  timestamp: number;
}

const questionCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Métriques de performance
interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHits: number;
}

const metrics: PerformanceMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  cacheHits: 0
};

/**
 * Get performance metrics
 */
export const getGroqMetrics = (): PerformanceMetrics => ({ ...metrics });

/**
 * Reset performance metrics
 */
export const resetGroqMetrics = (): void => {
  metrics.totalRequests = 0;
  metrics.successfulRequests = 0;
  metrics.failedRequests = 0;
  metrics.averageResponseTime = 0;
  metrics.cacheHits = 0;
};

/**
 * Clear question cache
 */
export const clearGroqCache = (): void => {
  questionCache.clear();
  console.log('🗑️ Cache Groq vidé');
};

/**
 * Generate cache key from request parameters
 */
const generateCacheKey = (text: string, numQuestions: number, difficulty: string, model: string): string => {
  const textHash = text.substring(0, 100); // First 100 chars as key
  return `${textHash}-${numQuestions}-${difficulty}-${model}`;
};

export interface GroqOptions {
  numQuestions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  model?: string;
}

export interface GroqModel {
  id: string;
  name: string;
  context_window: number;
  max_tokens: number;
}

/**
 * Available Groq models (FREE tier: 14,400 requests/day)
 * Updated November 2025 - Using latest model versions
 */
export const GROQ_MODELS: GroqModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile (Recommandé)',
    context_window: 32768,
    max_tokens: 8192
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant (Ultra-rapide)',
    context_window: 131072,
    max_tokens: 8192
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (Grand contexte)',
    context_window: 32768,
    max_tokens: 32768
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B (Léger et efficace)',
    context_window: 8192,
    max_tokens: 8192
  }
];

/**
 * Check if Groq service is available
 */
export const checkGroqAvailability = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${FLASK_API_URL}/health`, {
      timeout: 5000
    });
    
    // Check if groq is configured in backend
    return response.data?.groq === true || response.data?.status === 'ok';
  } catch (error) {
    console.error('Groq availability check failed:', error);
    return false;
  }
};

/**
 * Generate quiz questions using Groq (ULTRA-FAST)
 * 
 * @param text - Source text for quiz generation
 * @param options - Generation options
 * @returns Array of generated questions
 * 
 * @example
 * ```typescript
 * const questions = await generateQuestionsWithGroq(
 *   "Python est un langage...",
 *   { numQuestions: 10, difficulty: 'medium', model: 'llama3-70b-8192' }
 * );
 * ```
 */
export const generateQuestionsWithGroq = async (
  text: string,
  options: GroqOptions = {}
): Promise<Question[]> => {
  const {
    numQuestions = 5,
    difficulty = 'medium',
    model = 'llama-3.3-70b-versatile'
  } = options;

  if (!text || text.trim().length < 50) {
    throw new Error('Le texte source doit contenir au moins 50 caractères');
  }

  if (numQuestions < 1 || numQuestions > 50) {
    throw new Error('Le nombre de questions doit être entre 1 et 50');
  }

  // Check cache first
  const cacheKey = generateCacheKey(text, numQuestions, difficulty, model);
  const cachedEntry = questionCache.get(cacheKey);
  
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
    metrics.cacheHits++;
    console.log('💾 Questions récupérées du cache (économie de temps et requêtes)');
    return cachedEntry.questions;
  }

  metrics.totalRequests++;
  
  try {
    console.log(`🚀 Génération de ${numQuestions} questions avec Groq (${model})...`);
    const startTime = performance.now();

    const response = await axios.post(
      `${FLASK_API_URL}/generate`,
      {
        text,
        numQuestions,
        difficulty,
        modelType: 'groq',
        groqModel: model
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // Groq est ultra-rapide: 60s max pour 20 questions
      }
    );

    const duration = performance.now() - startTime;
    console.log(`✅ Generated ${numQuestions} questions in ${(duration / 1000).toFixed(1)}s`);
    
    // Update metrics
    metrics.successfulRequests++;
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.successfulRequests - 1) + duration) / metrics.successfulRequests;

    if (!response.data?.questions || !Array.isArray(response.data.questions)) {
      throw new Error('Invalid response format from Groq service');
    }

    // Convert backend format to Question type
    const questions: Question[] = response.data.questions.map((q: any, index: number) => ({
      id: `groq-q${index + 1}-${Date.now()}`,
      text: q.text,
      options: q.options.map((opt: any, optIndex: number) => ({
        id: `groq-q${index + 1}-opt${optIndex + 1}`,
        text: opt.text,
        isCorrect: opt.isCorrect === true
      })),
      explanation: q.explanation || '',
      difficulty: q.difficulty || difficulty
    }));

    // Validate questions
    const validQuestions = questions.filter(q => {
      const hasText = q.text && q.text.length > 0;
      const hasOptions = q.options && q.options.length >= 2;
      const hasCorrectAnswer = q.options.some(opt => opt.isCorrect);
      
      if (!hasText || !hasOptions || !hasCorrectAnswer) {
        console.warn('Invalid question filtered out:', q);
        return false;
      }
      
      return true;
    });

    if (validQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }

    console.log(`✅ ${validQuestions.length}/${questions.length} valid questions`);
    
    // Cache the validated questions
    questionCache.set(cacheKey, {
      questions: validQuestions,
      timestamp: Date.now()
    });
    
    // Log metrics
    console.log(`📊 Metrics: ${metrics.successfulRequests}/${metrics.totalRequests} success, avg ${(metrics.averageResponseTime / 1000).toFixed(1)}s, ${metrics.cacheHits} cache hits`);
    
    return validQuestions;

  } catch (error: any) {
    metrics.failedRequests++;
    console.error('❌ Erreur génération Groq:', error);
    
    // Handle specific error cases with detailed messages
    if (error.response?.status === 503) {
      throw new Error('Service Groq non configuré. Vérifiez GROQ_API_KEY dans le backend.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Limite de requêtes Groq atteinte (14,400/jour). Réessayez dans 24h ou utilisez un autre modèle.');
    }
    
    if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.error?.message || '';
      if (errorMsg.includes('decommissioned')) {
        throw new Error(`Modèle Groq obsolète. Utilisez: ${GROQ_MODELS.map(m => m.id).join(', ')}`);
      }
      throw new Error(`Requête invalide: ${errorMsg}`);
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      // Suggest fallback to faster model
      if (model !== 'llama-3.1-8b-instant') {
        console.warn('💡 Suggestion: Essayez le modèle llama-3.1-8b-instant (plus rapide)');
      }
      throw new Error(`Timeout Groq après ${numQuestions} questions. Réduisez le nombre ou utilisez llama-3.1-8b-instant.`);
    }
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Backend non accessible. Vérifiez que Flask tourne sur localhost:5000');
    }
    
    throw new Error(error.response?.data?.error || error.message || 'Erreur génération Groq');
  }
};

/**
 * Generate questions from file using Groq
 */
export const generateQuestionsFromFileWithGroq = async (
  file: File,
  options: GroqOptions = {}
): Promise<Question[]> => {
  const {
    numQuestions = 5,
    difficulty = 'medium',
    model = 'llama-3.3-70b-versatile'
  } = options;

  // Validation du fichier
  if (!file) {
    throw new Error('Aucun fichier fourni');
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('Fichier trop volumineux (max 10MB)');
  }

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format non supporté. Utilisez PDF, DOCX ou TXT');
  }

  try {
    console.log(`📄 Extraction du texte depuis: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    const startTime = performance.now();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('numQuestions', numQuestions.toString());
    formData.append('difficulty', difficulty);
    formData.append('modelType', 'groq');
    formData.append('groqModel', model);

    const response = await axios.post(
      `${FLASK_API_URL}/generate`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 180000, // 3 minutes pour gros fichiers
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`⬆️ Upload: ${percentCompleted}%`);
          }
        }
      }
    );

    const duration = performance.now() - startTime;
    console.log(`✅ Fichier traité en ${(duration / 1000).toFixed(1)}s`);

    if (!response.data?.questions || !Array.isArray(response.data.questions)) {
      throw new Error('Invalid response format from Groq service');
    }

    // Convert to Question type (same as above)
    const questions: Question[] = response.data.questions.map((q: any, index: number) => ({
      id: `groq-q${index + 1}-${Date.now()}`,
      text: q.text,
      options: q.options.map((opt: any, optIndex: number) => ({
        id: `groq-q${index + 1}-opt${optIndex + 1}`,
        text: opt.text,
        isCorrect: opt.isCorrect === true
      })),
      explanation: q.explanation || '',
      difficulty: q.difficulty || difficulty
    }));

    return questions.filter(q => 
      q.text && 
      q.options.length >= 2 && 
      q.options.some(opt => opt.isCorrect)
    );

  } catch (error: any) {
    console.error('Groq file generation error:', error);
    throw new Error(error.response?.data?.error || error.message || 'File generation failed');
  }
};

/**
 * Estimate Groq usage for planning
 * Free tier: 14,400 requests/day
 */
export const estimateGroqUsage = (questionsPerQuiz: number, quizzesPerDay: number): {
  requestsNeeded: number;
  withinFreeLimit: boolean;
  percentageUsed: number;
  remainingRequests: number;
  estimatedCostIfExceeded: number;
} => {
  const requestsNeeded = quizzesPerDay; // 1 request per quiz
  const freeLimit = 14400;
  const costPerRequest = 0.01; // $0.01 par quiz si dépassement
  
  return {
    requestsNeeded,
    withinFreeLimit: requestsNeeded <= freeLimit,
    percentageUsed: Math.min((requestsNeeded / freeLimit) * 100, 100),
    remainingRequests: Math.max(freeLimit - requestsNeeded, 0),
    estimatedCostIfExceeded: Math.max((requestsNeeded - freeLimit) * costPerRequest, 0)
  };
};

export default {
  checkGroqAvailability,
  generateQuestionsWithGroq,
  generateQuestionsFromFileWithGroq,
  estimateGroqUsage,
  GROQ_MODELS
};
