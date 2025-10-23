# Configuration Variables d'Environnement Render

Votre backend est déployé sur : **https://quizo-nued.onrender.com**

## ⚠️ IMPORTANT: Mettre à jour CORS_ORIGINS

Allez sur Render.com → votre service → Environment

### Variables à configurer :

```bash
# CORS - CRITIQUE pour la production
CORS_ORIGINS=https://ests-quiz.web.app,https://ests-quiz.firebaseapp.com,http://localhost:5173,http://localhost:8080

# API Keys (déjà configurées)
GEMINI_API_KEY=votre_clé_actuelle
CHATGPT_API_KEY=votre_clé_openai  # Optionnel

# Autres
LOG_LEVEL=INFO
PORT=10000
```

### Étapes :

1. Allez sur https://dashboard.render.com/
2. Sélectionnez votre service "quizo-backend" ou similaire
3. Cliquez sur "Environment" dans le menu de gauche
4. Trouvez `CORS_ORIGINS` et modifiez sa valeur
5. Cliquez sur "Save Changes"
6. Le service va redémarrer automatiquement (~30 secondes)

### URL du backend à utiliser :

```
https://quizo-nued.onrender.com/api
```

Cette URL doit être configurée dans :
- `.env.local` (local dev)
- Variables d'environnement Firebase pour la production
