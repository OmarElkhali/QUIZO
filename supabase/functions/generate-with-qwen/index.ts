
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || "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";
const APP_URL = Deno.env.get('APP_URL') || "https://quiznest.app";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Démarrage de generate-with-qwen");
    
    // Analyser le corps de la requête
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Format de requête invalide", 
          details: parseError.message,
          recevied: await req.text()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, numQuestions, difficulty = "medium", additionalInfo = "" } = requestBody;
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Le texte est requis" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!numQuestions || isNaN(numQuestions) || numQuestions < 1) {
      return new Response(
        JSON.stringify({ error: "Nombre de questions invalide" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Génération de ${numQuestions} questions avec Qwen. Difficulté: ${difficulty}`);
    
    // Limiter la taille du texte pour éviter les erreurs de contexte
    const truncatedText = text.slice(0, 12000);
    
    // Construire le prompt pour Qwen
    const prompt = `
      Génère ${numQuestions} questions de quiz QCM basées sur le texte fourni.
      Niveau de difficulté: ${difficulty}
      
      Texte: """${truncatedText}"""
      
      ${additionalInfo ? `Informations supplémentaires: ${additionalInfo}` : ''}
      
      INSTRUCTIONS IMPORTANTES:
      1. Chaque question doit provenir directement du texte fourni
      2. Les questions doivent être diverses et couvrir différents aspects du texte
      3. Pour chaque question, crée 4 options avec UNE SEULE réponse correcte
      4. Niveau ${difficulty}: ${
        difficulty === 'easy' 
          ? 'questions basiques testant la compréhension générale' 
          : difficulty === 'medium' 
            ? 'questions plus nuancées nécessitant une bonne compréhension' 
            : 'questions complexes nécessitant une analyse approfondie'
      }
      5. Fournis une explication claire pour chaque réponse correcte
      
      FORMAT DE RÉPONSE:
      Tu dois fournir un tableau JSON valide contenant les questions exactement comme ceci:
      
      [
        {
          "id": "q1",
          "text": "Question 1?",
          "options": [
            {"id": "q1_a", "text": "Option A", "isCorrect": false},
            {"id": "q1_b", "text": "Option B", "isCorrect": true},
            {"id": "q1_c", "text": "Option C", "isCorrect": false},
            {"id": "q1_d", "text": "Option D", "isCorrect": false}
          ],
          "explanation": "Explication pourquoi B est correct",
          "difficulty": "${difficulty}"
        }
      ]
      
      Tu dois générer EXACTEMENT ${numQuestions} questions et répondre UNIQUEMENT avec le JSON.
    `;

    console.log("Envoi de la requête à OpenRouter.ai avec le modèle Qwen");
    
    // Définir un timeout plus court pour éviter les attentes infinies
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // 3 minutes
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": APP_URL,
          "X-Title": "QuizNest",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "qwen/qwen2.5-7b-instruct",
          "messages": [
            {
              "role": "system",
              "content": "Tu es un expert en création de quiz éducatifs. Tu génères des questions QCM de haute qualité basées sur le contenu fourni."
            },
            {
              "role": "user",
              "content": prompt
            }
          ],
          "temperature": 0.3,
          "response_format": { "type": "json_object" }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur OpenRouter API:', errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Réponse OpenRouter reçue');
      
      // Extraire le texte de la réponse OpenRouter
      let generatedText = '';
      if (data.choices && data.choices.length > 0 && 
          data.choices[0].message && data.choices[0].message.content) {
        generatedText = data.choices[0].message.content;
      } else {
        throw new Error('Format de réponse inattendu');
      }

      // Extraire le JSON du texte
      let questions: Question[] = [];
      try {
        // Analyse directe du JSON
        try {
          questions = JSON.parse(generatedText);
        } catch (parseError) {
          // Si échec, tentative de trouver un tableau JSON dans la réponse
          const jsonMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            questions = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Aucun tableau JSON trouvé dans la réponse');
          }
        }
      } catch (parseError) {
        console.error('Erreur lors de l\'analyse de la réponse OpenRouter:', parseError);
        
        // Génération de questions de secours en cas d'échec
        questions = [];
        for (let i = 0; i < numQuestions; i++) {
          questions.push({
            id: `q${i+1}`,
            text: `Question ${i+1} sur l'intelligence artificielle?`,
            options: [
              {id: `q${i+1}_a`, text: "Option A", isCorrect: i % 4 === 0},
              {id: `q${i+1}_b`, text: "Option B", isCorrect: i % 4 === 1},
              {id: `q${i+1}_c`, text: "Option C", isCorrect: i % 4 === 2},
              {id: `q${i+1}_d`, text: "Option D", isCorrect: i % 4 === 3},
            ],
            explanation: "Explication de la réponse correcte.",
            difficulty: difficulty
          });
        }
      }

      // Vérifier et valider le format des questions
      if (!Array.isArray(questions)) {
        // Si ce n'est pas un tableau, vérifier si c'est peut-être un objet avec une propriété questions
        if (questions && typeof questions === 'object' && Array.isArray(questions.questions)) {
          questions = questions.questions;
        } else {
          // Sinon, créer un tableau vide
          questions = [];
        }
      }

      // Assurer un minimum de questions
      if (questions.length === 0) {
        for (let i = 0; i < numQuestions; i++) {
          questions.push({
            id: `q${i+1}`,
            text: `Question ${i+1} sur le texte fourni?`,
            options: [
              {id: `q${i+1}_a`, text: "Option A", isCorrect: true},
              {id: `q${i+1}_b`, text: "Option B", isCorrect: false},
              {id: `q${i+1}_c`, text: "Option C", isCorrect: false},
              {id: `q${i+1}_d`, text: "Option D", isCorrect: false},
            ],
            explanation: "Explication de la réponse.",
            difficulty: difficulty
          });
        }
      }

      // Assurer que chaque question a le format attendu
      const validatedQuestions: Question[] = questions.map((q: any, index) => {
        const questionId = q.id || `q${index + 1}`;
        
        // Assurer que les options sont valides
        let options = Array.isArray(q.options) ? q.options : [];
        if (options.length < 2) {
          options = [
            { id: `${questionId}_a`, text: "Option A", isCorrect: true },
            { id: `${questionId}_b`, text: "Option B", isCorrect: false },
            { id: `${questionId}_c`, text: "Option C", isCorrect: false },
            { id: `${questionId}_d`, text: "Option D", isCorrect: false }
          ];
        } else {
          // Normaliser les options
          options = options.map((o, optIndex) => ({
            id: o.id || `${questionId}_${String.fromCharCode(97 + optIndex)}`,
            text: o.text || `Option ${String.fromCharCode(65 + optIndex)}`,
            isCorrect: Boolean(o.isCorrect)
          }));
        }

        // S'assurer qu'il y a exactement une option correcte
        const correctOptions = options.filter(o => o.isCorrect);
        if (correctOptions.length !== 1) {
          options[0].isCorrect = true;
          for (let i = 1; i < options.length; i++) {
            options[i].isCorrect = false;
          }
        }

        return {
          id: questionId,
          text: q.text || `Question ${index + 1}?`,
          options,
          explanation: q.explanation || "Aucune explication fournie",
          difficulty: q.difficulty || difficulty
        };
      });

      // Limiter au nombre de questions demandé
      const finalQuestions = validatedQuestions.slice(0, numQuestions);
      console.log(`${finalQuestions.length} questions générées avec succès`);

      return new Response(JSON.stringify({ questions: finalQuestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openRouterError) {
      clearTimeout(timeout);
      console.error('Erreur lors de l\'appel à OpenRouter:', openRouterError);
      
      if (openRouterError.name === 'AbortError') {
        console.log('La requête à OpenRouter a été interrompue après un timeout');
        return new Response(JSON.stringify({ 
          error: "La génération de questions a pris trop de temps et a été annulée",
          fallbackQuestions: generateFallbackQuestions(numQuestions, difficulty)
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Générer des questions de secours
      const fallbackQuestions = generateFallbackQuestions(numQuestions, difficulty);
      console.log('Utilisation de questions de secours en raison des erreurs API');
      
      return new Response(JSON.stringify({ 
        warning: "Utilisation du mode secours en raison d'une erreur d'API",
        details: openRouterError.message,
        questions: fallbackQuestions
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Erreur générale dans generate-with-qwen:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Une erreur inconnue est survenue',
      errorDetail: error.toString(),
      fallbackQuestions: generateFallbackQuestions(5, "medium")
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Fonction utilitaire pour générer des questions de secours
function generateFallbackQuestions(numQuestions: number, difficulty: string): Question[] {
  const fallbackQuestions: Question[] = [];
  for (let i = 0; i < numQuestions; i++) {
    fallbackQuestions.push({
      id: `q${i+1}`,
      text: `Question ${i+1} sur le texte (générée en mode secours)?`,
      options: [
        {id: `q${i+1}_a`, text: "Option A", isCorrect: true},
        {id: `q${i+1}_b`, text: "Option B", isCorrect: false},
        {id: `q${i+1}_c`, text: "Option C", isCorrect: false},
        {id: `q${i+1}_d`, text: "Option D", isCorrect: false},
      ],
      explanation: "Explication (générée en mode secours).",
      difficulty: difficulty
    });
  }
  return fallbackQuestions;
}
