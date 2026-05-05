# -*- coding: utf-8 -*-
import os
import json
import logging
import requests
import re
from functools import wraps
from pypdf import PdfReader
import docx
import io
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

# Charger les variables d'environnement
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_AI_QUESTIONS_PER_QUIZ = int(os.getenv("MAX_AI_QUESTIONS_PER_QUIZ", "20"))
ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".docx", ".txt"}
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# --- Firebase Admin SDK Initialization ---
_firebase_app = None
service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if service_account_path and os.path.isfile(service_account_path):
    try:
        cred = credentials.Certificate(service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logging.getLogger(__name__).info("Firebase Admin SDK initialise avec succes")
    except Exception as e:
        logging.getLogger(__name__).warning(f"Firebase Admin SDK init echoue: {e}")
else:
    logging.getLogger(__name__).warning(
        "GOOGLE_APPLICATION_CREDENTIALS non defini ou fichier introuvable. "
        "La verification des tokens Firebase sera desactivee."
    )

# --- Rate Limiter ---
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per minute"],
    storage_uri="memory://",
)

# --- CORS ---
configured_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
).split(",")
local_dev_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
ALLOWED_ORIGINS = list(dict.fromkeys(
    origin.strip()
    for origin in [*configured_origins, *local_dev_origins]
    if origin.strip()
))
CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "max_age": 3600
    }
})

# Configuration du logging basee sur l'environnement
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


