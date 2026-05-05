# QUIZO Local Setup

## Prerequisites

- Node.js 20+
- Python 3.11+
- Firebase project with Auth/Firestore enabled
- Optional provider keys: Gemini, OpenRouter, Groq, Qwen
- Optional local Ollama on `http://localhost:11434`

## Install

```powershell
npm install
python -m venv python_api/.venv
python_api/.venv/Scripts/pip.exe install -r python_api/requirements.txt
```

## Environment

Create `.env` from `.env.example` and `python_api/.env` from `python_api/.env.example`.

Use placeholders in example files only. Put real values only in ignored local `.env` files.

Required frontend variables:

- `VITE_BACKEND_URL=http://localhost:5000/api`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- Supabase public URL/key if uploads are enabled

Required backend variables:

- `GEMINI_API_KEY` for the default production provider
- `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `QWEN_API_KEY` as optional fallbacks
- `OLLAMA_BASE_URL=http://localhost:11434` for local models
- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080`
- `MAX_UPLOAD_SIZE_MB=10`
- `MAX_AI_QUESTIONS_PER_QUIZ=20`

## Run Locally

```powershell
npm run dev:full
```

Or run separately:

```powershell
npm run dev
python_api/.venv/Scripts/python.exe python_api/app.py
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000/api/health`

## Verify

```powershell
npm run typecheck
npm run build
python_api/.venv/Scripts/python.exe -m py_compile python_api/app.py
python_api/.venv/Scripts/python.exe python_api/test_ai_providers.py
```

Provider smoke tests never print keys. Missing providers should return clean fallback behavior instead of breaking the app.
