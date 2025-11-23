import axios from 'axios';
import { Question } from '@/types/quiz';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { extractTextFromFile } from './fileService';

// URL de l'API Flask - utiliser proxy Vite en dev, variable d'env en prod
const FLASK_API_URL = import.meta.env.VITE_BACKEND_URL || '/api';

// Exporter la fonction pour pouvoir l'utiliser directement
export const getFirebaseBackupQuestions = async (): Promise<Question[]> => {
  try {
    // Essayer de récupérer les questions depuis Firestore
    const questionsCollection = collection(db, 'backup-questions');
    const snapshot = await getDocs(questionsCollection);
    
    if (!snapshot.empty) {
      const questions = snapshot.docs.map(doc => doc.data() as Question);
      console.log('Questions de secours récupérées depuis Firebase:', questions.length);
      return questions;
    }
    
    // Si aucune question n'existe dans Firestore, utiliser les questions statiques
    console.log('Aucune question trouvée dans Firebase, utilisation des questions statiques');
    return getStaticBackupQuestions();
  } catch (error) {
    console.error('Erreur lors de la récupération des questions depuis Firebase:', error);
    // En cas d'erreur, utiliser les questions statiques
    return getStaticBackupQuestions();
  }
};

// Questions statiques de secours (utilisées uniquement si Firebase échoue)
const getStaticBackupQuestions = (): Question[] => {
  return [
    {
      id: 'q1',
      text: 'Quelle fonctionnalité principale offre Firebase Realtime Database ?',
      options: [
        { id: 'q1_a', text: 'Stockage de fichiers volumineux', isCorrect: false },
        { id: 'q1_b', text: 'Base de données relationnelle', isCorrect: false },
        { id: 'q1_c', text: 'Synchronisation de données en temps réel', isCorrect: true },
        { id: 'q1_d', text: 'Hébergement de sites web', isCorrect: false }
      ],
      explanation: 'Firebase Realtime Database est une base de données NoSQL cloud qui permet de synchroniser les données entre clients en temps réel.',
      difficulty: 'medium'
    },
    {
      id: 'q2',
      text: 'Quel service Firebase permet l\'authentification des utilisateurs ?',
      options: [
        { id: 'q2_a', text: 'Firebase Firestore', isCorrect: false },
        { id: 'q2_b', text: 'Firebase Auth', isCorrect: true },
        { id: 'q2_c', text: 'Firebase Hosting', isCorrect: false },
        { id: 'q2_d', text: 'Firebase Cloud Messaging', isCorrect: false }
      ],
      explanation: 'Firebase Auth fournit des services backend et des SDK prêts à l\'emploi pour authentifier les utilisateurs dans votre application.',
      difficulty: 'easy'
    },
    {
      id: 'q3',
      text: 'Quelle est la principale différence entre Firebase Realtime Database et Firestore ?',
      options: [
        { id: 'q3_a', text: 'Firestore ne permet pas d\'accéder aux données hors ligne', isCorrect: false },
        { id: 'q3_b', text: 'Firestore est une base relationnelle', isCorrect: false },
        { id: 'q3_c', text: 'Firestore utilise une structure de type document/collection', isCorrect: true },
        { id: 'q3_d', text: 'Realtime Database offre plus de sécurité que Firestore', isCorrect: false }
      ],
      explanation: 'Firestore utilise un modèle de données plus intuitif avec des collections de documents, tandis que Realtime Database stocke les données dans une grande arborescence JSON.',
      difficulty: 'medium'
    },
    {
      id: 'q4',
      text: 'Firebase Cloud Messaging (FCM) est utilisé pour :',
      options: [
        { id: 'q4_a', text: 'Sauvegarder les données de l\'application', isCorrect: false },
        { id: 'q4_b', text: 'Envoyer des notifications push', isCorrect: true },
        { id: 'q4_c', text: 'Créer une interface utilisateur', isCorrect: false },
        { id: 'q4_d', text: 'Gérer les paiements', isCorrect: false }
      ],
      explanation: 'Firebase Cloud Messaging est une solution de messagerie multiplateforme qui permet d\'envoyer des notifications push de manière fiable.',
      difficulty: 'easy'
    },
    {
      id: 'q5',
      text: 'Firebase Hosting permet de :',
      options: [
        { id: 'q5_a', text: 'Gérer les utilisateurs', isCorrect: false },
        { id: 'q5_b', text: 'Déployer des applications web statiques', isCorrect: true },
        { id: 'q5_c', text: 'Envoyer des emails', isCorrect: false },
        { id: 'q5_d', text: 'Gérer les bases de données', isCorrect: false }
      ],
      explanation: 'Firebase Hosting fournit un hébergement rapide et sécurisé pour applications web, contenu statique et dynamique.',
      difficulty: 'easy'
    },
    {
      id: 'q6',
      text: 'Quel langage Firebase Cloud Functions utilise-t-il principalement ?',
      options: [
        { id: 'q6_a', text: 'Python', isCorrect: false },
        { id: 'q6_b', text: 'Java', isCorrect: false },
        { id: 'q6_c', text: 'JavaScript / TypeScript', isCorrect: true },
        { id: 'q6_d', text: 'Ruby', isCorrect: false }
      ],
      explanation: 'Firebase Cloud Functions utilise principalement JavaScript ou TypeScript, s\'exécutant dans un environnement Node.js.',
      difficulty: 'medium'
    },
    {
      id: 'q7',
      text: 'Pour quelle raison utiliser Firebase Analytics ?',
      options: [
        { id: 'q7_a', text: 'Stocker des fichiers', isCorrect: false },
        { id: 'q7_b', text: 'Analyser le trafic réseau', isCorrect: false },
        { id: 'q7_c', text: 'Comprendre le comportement des utilisateurs', isCorrect: true },
        { id: 'q7_d', text: 'Sauvegarder les préférences utilisateur', isCorrect: false }
      ],
      explanation: 'Firebase Analytics fournit des informations sur le comportement des utilisateurs et leur utilisation de l\'application.',
      difficulty: 'medium'
    },
    {
      id: 'q8',
      text: 'Quelle règle de sécurité Firebase est correcte pour autoriser uniquement l\'utilisateur connecté à lire ses propres données ?',
      options: [
        { id: 'q8_a', text: '"read": true', isCorrect: false },
        { id: 'q8_b', text: '"read": "auth != null"', isCorrect: false },
        { id: 'q8_c', text: '"read": "auth.uid == userId"', isCorrect: true },
        { id: 'q8_d', text: '"read": "false"', isCorrect: false }
      ],
      explanation: 'La règle "auth.uid == userId" vérifie que l\'ID de l\'utilisateur authentifié correspond à l\'ID utilisateur dans le chemin de la base de données.',
      difficulty: 'hard'
    },
    {
      id: 'q9',
      text: 'Quel plan Firebase propose des fonctionnalités payantes ?',
      options: [
        { id: 'q9_a', text: 'Free Plan', isCorrect: false },
        { id: 'q9_b', text: 'Spark Plan', isCorrect: false },
        { id: 'q9_c', text: 'Flame Plan', isCorrect: false },
        { id: 'q9_d', text: 'Blaze Plan', isCorrect: true }
      ],
      explanation: 'Le plan Blaze est le plan de tarification à l\'usage qui débloque toutes les fonctionnalités Firebase avec des tarifs évolutifs.',
      difficulty: 'medium'
    },
    {
      id: 'q10',
      text: 'Qu\'est-ce que Firebase Remote Config permet ?',
      options: [
        { id: 'q10_a', text: 'Modifier le code source à distance', isCorrect: false },
        { id: 'q10_b', text: 'Modifier dynamiquement le comportement et l\'apparence de l\'application', isCorrect: true },
        { id: 'q10_c', text: 'Gérer les versions de base de données', isCorrect: false },
        { id: 'q10_d', text: 'Supprimer les utilisateurs', isCorrect: false }
      ],
      explanation: 'Remote Config permet de modifier l\'apparence et le comportement de votre application sans publier une nouvelle version.',
      difficulty: 'medium'
    }
  ];
};

