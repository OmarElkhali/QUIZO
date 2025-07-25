
# API Python pour la génération de quiz

Cette API Flask sert d'interface pour la génération de questions de quiz à l'aide du modèle Qwen 2.5 via l'API OpenRouter.

## Installation

1. Installer les dépendances:
   ```
   pip install -r requirements.txt
   ```

2. Démarrer le serveur:
   ```
   python app.py
   ```

Ou avec Docker:
```
docker build -t quiz-ai-api .
docker run -p 5000:5000 quiz-ai-api
```

## Endpoints

- `POST /api/generate`: Génère des questions de quiz à partir d'un texte
  - Corps de la requête: `{ "text": "...", "numQuestions": 10, "difficulty": "medium", "additionalInfo": "..." }`
  - Réponse: `{ "questions": [...] }`

- `GET /api/health`: Vérifie que l'API est en ligne
  - Réponse: `{ "status": "ok", "message": "L'API Python est en ligne" }`

## Connexion avec l'application React

L'API est conçue pour être utilisée avec l'application React de quiz. Pour connecter les deux:

1. Démarrer l'API Python (port 5000 par défaut)
2. Configurer l'URL de l'API dans l'application React
3. Les appels à l'API se feront avec fetch ou axios depuis le frontend

## Variables d'environnement

- `OPENROUTER_API_KEY`: Clé API pour OpenRouter (requise pour Qwen)
