# -*- coding: utf-8 -*-
import os
import json
import logging
import requests
import re
from pypdf import PdfReader
import docx
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)

# Configuration CORS unifiée et sécurisée
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8080").split(",")
CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "max_age": 3600
    }
})

# Configuration du logging basée sur l'environnement
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Clés API depuis les variables d'environnement (SANS valeurs par défaut hardcodées)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHATGPT_API_KEY = os.getenv("CHATGPT_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Groq ultra-rapide et gratuit

# Configuration Ollama (LLM local)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

# Configuration Groq (recommandé pour production)
DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Configuration de l'API Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("API Gemini configurée avec succès")
else:
    logger.warning("GEMINI_API_KEY n'est pas configurée - la génération avec Gemini sera désactivée")
    
if not CHATGPT_API_KEY:
    logger.warning("CHATGPT_API_KEY n'est pas configurée - la génération avec ChatGPT sera désactivée")

if GROQ_API_KEY:
    logger.info("API Groq configurée - LLM ultra-rapide disponible (gratuit)")
else:
    logger.warning("GROQ_API_KEY n'est pas configurée - la génération avec Groq sera désactivée")

logger.info(f"Ollama configuré sur: {OLLAMA_BASE_URL} avec modèle par défaut: {DEFAULT_OLLAMA_MODEL}")

def extract_text_from_file(file):
    """Extrait le texte des fichiers PDF/DOCX/TXT"""
    filename = file.filename.lower()
    logger.debug(f"Début de l'extraction du texte pour le fichier: {filename}")
    
    try:
        if filename.endswith('.pdf'):
            logger.info(f"Extraction du texte du PDF: {filename}")
            pdf_reader = PdfReader(io.BytesIO(file.read()))
            logger.debug(f"PDF chargé avec {len(pdf_reader.pages)} pages")
            text = '\n'.join([page.extract_text() for page in pdf_reader.pages])
            logger.debug(f"Extraction PDF terminée: {len(text)} caractères extraits")
            return text if text.strip() else "Aucun texte détecté dans le PDF"
        
        elif filename.endswith(('.docx', '.doc')):
            logger.info(f"Extraction du texte du document Word: {filename}")
            doc = docx.Document(io.BytesIO(file.read()))
            logger.debug(f"Document Word chargé avec {len(doc.paragraphs)} paragraphes")
            text = '\n'.join([para.text for para in doc.paragraphs if para.text])
            logger.debug(f"Extraction Word terminée: {len(text)} caractères extraits")
            return text
        
        elif filename.endswith('.txt'):
            logger.info(f"Extraction du texte du fichier TXT: {filename}")
            text = file.read().decode('utf-8', errors='ignore')
            logger.debug(f"Extraction TXT terminée: {len(text)} caractères extraits")
            return text
        
        logger.error(f"Format de fichier non supporté: {filename}")
        raise ValueError("Format de fichier non supporté")
    
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction du texte: {str(e)}")
        raise ValueError(f"Échec de l'extraction: {str(e)}")

@app.route('/api/extract-text', methods=['POST', 'OPTIONS'])
def handle_text_extraction():
    """Endpoint pour l'extraction de texte depuis un fichier"""
    # Gérer les requêtes preflight CORS
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        logger.info("Requête d'extraction de texte reçue")
        
        if 'file' not in request.files:
            logger.warning("Aucun fichier fourni dans la requête")
            return jsonify({'error': 'Aucun fichier fourni'}), 400

        file = request.files['file']
        if not file or file.filename == '':
            logger.warning("Nom de fichier vide")
            return jsonify({'error': 'Nom de fichier vide'}), 400

        logger.info(f"Début de l'extraction pour le fichier: {file.filename}")
        text = extract_text_from_file(file)
        logger.info(f"Extraction réussie: {len(text)} caractères extraits")
        
        return jsonify({
            'text': text,
            'filename': file.filename,
            'characters': len(text)
        })

    except Exception as e:
        logger.error(f"Erreur lors du traitement de l'extraction: {str(e)}")
        return jsonify({'error': str(e)}), 500