export const processFileAndGenerateQuestions = async (
  file: File,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  additionalInfo?: string,
  modelType: 'chatgpt' | 'gemini' = 'gemini',
  progressCallback?: (progress: number) => void
): Promise<Question[]> => {
  try {
    // Extraction du texte à partir du fichier en utilisant l'API Flask
    progressCallback?.(0.1);
    console.log(`=== DÉBUT EXTRACTION DE TEXTE ===`);
    console.log(`Fichier: ${file.name} (${file.type}, ${file.size} octets)`);
    console.log(`Extraction du texte du fichier via Flask API: ${file.name}`);
    
    let extractedText = "";
    
    try {
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', file);
      console.log(`FormData créé avec le fichier ${file.name}`);
      
      // Appeler l'API Flask pour extraire le texte
      console.log(`Envoi de la requête d'extraction à ${FLASK_API_URL}/extract-text`);
      const response = await axios.post(`${FLASK_API_URL}/extract-text`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minutes (extraction PDF peut être lente pour gros fichiers)
      });
      
      if (response.data && response.data.text) {
        extractedText = response.data.text;
        console.log(`Texte extrait avec succès via Flask API (${extractedText.length} caractères)`);
        console.log(`Aperçu du texte extrait: ${extractedText.substring(0, 150)}...`);
      } else {
        console.error('Format de réponse incorrect depuis l\'API Flask d\'extraction');
        console.error('Réponse reçue:', response.data);
        // Fallback à l'extraction côté client
        console.log('Tentative d\'extraction côté client...');
        extractedText = await extractTextFromFile(file);
      }
    } catch (extractError) {
      console.error('Erreur lors de l\'extraction via Flask API:', extractError);
      console.log('Utilisation de l\'extraction côté client comme solution de secours...');
      // Fallback à l'extraction côté client
      extractedText = await extractTextFromFile(file);
    }
    console.log(`=== FIN EXTRACTION DE TEXTE ===`);
    
    // Génération des questions à partir du texte extrait
    progressCallback?.(0.3);
    console.log(`=== DÉBUT GÉNÉRATION DE QUESTIONS ===`);
    console.log(`Paramètres: ${numQuestions} questions, difficulté ${difficulty}, modèle ${modelType}`);
    if (additionalInfo) {
      console.log(`Informations additionnelles fournies: ${additionalInfo}`);
    }
    
    const questions = await generateQuestionsWithAI(
      extractedText,
      numQuestions,
      difficulty,
      additionalInfo,
      modelType,
      (progress) => {
        const totalProgress = 0.3 + progress * 0.7;
        console.log(`Progression de la génération: ${Math.round(progress * 100)}% (Total: ${Math.round(totalProgress * 100)}%)`);
        progressCallback?.(totalProgress);
      }
    );
    
    console.log(`${questions.length} questions générées avec succès`);
    questions.forEach((q, index) => {
      console.log(`Question ${index + 1}: ${q.text}`);
      console.log(`  Options: ${q.options.map(o => o.text).join(' | ')}`);
      console.log(`  Réponse correcte: ${q.options.find(o => o.isCorrect)?.text}`);
    });
    console.log(`=== FIN GÉNÉRATION DE QUESTIONS ===`);
    
    return questions;
  } catch (error) {
    console.error('=== ERREUR LORS DU TRAITEMENT DU FICHIER ===');
    console.error('Détails de l\'erreur:', error);
    throw error;
  }
};

