# QUIZO — Plateforme de Quiz (IA & Manuel)

> Crée des quiz **avec l’IA** (Gemini / OpenAI) **ou manuellement**, partage-les via **code d’accès**, lance des **compétitions en temps réel** et suis les **analyses** — le tout dans une application moderne, rapide et sécurisée.

![Status](https://img.shields.io/badge/status-active-success)
![Frontend](https://img.shields.io/badge/React-TypeScript-3178C6)
![Backend](https://img.shields.io/badge/Flask-Python-3776AB)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28)
![License](https://img.shields.io/badge/license-MIT-black)

---

## ✨ Fonctionnalités

- **Deux modes de création**
  - **Génération IA** (Gemini / OpenAI) : QCM, explications, difficulté, limite de temps.
  - **Builder manuel** : questions à la main (4 options, 1 réponse correcte), explication optionnelle.
- **Partage & compétition**
  - Rejoindre via **code** (ex. `QUIZO-8F2KQZ`) et concourir en **temps réel**.
- **Classement live**
  - Leaderboard en direct (score, temps total) via Firestore `onSnapshot`.
- **Résultats & analytics**
  - Score final, détails par question, temps, export **CSV**.
- **Auth & sécurité**
  - Firebase Auth (email/mot de passe), règles Firestore strictes, rôles basiques.
- **UX moderne**
  - React + Vite + Tailwind + shadcn-ui + Framer Motion.

> ℹ️ Sur Render **Free**, l’API Flask peut **se mettre en veille** après ~15 min d’inactivité (première requête plus lente).

---

## 🔗 Liens

- **Démo :** _à renseigner_
- **Documentation rapide :** _à renseigner_
- **Backend base URL :** _à renseigner_

---

## 🧱 Stack technique

**Frontend :** React, TypeScript, Vite, Tailwind CSS, shadcn-ui, React Router, Framer Motion, Axios  
**Backend :** Python, Flask  
**Cloud :** Firebase (Auth, Firestore, Storage)  
**IA :** Google Gemini, OpenAI (optionnel)  
**Déploiement :** Firebase Hosting / Render

---

## 🗂️ Structure (exemple)

QUIZO/
├─ frontend/ # App React + TS + Vite
│ ├─ src/
│ │ ├─ pages/ # CreateManualQuiz, Builder, Play, Leaderboard, Dashboard
│ │ ├─ components/ # UI (shadcn)
│ │ ├─ hooks/ lib/ services/ # Clients Firebase/HTTP, helpers
│ │ └─ main.tsx, App.tsx, ...
│ └─ vite.config.ts, tsconfig.json, ...
│
├─ backend/ # API Flask
│ ├─ app.py # routes: manual quizzes, join, attempts, finish
│ └─ requirements.txt, ...
│
├─ firestore/
│ ├─ firestore.rules
│ └─ firestore.indexes.json
└─ README.md

markdown
Copy code

---

## 🧩 Modèle de données (Firestore)

- `/users/{uid}`
- `/quizzes/{quizId}` → `ownerId`, `title`, `description`, `mode:"ai"|"manual"`, `visibility:"private"|"by_code"`, `isActive`, `timeLimitSec?`, `shareCode`, `createdAt`, `updatedAt`, `stats:{questionsCount, plays, avgScore}`
  - `/questions/{questionId}` → `text`, `options[4]`, `correctIndex`, `explanation?`, `difficulty?`, `order`
- `/competitions/{compId}` → `quizId`, `ownerId`, `shareCode`, `isActive`, `startedAt`, `endedAt?`
  - `/participants/{uid}` → `userId`, `displayName`, `joinedAt`, `lastActivityAt`, `score`, `totalTimeSec`, `finished`
- `/attempts/{attemptId}` → `quizId`, `userId`, `competitionId?`, `startedAt`, `finishedAt?`, `score`, `totalTimeSec`, `answers:[{questionId, selectedIndex, correct, elapsedMs}]`

**Indexes recommandés**
- `quizzes.shareCode` (unique)
- `competitions.shareCode`
- `competitions.quizId`
- `participants` trié par `score desc, totalTimeSec asc`

---

## 🔐 Extrait de règles Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signed() { return request.auth != null; }
    function isOwner(d) { return signed() && d.ownerId == request.auth.uid; }
    function isCollab(d) {
      return signed() && (
        (d.collaborators is list && request.auth.uid in d.collaborators) ||
        (d.collaborators is map && d.collaborators[request.auth.uid] == true)
      );
    }
    function same(field) { return request.method=='create' || request.resource.data[field]==resource.data[field]; }

    match /quizzes/{qid} {
      allow read: if signed() && (isOwner(resource.data) || isCollab(resource.data) || resource.data.visibility=="by_code");
      allow create: if signed()
        && request.resource.data.ownerId == request.auth.uid
        && (request.resource.data.mode in ['ai','manual'])
        && (request.resource.data.visibility in ['private','by_code']);
      allow update, delete: if signed() && isOwner(resource.data) && same('ownerId');

      match /questions/{qid2} {
        allow read: if signed();
        allow create, update, delete: if signed()
          && isOwner(get(/databases/$(db)/documents/quizzes/$(qid)).data);
      }
    }

    match /competitions/{cid} {
      allow read: if true;
      allow create, update, delete: if signed()
        && isOwner(request.resource.data);
      match /participants/{uid} {
        allow read: if true;
        allow create: if signed() && request.resource.data.userId == request.auth.uid;
        allow update: if signed() && resource.data.userId == request.auth.uid;
      }
    }

    match /attempts/{aid} {
      allow create: if signed() && request.resource.data.userId == request.auth.uid;
      allow read: if signed() && (
        resource.data.userId == request.auth.uid ||
        isOwner(get(/databases/$(db)/documents/quizzes/$(resource.data.quizId)).data)
      );
      allow update: if signed() && resource.data.userId == request.auth.uid;
    }
  }
}
```
##⚙️ Installation & démarrage
1) Prérequis
Node ≥ 18, pnpm/yarn/npm

Python ≥ 3.10

Projet Firebase (Firestore activé)

Clés IA optionnelles (Gemini / OpenAI)

2) Frontend
bash
Copy code
cd frontend
cp .env.example .env   # renseigner les clés Firebase + VITE_BACKEND_URL
pnpm i
pnpm dev
.env.example (frontend)

ini
Copy code
VITE_BACKEND_URL=http://localhost:5001
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
3) Backend (Flask)
bash
Copy code
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # renseigner clés/vars
flask run -p 5001
.env.example (backend)

ini
Copy code
OPENAI_API_KEY=
GEMINI_API_KEY=
FIREBASE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json  # si Admin SDK
CORS_ORIGINS=http://localhost:5173
##🛣️ API minimale
css
Copy code
POST /api/manual-quizzes
  body: { title, description, timeLimitSec?, visibility }
  -> { quizId, shareCode, compId }

POST /api/quizzes/:quizId/questions
  body: { text, options[4], correctIndex, explanation?, difficulty?, order }

POST /api/competitions/join
  body: { shareCode } -> { compId, quizId }

POST /api/attempts/start
  body: { quizId, competitionId? } -> { attemptId }

POST /api/attempts/:attemptId/answer
  body: { questionId, selectedIndex, elapsedMs }

POST /api/attempts/:attemptId/finish
  -> { score, totalTimeSec }
##🧠 Architecture (Mermaid)
mermaid
Copy code
flowchart LR
  A[User (Browser)] --Auth/RT--> B[Firebase Auth/Firestore]
  A -- HTTP --> C[Flask API]
  C -- read/write --> B
  C -- IA calls --> D[(Gemini / OpenAI)]
  B <-onSnapshot-> A
##🖼️ Captures d’écran
Placez vos images dans frontend/public/ ou docs/ puis référencez-les ici :
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/9652cfd6-7bfc-491c-a799-dfcde7128c8c" />


md
Copy code
![Leaderboard](docs/leaderboard.png)
##📈 Conseils perf & coûts
Utiliser onSnapshot uniquement sur les écrans actifs (unsubscribe à l’unmount).

Paginer le leaderboard (limit(100)), garder des documents petits et plats.

Grouper les écritures : mettre à jour participants aux checkpoints + fin, pas à chaque clic.

Attendre un cold start possible du backend en Free.

##🧪 Tests
Unit tests (hooks/services), tests de composants (flux Play).

Emulator Suite pour valider les règles Firestore (rules-unit-testing).

Petit test de charge (ex. autocannon) sur un endpoint de santé.

##🗺️ Roadmap
Banques de questions & tags

Équipes & tournois multi-manches

Analyse d’items (indices de difficulté/discrimination)

LLM pour distracteurs & contrôle qualité

Mode hors-ligne (PWA) pour jouer

##🤝 Contribuer
Les PRs sont les bienvenues :

Commits conventionnels (feat:, fix:, …)

Lint/tests avant soumission

Fonctions courtes, typées, testables

##📜 Licence
MIT — © Omar Elkhali

makefile
Copy code
::contentReference[oaicite:0]{index=0}
