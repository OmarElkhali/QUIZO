# -*- coding: utf-8 -*-
import os
import json
import logging
import requests
import re
import PyPDF2
import docx
import io
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# 2. Vérifier que le CORS est correctement configuré

# Votre configuration CORS dans `app.py` est déjà correcte, car elle autorise les requêtes depuis `https://quizo-ruddy.vercel.app` :
CORS(app, resources={r"/*": {"origins": ["https://quizo-ruddy.vercel.app", "http://localhost:5173"]}}) 

# Configuration du logging améliorée
logging.basicConfig(
    level=logging.DEBUG,  # Changé de INFO à DEBUG pour plus de détails
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Clés API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBxXkrsx48gwKp7r7dduLV5dX1tfpnv3N0")
CHATGPT_API_KEY = os.getenv("CHATGPT_API_KEY", "")

def extract_text_from_file(file):
    """Extrait le texte des fichiers PDF/DOCX/TXT"""
    filename = file.filename.lower()
    logger.debug(f"Début de l'extraction du texte pour le fichier: {filename}")
    
    try:
        if filename.endswith('.pdf'):
            logger.info(f"Extraction du texte du PDF: {filename}")
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
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

@app.route('/api/extract-text', methods=['POST'])
def handle_text_extraction():
    """Endpoint pour l'extraction de texte depuis un fichier"""
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

@app.route('/api/generate', methods=['POST'])
def generate_quiz():
    """Endpoint principal pour la génération de quiz"""
    try:
        logger.info("Requête de génération de quiz reçue")
        
        # Gestion des entrées multiples
        if 'file' in request.files:
            file = request.files['file']
            logger.info(f"Extraction du texte à partir du fichier: {file.filename}")
            text = extract_text_from_file(file)
        else:
            data = request.get_json()
            text = data.get('text', '')
            logger.info(f"Texte reçu directement: {len(text)} caractères")

        # Paramètres de génération
        num_questions = int(request.form.get('numQuestions', data.get('numQuestions', 5)))
        difficulty = request.form.get('difficulty', data.get('difficulty', 'hard'))
        model_type = request.form.get('modelType', data.get('modelType', 'gemini'))
        api_key = request.form.get('apiKey', data.get('apiKey', ''))
        
        logger.info(f"Paramètres de génération: {num_questions} questions, difficulté {difficulty}, modèle {model_type}")

        if not text.strip():
            logger.warning("Aucun contenu textuel fourni pour la génération")
            return jsonify({'error': 'Aucun contenu fourni'}), 400

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
        if model_type == 'chatgpt':
            # Utiliser ChatGPT
            logger.info("Utilisation de l'API ChatGPT")
            content = generate_with_chatgpt(prompt, api_key or CHATGPT_API_KEY)
        else:
            # Utiliser Gemini (par défaut)
            try:
                logger.info("Envoi de la requête à l'API Gemini")
                response = requests.post(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
                    headers={'x-goog-api-key': GEMINI_API_KEY},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=30
                )
                response.raise_for_status()
                logger.info("Réponse reçue de l'API Gemini")
                content = response.json()['candidates'][0]['content']['parts'][0]['text']
            except requests.exceptions.RequestException as e:
                logger.error(f"Erreur lors de l'appel à l'API Gemini: {str(e)}")
                raise ValueError("Service temporairement indisponible")

        logger.debug(f"Contenu brut reçu: {len(content)} caractères")
        
        json_str = re.search(r'\{.*\}', content, re.DOTALL).group()
        logger.debug(f"JSON extrait: {len(json_str)} caractères")
        
        questions_data = json.loads(json_str).get('questions', [])
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
    return jsonify({
        "status": "ok",
        "version": "1.0.0",
        "services": {
            "gemini": bool(GEMINI_API_KEY),
            "chatgpt": bool(CHATGPT_API_KEY)
        }
    })

if __name__ == '__main__':
    logger.info("Démarrage du serveur Flask sur le port 5000")
    app.run(host='0.0.0.0', port=5000, debug=False)