# --- Firebase Auth Verification Decorator ---
def require_auth(f):
    """Decorator that verifies Firebase ID token from Authorization header.
    In dev mode (no Firebase Admin SDK), requests pass through with a warning.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # CORS preflight requests must pass through without auth
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        if not _firebase_app:
            # Dev mode: no Firebase Admin SDK available, skip verification
            g.user_uid = None
            return f(*args, **kwargs)

        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            # In development, allow requests without auth (for testing)
            if os.getenv('FLASK_ENV') == 'development':
                logger.debug("Dev mode: requete sans token autorisee")
                g.user_uid = None
                return f(*args, **kwargs)
            return jsonify({'error': 'Token d\'authentification manquant'}), 401

        token = auth_header.replace('Bearer ', '')
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            g.user_uid = decoded_token.get('uid')
            return f(*args, **kwargs)
        except firebase_auth.InvalidIdTokenError:
            return jsonify({'error': 'Token invalide'}), 401
        except firebase_admin.exceptions.FirebaseError as e:
            logger.error(f"Erreur Firebase Auth: {sanitize_error_message(str(e))}")
            return jsonify({'error': 'Erreur de verification du token'}), 401
        except Exception as e:
            logger.error(f"Erreur inattendue verification token: {sanitize_error_message(str(e))}")
            return jsonify({'error': 'Erreur de verification du token'}), 401

    return decorated_function

# ClÃ©s API depuis les variables d'environnement (SANS valeurs par dÃ©faut hardcodÃ©es)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
QWEN_API_KEY = os.getenv("QWEN_API_KEY")

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen3.6-flash")
OPENROUTER_QWEN_MODEL = os.getenv("OPENROUTER_QWEN_MODEL", os.getenv("QWEN_MODEL", "qwen/qwen3.6-flash"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3-32b")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL") or "https://api.groq.com/" + "open" + "ai/v1"
QWEN_MODEL = os.getenv("QWEN_MODEL", "qwen-plus")
QWEN_BASE_URL = os.getenv("QWEN_BASE_URL", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

SUPPORTED_MODELS = {"gemini", "openrouter", "groq", "ollama", "qwen"}
PROVIDER_FALLBACK_ORDER = ["gemini", "openrouter", "groq", "qwen", "ollama"]

def sanitize_error_message(message):
    """Remove API key values from provider errors before logging or returning them."""
    if not message:
        return ""
    sanitized = re.sub(r"api_key:[A-Za-z0-9_\-]+", "api_key:[redacted]", str(message))
    sanitized = re.sub(r"AIza[0-9A-Za-z_\-]{20,}", "[redacted-google-api-key]", sanitized)
    sanitized = re.sub(r"sk-or-[0-9A-Za-z_\-]{20,}", "[redacted-openrouter-api-key]", sanitized)
    sanitized = re.sub(r"sk-[0-9A-Za-z_\-]{20,}", "[redacted-secret-key]", sanitized)
    sanitized = re.sub(r"gsk_[0-9A-Za-z_\-]{20,}", "[redacted-groq-api-key]", sanitized)
    return sanitized

# Configuration de l'API Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("API Gemini configurÃ©e avec succÃ¨s")
else:
    logger.warning("GEMINI_API_KEY n'est pas configurÃ©e - la gÃ©nÃ©ration avec Gemini sera dÃ©sactivÃ©e")
    
if not OPENROUTER_API_KEY:
    logger.warning("OPENROUTER_API_KEY n'est pas configuree - OpenRouter/Qwen via OpenRouter seront desactives")

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY n'est pas configuree - Groq sera desactive")

if not QWEN_API_KEY:
    logger.warning("QWEN_API_KEY n'est pas configuree - Qwen direct sera desactive; OpenRouter peut etre utilise")


def get_provider_configured_state():
    return {
        "gemini": bool(GEMINI_API_KEY),
        "openrouter": bool(OPENROUTER_API_KEY),
        "groq": bool(GROQ_API_KEY),
        "ollama": bool(os.getenv("OLLAMA_BASE_URL") or os.getenv("OLLAMA_MODEL")),
        "qwen": bool(QWEN_API_KEY or OPENROUTER_API_KEY),
    }


def get_provider_model(model_type):
    if model_type == "gemini":
        return "gemini-2.5-flash"
    if model_type == "openrouter":
        return OPENROUTER_MODEL
    if model_type == "groq":
        return GROQ_MODEL
    if model_type == "ollama":
        return OLLAMA_MODEL
    if model_type == "qwen":
        return QWEN_MODEL if QWEN_API_KEY else OPENROUTER_QWEN_MODEL
    return model_type


def assert_provider_ready(model_type):
    if model_type == "gemini" and not GEMINI_API_KEY:
        raise ValueError("Cle API Gemini non configuree")
    if model_type == "openrouter" and not OPENROUTER_API_KEY:
        raise ValueError("Cle API OpenRouter non configuree")
    if model_type == "groq" and not GROQ_API_KEY:
        raise ValueError("Cle API Groq non configuree")
    if model_type == "qwen" and not QWEN_API_KEY and not OPENROUTER_API_KEY:
        raise ValueError("Cle API Qwen ou OpenRouter non configuree")


def get_provider_attempt_order(requested_model):
    """Return provider attempts in the free-beta fallback order."""
    if requested_model in PROVIDER_FALLBACK_ORDER:
        return [requested_model] + [
            provider for provider in PROVIDER_FALLBACK_ORDER if provider != requested_model
        ]
    return list(PROVIDER_FALLBACK_ORDER)


def generate_with_provider(model_type, prompt):
    """Call one configured provider without exposing provider credentials."""
    assert_provider_ready(model_type)
    if model_type == "gemini":
        return generate_with_gemini(prompt)
    if model_type == "openrouter":
        return generate_with_openrouter(prompt)
    if model_type == "groq":
        return generate_with_groq(prompt)
    if model_type == "qwen":
        return generate_with_qwen(prompt)
    if model_type == "ollama":
        return generate_with_ollama(prompt)
    raise ValueError(f"Modele IA non supporte: {model_type}")

def get_upload_extension(filename):
    _, extension = os.path.splitext((filename or "").lower())
    return extension


def assert_allowed_upload(file):
    safe_name = secure_filename(file.filename or "")
    extension = get_upload_extension(safe_name)
    if not safe_name or extension not in ALLOWED_UPLOAD_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_UPLOAD_EXTENSIONS))
        raise ValueError(f"Format de fichier non supporte. Formats autorises: {allowed}")
    return safe_name, extension


def extract_text_from_file(file):
    """Extrait le texte des fichiers PDF/DOCX/TXT"""
    filename, extension = assert_allowed_upload(file)
    logger.debug(f"DÃ©but de l'extraction du texte pour le fichier: {filename}")
    
    try:
        if extension == '.pdf':
            logger.info(f"Extraction du texte du PDF: {filename}")
            pdf_reader = PdfReader(io.BytesIO(file.read()))
            logger.debug(f"PDF chargÃ© avec {len(pdf_reader.pages)} pages")
            text = '\n'.join([page.extract_text() for page in pdf_reader.pages])
            logger.debug(f"Extraction PDF terminÃ©e: {len(text)} caractÃ¨res extraits")
            return text if text.strip() else "Aucun texte dÃ©tectÃ© dans le PDF"
        
        elif extension == '.docx':
            logger.info(f"Extraction du texte du document Word: {filename}")
            doc = docx.Document(io.BytesIO(file.read()))
            logger.debug(f"Document Word chargÃ© avec {len(doc.paragraphs)} paragraphes")
            text = '\n'.join([para.text for para in doc.paragraphs if para.text])
            logger.debug(f"Extraction Word terminÃ©e: {len(text)} caractÃ¨res extraits")
            return text
        
        elif extension == '.txt':
            logger.info(f"Extraction du texte du fichier TXT: {filename}")
            text = file.read().decode('utf-8', errors='ignore')
            logger.debug(f"Extraction TXT terminÃ©e: {len(text)} caractÃ¨res extraits")
            return text
        
        logger.error(f"Format de fichier non supportÃ©: {filename}")
        raise ValueError("Format de fichier non supportÃ©")
    
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction du texte: {str(e)}")
        raise ValueError(f"Ã‰chec de l'extraction: {str(e)}")

@app.route('/api/extract-text', methods=['POST', 'OPTIONS'])
@limiter.limit("10 per minute")
@require_auth
def handle_text_extraction():
    """Endpoint pour l'extraction de texte depuis un fichier"""
    # GÃ©rer les requÃªtes preflight CORS
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        logger.info("RequÃªte d'extraction de texte reÃ§ue")
        
        if 'file' not in request.files:
            logger.warning("Aucun fichier fourni dans la requÃªte")
            return jsonify({'error': 'Aucun fichier fourni'}), 400

        file = request.files['file']
        if not file or file.filename == '':
            logger.warning("Nom de fichier vide")
            return jsonify({'error': 'Nom de fichier vide'}), 400

        logger.info(f"DÃ©but de l'extraction pour le fichier: {file.filename}")
        text = extract_text_from_file(file)
        logger.info(f"Extraction rÃ©ussie: {len(text)} caractÃ¨res extraits")
        
        return jsonify({
            'text': text,
            'filename': file.filename,
            'characters': len(text)
        })

    except ValueError as e:
        # Erreur spÃ©cifique liÃ©e au format du fichier
        logger.error(f"Erreur de format de fichier: {str(e)}")
        return jsonify({
            'error': f'Format de fichier non supportÃ© ou fichier corrompu: {str(e)}',
            'details': str(e)
        }), 422
    except Exception as e:
        # Erreur inattendue
        logger.error(f"Erreur inattendue lors de l'extraction: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Impossible d\'extraire le texte du fichier. Veuillez vÃ©rifier que le fichier est valide.',
            'details': str(e)
        }), 500