export const generateQuestionsWithAI = async (
  text: string,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  additionalInfo?: string,
  modelType: 'chatgpt' | 'gemini' | 'groq' = 'groq', // Groq par défaut
  progressCallback?: (progress: number) => void,
  apiKey?: string
): Promise<Question[]> => {
  try {
    console.log(`Génération de ${numQuestions} questions avec ${modelType} via Flask API...`);
    progressCallback?.(0.1);
    
    // Vérification de l'état du serveur Flask
    try {
      progressCallback?.(0.2);
      console.log('🔍 Vérification du serveur Flask...');
      const healthCheck = await axios.get(`${FLASK_API_URL}/health`, { timeout: 5000 });
      console.log('✅ Serveur Flask opérationnel:', healthCheck.data);
      
      // Vérifier que le modèle choisi est configuré
      if (modelType === 'gemini' && !healthCheck.data.services?.gemini) {
        throw new Error('Gemini API non configurée. Ajoutez GEMINI_API_KEY dans python_api/.env');
      }
      if (modelType === 'groq') {
        if (!healthCheck.data.groq) {
          throw new Error('Groq API non configurée. Ajoutez GROQ_API_KEY dans python_api/.env');
        }
        console.log('⚡ Groq activé - Génération ultra-rapide');
      }
      if (modelType === 'chatgpt' && !healthCheck.data.services?.chatgpt && !apiKey) {
        throw new Error('ChatGPT API non configurée. Fournissez une clé API ou configurez le backend.');
      }
    } catch (healthError: any) {
      if (healthError.message?.includes('API non configurée')) {
        throw healthError; // Re-throw configuration errors
      }
      console.error('❌ Serveur Flask inaccessible:', healthError);
      throw new Error('Backend non accessible. Vérifiez que Flask tourne sur localhost:5000');
    }
    
    // Création de la requête vers l'API Flask
    progressCallback?.(0.3);
    console.log('Envoi des données au serveur Flask:', {
      numQuestions,
      difficulty,
      additionalInfo,
      modelType,
      textLength: text.length
    });
    console.log(`Aperçu du texte envoyé: ${text.substring(0, 150)}...`);
    
    try {
      console.log(`Envoi de la requête à ${FLASK_API_URL}/generate...`);
      const startTime = Date.now();
      
      // Timeout adapté au modèle (Groq ultra-rapide, Gemini/ChatGPT plus lents)
      const timeoutMs = modelType === 'groq' ? 60000 : 180000; // 1min pour Groq, 3min pour autres
      console.log(`Timeout configuré: ${timeoutMs / 1000}s pour ${modelType}`);
      
      const response = await axios.post(`${FLASK_API_URL}/generate`, {
        text,
        numQuestions,
        difficulty,
        additionalInfo,
        modelType,
        apiKey: modelType === 'chatgpt' ? apiKey : undefined
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: timeoutMs
      });
      const endTime = Date.now();
      console.log(`Réponse reçue en ${(endTime - startTime) / 1000} secondes`);
      
      progressCallback?.(0.8);
      
      // Vérification de la présence d'un avertissement dans la réponse
      if (response.data && response.data.warning) {
        console.warn('Avertissement depuis l\'API Flask:', response.data.warning);
      }
      
      if (response.data && response.data.questions) {
        let questions = response.data.questions;
        console.log(`${questions.length} questions générées via Flask API`);
        
        // Vérification et correction des questions générées
        const validQuestions = [];
        
        for (const q of questions) {
          // Vérifier si la question a tous les champs requis
          if (!q || !q.text || !q.options || !Array.isArray(q.options)) {
            console.warn('Question invalide ignorée:', q);
            continue;
          }
          
          // Vérifier et corriger les options
          const validOptions = q.options.filter(opt => 
            opt && typeof opt.text === 'string' && typeof opt.isCorrect === 'boolean' && opt.id
          );
          
          // S'assurer qu'il y a au moins 2 options et qu'une option est correcte
          if (validOptions.length < 2) {
            console.warn('Question ignorée - moins de 2 options valides:', q.text);
            continue;
          }
          
          // Vérifier qu'au moins une option est correcte
          if (!validOptions.some(opt => opt.isCorrect === true)) {
            console.warn('Question ignorée - aucune option correcte:', q.text);
            continue;
          }
          
          // Ajouter un ID à la question si manquant
          const validQuestion: Question = {
            id: q.id || `gen_q${validQuestions.length + 1}`,
            text: q.text,
            options: validOptions,
            explanation: q.explanation || 'Pas d\'explication disponible.',
            difficulty: q.difficulty || difficulty
          };
          
          validQuestions.push(validQuestion);
          console.log(`Question validée: ${validQuestion.text.substring(0, 50)}...`);
        }
        
        console.log(`${validQuestions.length} questions valides parmi les ${questions.length} générées`);
        
        // Si nous n'avons pas assez de questions valides, compléter avec des questions de secours
        if (validQuestions.length < numQuestions) {
          console.log(`Ajout de ${numQuestions - validQuestions.length} questions de secours...`);
          const backupQuestions = await getFirebaseBackupQuestions();
          const remainingQuestions = backupQuestions
            .filter(q => !validQuestions.some(genQ => genQ.text === q.text))
            .slice(0, numQuestions - validQuestions.length)
            .map(q => ({...q, difficulty}));
          
          // Fusionner les questions valides avec les questions de secours
          const finalQuestions = [...validQuestions, ...remainingQuestions];
          console.log(`Retour de ${finalQuestions.length} questions au total (${validQuestions.length} générées + ${remainingQuestions.length} de secours)`);
          
          // Limiter au nombre de questions demandé
          return finalQuestions.slice(0, numQuestions);
        }
        
        // Si nous avons suffisamment de questions valides, les retourner directement
        console.log(`Retour de ${validQuestions.length} questions générées`);
        return validQuestions.slice(0, numQuestions);
      } else {
        console.error('Format de réponse incorrect depuis l\'API Flask:', response.data);
        throw new Error('Format de réponse incorrect depuis l\'API Flask');
      }
    } catch (apiError) {
      console.error('Erreur lors de l\'appel à l\'API Flask:', apiError);
      throw new Error(`Échec de la génération avec Gemini: ${apiError.message || 'Erreur inconnue'}`);
    }
  } catch (error: any) {
    console.error('Erreur générale lors de la génération des questions:', error);
    throw error; // Propager l'erreur au lieu de masquer avec des questions de secours
  }
};
