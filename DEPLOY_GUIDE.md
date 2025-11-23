# 🚀 GUIDE DE DÉPLOIEMENT QUIZO

**Date**: 23 Novembre 2025  
**Version**: 3.0  
**Plateformes**: Vercel (Frontend) + Render (Backend)

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Architecture de Déploiement](#architecture)
3. [Déploiement Backend (Render)](#backend-render)
4. [Déploiement Frontend (Vercel)](#frontend-vercel)
5. [Configuration Firebase](#firebase)
6. [Variables d'Environnement](#variables)
7. [Vérification et Tests](#tests)
8. [Dépannage](#troubleshooting)
9. [Monitoring et Maintenance](#monitoring)

---

## 🔧 PRÉREQUIS {#prérequis}

### Comptes Nécessaires

- ✅ **GitHub** - Repository du code
- ✅ **Vercel** - Hébergement frontend (gratuit)
- ✅ **Render** - Hébergement backend (gratuit)
- ✅ **Firebase** - Base de données et auth (gratuit)
- ✅ **Groq** - API LLM (gratuit, 14 400 req/jour)

### Clés API à Préparer

```bash
GROQ_API_KEY=gsk_your_groq_api_key_here (OBLIGATOIRE)
FIREBASE_API_KEY=AIza...
FIREBASE_PROJECT_ID=quizo-...
# + autres clés Firebase (voir section Variables)
```

### Outils Locaux

```powershell
# Vérifier installations
node --version    # v18+ requis
npm --version     # v9+ requis
git --version     # Git installé
```

---

## 🏗️ ARCHITECTURE DE DÉPLOIEMENT {#architecture}

```
┌─────────────────────────────────────────────────────┐
│                    UTILISATEUR                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Vercel CDN (Frontend)│
         │   quizo.vercel.app    │
         │   - React + Vite       │
         │   - Tailwind CSS       │
         │   - Firebase SDK       │
         └──────────┬─────────────┘
                    │
        ┌───────────┴──────────────┐
        │                          │
        ▼                          ▼
┌──────────────┐          ┌─────────────────┐
│   Firebase   │          │ Render (Backend)│
│   - Auth     │◄─────────┤ quizo.onrender  │
│   - Firestore│          │ - Flask API     │
│   - Storage  │          │ - Groq AI       │
│   - Realtime │          │ - Gunicorn      │
└──────────────┘          └─────────────────┘
```

### Flux de Requêtes

1. **User** → **Vercel** (HTML/CSS/JS)
2. **Vercel** → **Firebase** (Auth, data)
3. **Vercel** → **Render** (`/api/*` proxied)
4. **Render** → **Groq API** (génération questions)

---

## 🐍 DÉPLOIEMENT BACKEND (RENDER) {#backend-render}

### Étape 1: Préparer le Repository

```powershell
# Vérifier que render.yaml existe
cd C:\Users\SetupGame\Desktop\QUIZPROJECT\ESTS-QUIZ
cat render.yaml

# Commit et push
git add render.yaml python_api/
git commit -m "🚀 Configuration déploiement Render"
git push origin main
```

### Étape 2: Créer Service Render

1. **Se connecter**: https://render.com (Sign up avec GitHub)

2. **Nouveau Service Web**:
   - Dashboard → "New" → "Web Service"
   - Connect Repository: `OmarElkhali/QUIZO`
   - Autoriser Render à accéder au repo

3. **Configuration Automatique**:
   ```yaml
   ✅ Name: quizo-backend
   ✅ Region: Frankfurt (EU Central)
   ✅ Branch: main
   ✅ Root Directory: python_api
   ✅ Runtime: Python 3.11
   ✅ Build Command: pip install -r requirements.txt
   ✅ Start Command: (voir render.yaml)
   ```

4. **Variables d'Environnement** (onglet "Environment"):
   ```
   GROQ_API_KEY = gsk_your_groq_api_key_here
   CORS_ORIGINS = https://quizo.vercel.app,https://quizo-*.vercel.app
   LOG_LEVEL = INFO
   FLASK_ENV = production
   ```

5. **Santé et Monitoring**:
   - Health Check Path: `/api/health`
   - Auto-Deploy: ✅ Enabled

6. **Déployer**:
   - Click "Create Web Service"
   - Attendre 3-5 minutes (premier deploy)

### Étape 3: Vérifier Backend

```powershell
# URL backend (remplacer par votre URL Render)
$BACKEND_URL = "https://quizo-backend.onrender.com"

# Test health
Invoke-RestMethod "$BACKEND_URL/api/health" | ConvertTo-Json

# Devrait retourner:
# {
#   "status": "healthy",
#   "groq_available": true,
#   "version": "3.0"
# }
```

---

## ⚛️ DÉPLOIEMENT FRONTEND (VERCEL) {#frontend-vercel}

### Étape 1: Build Local (Test)

```powershell
# Tester build avant déploiement
cd C:\Users\SetupGame\Desktop\QUIZPROJECT\ESTS-QUIZ
npm install
npm run build

# Vérifier dossier dist/
ls dist/

# Preview local
npm run preview
# Ouvrir http://localhost:4173
```

### Étape 2: Déployer sur Vercel

#### Option A: Via Interface Web (Recommandé)

1. **Se connecter**: https://vercel.com (Sign up avec GitHub)

2. **Import Project**:
   - Dashboard → "Add New" → "Project"
   - Import Git Repository: `OmarElkhali/QUIZO`
   - Click "Import"

3. **Configuration Projet**:
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   Node Version: 18.x
   ```

4. **Variables d'Environnement** (avant deploy):
   
   Aller dans "Environment Variables" et ajouter:
   
   ```bash
   # Firebase (OBLIGATOIRE)
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=quizo-....firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=quizo-...
   VITE_FIREBASE_STORAGE_BUCKET=quizo-....appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123...
   VITE_FIREBASE_APP_ID=1:123...:web:...
   VITE_FIREBASE_MEASUREMENT_ID=G-...
   VITE_FIREBASE_DATABASE_URL=https://quizo-...-default-rtdb.firebaseio.com
   
   # Backend (remplacer par URL Render)
   VITE_BACKEND_URL=https://quizo-backend.onrender.com/api
   
   # OpenAI (Optionnel)
   VITE_OPENAI_API_KEY=sk-...
   ```

5. **Déployer**:
   - Click "Deploy"
   - Attendre 2-3 minutes
   - URL: `https://quizo-<random>.vercel.app`

#### Option B: Via CLI Vercel

```powershell
# Installer CLI
npm i -g vercel

# Login
vercel login

# Déployer
cd C:\Users\SetupGame\Desktop\QUIZPROJECT\ESTS-QUIZ
vercel

# Suivre instructions
# Premier deploy → Preview
# vercel --prod → Production
```

### Étape 3: Configuration Domaine (Optionnel)

1. **Domaine Personnalisé**:
   - Vercel Dashboard → Project → Settings → Domains
   - Add Domain: `quizo.votredomaine.com`
   - Configurer DNS (A record ou CNAME)

2. **Mise à Jour CORS Backend**:
   ```
   # Sur Render, ajouter dans CORS_ORIGINS:
   https://quizo.votredomaine.com
   ```

---

## 🔥 CONFIGURATION FIREBASE {#firebase}

### Étape 1: Activer Services Firebase

1. **Console Firebase**: https://console.firebase.google.com

2. **Authentication**:
   - Build → Authentication → Get Started
   - Sign-in method → Email/Password → Enable
   - Ajouter domaines autorisés:
     - `quizo.vercel.app`
     - `quizo-*.vercel.app` (preview deployments)

3. **Firestore Database**:
   - Build → Firestore Database → Create Database
   - Mode: Production
   - Location: europe-west1 (Belgique)
   - Règles (temporaire, à sécuriser):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

4. **Storage**:
   - Build → Storage → Get Started
   - Règles:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /quiz-files/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth.uid == userId;
       }
     }
   }
   ```

5. **Realtime Database** (pour competitions live):
   - Build → Realtime Database → Create Database
   - Location: europe-west1
   - Mode: Locked (puis configurer règles)
   - Règles:
   ```json
   {
     "rules": {
       "competitions": {
         "$competitionId": {
           ".read": true,
           ".write": "auth != null"
         }
       }
     }
   }
   ```

### Étape 2: Récupérer Configuration

1. **Project Settings** → "Your apps" → Web app
2. Copier les clés `firebaseConfig`
3. Les ajouter dans Vercel Environment Variables

---

## 🔐 VARIABLES D'ENVIRONNEMENT COMPLÈTES {#variables}

### Backend (Render)

| Variable | Valeur | Type | Obligatoire |
|----------|--------|------|-------------|
| `GROQ_API_KEY` | `gsk_...` | Secret | ✅ Oui |
| `CORS_ORIGINS` | `https://quizo.vercel.app` | Config | ✅ Oui |
| `LOG_LEVEL` | `INFO` | Config | Non |
| `FLASK_ENV` | `production` | Config | Non |
| `GEMINI_API_KEY` | `AIza...` | Secret | Non (fallback) |
| `CHATGPT_API_KEY` | `sk-...` | Secret | Non (fallback) |

### Frontend (Vercel)

| Variable | Exemple | Obligatoire |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | `https://quizo-backend.onrender.com/api` | ✅ Oui |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | ✅ Oui |
| `VITE_FIREBASE_AUTH_DOMAIN` | `quizo-xyz.firebaseapp.com` | ✅ Oui |
| `VITE_FIREBASE_PROJECT_ID` | `quizo-xyz` | ✅ Oui |
| `VITE_FIREBASE_STORAGE_BUCKET` | `quizo-xyz.appspot.com` | ✅ Oui |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | ✅ Oui |
| `VITE_FIREBASE_APP_ID` | `1:123...` | ✅ Oui |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-ABC123` | Non |
| `VITE_FIREBASE_DATABASE_URL` | `https://quizo-xyz-rtdb.firebaseio.com` | ✅ Oui (pour live) |
| `VITE_OPENAI_API_KEY` | `sk-...` | Non |

---

## ✅ VÉRIFICATION ET TESTS {#tests}

### Checklist Post-Déploiement

```powershell
# Script de test automatique
$FRONTEND_URL = "https://quizo-<votre-url>.vercel.app"
$BACKEND_URL = "https://quizo-backend.onrender.com"

Write-Host "🧪 Tests de Déploiement QUIZO" -ForegroundColor Cyan

# Test 1: Backend Health
Write-Host "`n1️⃣ Backend Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "$BACKEND_URL/api/health"
    Write-Host "✅ Backend OK: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Fail: $_" -ForegroundColor Red
}

# Test 2: Frontend Loading
Write-Host "`n2️⃣ Frontend Loading..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest $FRONTEND_URL -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend OK (200)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend Fail: $_" -ForegroundColor Red
}

# Test 3: CORS
Write-Host "`n3️⃣ CORS Configuration..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = $FRONTEND_URL
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest "$BACKEND_URL/api/health" -Headers $headers -UseBasicParsing
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    Write-Host "✅ CORS OK: $corsHeader" -ForegroundColor Green
} catch {
    Write-Host "⚠️ CORS Warning: $_" -ForegroundColor Yellow
}

# Test 4: Groq API
Write-Host "`n4️⃣ Groq API Test..." -ForegroundColor Yellow
try {
    $body = @{
        text = "Test question"
        numQuestions = 2
        difficulty = "easy"
        model = "groq"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod "$BACKEND_URL/api/generate" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 60
    
    Write-Host "✅ Groq OK: $($response.questions.Count) questions" -ForegroundColor Green
} catch {
    Write-Host "❌ Groq Fail: $_" -ForegroundColor Red
}

Write-Host "`n🎉 Tests Terminés!" -ForegroundColor Cyan
```

### Tests Manuels

1. **Authentification**:
   - Ouvrir `https://quizo-<votre-url>.vercel.app`
   - Créer compte
   - Se connecter
   - Se déconnecter

2. **Création Quiz**:
   - Upload fichier PDF
   - Générer questions (vérifier 30 questions)
   - Sauvegarder quiz

3. **Partage**:
   - Ouvrir quiz sauvegardé
   - Click "Partager"
   - Tester QR code
   - Tester email
   - Tester réseaux sociaux

4. **Compétition**:
   - Créer compétition
   - Rejoindre avec code
   - Participer
   - Voir résultats

---

## 🔧 DÉPANNAGE {#troubleshooting}

### Problème 1: Backend Timeout Render (503)

**Symptôme**: "Service Unavailable" après 15min inactivité

**Cause**: Plan gratuit Render met service en veille

**Solutions**:

```powershell
# Solution A: Ping automatique (cron externe)
# Utiliser cron-job.org ou UptimeRobot
# URL à pinger: https://quizo-backend.onrender.com/api/health
# Fréquence: Toutes les 10 minutes

# Solution B: Upgrade plan Render
# Plan Starter ($7/mois) - pas de veille

# Solution C: Message utilisateur
# Ajouter dans frontend: "Première requête peut prendre 30s (backend démarrage)"
```

### Problème 2: CORS Errors

**Symptôme**: `Access-Control-Allow-Origin` error dans console

**Solution**:
```powershell
# Render Dashboard → quizo-backend → Environment
# CORS_ORIGINS = https://quizo.vercel.app,https://quizo-git-*.vercel.app

# Vérifier app.py:
# CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))
```

### Problème 3: Firebase Permission Denied

**Symptôme**: `permission-denied` lors accès Firestore

**Solution**:
```javascript
// Firebase Console → Firestore → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.ownerId;
    }
    match /competitions/{compId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Problème 4: Build Fail Vercel

**Symptôme**: "Build failed" avec erreur TypeScript

**Solution**:
```powershell
# Local check
npm run build

# Si erreurs TypeScript:
# Vérifier tsconfig.json
# Fix imports manquants
# Rebuild

# Force deploy sans cache:
# Vercel Dashboard → Deployments → Redeploy → Clear cache
```

### Problème 5: Groq API Rate Limit

**Symptôme**: `429 Too Many Requests`

**Solution**:
```python
# Backend implémente déjà retry avec backoff
# Vérifier quota: 14,400 req/jour (plan gratuit)
# Upgrade vers plan payant si besoin

# Monitoring quota:
# https://console.groq.com/usage
```

### Problème 6: Variables d'Env Non Chargées

**Symptôme**: `undefined` pour `import.meta.env.VITE_*`

**Solution**:
```powershell
# Vercel: Redeploy après ajout variables
# Vérifier prefixe VITE_ présent
# Build Command doit être: npm run build (pas vite build)

# Local test:
cp .env.example .env.production
# Remplir valeurs
npm run build -- --mode production
```

---

## 📊 MONITORING ET MAINTENANCE {#monitoring}

### Outils de Monitoring

1. **Vercel Analytics** (gratuit):
   - Dashboard → Analytics
   - Métriques: Load time, LCP, FID
   - Visiteurs en temps réel

2. **Render Metrics** (gratuit):
   - Dashboard → Metrics
   - CPU, Memory, Response time
   - Logs en temps réel

3. **Firebase Console**:
   - Usage quotas
   - Auth users count
   - Firestore read/write stats

4. **Groq Dashboard**:
   - https://console.groq.com
   - Requests quota
   - Average latency

### Logs et Debugging

```powershell
# Vercel Logs
vercel logs <deployment-url>

# Render Logs
# Dashboard → Logs (live tail)

# Firebase Logs
# Console → Functions → Logs (si Cloud Functions utilisées)
```

### Alertes Recommandées

1. **UptimeRobot** (gratuit):
   - Monitor: `https://quizo.vercel.app`
   - Monitor: `https://quizo-backend.onrender.com/api/health`
   - Alerte email si down >5min

2. **Sentry** (optionnel, error tracking):
   ```javascript
   // src/main.tsx
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: import.meta.env.MODE
   });
   ```

### Maintenance Régulière

**Hebdomadaire**:
- ✅ Vérifier logs erreurs
- ✅ Check quotas Firebase/Groq
- ✅ Tester fonctionnalités clés

**Mensuel**:
- ✅ Mettre à jour dépendances: `npm outdated`
- ✅ Review Firebase rules sécurité
- ✅ Backup Firestore (export)

**Trimestriel**:
- ✅ Audit sécurité
- ✅ Performance review
- ✅ User feedback analysis

---

## 🚀 DÉPLOIEMENT CONTINU (CI/CD)

### GitHub Actions (Optionnel)

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy QUIZO

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
```

### Auto-Deploy (déjà configuré)

- **Render**: Auto-deploy sur push `main` (via `render.yaml`)
- **Vercel**: Auto-deploy sur push (via GitHub integration)

---

## 📈 OPTIMISATIONS PRODUCTION

### Performance Frontend

1. **Code Splitting** (déjà configuré):
   ```typescript
   // vite.config.ts
   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'vendor': ['react', 'react-dom'],
           'firebase': ['firebase/app', 'firebase/auth'],
         }
       }
     }
   }
   ```

2. **Lazy Loading Routes**:
   ```typescript
   // src/App.tsx
   const Quiz = lazy(() => import('./pages/Quiz'));
   const Competition = lazy(() => import('./pages/Competition'));
   ```

3. **Image Optimization**:
   - Utiliser WebP format
   - Lazy load images: `<img loading="lazy" />`
   - Firebase Storage avec transformations

### Performance Backend

1. **Caching** (déjà implémenté):
   - In-memory cache (5min TTL)
   - Deduplicate identical requests

2. **Database Indexes**:
   ```javascript
   // Firestore indexes (firestore.indexes.json)
   {
     "indexes": [
       {
         "collectionGroup": "quizzes",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "ownerId", "order": "ASCENDING" },
           { "fieldPath": "createdAt", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

3. **Gunicorn Workers**:
   ```yaml
   # render.yaml - Ajuster selon trafic
   startCommand: gunicorn app:app --workers 4 --threads 2
   ```

### Sécurité Production

1. **HTTPS Forcé**: ✅ (Vercel et Render par défaut)

2. **Rate Limiting**:
   ```python
   # python_api/app.py
   from flask_limiter import Limiter
   
   limiter = Limiter(app, key_func=lambda: request.remote_addr)
   
   @app.route('/api/generate', methods=['POST'])
   @limiter.limit("10 per minute")
   def generate():
       # ...
   ```

3. **Input Validation**:
   ```python
   # Valider tous inputs utilisateur
   from bleach import clean
   
   text = clean(request.json.get('text', ''))
   ```

---

## 🎯 CHECKLIST FINALE DÉPLOIEMENT

### Avant Production

- [ ] Backend déployé sur Render avec santé ✅
- [ ] Frontend déployé sur Vercel accessible
- [ ] Firebase services activés (Auth, Firestore, Storage, Realtime)
- [ ] Toutes variables environnement configurées
- [ ] CORS configuré correctement
- [ ] Tests manuels passés (auth, quiz, partage)
- [ ] Tests automatiques passés (health, generate)
- [ ] Monitoring configuré (UptimeRobot)
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Logs vérifiés sans erreurs critiques

### Après Premier Déploiement

- [ ] Backup Firestore configuré
- [ ] Analytics activées (Vercel, Firebase)
- [ ] Documentation mise à jour
- [ ] README avec nouvelles URLs
- [ ] Équipe/utilisateurs notifiés
- [ ] Guide utilisateur publié
- [ ] Support/feedback channel créé

---

## 📞 RESSOURCES ET SUPPORT

### Documentation Officielle

- **Vercel**: https://vercel.com/docs
- **Render**: https://render.com/docs
- **Firebase**: https://firebase.google.com/docs
- **Groq**: https://console.groq.com/docs
- **Vite**: https://vitejs.dev/guide/

### Support Communauté

- **GitHub Issues**: https://github.com/OmarElkhali/QUIZO/issues
- **Discord Render**: https://render.com/community
- **Stack Overflow**: Tag `firebase` `vercel` `render`

### Contacts Urgents

- **Render Status**: https://status.render.com
- **Vercel Status**: https://www.vercel-status.com
- **Firebase Status**: https://status.firebase.google.com

---

## 🎉 CONCLUSION

Votre application QUIZO est maintenant déployée en production!

**URLs de Production**:
- Frontend: `https://quizo-<random>.vercel.app`
- Backend: `https://quizo-backend.onrender.com`

**Prochaines Étapes**:
1. Configurer domaine personnalisé
2. Activer monitoring avancé
3. Implémenter analytics
4. Collecter feedback utilisateurs
5. Itérer et améliorer!

**Questions?** Consultez les sections Dépannage et Support ci-dessus.

---

_Généré le 23 Novembre 2025 - Version 3.0_  
_Maintenu par: Omar Elkhali_
