/**
 * Service pour interagir avec un LLM local (Ollama/LM Studio)
 * Alternative gratuite et privée aux API cloud (Gemini/ChatGPT)
 */

import axios from 'axios';
import { Question } from '@/types/quiz';

// Configuration du serveur LLM local
const LOCAL_LLM_URL = import.meta.env.VITE_LOCAL_LLM_URL || 'http://localhost:11434';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

export interface LocalLLMConfig {
  model?: string;  // 'qwen2.5:7b', 'llama3.1:8b', 'mistral:7b', etc.
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

/**
 * Vérifie si le LLM local (Ollama) est disponible
 */
export const isLocalLLMAvailable = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${LOCAL_LLM_URL}/api/tags`, {
      timeout: 2000
    });
    return response.status === 200;
  } catch (error) {
    console.warn('LLM local non disponible:', error);
    return false;
  }
};

/**
 * Liste les modèles LLM locaux disponibles
 */
export const listLocalModels = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${LOCAL_LLM_URL}/api/tags`, {
      timeout: 5000
    });
    
    const models = response.data.models?.map((model: any) => model.name) || [];
    console.log('Modèles locaux disponibles:', models);
    return models;
  } catch (error) {
    console.error('Erreur lors de la récupération des modèles locaux:', error);
    return [];
  }
};

/**
 * Génère du texte avec Ollama directement
 */
export const generateWithOllama = async (
  prompt: string,
  config: LocalLLMConfig = {}
): Promise<string> => {
  const {
    model = 'qwen2.5:7b',
    temperature = 0.7,
    topP = 0.9,
  } = config;

  try {
    console.log(`Génération avec Ollama, modèle: ${model}`);
    
    const response = await axios.post(
      `${LOCAL_LLM_URL}/api/generate`,
      {
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          top_p: topP,
          top_k: 40,
        }
      },
      {
        timeout: 180000  // 3 minutes
      }
    );

    const generatedText = response.data.response || '';
    console.log(`Génération réussie: ${generatedText.length} caractères`);
    
    return generatedText;
  } catch (error) {
    console.error('Erreur lors de la génération avec Ollama:', error);
    throw new Error(`Erreur Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Génère des questions avec le LLM local via le backend Flask
 * Cette fonction utilise le backend qui gère Ollama
 */
export const generateQuestionsWithLocalLLM = async (
  text: string,
  numQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  model: string = 'qwen2.5:7b'
): Promise<Question[]> => {
  try {
    console.log(`Génération de ${numQuestions} questions avec LLM local (${model})`);
    
    // Appeler le backend Flask qui gère Ollama
    const response = await axios.post(
      `${BACKEND_URL}/generate`,
      {
        text,
        numQuestions,
        difficulty,
        modelType: 'local',  // Nouveau type pour LLM local
        localModel: model     // Spécifier le modèle Ollama
      },
      {
        timeout: 180000,  // 3 minutes
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const questions = response.data.questions || [];
    
    if (questions.length === 0) {
      throw new Error('Aucune question générée par le LLM local');
    }

    console.log(`${questions.length} questions générées avec succès`);
    return questions;
    
  } catch (error: unknown) {
    console.error('Erreur lors de la génération avec LLM local:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Le serveur LLM local n\'est pas accessible. Assurez-vous qu\'Ollama est en cours d\'exécution.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Le modèle ${model} n'est pas disponible. Téléchargez-le avec: ollama pull ${model}`);
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
    }
    
    throw new Error(
      `Erreur LLM local: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Génère des questions directement avec Ollama (sans passer par le backend)
 * Utile pour tester ou si vous voulez éviter le backend Flask
 */
export const generateQuestionsDirectlyWithOllama = async (
  text: string,
  numQuestions: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  model: string = 'qwen2.5:7b'
): Promise<Question[]> => {
  // Construire le prompt
  const prompt = `Tu es un expert en création de quiz éducatifs. Génère ${numQuestions} questions QCM en français de niveau ${difficulty}.

TEXTE SOURCE :
${text.substring(0, 5000)}

INSTRUCTIONS STRICTES :
1. Crée exactement ${numQuestions} questions basées UNIQUEMENT sur le texte source
2. Chaque question doit avoir EXACTEMENT 4 options
3. UNE SEULE option doit avoir "isCorrect": true
4. L'explication doit citer ou référencer le texte source
5. Utilise le niveau de difficulté: ${difficulty}

FORMAT JSON REQUIS (SANS markdown, SANS \`\`\`json) :
{
  "questions": [
    {
      "text": "Question claire et précise ?",
      "options": [
        {"text": "Réponse correcte", "isCorrect": true},
        {"text": "Réponse plausible mais fausse", "isCorrect": false},
        {"text": "Autre réponse plausible mais fausse", "isCorrect": false},
        {"text": "Dernière réponse plausible mais fausse", "isCorrect": false}
      ],
      "explanation": "Explication basée sur le texte source",
      "difficulty": "${difficulty}"
    }
  ]
}

IMPORTANT : Retourne UNIQUEMENT le JSON, sans texte avant ou après, sans balises markdown.`;

  try {
    // Générer avec Ollama
    const responseText = await generateWithOllama(prompt, { model });
    
    // Nettoyer la réponse
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();
    
    // Parser le JSON
    let data: any;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      // Tenter d'extraire le JSON avec regex
      const jsonMatch = cleanedText.match(/\{.*\}/s);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Impossible de parser la réponse JSON');
      }
    }
    
    const questions: Question[] = data.questions || [];
    
    // Valider et formater
    const validatedQuestions: Question[] = [];
    
    for (let i = 0; i < questions.length && i < numQuestions; i++) {
      const q = questions[i];
      
      // Validation basique
      if (!q.text || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        console.warn(`Question ${i + 1} invalide, ignorée`);
        continue;
      }
      
      // Vérifier qu'il y a exactement une réponse correcte
      const correctCount = q.options.filter((opt: any) => opt.isCorrect).length;
      if (correctCount !== 1) {
        console.warn(`Question ${i + 1} n'a pas exactement 1 réponse correcte, correction...`);
        // Forcer la première comme correcte si nécessaire
        if (correctCount === 0) {
          q.options[0].isCorrect = true;
        } else {
          // Garder seulement la première correcte
          let foundFirst = false;
          q.options.forEach((opt: any) => {
            if (opt.isCorrect) {
              if (foundFirst) {
                opt.isCorrect = false;
              } else {
                foundFirst = true;
              }
            }
          });
        }
      }
      
      // Ajouter les IDs
      const questionId = `q${i + 1}`;
      const formattedQuestion: Question = {
        id: questionId,
        text: q.text,
        options: q.options.map((opt: any, idx: number) => ({
          id: `${questionId}_${String.fromCharCode(97 + idx)}`,  // a, b, c, d
          text: opt.text,
          isCorrect: opt.isCorrect || false
        })),
        explanation: q.explanation || 'Pas d\'explication disponible',
        difficulty: q.difficulty || difficulty
      };
      
      validatedQuestions.push(formattedQuestion);
    }
    
    if (validatedQuestions.length === 0) {
      throw new Error('Aucune question valide générée');
    }
    
    console.log(`${validatedQuestions.length} questions validées`);
    return validatedQuestions;
    
  } catch (error) {
    console.error('Erreur lors de la génération directe avec Ollama:', error);
    throw error;
  }
};

