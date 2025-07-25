
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, numQuestions, difficulty, additionalInfo } = await req.json();
    const geminiApiKey = 'AIzaSyAzFO0MGD9VlAHSIUyrxuhlAAltmoxT5uE'; // API Key for Gemini

    console.log(`Generating ${numQuestions} questions with Gemini. Difficulty: ${difficulty}`);
    
    // Construct the prompt for Gemini
    const prompt = `
      Génère ${numQuestions} questions de quiz QCM basées sur le texte fourni.
      Niveau de difficulté: ${difficulty}
      
      Texte: """${text.slice(0, 10000)}"""
      
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
      
      Tu dois générer EXACTEMENT ${numQuestions} questions.
    `;

    try {
      // Tentative avec gemini-1.5-flash
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        console.error(`Error with gemini-1.5-flash: ${response.status} ${response.statusText}`);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Gemini response received');
      
      // Extract the text from Gemini's response
      let generatedText = '';
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        generatedText = data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Unexpected response format from Gemini API');
      }

      // Extract JSON from the text (Gemini might wrap the JSON in markdown code blocks)
      let questions = [];
      try {
        // Try to find JSON array in the response
        const jsonMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        throw new Error('Failed to parse questions from Gemini response');
      }

      // Verify and validate questions format
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format or empty questions array');
      }

      // Ensure each question has the required format
      const validatedQuestions = questions.map((q, index) => {
        const questionId = q.id || `q${index + 1}`;
        
        // Ensure options are valid
        const options = Array.isArray(q.options) ? q.options.map((o, optIndex) => ({
          id: o.id || `${questionId}_${String.fromCharCode(97 + optIndex)}`,
          text: o.text || `Option ${String.fromCharCode(65 + optIndex)}`,
          isCorrect: Boolean(o.isCorrect)
        })) : [];

        // Make sure there's exactly one correct option
        const correctOptions = options.filter(o => o.isCorrect);
        if (correctOptions.length !== 1 && options.length > 0) {
          options[0].isCorrect = true;
          for (let i = 1; i < options.length; i++) {
            options[i].isCorrect = false;
          }
        }

        return {
          id: questionId,
          text: q.text || `Question ${index + 1}?`,
          options: options.length > 0 ? options : [
            { id: `${questionId}_a`, text: "Option A", isCorrect: true },
            { id: `${questionId}_b`, text: "Option B", isCorrect: false },
            { id: `${questionId}_c`, text: "Option C", isCorrect: false },
            { id: `${questionId}_d`, text: "Option D", isCorrect: false }
          ],
          explanation: q.explanation || "Aucune explication fournie",
          difficulty: q.difficulty || difficulty
        };
      });

      console.log(`Successfully generated ${validatedQuestions.length} questions`);

      return new Response(JSON.stringify({ questions: validatedQuestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (geminiError) {
      console.error('Error with gemini-1.5-flash, trying gemini-pro:', geminiError);
      
      // Si gemini-1.5-flash échoue, essayer avec gemini-pro
      try {
        const responsePro = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              topK: 40
            }
          })
        });

        if (!responsePro.ok) {
          console.error(`Error with gemini-pro: ${responsePro.status} ${responsePro.statusText}`);
          throw new Error(`Gemini API error (pro): ${responsePro.status} ${responsePro.statusText}`);
        }

        const dataPro = await responsePro.json();
        console.log('Gemini-pro response received');
        
        // Extract the text from Gemini's response
        let generatedText = '';
        if (dataPro.candidates && dataPro.candidates.length > 0 && 
            dataPro.candidates[0].content && 
            dataPro.candidates[0].content.parts && 
            dataPro.candidates[0].content.parts.length > 0) {
          generatedText = dataPro.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Unexpected response format from Gemini-pro API');
        }

        // Extract JSON from the text
        let questions = [];
        try {
          const jsonMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            questions = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON array found in response');
          }
        } catch (parseError) {
          console.error('Error parsing Gemini-pro response:', parseError);
          throw new Error('Failed to parse questions from Gemini-pro response');
        }

        // Validate questions
        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error('Invalid questions format or empty questions array');
        }

        // Ensure each question has the required format
        const validatedQuestions = questions.map((q, index) => {
          const questionId = q.id || `q${index + 1}`;
          
          // Ensure options are valid
          const options = Array.isArray(q.options) ? q.options.map((o, optIndex) => ({
            id: o.id || `${questionId}_${String.fromCharCode(97 + optIndex)}`,
            text: o.text || `Option ${String.fromCharCode(65 + optIndex)}`,
            isCorrect: Boolean(o.isCorrect)
          })) : [];

          // Make sure there's exactly one correct option
          const correctOptions = options.filter(o => o.isCorrect);
          if (correctOptions.length !== 1 && options.length > 0) {
            options[0].isCorrect = true;
            for (let i = 1; i < options.length; i++) {
              options[i].isCorrect = false;
            }
          }

          return {
            id: questionId,
            text: q.text || `Question ${index + 1}?`,
            options: options.length > 0 ? options : [
              { id: `${questionId}_a`, text: "Option A", isCorrect: true },
              { id: `${questionId}_b`, text: "Option B", isCorrect: false },
              { id: `${questionId}_c`, text: "Option C", isCorrect: false },
              { id: `${questionId}_d`, text: "Option D", isCorrect: false }
            ],
            explanation: q.explanation || "Aucune explication fournie",
            difficulty: q.difficulty || difficulty
          };
        });

        console.log(`Successfully generated ${validatedQuestions.length} questions with gemini-pro`);

        return new Response(JSON.stringify({ questions: validatedQuestions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (geminiProError) {
        console.error('Both Gemini models failed, using fallback questions:', geminiProError);
        
        // Générer des questions de secours
        const fallbackQuestions = Array.from({ length: numQuestions }, (_, i) => {
          const qId = `q${i+1}`;
          return {
            id: qId,
            text: `Question ${i+1} sur le document (générée automatiquement)`,
            options: [
              { id: `${qId}_a`, text: "Première option", isCorrect: true },
              { id: `${qId}_b`, text: "Deuxième option", isCorrect: false },
              { id: `${qId}_c`, text: "Troisième option", isCorrect: false },
              { id: `${qId}_d`, text: "Quatrième option", isCorrect: false }
            ],
            explanation: "Cette question a été générée automatiquement suite à un problème technique. Les réponses ne reflètent pas nécessairement le contenu du document.",
            difficulty
          };
        });
        
        return new Response(JSON.stringify({ 
          warning: "Utilisation du mode secours en raison d'une erreur avec Gemini",
          questions: fallbackQuestions 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error) {
    console.error('Error in generate-questions function:', error);
    
    // Générer des questions de secours en cas d'erreur
    const fallbackQuestions = Array.from({ length: 10 }, (_, i) => {
      const qId = `q${i+1}`;
      return {
        id: qId,
        text: `Question ${i+1} sur le document (générée automatiquement en mode secours)`,
        options: [
          { id: `${qId}_a`, text: "Première option", isCorrect: true },
          { id: `${qId}_b`, text: "Deuxième option", isCorrect: false },
          { id: `${qId}_c`, text: "Troisième option", isCorrect: false },
          { id: `${qId}_d`, text: "Quatrième option", isCorrect: false }
        ],
        explanation: "Cette question a été générée suite à une erreur. Veuillez réessayer plus tard.",
        difficulty: "medium"
      };
    });
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An unknown error occurred',
      errorDetail: error.toString(),
      questions: fallbackQuestions
    }), {
      status: 200, // Retourner 200 pour ne pas bloquer le client
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