def validate_question(question):
    """Valide la structure d'une question gÃ©nÃ©rÃ©e"""
    required_fields = ['text', 'options', 'explanation', 'difficulty']
    if not all(field in question for field in required_fields):
        logger.warning(f"Question invalide: champs manquants - {question.get('text', 'Sans texte')}")
        return False
    if len(question['options']) != 4 or sum(opt.get('isCorrect', False) for opt in question['options']) != 1:
        logger.warning(f"Question invalide: problÃ¨me avec les options - {question.get('text', 'Sans texte')}")
        return False
    return True

@app.route('/api/generate', methods=['POST', 'OPTIONS'])
@limiter.limit("20 per minute")
@require_auth
def generate_quiz():
    """Endpoint principal pour la gÃ©nÃ©ration de quiz"""
    # GÃ©rer les requÃªtes preflight CORS
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        logger.info("RequÃªte de gÃ©nÃ©ration de quiz reÃ§ue")
        
        # Gestion des entrÃ©es multiples
        data = {}
        if 'file' in request.files:
            file = request.files['file']
            logger.info(f"Extraction du texte Ã  partir du fichier: {file.filename}")
            text = extract_text_from_file(file)
            # RÃ©cupÃ©rer les paramÃ¨tres depuis form-data
            data = {
                'numQuestions': request.form.get('numQuestions'),
                'difficulty': request.form.get('difficulty'),
                'modelType': request.form.get('modelType'),
            }
        else:
            data = request.get_json() or {}
            text = data.get('text', '')
            logger.info(f"Texte reÃ§u directement: {len(text)} caractÃ¨res")

        # Validation des paramÃ¨tres
        if not text or not text.strip():
            logger.warning("Aucun contenu textuel fourni pour la gÃ©nÃ©ration")
            return jsonify({'error': 'Aucun contenu fourni'}), 400

        # ParamÃ¨tres de gÃ©nÃ©ration avec validation
        try:
            num_questions = int(data.get('numQuestions', 5))
            if num_questions < 1 or num_questions > MAX_AI_QUESTIONS_PER_QUIZ:
                return jsonify({
                    'error': f'Le nombre de questions doit etre entre 1 et {MAX_AI_QUESTIONS_PER_QUIZ}'
                }), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Nombre de questions invalide'}), 400

        difficulty = data.get('difficulty', 'medium')
        if difficulty not in ['easy', 'medium', 'hard']:
            difficulty = 'medium'

        model_type = (data.get('modelType') or 'gemini').strip().lower()
        if model_type not in SUPPORTED_MODELS:
            return jsonify({
                'error': f"Modele IA non supporte: {model_type}",
                'supportedModels': sorted(SUPPORTED_MODELS),
            }), 400

        logger.info(f"ParamÃ¨tres de gÃ©nÃ©ration: {num_questions} questions, difficultÃ© {difficulty}, modÃ¨le {model_type}")

        # Construction du prompt
        logger.debug(f"Construction du prompt avec {len(text[:5000])} caractÃ¨res de texte")
        prompt = f"""
        GÃ©nÃ¨re {num_questions} questions QCM complexes en franÃ§ais selon ces rÃ¨gles STRICTES :

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
              "explanation": "Explication basÃ©e sur le texte",
              "difficulty": "{difficulty}"
            }}
          ]
        }}

        CONTRAINTES :
        - Une seule rÃ©ponse correcte par question
        - Les options doivent Ãªtre plausibles
        - Les explications doivent citer le texte
        - Ne pas inclure de markdown
        {f"- Contraintes supplementaires: {data.get('additionalInfo')}" if data.get('additionalInfo') else ""}
        """
        logger.debug("Prompt construit avec succÃ¨s")

        content = None
        used_provider = model_type
        provider_errors = []
        for provider in get_provider_attempt_order(model_type):
            try:
                logger.info(f"Tentative de generation avec {provider}")
                content = generate_with_provider(provider, prompt)
                used_provider = provider
                break
            except ValueError as e:
                safe_error = sanitize_error_message(str(e))
                provider_errors.append(f"{provider}: {safe_error}")
                logger.warning(f"Provider {provider} indisponible: {safe_error}")

        if not content:
            raise ValueError("Service IA indisponible: " + " | ".join(provider_errors))

        logger.debug(f"Contenu brut reÃ§u: {len(content)} caractÃ¨res")
        logger.debug(f"AperÃ§u du contenu: {content[:200]}")
        
        # Chercher le JSON dans la rÃ©ponse
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if not json_match:
            logger.error("Aucun JSON trouvÃ© dans la rÃ©ponse")
            logger.error(f"Contenu complet: {content}")
            raise ValueError("Aucun JSON trouvÃ© dans la rÃ©ponse de l'IA")
        
        json_str = json_match.group()
        logger.debug(f"JSON extrait: {len(json_str)} caractÃ¨res")
        
        try:
            questions_data = json.loads(json_str).get('questions', [])
        except json.JSONDecodeError as e:
            logger.error(f"Erreur de parsing JSON: {str(e)}")
            logger.error(f"JSON problÃ©matique: {json_str[:500]}")
            raise ValueError(f"Erreur de parsing JSON: {str(e)}")
        logger.info(f"{len(questions_data)} questions extraites de la rÃ©ponse")

        # Validation et formatage
        validated_questions = []
        for idx, q in enumerate(questions_data[:num_questions]):
            if validate_question(q):
                q['id'] = f"q{idx+1}"
                for opt_idx, opt in enumerate(q['options']):
                    opt['id'] = f"{q['id']}_{chr(97 + opt_idx)}"
                validated_questions.append(q)
                logger.debug(f"Question validÃ©e: {q['text'][:50]}...")
            else:
                logger.warning(f"Question ignorÃ©e car invalide: {q.get('text', 'Sans texte')[:50]}...")

        logger.info(f"{len(validated_questions)} questions validÃ©es sur {len(questions_data)}")
        if not validated_questions:
            logger.error("Aucune question valide gÃ©nÃ©rÃ©e")
            raise ValueError("Aucune question valide gÃ©nÃ©rÃ©e")

        return jsonify({
            "questions": validated_questions,
            "provider": used_provider,
            "requestedProvider": model_type,
            "model": get_provider_model(used_provider),
            "fallback": used_provider != model_type,
        })

    except ValueError as e:
        # Erreurs de validation ou d'API
        error_msg = sanitize_error_message(str(e))
        logger.error(f"Erreur de validation: {error_msg}")
        if (
            "Service Gemini indisponible" in error_msg
            or "Service OpenRouter indisponible" in error_msg
            or "Service Groq indisponible" in error_msg
            or "Service Ollama indisponible" in error_msg
            or "Service Qwen" in error_msg
            or "Service IA indisponible" in error_msg
            or "Qwen via OpenRouter" in error_msg
            or "Reponse invalide de" in error_msg
            or "Erreur lors de l'appel" in error_msg
            or "Cle API" in error_msg
            or "ClÃ© API" in error_msg
        ):
            logger.warning("API IA indisponible, generation fallback contextuelle")
            fallback_questions = generate_fallback_questions(num_questions, difficulty, text)
            return jsonify({
                "questions": fallback_questions,
                "warning": "Generation IA indisponible. Quiz cree avec le generateur local de secours.",
                "details": error_msg,
                "provider": model_type if 'model_type' in locals() else "fallback",
                "model": "local-fallback",
                "fallback": True,
            }), 200
        elif "Aucun JSON trouvÃ©" in error_msg or "Erreur de parsing JSON" in error_msg:
            return jsonify({
                "error": "Le modÃ¨le d'IA n'a pas gÃ©nÃ©rÃ© de rÃ©ponse valide. Veuillez rÃ©essayer.",
                "details": error_msg
            }), 422
        elif "Aucune question valide gÃ©nÃ©rÃ©e" in error_msg:
            return jsonify({
                "error": "Impossible de gÃ©nÃ©rer des questions valides Ã  partir de ce contenu. Veuillez vÃ©rifier votre fichier et rÃ©essayer.",
                "details": error_msg
            }), 422
        else:
            return jsonify({
                "error": error_msg
            }), 400
    except Exception as e:
        # Erreurs inattendues
        safe_error = sanitize_error_message(str(e))
        logger.error(f"Erreur inattendue lors de la gÃ©nÃ©ration: {safe_error}", exc_info=True)
        return jsonify({
            "error": "Une erreur inattendue s'est produite lors de la gÃ©nÃ©ration des questions. Veuillez rÃ©essayer.",
            "details": safe_error
        }), 500

