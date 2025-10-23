# 🚀 Guide de Déploiement QUIZO

Ce guide explique comment déployer l'application QUIZO (Frontend + Backend).

## 📋 Prérequis

- Node.js 18+ installé
- Python 3.11+ installé
- Firebase CLI installé (`npm install -g firebase-tools`)
- Compte Firebase configuré
- Compte Render.com (pour le backend)
- Compte GitHub

## 🎯 Architecture de Déploiement

```
┌─────────────────────────────────────────────┐
│           Frontend (React + Vite)            │
│        Hébergé sur Firebase Hosting          │
│        https://ests-quiz.web.app             │
└─────────────────┬───────────────────────────┘
                  │
                  │ API Calls
                  │
┌─────────────────▼───────────────────────────┐
│        Backend (Flask + Python)              │
│        Hébergé sur Render.com                │
│     https://your-app.onrender.com/api        │
└─────────────────┬───────────────────────────┘
                  │
                  │ Firestore + Storage
                  │
┌─────────────────▼───────────────────────────┐
│            Firebase Services                 │
│   - Firestore Database                       │
│   - Authentication                           │
│   - Storage                                  │
└─────────────────────────────────────────────┘
```

## 🔧 Configuration

### 1. Variables d'Environnement Frontend

Créez un fichier `.env` à la racine :

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API URL (sera mis à jour après déploiement Render)
VITE_BACKEND_URL=https://your-backend.onrender.com/api
```

### 2. Variables d'Environnement Backend

Créez `python_api/.env` :

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key
CHATGPT_API_KEY=your_openai_api_key  # Optionnel

# CORS Configuration
CORS_ORIGINS=https://ests-quiz.web.app,https://ests-quiz.firebaseapp.com

# Logging
LOG_LEVEL=INFO
PORT=5000
```

## 📦 Déploiement Automatique

### Option 1: Script PowerShell (Windows)

```powershell
.\deploy.ps1
```

Ce script effectue automatiquement :
- ✅ Build du frontend
- ✅ Déploiement des règles Firestore
- ✅ Déploiement sur Firebase Hosting
- ✅ Vérification du backend
- ✅ Push sur GitHub

### Option 2: Commandes NPM

```bash
# Build uniquement
npm run build

# Déployer sur Firebase
npm run deploy:firebase

# Tout déployer (frontend)
npm run deploy
```

## 🐍 Déploiement Backend sur Render

### Méthode Automatique (Recommandée)

1. **Connectez-vous sur [Render.com](https://render.com)**

2. **Créez un nouveau Web Service**
   - Cliquez sur "New +" → "Web Service"

3. **Connectez votre Repository GitHub**
   - Sélectionnez `OmarElkhali/QUIZO`
   - Autorisez Render à accéder au repository

4. **Configuration du Service**
   ```
   Name: quizo-backend
   Region: Frankfurt (EU Central) - ou le plus proche
   Branch: main
   Root Directory: python_api
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app
   Instance Type: Free (ou Starter pour production)
   ```

5. **Variables d'Environnement**
   
   Ajoutez dans l'onglet "Environment" :
   ```
   GEMINI_API_KEY=votre_clé_gemini
   CHATGPT_API_KEY=votre_clé_openai (optionnel)
   CORS_ORIGINS=https://ests-quiz.web.app,https://ests-quiz.firebaseapp.com
   LOG_LEVEL=INFO
   PORT=5000
   ```

6. **Déploiement**
   - Cliquez sur "Create Web Service"
   - Attendez 2-3 minutes que le déploiement se termine
   - Notez l'URL générée (ex: `https://quizo-backend.onrender.com`)

7. **Mise à Jour Frontend**
   
   Mettez à jour `.env` avec la nouvelle URL backend :
   ```env
   VITE_BACKEND_URL=https://quizo-backend.onrender.com/api
   ```
   
   Puis redéployez le frontend :
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Méthode Manuelle (Alternative)

Si vous préférez Docker :

```bash
cd python_api

# Build l'image
docker build -t quizo-backend .

# Test local
docker run -p 5000:5000 --env-file .env quizo-backend

# Push vers Render (via Docker Registry)
# Suivez la documentation Render pour Docker
```

## 🔥 Déploiement Firebase

### Première Configuration

```bash
# Login Firebase
firebase login

# Initialiser (si pas déjà fait)
firebase init

# Sélectionnez:
# - Firestore
# - Hosting
# - Storage (optionnel)
```

### Déploiement

```bash
# Déployer tout
firebase deploy

# Ou par service
firebase deploy --only firestore:rules
firebase deploy --only hosting
firebase deploy --only storage
```

## ✅ Vérification Post-Déploiement

### 1. Frontend

Visitez `https://ests-quiz.web.app` et vérifiez :
- ✅ Page d'accueil se charge
- ✅ Authentification fonctionne
- ✅ Création de quiz manuel fonctionne
- ✅ Console navigateur : aucune erreur

### 2. Backend

Testez l'API :
```bash
# Health check
curl https://quizo-backend.onrender.com/api/health

# Devrait retourner: {"status": "ok", "version": "1.0"}
```

### 3. Firestore

Dans Firebase Console :
- ✅ Vérifiez que les règles sont à jour
- ✅ Testez la création d'un quiz
- ✅ Vérifiez les permissions

## 🔄 CI/CD avec GitHub Actions (Optionnel)

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_BACKEND_URL: ${{ secrets.VITE_BACKEND_URL }}
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## 🐛 Dépannage

### Erreur: "Failed to build"

```bash
# Nettoyer le cache
rm -rf node_modules dist
npm install
npm run build
```

### Erreur: "CORS Error"

Vérifiez que `CORS_ORIGINS` dans le backend inclut l'URL Firebase :
```env
CORS_ORIGINS=https://ests-quiz.web.app,https://ests-quiz.firebaseapp.com
```

### Backend ne répond pas

1. Vérifiez les logs Render
2. Testez le endpoint `/api/health`
3. Vérifiez les variables d'environnement

### Erreur Firestore Permissions

```bash
# Redéployez les règles
firebase deploy --only firestore:rules
```

## 📊 Monitoring

### Frontend (Firebase Hosting)
- Console Firebase → Hosting → Usage

### Backend (Render)
- Dashboard Render → Metrics
- Logs en temps réel

### Firestore
- Console Firebase → Firestore → Usage
- Règles de sécurité

## 🔐 Sécurité Production

Avant la mise en production :

1. ✅ Changez toutes les clés API
2. ✅ Activez les règles Firestore strictes
3. ✅ Configurez les limites de taux (rate limiting)
4. ✅ Activez HTTPS uniquement
5. ✅ Configurez les backups Firestore
6. ✅ Ajoutez monitoring et alertes

## 📞 Support

- **Issues GitHub** : https://github.com/OmarElkhali/QUIZO/issues
- **Documentation** : README.md
- **Firebase Console** : https://console.firebase.google.com/project/ests-quiz

---

**Dernière mise à jour** : Octobre 2025
**Version** : 1.0.0
