# 🧠 QUIZO — Plateforme de Quiz Éducatif avec IA

[![CI](https://github.com/OmarElkhali/QUIZO/actions/workflows/deploy.yml/badge.svg)](https://github.com/OmarElkhali/QUIZO/actions)

Plateforme de création de quiz hybride (IA + manuel) conçue pour la compétition en temps réel.

## ✨ Fonctionnalités

- **Génération IA** — Upload un PDF/DOCX/TXT et l'IA génère des questions automatiquement
- **Création Manuelle** — Builder de quiz intuitif avec drag & drop
- **Multi-Providers IA** — Gemini, OpenRouter, Groq, Qwen, Ollama local
- **Compétitions Temps Réel** — Leaderboard live via Firestore `onSnapshot`
- **Partage par Code** — Codes de partage `QUIZO-XXXXXX` pour rejoindre un quiz
- **8 Langues** — FR, EN, ES, AR (RTL), ZH, HI, PT, DE
- **Thème Clair/Sombre** — Toggle automatique avec persistence

## 🏗️ Stack Technique

| Couche | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 5, TailwindCSS, shadcn/ui, Framer Motion |
| **Backend** | Python 3, Flask 3, Gunicorn |
| **Base de données** | Firebase Firestore |
| **Auth** | Firebase Auth (Email + Google + Anonyme) |
| **IA** | Gemini 2.5, OpenRouter, Groq, Qwen, Ollama |
| **Déploiement** | Vercel (frontend) + Render (backend) |

## 🚀 Démarrage Local

### Prérequis
- Node.js 20+
- Python 3.11+
- Compte Firebase (projet existant)

### 1. Clone et installation

```bash
git clone https://github.com/OmarElkhali/QUIZO.git
cd QUIZO
npm install
cd python_api && pip install -r requirements.txt && cd ..
```

### 2. Configuration

```bash
cp .env.example .env
# Remplissez .env avec vos clés Firebase et Supabase

cp python_api/.env.example python_api/.env
# Remplissez python_api/.env avec vos clés API IA
```

### 3. Lancez en mode local

```bash
# Frontend + Backend simultanément
npm run dev:full

# Ou séparément :
npm run dev          # Frontend → http://localhost:5173
npm run start:api    # Backend  → http://localhost:5000
```

## 📦 Scripts Disponibles

| Script | Description |
|---|---|
| `npm run dev` | Démarre le frontend Vite |
| `npm run dev:full` | Frontend + Backend simultanément |
| `npm run build` | TypeCheck + Build production |
| `npm run start:api` | Démarre le backend Flask |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm run e2e` | Tests Playwright |
| `npm run preview` | Prévisualisation du build |

## ☁️ Déploiement Production

### Frontend → Vercel
1. Connectez le repo GitHub sur [vercel.com](https://vercel.com)
2. Build command : `npm run build`
3. Output dir : `dist`
4. Ajoutez les variables `VITE_*` dans le dashboard

### Backend → Render
1. Connectez le repo GitHub sur [render.com](https://render.com)
2. Root dir : `python_api`
3. Build : `pip install -r requirements.txt`
4. Start : `gunicorn app:app --workers 2 --timeout 180`
5. Ajoutez les clés API IA dans les env vars

## 📂 Structure du Projet

```
QUIZO/
├── src/
│   ├── pages/           # 20 pages lazy-loaded
│   ├── components/      # Composants UI (shadcn + custom)
│   ├── services/        # Services métier (quiz, IA, compétition, participant)
│   ├── context/         # Auth + Quiz providers
│   ├── hooks/           # Hooks React personnalisés
│   ├── i18n/            # Traductions (8 langues)
│   ├── types/           # Interfaces TypeScript
│   └── lib/             # Firebase + utils
├── python_api/          # Backend Flask
│   ├── app.py           # API principale
│   └── requirements.txt
├── firestore.rules      # Règles de sécurité Firestore
├── vercel.json          # Config Vercel
├── render.yaml          # Config Render
└── .github/workflows/   # CI/CD
```

## 🔐 Sécurité

- Firebase Auth token verification sur tous les endpoints API
- Rate limiting (20 req/min génération, 10 req/min extraction)
- Aucune clé hardcodée — tout passe par les variables d'environnement
- Règles Firestore granulaires (owner, collaborator, participant)
- CORS configuré avec whitelist d'origines

## 📄 Licence

MIT — Omar Elkhali