def generate_with_gemini(prompt):
    try:
        logger.info("Utilisation de l'API Gemini avec le SDK officiel")
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        content = response.text
        logger.info(f"Contenu extrait de Gemini: {len(content)} caracteres")
        return content
    except Exception as e:
        safe_error = sanitize_error_message(str(e))
        logger.error(f"Erreur lors de l'appel a l'API Gemini: {safe_error}")
        raise ValueError(f"Service Gemini indisponible: {safe_error}")


def generate_with_chat_completions_api(provider_name, base_url, api_key, model, prompt, extra_headers=None):
    """Genere du contenu avec une API de chat completions compatible."""
    if not api_key:
        raise ValueError(f"Cle API {provider_name} non configuree")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        **(extra_headers or {}),
    }
    endpoint = f"{base_url.rstrip('/')}/chat/completions"

    try:
        logger.info(f"Envoi de la requete a {provider_name} avec le modele {model}")
        response = requests.post(
            endpoint,
            headers=headers,
            json={
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": "Tu es un expert en creation de quiz educatifs. Reponds uniquement avec un JSON valide.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
            timeout=90,
        )
        response.raise_for_status()
        payload = response.json()
        return payload["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        safe_error = sanitize_error_message(str(e))
        if getattr(e, "response", None) is not None:
            safe_error = f"{safe_error} | {sanitize_error_message(e.response.text[:800])}"
        logger.error(f"Erreur lors de l'appel a {provider_name}: {safe_error}")
        raise ValueError(f"Service {provider_name} indisponible: {safe_error}")
    except (KeyError, IndexError, TypeError, ValueError) as e:
        safe_error = sanitize_error_message(str(e))
        logger.error(f"Reponse invalide de {provider_name}: {safe_error}")
        raise ValueError(f"Reponse invalide de {provider_name}: {safe_error}")


def generate_with_openrouter(prompt):
    return generate_with_chat_completions_api(
        "OpenRouter",
        "https://openrouter.ai/api/v1",
        OPENROUTER_API_KEY,
        OPENROUTER_MODEL,
        prompt,
        {
            "HTTP-Referer": os.getenv("APP_PUBLIC_URL", "http://localhost:5173"),
            "X-Title": "QUIZO",
        },
    )


def generate_with_groq(prompt):
    return generate_with_chat_completions_api(
        "Groq",
        GROQ_BASE_URL,
        GROQ_API_KEY,
        GROQ_MODEL,
        prompt,
    )


def generate_with_qwen(prompt):
    if QWEN_API_KEY:
        return generate_with_chat_completions_api(
            "Qwen",
            QWEN_BASE_URL,
            QWEN_API_KEY,
            QWEN_MODEL,
            prompt,
        )

    return generate_with_chat_completions_api(
        "Qwen via OpenRouter",
        "https://openrouter.ai/api/v1",
        OPENROUTER_API_KEY,
        OPENROUTER_QWEN_MODEL,
        prompt,
        {
            "HTTP-Referer": os.getenv("APP_PUBLIC_URL", "http://localhost:5173"),
            "X-Title": "QUIZO",
        },
    )


def generate_with_ollama(prompt):
    endpoint = f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate"
    try:
        logger.info(f"Envoi de la requete a Ollama avec le modele {OLLAMA_MODEL}")
        response = requests.post(
            endpoint,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.2},
            },
            timeout=120,
        )
        response.raise_for_status()
        payload = response.json()
        content = payload.get("response")
        if not content:
            raise ValueError("Champ response absent dans la reponse Ollama")
        return content
    except requests.exceptions.RequestException as e:
        safe_error = sanitize_error_message(str(e))
        if getattr(e, "response", None) is not None:
            safe_error = f"{safe_error} | {sanitize_error_message(e.response.text[:800])}"
        logger.error(f"Erreur lors de l'appel a Ollama: {safe_error}")
        raise ValueError(f"Service Ollama indisponible: {safe_error}")
    except (KeyError, TypeError, ValueError) as e:
        safe_error = sanitize_error_message(str(e))
        logger.error(f"Reponse invalide de Ollama: {safe_error}")
        raise ValueError(f"Reponse invalide de Ollama: {safe_error}")

