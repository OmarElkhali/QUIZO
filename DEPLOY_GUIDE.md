# 🚀 Guide de Déploiement Complet - QUIZO v3.0

Ce guide vous explique étape par étape comment déployer l'application **QUIZO** (Frontend React sur Vercel et Backend Flask sur Render).

---

## 1. 🖥️ Déploiement du Frontend (Vercel)

Le frontend est construit avec **Vite + React + TypeScript** et est 100% serverless, s'appuyant sur Firebase.

### Étapes de déploiement :
1. Créez un compte sur [Vercel](https://vercel.com/) si ce n'est pas déjà fait.
2. Connectez votre dépôt GitHub à Vercel.
3. Importez le projet `ESTS-QUIZ`.
4. Configurez les paramètres du projet :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
5. Configurez les **Variables d'environnement** dans Vercel :
   - `VITE_BACKEND_URL` : URL de votre API backend déployée (ex: `https://quizo-api.onrender.com/api`)
   - `VITE_FIREBASE_API_KEY` : Clé API Firebase
   - `VITE_FIREBASE_AUTH_DOMAIN` : Domaine Firebase Auth
   - `VITE_FIREBASE_PROJECT_ID` : ID du projet Firebase
   - `VITE_FIREBASE_STORAGE_BUCKET` : Bucket de stockage Firebase
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` : ID de messagerie Firebase
   - `VITE_FIREBASE_APP_ID` : ID de l'application Firebase
   - `VITE_FIREBASE_MEASUREMENT_ID` : (Optionnel) ID Analytics
6. Cliquez sur **Deploy**.

---

## 2. 🐍 Déploiement du Backend (Render)

Le backend est un serveur Flask Python qui gère l'extraction de texte et la génération de QCM par IA (Gemini, Groq, OpenRouter).

### Étapes de déploiement :
1. Créez un compte sur [Render](https://render.com/).
2. Créez un nouveau **Web Service**.
3. Associez votre dépôt GitHub.
4. Renseignez les paramètres suivants :
   - **Name** : `quizo-api`
   - **Root Directory** : `python_api` (très important !)
   - **Language** : `Python 3`
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `gunicorn app:app`
5. Configurez les **Variables d'environnement** dans Render :
   - `FLASK_ENV` : `production`
   - `CORS_ORIGINS` : URL de votre frontend Vercel (ex: `https://quizo.vercel.app`)
   - `GEMINI_API_KEY` : Votre clé API Google Gemini
   - `GROQ_API_KEY` : (Optionnel) Votre clé API Groq
   - `OPENROUTER_API_KEY` : (Optionnel) Votre clé API OpenRouter
   - `LOG_LEVEL` : `INFO`
6. Cliquez sur **Create Web Service**.

> [!WARNING]
> **Hébergement Render Free Tier**
> Render met le serveur en veille après 15 minutes d'inactivité. Le premier appel après une veille prend environ 50 secondes à charger (cold start). L'application frontend de QUIZO gère cela en affichant un indicateur de chargement propre et un réveil automatique.

---

## 3. 🔥 Configuration Firebase

Pour que le mode temps réel synchrone et les quizz fonctionnent, vous devez configurer votre console Firebase.

### A. Activer les modes d'authentification
1. Allez sur votre **Console Firebase** -> **Authentication** -> **Sign-in method**.
2. Activez les fournisseurs suivants :
   - **Adresse e-mail et mot de passe** (pour les créateurs de quiz).
   - **Anonyme** (obligatoire pour les participants rapides qui rejoignent par code sans créer de compte).

### B. Appliquer les Règles de Sécurité Firestore
Déployez le fichier `firestore.rules` présent à la racine du projet via la console Firebase (sélectionnez l'onglet Rules dans Firestore) ou via Firebase CLI :
```bash
firebase deploy --only firestore:rules
```

Les règles configurées dans `firestore.rules` sécurisent les quizz, les tentatives des participants et les accès temporaires.
