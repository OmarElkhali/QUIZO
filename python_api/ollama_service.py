# -*- coding: utf-8 -*-
"""
Service d'intégration Ollama pour QUIZO
Utilise des modèles LLM locaux (Qwen, Llama, Mistral) via Ollama
"""

import os
import json
import logging
import requests
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Configuration Ollama
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "qwen3-vl:4b")  # Modèle rapide avec vision

class OllamaService:
    """Service pour interagir avec Ollama API"""
    
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = DEFAULT_MODEL):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self.api_url = f"{self.base_url}/api"
        logger.info(f"OllamaService initialisé avec modèle: {model}, URL: {base_url}")
    
    def is_available(self) -> bool:
        """Vérifie si Ollama est disponible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama non disponible: {e}")
            return False
    
    def list_models(self) -> List[str]:
        """Liste les modèles disponibles"""
        try:
            response = requests.get(f"{self.api_url}/tags", timeout=5)
            response.raise_for_status()
            data = response.json()
            models = [model['name'] for model in data.get('models', [])]
            logger.info(f"Modèles Ollama disponibles: {models}")
            return models
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des modèles: {e}")
            return []
    
    def generate(self, prompt: str, stream: bool = False, options: Optional[Dict] = None) -> str:
        """
        Génère du texte avec Ollama
        
        Args:
            prompt: Le prompt à envoyer au modèle
            stream: Si True, retourne un stream (non implémenté ici)
            options: Options supplémentaires (temperature, top_p, etc.)
        
        Returns:
            Le texte généré
        """
        try:
            logger.info(f"Génération avec Ollama, modèle: {self.model}")
            logger.debug(f"Prompt (premiers 200 caractères): {prompt[:200]}...")
            
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": options or {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "top_k": 40,
                    "num_predict": 4096,  # Augmenter la limite de tokens générés
                }
            }
            
            # Timeout généreux pour la génération
            response = requests.post(
                f"{self.api_url}/generate",
                json=payload,
                timeout=600  # 10 minutes max pour la première génération
            )
            response.raise_for_status()
            
            result = response.json()
            generated_text = result.get('response', '')
            
            logger.info(f"Génération réussie: {len(generated_text)} caractères")
            logger.debug(f"Réponse (premiers 200 caractères): {generated_text[:200]}...")
            
            return generated_text
            
        except requests.exceptions.Timeout:
            logger.error("Timeout lors de la génération Ollama")
            raise ValueError("La génération a pris trop de temps. Essayez avec un prompt plus court.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur lors de la requête Ollama: {e}")
            raise ValueError(f"Erreur lors de la communication avec Ollama: {str(e)}")
        except Exception as e:
            logger.error(f"Erreur inattendue lors de la génération: {e}")
            raise ValueError(f"Erreur lors de la génération: {str(e)}")
    
    def chat(self, messages: List[Dict[str, str]], options: Optional[Dict] = None) -> str:
        """
        Interface chat avec Ollama (compatible OpenAI format)
        
        Args:
            messages: Liste de messages [{role: "user|assistant|system", content: "..."}]
            options: Options supplémentaires
        
        Returns:
            La réponse du modèle
        """
        try:
            logger.info(f"Chat avec Ollama, modèle: {self.model}, {len(messages)} messages")
            
            payload = {
                "model": self.model,
                "messages": messages,
                "stream": False,
                "options": options or {
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            }
            
            response = requests.post(
                f"{self.api_url}/chat",
                json=payload,
                timeout=180
            )
            response.raise_for_status()
            
            result = response.json()
            assistant_message = result.get('message', {}).get('content', '')
            
            logger.info(f"Chat réussi: {len(assistant_message)} caractères")
            return assistant_message
            
        except Exception as e:
            logger.error(f"Erreur lors du chat Ollama: {e}")
            raise ValueError(f"Erreur lors du chat: {str(e)}")


def generate_quiz_with_ollama(
    text: str,
    num_questions: int = 5,
    difficulty: str = "medium",
    model: str = DEFAULT_MODEL
) -> List[Dict[str, Any]]:
    """
    Génère des questions QCM en utilisant Ollama
    
    Args:
        text: Le texte source pour générer les questions
        num_questions: Nombre de questions à générer
        difficulty: Difficulté (easy, medium, hard)
        model: Modèle Ollama à utiliser
    
    Returns:
        Liste de questions au format QUIZO
    """
    
    # Créer le service Ollama
    ollama = OllamaService(model=model)
    
    # Vérifier la disponibilité
    if not ollama.is_available():
        raise ValueError("Ollama n'est pas disponible. Assurez-vous qu'il est installé et en cours d'exécution.")
    
    # Vérifier que le modèle est disponible
    available_models = ollama.list_models()
    if model not in available_models:
        logger.warning(f"Modèle {model} non trouvé. Modèles disponibles: {available_models}")
        if available_models:
            model = available_models[0]
            logger.info(f"Utilisation du modèle alternatif: {model}")
            ollama.model = model
        else:
            raise ValueError("Aucun modèle Ollama disponible. Téléchargez un modèle avec 'ollama pull qwen2.5:7b'")
    
    # Construction du prompt optimisé pour Ollama
    prompt = f"""Tu es un expert en création de quiz éducatifs. Génère {num_questions} questions QCM en français de niveau {difficulty}.

TEXTE SOURCE :
{text[:5000]}

INSTRUCTIONS STRICTES :
1. Crée exactement {num_questions} questions basées UNIQUEMENT sur le texte source
2. Chaque question doit avoir EXACTEMENT 4 options
3. UNE SEULE option doit avoir "isCorrect": true
4. L'explication doit citer ou référencer le texte source
5. Utilise le niveau de difficulté: {difficulty}

