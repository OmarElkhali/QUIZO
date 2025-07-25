
# Guide d'intégration: React + Python Flask

Ce projet est composé de deux parties principales:
1. Frontend React (application web principale)
2. Backend Python Flask (API pour la génération de quiz avec IA)

## Structure du projet

```
project/
├── src/                   # Code source React (frontend)
│   ├── components/        # Composants React
│   ├── context/           # Contextes React (gestion d'état)
│   ├── services/          # Services pour les API et la logique métier
│   └── ...
├── python_api/            # API Python Flask (backend IA)
│   ├── app.py             # Application Flask principale
│   ├── requirements.txt   # Dépendances Python
│   └── Dockerfile         # Pour déploiement containerisé
└── ...
```

## Comment démarrer l'application

### 1. Démarrer le frontend React
```
npm install
npm run dev
```

### 2. Démarrer l'API Python
```
cd python_api
pip install -r requirements.txt
python app.py
```

### 3. Configuration de la connexion

Par défaut, l'API Python fonctionne sur `http://localhost:5000` et le frontend React sur `http://localhost:5173`. 

Pour connecter le frontend à l'API Python, vous pouvez:

1. **Option 1: Configurer un proxy dans le frontend**
   Dans `vite.config.ts`, ajoutez:
   ```js
   server: {
     proxy: {
       '/api': 'http://localhost:5000'
     }
   }
   ```

2. **Option 2: Configurer CORS dans le backend**
   Cette configuration est déjà en place dans l'API Flask.

## Workflow d'utilisation

1. L'utilisateur télécharge un document sur l'interface React
2. Le frontend extrait le texte du document
3. Le frontend envoie une requête à l'API Python avec le texte et les paramètres du quiz
4. L'API Python génère les questions à l'aide de Qwen via OpenRouter
5. Les questions sont renvoyées au frontend
6. Le frontend crée un quiz avec ces questions et l'enregistre dans Firebase

## Architecture des données

Les requêtes entre le frontend et l'API Python suivent ce format:

**Requête**:
```json
{
  "text": "Contenu du document...",
  "numQuestions": 10,
  "difficulty": "medium",
  "additionalInfo": "Informations supplémentaires..."
}
```

**Réponse**:
```json
{
  "questions": [
    {
      "id": "q1",
      "text": "Question 1?",
      "options": [
        {"id": "q1_a", "text": "Option A", "isCorrect": false},
        {"id": "q1_b", "text": "Option B", "isCorrect": true},
        {"id": "q1_c", "text": "Option C", "isCorrect": false},
        {"id": "q1_d", "text": "Option D", "isCorrect": false}
      ],
      "explanation": "Explication de la réponse correcte",
      "difficulty": "medium"
    },
    // autres questions...
  ]
}
```

## Déploiement

### Frontend React
1. Construire l'application: `npm run build`
2. Déployer les fichiers statiques générés sur un hébergement (Vercel, Netlify, etc.)

### API Python
1. Option conteneur:
   ```
   cd python_api
   docker build -t quiz-ai-api .
   docker run -p 5000:5000 quiz-ai-api
   ```

2. Option PaaS:
   Déployer sur Heroku, Railway, Render ou autre service compatible avec les applications Python/Flask.
