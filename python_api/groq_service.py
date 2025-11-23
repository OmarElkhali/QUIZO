"""
Service d'intégration Groq pour génération ultra-rapide de quiz
https://console.groq.com/docs/quickstart
"""

import os
import json
import logging
import time
import hashlib
from typing import List, Dict, Any, Optional, Set
from groq import Groq
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")  # Ultra-rapide (nouveau modèle 2025)
MAX_RETRIES = int(os.getenv("GROQ_MAX_RETRIES", "3"))
RETRY_DELAY = float(os.getenv("GROQ_RETRY_DELAY", "1.0"))  # secondes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GroqService:
    """Service pour utiliser Groq (LLM ultra-rapide et gratuit)"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = GROQ_MODEL):
        """
        Initialize Groq client
        
        Args:
            api_key: Groq API key (or from env GROQ_API_KEY)
            model: Model to use (default: llama3-70b-8192)
        """
        self.api_key = api_key or GROQ_API_KEY
        if not self.api_key:
            raise ValueError("GROQ_API_KEY must be set in environment or provided")
        
        self.client = Groq(api_key=self.api_key)
        self.model = model
        logger.info(f"✅ GroqService initialized with model: {model}")
    
    def is_available(self) -> bool:
        """Check if Groq service is available"""
        try:
            # Test simple request
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=10,
                temperature=0.1
            )
            return bool(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"❌ Groq unavailable: {e}")
            return False
    
    def _detect_duplicates(self, questions: List[Dict[str, Any]]) -> Set[str]:
        """Detect duplicate questions by text similarity"""
        seen_hashes = set()
        duplicates = set()
        
        for i, q in enumerate(questions):
            # Create hash from normalized question text
            text_normalized = q.get('text', '').lower().strip()
            text_hash = hashlib.md5(text_normalized.encode()).hexdigest()[:8]
            
            if text_hash in seen_hashes:
                duplicates.add(i)
                logger.warning(f"🔍 Duplicate detected: Question {i+1}")
            else:
                seen_hashes.add(text_hash)
        
        return duplicates
    
    def _call_groq_with_retry(self, messages: List[Dict], temperature: float, max_tokens: int) -> str:
        """Call Groq API with exponential backoff retry"""
        last_error = None
        
        for attempt in range(MAX_RETRIES):
            try:
                logger.debug(f"🔄 Attempt {attempt + 1}/{MAX_RETRIES}...")
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    top_p=0.9,
                    response_format={"type": "json_object"}
                )
                
                return response.choices[0].message.content
                
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                
                # Don't retry on certain errors
                if 'authentication' in error_str or 'api_key' in error_str:
                    logger.error(f"❌ Authentication error, no retry")
                    raise
                
                if 'invalid' in error_str and 'model' in error_str:
                    logger.error(f"❌ Invalid model, no retry")
                    raise
                
                # Retry with exponential backoff
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAY * (2 ** attempt)  # 1s, 2s, 4s...
                    logger.warning(f"⚠️ Attempt {attempt + 1} failed: {e}")
                    logger.info(f"⏳ Retrying in {delay:.1f}s...")
                    time.sleep(delay)
                else:
                    logger.error(f"❌ All {MAX_RETRIES} attempts failed")
        
        raise last_error
    
    def generate_quiz(
        self,
        text: str,
        num_questions: int = 5,
        difficulty: str = "medium",
        language: str = "fr",
        temperature: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Generate quiz questions using Groq (ULTRA-RAPIDE)
        
        Args:
            text: Source text for quiz generation
            num_questions: Number of questions to generate (1-20)
            difficulty: Difficulty level (easy, medium, hard)
            language: Output language (fr, en, etc.)
            temperature: Creativity (0.0-1.0)
        
        Returns:
            List of questions in QUIZO format
        """
        logger.info(f"🚀 Generating {num_questions} questions with Groq ({self.model})...")
        
        # Prompt optimisé pour QCM format JSON
        difficulty_map = {
            "easy": "facile (niveau lycée)",
            "medium": "moyen (niveau universitaire)",
            "hard": "difficile (niveau expert)"
        }
        
        # Adapter la longueur du texte selon le nombre de questions
        text_length = min(5000 if num_questions <= 10 else 8000, len(text))
        
        prompt = f"""Tu es un expert en création de quiz éducatifs. Génère EXACTEMENT {num_questions} questions à choix multiples (QCM) basées sur le texte fourni.

**⚠️ IMPÉRATIF: GÉNÈRE EXACTEMENT {num_questions} QUESTIONS - PAS MOINS!**

**CONTRAINTES STRICTES:**
1. Niveau de difficulté: {difficulty_map.get(difficulty, 'moyen')}
2. Langue: {'français' if language == 'fr' else 'anglais'}
3. Format: JSON uniquement (pas de markdown, pas de texte avant/après)
4. Chaque question doit avoir EXACTEMENT 4 options
5. UNE SEULE option correcte par question
6. Questions pertinentes et éducatives
7. **NOMBRE DE QUESTIONS REQUIS: {num_questions}**

**TEXTE SOURCE:**
{text[:text_length]}

**FORMAT JSON REQUIS:**
{{
  "questions": [
    {{
      "text": "Question claire et précise ?",
      "options": [
        {{"text": "Option A", "isCorrect": false}},
        {{"text": "Option B", "isCorrect": true}},
        {{"text": "Option C", "isCorrect": false}},
        {{"text": "Option D", "isCorrect": false}}
      ],
      "explanation": "Explication pédagogique de la réponse",
      "difficulty": "{difficulty}"
    }}
  ]
}}

RÉPONDS UNIQUEMENT AVEC LE JSON, SANS AUTRE TEXTE."""

        try:
            # Calculer max_tokens en fonction du nombre de questions
            # 1 question ≈ 250 tokens (texte + 4 options + explication)
            # Ajouter 20% de marge pour sécurité
            estimated_tokens = int(num_questions * 250 * 1.2)
            max_tokens_needed = max(4096, min(estimated_tokens, 8192))  # Entre 4096 et 8192
            
            logger.info(f"📊 Token estimation: {num_questions} questions → {max_tokens_needed} max_tokens")
            
            # Appel Groq avec retry automatique (ultra-rapide: 3-5s pour 5-10 questions, 10-15s pour 30-50)
            messages = [
                {
                    "role": "system",
                    "content": f"Tu es un générateur de quiz JSON. Génère EXACTEMENT {num_questions} questions DIFFÉRENTES et UNIQUES. Réponds UNIQUEMENT en JSON valide, sans markdown ni texte supplémentaire."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            start_time = time.time()
            content = self._call_groq_with_retry(messages, temperature, max_tokens_needed)
            generation_time = time.time() - start_time
            
            logger.info(f"⚡ Generation completed in {generation_time:.2f}s")
            logger.debug(f"Raw response: {content[:200]}...")
            
            # Parse JSON
            data = json.loads(content)
            questions = data.get("questions", [])
            
            if not questions:
                raise ValueError("No questions generated in response")
            
            # Detect and remove duplicates
            duplicate_indices = self._detect_duplicates(questions)
            if duplicate_indices:
                logger.info(f"🔍 Found {len(duplicate_indices)} duplicate questions, filtering...")
                questions = [q for i, q in enumerate(questions) if i not in duplicate_indices]
            
            # Validation et nettoyage
            validated_questions = []
            validation_start = time.time()
            
            for i, q in enumerate(questions[:num_questions], 1):
                try:
                    # Validation structure
                    if not q.get("text") or not q.get("options"):
                        logger.warning(f"⚠️ Question {i} incomplete, skipped")
                        continue
                    
                    # Validation options
                    options = q["options"]
                    if len(options) < 2:
                        logger.warning(f"⚠️ Question {i} has <2 options, skipped")
                        continue
                    
                    # Vérifier au moins une réponse correcte
                    has_correct = any(opt.get("isCorrect") for opt in options)
                    if not has_correct:
                        # Fix: marquer la première option comme correcte
                        options[0]["isCorrect"] = True
                        logger.warning(f"⚠️ Question {i} had no correct answer, fixed")
                    
                    # Ajouter question validée
                    validated_questions.append({
                        "text": q["text"],
                        "options": options,
                        "explanation": q.get("explanation", ""),
                        "difficulty": q.get("difficulty", difficulty)
                    })
                    
                except Exception as e:
                    logger.error(f"❌ Error validating question {i}: {e}")
                    continue
            
            validation_time = time.time() - validation_start
            total_time = generation_time + validation_time
            
            # Métriques de performance
            success_rate = (len(validated_questions) / len(questions)) * 100 if questions else 0
            questions_per_second = len(validated_questions) / total_time if total_time > 0 else 0
            
            logger.info(f"✅ {len(validated_questions)}/{num_questions} questions generated successfully")
            logger.info(f"📊 Metrics: {success_rate:.1f}% valid, {questions_per_second:.1f} q/s")
            
            if not validated_questions:
                raise ValueError("No valid questions after validation")
            
            # Avertissement si moins de questions que demandé
            if len(validated_questions) < num_questions:
                shortage = num_questions - len(validated_questions)
                logger.warning(f"⚠️ Seulement {len(validated_questions)}/{num_questions} questions générées (manque {shortage})")
                logger.warning(f"💡 Conseil: Augmentez max_tokens ou réduisez le nombre de questions")
            
            return validated_questions
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing error: {e}")
            logger.error(f"Response content: {content[:500]}")
            raise ValueError(f"Invalid JSON response from Groq: {e}")
        
        except Exception as e:
            logger.error(f"❌ Groq generation error: {e}")
            raise


def generate_quiz_with_groq(
    text: str,
    num_questions: int = 5,
    difficulty: str = "medium",
    api_key: Optional[str] = None,
    model: str = GROQ_MODEL
) -> List[Dict[str, Any]]:
    """
    High-level function to generate quiz with Groq
    
    Usage:
        questions = generate_quiz_with_groq(
            text="Python est un langage...",
            num_questions=10,
            difficulty="easy"
        )
    """
    service = GroqService(api_key=api_key, model=model)
    return service.generate_quiz(text, num_questions, difficulty)


# Test function
def test_groq():
    """Test Groq service"""
    print("🔍 Test de la connexion Groq...")
    
    try:
        service = GroqService()
        
        # Test 1: Availability
        if service.is_available():
            print("✅ Groq est disponible!")
        else:
            print("❌ Groq n'est pas disponible")
            return
        
        # Test 2: Quiz generation (rapide!)
        print(f"\n🧪 Test de génération avec {GROQ_MODEL}...")
        print("⏳ Génération en cours (devrait prendre 3-10 secondes)...\n")
        
        test_text = """
        Python est un langage de programmation de haut niveau, interprété et polyvalent.
        Créé par Guido van Rossum en 1991, il est connu pour sa syntaxe claire et lisible.
        Python est utilisé dans de nombreux domaines comme le développement web, 
        la data science, l'intelligence artificielle et l'automatisation.
        """
        
        import time
        start = time.time()
        
        questions = service.generate_quiz(
            text=test_text,
            num_questions=3,
            difficulty="easy"
        )
        
        duration = time.time() - start
        
        print(f"✅ {len(questions)} questions générées en {duration:.1f} secondes! 🚀\n")
        
        # Display questions
        for i, q in enumerate(questions, 1):
            print(f"Question {i}: {q['text']}")
            print(f"  Difficulté: {q['difficulty']}")
            print(f"  Options: {len(q['options'])}")
            correct = [opt['text'] for opt in q['options'] if opt.get('isCorrect')]
            print(f"  Réponse correcte: {correct[0] if correct else 'N/A'}")
            print()
        
        print(f"⚡ Performance: {duration/len(questions):.1f}s par question")
        print("🎉 Test réussi!")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_groq()