FORMAT JSON REQUIS (SANS markdown, SANS ```json) :
{{
  "questions": [
    {{
      "text": "Question claire et précise ?",
      "options": [
        {{"text": "Réponse correcte", "isCorrect": true}},
        {{"text": "Réponse plausible mais fausse", "isCorrect": false}},
        {{"text": "Autre réponse plausible mais fausse", "isCorrect": false}},
        {{"text": "Dernière réponse plausible mais fausse", "isCorrect": false}}
      ],
      "explanation": "Explication basée sur le texte source",
      "difficulty": "{difficulty}"
    }}
  ]
}}

IMPORTANT : Retourne UNIQUEMENT le JSON, sans texte avant ou après, sans balises markdown.
"""
    
    logger.info(f"Génération de {num_questions} questions avec Ollama ({model})")
    
    # Générer avec Ollama
    try:
        response_text = ollama.generate(
            prompt,
            options={
                "temperature": 0.7,  # Un peu de créativité
                "top_p": 0.9,
                "top_k": 40,
                "num_predict": 2048,  # Limite de tokens générés
            }
        )
        
        logger.debug(f"Réponse brute Ollama: {response_text[:500]}...")
        
        # Nettoyer la réponse (enlever markdown si présent)
        response_text = response_text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]  # Enlever ```json
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parser le JSON
        try:
            data = json.loads(response_text)
            questions = data.get('questions', [])
        except json.JSONDecodeError as e:
            logger.error(f"Erreur de parsing JSON: {e}")
            logger.error(f"Réponse problématique: {response_text[:1000]}")
            
            # Tenter d'extraire le JSON avec regex
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)
                questions = data.get('questions', [])
            else:
                raise ValueError("Impossible d'extraire le JSON de la réponse")
        
        # Valider et formater les questions
        validated_questions = []
        for idx, q in enumerate(questions[:num_questions]):
            # Validation basique
            if not q.get('text') or not q.get('options') or not q.get('explanation'):
                logger.warning(f"Question {idx+1} invalide, ignorée")
                continue
            
            if len(q['options']) != 4:
                logger.warning(f"Question {idx+1} n'a pas 4 options, ignorée")
                continue
            
            # Compter les réponses correctes
            correct_count = sum(1 for opt in q['options'] if opt.get('isCorrect', False))
            if correct_count != 1:
                logger.warning(f"Question {idx+1} n'a pas exactement 1 réponse correcte ({correct_count}), correction...")
                # Forcer la première option comme correcte si aucune n'est marquée
                if correct_count == 0:
                    q['options'][0]['isCorrect'] = True
                # Si plusieurs sont correctes, garder seulement la première
                elif correct_count > 1:
                    found_first = False
                    for opt in q['options']:
                        if opt.get('isCorrect', False):
                            if not found_first:
                                found_first = True
                            else:
                                opt['isCorrect'] = False
            
            # Ajouter les IDs
            q['id'] = f"q{idx+1}"
            for opt_idx, opt in enumerate(q['options']):
                if 'id' not in opt:
                    opt['id'] = f"{q['id']}_{chr(97 + opt_idx)}"  # a, b, c, d
            
            # Ajouter la difficulté si absente
            if 'difficulty' not in q:
                q['difficulty'] = difficulty
            
            validated_questions.append(q)
            logger.debug(f"Question {idx+1} validée: {q['text'][:50]}...")
        
        if not validated_questions:
            raise ValueError("Aucune question valide n'a été générée")
        
        logger.info(f"{len(validated_questions)} questions validées sur {len(questions)} générées")
        return validated_questions
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération avec Ollama: {e}")
        raise


# Fonction helper pour tester
def test_ollama():
    """Teste la connexion et génération Ollama"""
    print("🔍 Test de la connexion Ollama...\n")
    
    ollama = OllamaService()
    
    # Test disponibilité
    if not ollama.is_available():
        print("❌ Ollama n'est pas disponible!")
        print("   Assurez-vous qu'Ollama est installé et en cours d'exécution")
        print("   Commande: ollama serve")
        return False
    
    print("✅ Ollama est disponible!\n")
    
    # Lister les modèles
    print("📦 Modèles disponibles:")
    models = ollama.list_models()
    for model in models:
        print(f"   - {model}")
    print()
    
    if not models:
        print("⚠️  Aucun modèle trouvé!")
        print("   Téléchargez un modèle avec: ollama pull qwen2.5:7b")
        return False
    
    # Test de génération
    print(f"🧪 Test de génération avec qwen3:4b...\n")
    
    # Utiliser qwen3:4b (sans thinking)
    model_to_use = "qwen3:4b" if "qwen3:4b" in models else models[0]
    
    test_text = """
    Python est un langage de programmation populaire créé par Guido van Rossum en 1991.
    Il est connu pour sa syntaxe simple et sa grande lisibilité.
    """
    
    try:
        print("⏳ Génération en cours (peut prendre 30-60 secondes)...\n")
        questions = generate_quiz_with_ollama(
            text=test_text,
            num_questions=1,  # 1 seule question pour tester
            difficulty="easy",
            model=model_to_use
        )
        
        print(f"✅ {len(questions)} questions générées avec succès!\n")
        
        for i, q in enumerate(questions, 1):
            print(f"Question {i}: {q['text']}")
            print(f"  Difficulté: {q['difficulty']}")
            print(f"  Options: {len(q['options'])}")
            correct = [opt['text'] for opt in q['options'] if opt.get('isCorrect')]
            print(f"  Réponse correcte: {correct[0] if correct else 'N/A'}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la génération: {e}")
        return False


if __name__ == "__main__":
    # Lancer le test
    test_ollama()