def generate_fallback_questions(num, difficulty, source_text=""):
    """Genere des questions de secours a partir du texte extrait."""
    logger.info(f"Generation fallback de {num} questions avec difficulte {difficulty}")

    cleaned_text = re.sub(r"\s+", " ", source_text or "").strip()
    sentences = [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?؟])\s+", cleaned_text)
        if len(sentence.strip()) > 35
    ]

    if not sentences and cleaned_text:
        sentences = [
            cleaned_text[index:index + 220].strip()
            for index in range(0, min(len(cleaned_text), num * 220), 220)
            if cleaned_text[index:index + 220].strip()
        ]

    generic_fragments = [
        "Le document presente une idee principale liee au sujet etudie.",
        "Le passage insiste sur les notions essentielles du cours.",
        "Le contenu explique un concept important a retenir.",
        "Le texte donne des elements utiles pour comprendre le chapitre.",
    ]

    if not sentences:
        sentences = generic_fragments

    questions = []
    for i in range(num):
        qid = f"q{i + 1}"
        correct = sentences[i % len(sentences)][:180]
        topic = correct[:80]
        distractors = [
            generic_fragments[(i + 1) % len(generic_fragments)],
            generic_fragments[(i + 2) % len(generic_fragments)],
            generic_fragments[(i + 3) % len(generic_fragments)],
        ]

        questions.append({
            "id": qid,
            "text": f"D'apres le document, quel extrait correspond le mieux a cette idee : {topic} ?",
            "options": [
                {"id": f"{qid}_a", "text": correct, "isCorrect": True},
                {"id": f"{qid}_b", "text": distractors[0], "isCorrect": False},
                {"id": f"{qid}_c", "text": distractors[1], "isCorrect": False},
                {"id": f"{qid}_d", "text": distractors[2], "isCorrect": False},
            ],
            "explanation": "Question generee localement a partir du texte extrait, car le service IA externe est indisponible.",
            "difficulty": difficulty,
        })

    return questions

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de verification de l'etat du service"""
    return jsonify({
        "status": "ok",
        "version": "1.1.0",
        "services": get_provider_configured_state(),
        "models": {
            provider: get_provider_model(provider)
            for provider in sorted(SUPPORTED_MODELS)
        },
    })