def validate_question(question):
    """Valide la structure d'une question générée"""
    required_fields = ['text', 'options', 'explanation', 'difficulty']
    if not all(field in question for field in required_fields):
        logger.warning(f"Question invalide: champs manquants - {question.get('text', 'Sans texte')}")
        return False
    if len(question['options']) != 4 or sum(opt.get('isCorrect', False) for opt in question['options']) != 1:
        logger.warning(f"Question invalide: problème avec les options - {question.get('text', 'Sans texte')}")
        return False
    return True

@app.route('/api/generate', methods=['POST', 'OPTIONS'])
def generate_quiz():
    """Endpoint principal pour la génération de quiz"""
    # Gérer les requêtes preflight CORS
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        logger.info("Requête de génération de quiz reçue")
        
        # Gestion des entrées multiples
        data = {}
        if 'file' in request.files:
            file = request.files['file']
            logger.info(f"Extraction du texte à partir du fichier: {file.filename}")
            text = extract_text_from_file(file)
            # Récupérer les paramètres depuis form-data
            data = {
                'numQuestions': request.form.get('numQuestions'),
                'difficulty': request.form.get('difficulty'),
                'modelType': request.form.get('modelType'),
                'apiKey': request.form.get('apiKey', '')
            }
        else:
            data = request.get_json() or {}
            text = data.get('text', '')
            logger.info(f"Texte reçu directement: {len(text)} caractères")

        # Validation des paramètres
        if not text or not text.strip():
            logger.warning("Aucun contenu textuel fourni pour la génération")
            return jsonify({'error': 'Aucun contenu fourni'}), 400

        # Paramètres de génération avec validation
        try:
            num_questions = int(data.get('numQuestions', 5))
            if num_questions < 1 or num_questions > 50:
                return jsonify({'error': 'Le nombre de questions doit être entre 1 et 50'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Nombre de questions invalide'}), 400

        difficulty = data.get('difficulty', 'medium')
        if difficulty not in ['easy', 'medium', 'hard']:
            difficulty = 'medium'

        model_type = data.get('modelType', 'gemini')
        if model_type not in ['gemini', 'chatgpt', 'local', 'groq']:
            model_type = 'gemini'

        api_key = data.get('apiKey', '')
        local_model = data.get('localModel', DEFAULT_OLLAMA_MODEL)
        groq_model = data.get('groqModel', DEFAULT_GROQ_MODEL)
        
        logger.info(f"Paramètres de génération: {num_questions} questions, difficulté {difficulty}, modèle {model_type}")

        # Vérifier que la clé API nécessaire est disponible
        if model_type == 'gemini' and not GEMINI_API_KEY:
            return jsonify({'error': 'Clé API Gemini non configurée'}), 503
        if model_type == 'chatgpt' and not api_key and not CHATGPT_API_KEY:
            return jsonify({'error': 'Clé API ChatGPT requise'}), 400
        if model_type == 'groq' and not GROQ_API_KEY:
            return jsonify({'error': 'Clé API Groq non configurée'}), 503

        # Construction du prompt
        logger.debug(f"Construction du prompt avec {len(text[:5000])} caractères de texte")
        prompt = f"""
        Génère {num_questions} questions QCM complexes en français selon ces règles STRICTES :

        TEXTE SOURCE :
        {text[:5000]}

        FORMAT JSON REQUIS :
        {{
          "questions": [
            {{
              "text": "Question...",
              "options": [
                {{"text": "...", "isCorrect": true}},
                {{"text": "...", "isCorrect": false}},
                {{"text": "...", "isCorrect": false}},
                {{"text": "...", "isCorrect": false}}
              ],
              "explanation": "Explication basée sur le texte",
              "difficulty": "{difficulty}"
            }}
          ]
        }}

        CONTRAINTES :
        - Une seule réponse correcte par question
        - Les options doivent être plausibles
        - Les explications doivent citer le texte
        - Ne pas inclure de markdown
        """
        logger.debug("Prompt construit avec succès")

        # Sélection du modèle à utiliser
        if model_type == 'groq':
            # Utiliser Groq (ULTRA-RAPIDE et GRATUIT - RECOMMANDÉ)
            logger.info(f"Utilisation de Groq avec le modèle: {groq_model}")
            from groq_service import generate_quiz_with_groq
            questions_data = generate_quiz_with_groq(text, num_questions, difficulty, GROQ_API_KEY, groq_model)
            # Convert to expected format
            content = json.dumps({"questions": questions_data})
        elif model_type == 'local':
            # Utiliser Ollama (LLM local)
            logger.info(f"Utilisation d'Ollama avec le modèle: {local_model}")
            content = generate_with_ollama(prompt, local_model)
        elif model_type == 'chatgpt':
            # Utiliser ChatGPT
            logger.info("Utilisation de l'API ChatGPT")
            content = generate_with_chatgpt(prompt, api_key or CHATGPT_API_KEY)
        else:
            # Utiliser Gemini (par défaut) avec le SDK officiel
            try:
                logger.info("Utilisation de l'API Gemini avec le SDK officiel")
                # Utiliser gemini-2.5-flash comme dans le test réussi
                model = genai.GenerativeModel('gemini-2.5-flash')
                logger.info("Envoi de la requête à Gemini...")
                
                response = model.generate_content(prompt)
                logger.info("Réponse reçue de l'API Gemini")
                
                # Log de la réponse pour debug
                logger.debug(f"Réponse Gemini reçue avec succès")
                
                content = response.text
                logger.info(f"Contenu extrait de Gemini: {len(content)} caractères")
            except Exception as e:
                logger.error(f"Erreur lors de l'appel à l'API Gemini: {str(e)}")
                raise ValueError(f"Service Gemini indisponible: {str(e)}")

        logger.debug(f"Contenu brut reçu: {len(content)} caractères")
        logger.debug(f"Aperçu du contenu: {content[:200]}")
        
        # Chercher le JSON dans la réponse
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if not json_match:
            logger.error("Aucun JSON trouvé dans la réponse")
            logger.error(f"Contenu complet: {content}")
            raise ValueError("Aucun JSON trouvé dans la réponse de l'IA")
        
        json_str = json_match.group()
        logger.debug(f"JSON extrait: {len(json_str)} caractères")
        
        try:
            questions_data = json.loads(json_str).get('questions', [])
        except json.JSONDecodeError as e:
            logger.error(f"Erreur de parsing JSON: {str(e)}")
            logger.error(f"JSON problématique: {json_str[:500]}")
            raise ValueError(f"Erreur de parsing JSON: {str(e)}")
        logger.info(f"{len(questions_data)} questions extraites de la réponse")

        # Validation et formatage
        validated_questions = []
        for idx, q in enumerate(questions_data[:num_questions]):
            if validate_question(q):
                q['id'] = f"q{idx+1}"
                for opt_idx, opt in enumerate(q['options']):
                    opt['id'] = f"{q['id']}_{chr(97 + opt_idx)}"
                validated_questions.append(q)
                logger.debug(f"Question validée: {q['text'][:50]}...")
            else:
                logger.warning(f"Question ignorée car invalide: {q.get('text', 'Sans texte')[:50]}...")

        logger.info(f"{len(validated_questions)} questions validées sur {len(questions_data)}")
        if not validated_questions:
            logger.error("Aucune question valide générée")
            raise ValueError("Aucune question valide générée")

        return jsonify({"questions": validated_questions})

    except Exception as e:
        logger.error(f"Erreur lors de la génération de questions: {str(e)}")
        return jsonify({
            "error": str(e),
            "questions": generate_fallback_questions(num_questions, difficulty)
        }), 500

def generate_with_chatgpt(prompt, api_key):
    """Génère du contenu en utilisant l'API ChatGPT"""
    if not api_key:
        logger.error("Clé API ChatGPT non fournie")
        raise ValueError("Clé API ChatGPT requise")
    
    try:
        logger.info("Envoi de la requête à l'API ChatGPT")
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'gpt-4-turbo',
                'messages': [
                    {'role': 'system', 'content': 'Tu es un expert en création de quiz éducatifs. Génère des questions de quiz en français au format JSON demandé.'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': 0.7
            },
            timeout=60
        )
        response.raise_for_status()
        logger.info("Réponse reçue de l'API ChatGPT")
        
        return response.json()['choices'][0]['message']['content']
    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur lors de l'appel à l'API ChatGPT: {str(e)}")
        if hasattr(e, 'response') and e.response:
            logger.error(f"Détails de l'erreur: {e.response.text}")
        raise ValueError(f"Erreur lors de l'appel à l'API ChatGPT: {str(e)}")

def generate_with_ollama(prompt, model=DEFAULT_OLLAMA_MODEL):
    """Génère du contenu en utilisant Ollama (LLM local)"""
    try:
        logger.info(f"Envoi de la requête à Ollama, modèle: {model}")
        
        # D'abord vérifier si Ollama est accessible
        try:
            health_check = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
            if health_check.status_code != 200:
                raise ValueError("Ollama n'est pas accessible")
        except requests.exceptions.RequestException:
            raise ValueError(
                "Ollama n'est pas disponible. "
                "Assurez-vous qu'Ollama est installé et en cours d'exécution (ollama serve). "
                "Installation: https://ollama.com/download"
            )
        
        # Envoyer la requête de génération
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'top_k': 40,
                    'num_predict': 2048,
                }
            },
            timeout=180  # 3 minutes max pour la génération
        )
        
        if response.status_code == 404:
            # Le modèle n'existe pas
            raise ValueError(
                f"Le modèle '{model}' n'est pas disponible. "
                f"Téléchargez-le avec: ollama pull {model}"
            )
        
        response.raise_for_status()
        result = response.json()
        
        generated_text = result.get('response', '')
        logger.info(f"Réponse reçue d'Ollama: {len(generated_text)} caractères")
        
        if not generated_text:
            raise ValueError("Ollama n'a pas généré de contenu")
        
        return generated_text
        
    except requests.exceptions.Timeout:
        logger.error("Timeout lors de la génération Ollama")
        raise ValueError(
            "La génération a pris trop de temps (>3 minutes). "
            "Essayez avec un texte plus court ou un modèle plus rapide (phi3:mini)."
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur lors de l'appel à Ollama: {str(e)}")
        raise ValueError(f"Erreur Ollama: {str(e)}")
    except Exception as e:
        logger.error(f"Erreur inattendue avec Ollama: {str(e)}")
        raise ValueError(f"Erreur lors de la génération avec Ollama: {str(e)}")

def generate_fallback_questions(num, difficulty):
    """Génère des questions de secours formatées correctement"""
    logger.info(f"Génération de {num} questions de secours avec difficulté {difficulty}")
    return [{
        "id": f"q{i+1}",
        "text": f"Question technique {i+1}?",
        "options": [
            {"id": f"q{i+1}_a", "text": "Réponse correcte", "isCorrect": True},
            {"id": f"q{i+1}_b", "text": "Distracteur 1", "isCorrect": False},
            {"id": f"q{i+1}_c", "text": "Distracteur 2", "isCorrect": False},
            {"id": f"q{i+1}_d", "text": "Distracteur 3", "isCorrect": False}
        ],
        "explanation": "Généré automatiquement suite à une erreur technique",
        "difficulty": difficulty
    } for i in range(num)]

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de vérification de l'état du service"""
    logger.info("Vérification de l'état du service")
    
    # Vérifier Ollama
    ollama_available = False
    ollama_models = []
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        if response.status_code == 200:
            ollama_available = True
            data = response.json()
            ollama_models = [model['name'] for model in data.get('models', [])]
    except Exception:
        pass
    
    return jsonify({
        "status": "ok",
        "version": "1.0.0",
        "services": {
            "gemini": bool(GEMINI_API_KEY),
            "chatgpt": bool(CHATGPT_API_KEY),
            "ollama": ollama_available,
            "ollama_models": ollama_models
        },
        "groq": bool(GROQ_API_KEY)  # Groq ultra-rapide disponible
    })

@app.route('/api/ollama/models', methods=['GET'])
def list_ollama_models():
    """Liste les modèles Ollama disponibles"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        response.raise_for_status()
        data = response.json()
        models = data.get('models', [])
        
        return jsonify({
            "available": True,
            "models": [
                {
                    "name": model['name'],
                    "size": model.get('size', 0),
                    "modified_at": model.get('modified_at', '')
                }
                for model in models
            ],
            "count": len(models)
        })
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des modèles Ollama: {e}")
        return jsonify({
            "available": False,
            "models": [],
            "error": str(e),
            "message": "Ollama n'est pas disponible. Installez-le depuis https://ollama.com"
        }), 503

if __name__ == '__main__':
    logger.info("Démarrage du serveur Flask sur le port 5000")
    app.run(host='0.0.0.0', port=5000, debug=False)