# Politique de Sécurité - QUIZO

## 🔒 Configuration Sécurisée

### Variables d'Environnement Requises

#### Backend (Python Flask)
```bash
# python_api/.env
GEMINI_API_KEY=votre_clé_gemini
CHATGPT_API_KEY=votre_clé_openai
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
LOG_LEVEL=INFO
```

#### Frontend (React/Vite)
```bash
# .env
VITE_BACKEND_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### ⚠️ JAMAIS

- ❌ Ne jamais commiter les fichiers `.env`
- ❌ Ne jamais hardcoder les clés API dans le code
- ❌ Ne jamais exposer les clés privées Firebase Admin
- ❌ Ne jamais commit `firebase-service-account.json`

### ✅ TOUJOURS

- ✅ Utiliser `.env.example` comme template
- ✅ Vérifier `.gitignore` avant chaque commit
- ✅ Utiliser des variables d'environnement
- ✅ Restreindre les CORS aux domaines autorisés
- ✅ Activer le logging en production (niveau INFO)

## 🛡️ Règles Firestore

Les règles Firestore sont dans `firestore.rules`. Elles:
- Vérifient l'authentification pour toutes les opérations
- Supportent `userId` (quiz IA) et `creatorId` (quiz manuels)
- Limitent les requêtes list à 100 documents
- Empêchent la modification des propriétaires

Pour déployer:
```bash
firebase deploy --only firestore:rules
```

## 🔐 Bonnes Pratiques

1. **API Keys**: Rotation régulière des clés (tous les 90 jours)
2. **CORS**: Liste blanche stricte des origines
3. **Rate Limiting**: À implémenter avec Flask-Limiter
4. **HTTPS**: Obligatoire en production
5. **Validation**: Toutes les entrées doivent être validées

## 📞 Signaler une Vulnérabilité

Si vous découvrez une faille de sécurité:
1. **NE PAS** créer une issue publique
2. Envoyer un email à: security@votre-domaine.com
3. Inclure: description, impact, étapes de reproduction
4. Délai de réponse: 48h

## 🔄 Mises à Jour de Sécurité

- Python: `pip list --outdated`
- Node: `npm audit`
- Dépendances: Mise à jour mensuelle des patchs de sécurité