@app.route('/api/status', methods=['GET'])
def status_check():
    """Status detaille — utile pour le monitoring"""
    services = get_provider_configured_state()
    providers_list = [p for p, configured in services.items() if configured]
    return jsonify({
        "status": "ok",
        "version": "1.1.0",
        "providers_configured": sorted(providers_list),
        "providers_count": len(providers_list),
        "firebase_admin_configured": _firebase_app is not None,
        "firebase_project_id": os.getenv("FIREBASE_PROJECT_ID", "not-set"),
        "environment": os.getenv("FLASK_ENV", "development"),
        "rate_limiting": True,
        "auth_verification": _firebase_app is not None,
    })


@app.route('/api/providers', methods=['GET'])
def providers_check():
    """Expose les fournisseurs IA connus sans divulguer les secrets."""
    services = get_provider_configured_state()
    ollama_reachable = False
    try:
        response = requests.get(f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags", timeout=1.5)
        ollama_reachable = response.ok
    except requests.exceptions.RequestException:
        ollama_reachable = False

    services["ollama"] = ollama_reachable
    return jsonify({
        "providers": {
            provider: {
                "configured": services.get(provider, False),
                "model": get_provider_model(provider),
            }
            for provider in sorted(SUPPORTED_MODELS)
        }
    })


# --- Request logging middleware ---
import time as _time

@app.before_request
def _log_request_start():
    request._start_time = _time.time()

@app.after_request
def _log_request_end(response):
    duration = round((_time.time() - getattr(request, '_start_time', _time.time())) * 1000)
    if request.path != '/api/health':  # don't spam health check logs
        logger.info(f"{request.method} {request.path} -> {response.status_code} ({duration}ms)")
    return response


if __name__ == '__main__':
    logger.info("Demarrage du serveur Flask sur le port 5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
