# 🚀 GUIDE RAPIDE DE DÉPLOIEMENT

## Déploiement en 3 Étapes

### 1. Backend (Render)

```powershell
# Connectez-vous à Render
# https://render.com

# Créer Web Service:
# - Repository: OmarElkhali/QUIZO
# - Root Directory: python_api
# - Auto-deploy: ✅ (render.yaml détecté)

# Ajouter variables d'environnement:
GROQ_API_KEY=gsk_your_groq_api_key_here
CORS_ORIGINS=https://quizo.vercel.app,https://quizo-*.vercel.app
```

### 2. Frontend (Vercel)

```powershell
# Option A: Interface Web
# https://vercel.com
# - Import Project → OmarElkhali/QUIZO
# - Framework: Vite
# - Ajouter toutes les variables VITE_* (voir .env.example)

# Option B: CLI
npm i -g vercel
vercel login
vercel --prod
```

### 3. Firebase

```
Firebase Console → https://console.firebase.google.com

1. Authentication → Enable Email/Password
2. Firestore → Create Database (europe-west1)
3. Storage → Get Started
4. Realtime Database → Create Database
5. Project Settings → Copy Firebase config → Variables Vercel
```

## Tests Rapides

```powershell
# Test automatique
.\test-deployment.ps1 -FrontendUrl "https://votre-url.vercel.app"

# Manuels
curl https://quizo-backend.onrender.com/api/health
curl https://votre-url.vercel.app
```

## Liens Utiles

- **Guide Complet**: `DEPLOY_GUIDE.md`
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com

## Support

Problème? → `DEPLOY_GUIDE.md` section "Dépannage"
