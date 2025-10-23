# Instructions de Configuration Vercel

## Variables d'Environnement à configurer sur Vercel

### 🔗 Accéder aux paramètres :
https://vercel.com/votre-projet/settings/environment-variables

### ⚙️ Variables requises :

```bash
# Backend API URL - CRITIQUE
VITE_BACKEND_URL=https://quizo-nued.onrender.com/api

# Firebase Configuration (déjà configurées normalement)
VITE_FIREBASE_API_KEY=votre_clé
VITE_FIREBASE_AUTH_DOMAIN=ests-quiz.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ests-quiz
VITE_FIREBASE_STORAGE_BUCKET=ests-quiz.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_id
VITE_FIREBASE_APP_ID=votre_app_id
```

### 📋 Étapes :

1. **Allez sur** : https://vercel.com/dashboard
2. **Sélectionnez** votre projet QUIZO
3. **Settings** → **Environment Variables**
4. **Ajoutez chaque variable** :
   - Name: `VITE_BACKEND_URL`
   - Value: `https://quizo-nued.onrender.com/api`
   - Environment: **Production, Preview, Development** (cochez les 3)
5. **Cliquez** "Save"
6. **Redéployez** : Allez dans "Deployments" → Cliquez sur les 3 points → "Redeploy"

### ✅ Vérification

Après redéploiement, ouvrez la console de votre navigateur sur https://quizo-ruddy.vercel.app :

```javascript
// Devrait afficher: https://quizo-nued.onrender.com/api
console.log(import.meta.env.VITE_BACKEND_URL)
```

### 🔗 Synchronisation Backend (Render)

N'oubliez pas de configurer CORS sur Render :

```bash
CORS_ORIGINS=https://quizo-ruddy.vercel.app,http://localhost:5173,http://localhost:8080
```

## 🧪 Test de connexion

Une fois les deux configurés, testez :

1. Allez sur https://quizo-ruddy.vercel.app
2. Ouvrez la console développeur (F12)
3. Créez un quiz avec IA
4. Vérifiez qu'il n'y a pas d'erreur CORS ou "Failed to fetch"

Si vous voyez une erreur CORS, c'est que Render n'a pas la bonne variable `CORS_ORIGINS`.