/**
 * Obtient des informations sur le LLM local
 */
export const getLocalLLMInfo = async () => {
  try {
    const available = await isLocalLLMAvailable();
    
    if (!available) {
      return {
        available: false,
        models: [],
        message: 'Ollama non disponible. Installez-le depuis https://ollama.com'
      };
    }
    
    const models = await listLocalModels();
    
    return {
      available: true,
      models,
      message: models.length > 0 
        ? `${models.length} modèle(s) disponible(s)` 
        : 'Aucun modèle téléchargé. Utilisez: ollama pull qwen2.5:7b'
    };
  } catch (error) {
    return {
      available: false,
      models: [],
      message: 'Erreur lors de la vérification du LLM local'
    };
  }
};

/**
 * Modèles recommandés pour QUIZO
 */
export const RECOMMENDED_MODELS = {
  'qwen2.5:7b': {
    name: 'Qwen 2.5 (7B)',
    size: '4.7 GB',
    quality: 5,
    speed: 4,
    description: 'Excellent pour le français et les QCM'
  },
  'qwen2.5:14b': {
    name: 'Qwen 2.5 (14B)',
    size: '8.5 GB',
    quality: 5,
    speed: 3,
    description: 'Meilleure qualité, nécessite plus de ressources'
  },
  'llama3.1:8b': {
    name: 'Llama 3.1 (8B)',
    size: '5 GB',
    quality: 4,
    speed: 4,
    description: 'Très performant, bon multilingue'
  },
  'mistral:7b': {
    name: 'Mistral (7B)',
    size: '4.1 GB',
    quality: 5,
    speed: 5,
    description: 'Rapide et excellent en français'
  },
  'phi3:mini': {
    name: 'Phi-3 Mini',
    size: '2.3 GB',
    quality: 3,
    speed: 5,
    description: 'Léger, parfait pour PC modestes'
  }
};
