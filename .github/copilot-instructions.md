These instructions are intended for automated coding agents (Copilot-style) that will make code changes in the QUIZO frontend repository. Keep guidance concise and only reference discoverable, authoritative sources in this repo.

1) Big picture (what this frontend does)
- This is the QUIZO React + TypeScript frontend (Vite, Tailwind, shadcn-ui). It talks to:
  - Firebase (Auth, Firestore, Storage) for realtime data and auth flows (see `src/lib/firebase.ts` and the Firestore model in `README.md`).
  - A Flask AI backend (`python_api/app.py`) hosted on Render for text extraction and LLM-based question generation. The frontend calls this backend under `/api/extract-text` and `/api/generate` (see `src/services/aiService.ts`).

2) Where to change behavior
- UI / interaction: `src/components/*` and `src/pages/*`.
- Business logic and API clients: `src/services/*` (notably `aiService.ts`, `quizService.ts`, `fileService.ts`).
- Firebase wiring: `src/lib/firebase.ts` (client initialization and export of `db`, `auth`).

3) Important conventions and patterns
- Prefer small, typed functions. Use the existing `Question` type in `src/types/quiz.ts` when producing or transforming question objects.
- Use Firestore document shapes described in `README.md` (quizzes, questions, competitions, participants, attempts). When writing to Firestore, preserve fields like `ownerId`, `shareCode`, and `visibility`.
- Error handling: many services use graceful fallbacks (see `aiService.ts` — if the Flask API is down, return Firebase backup questions silently). Preserve this user-facing resilience when modifying flows.
- Network timeouts: AI endpoints may be slow (3 minute timeout used in `aiService.ts`). Keep long timeouts for generation calls or centralize in a single utility to avoid regressions.

4) Build / run / debug notes
- Local frontend dev: use the `dev` script from `package.json` (Vite). Environment variables live in `.env` and match `README.md` (`VITE_BACKEND_URL`, Firebase vars).
- Backend (local Python dev): `python_api/app.py` is a Flask app. The README documents venv creation and `flask run -p 5001`. The frontend expects the backend on `VITE_BACKEND_URL` (default `http://localhost:5001`).
- Tests & lint: `npm run lint` is configured for the frontend. There are no automated unit tests present in the repo root; if you add tests, follow the repo's TypeScript and ESlint configuration in `package.json` and `tsconfig.*` files.

5) Integration and external dependencies
- LLMs: Gemini/OpenAI calls are proxied through the Flask backend (see `python_api/`). The frontend can optionally pass a ChatGPT API key for `chatgpt` model usage — see `aiService.generateQuestionsWithAI`.
- Firebase: reads/writes rely on client SDK v10. Follow the existing Firestore indexing expectations in `README.md` when adding queries (avoid unindexed composite queries).
- Supabase: limited integration exists under `src/integrations/supabase` — only modify if you understand its usage.

6) Examples & quick patterns to copy
- Creating graceful AI fallback (copy pattern from `src/services/aiService.ts`):
  - Check Flask `/health` endpoint first.
  - If unavailable, call `getFirebaseBackupQuestions()` and map to expected `Question` type.
- Validating generated questions (copy the validation loop): ensure `text`, `options` array, at least 2 options, and at least one `isCorrect: true`.

7) Safety and non-discoverable secrets
- **NEVER commit `.env` files or hardcode API keys.** API keys must be in environment variables only.
- Use `.env.example` as a template - copy to `.env` and fill with real values locally.
- Python backend expects: `GEMINI_API_KEY`, `CHATGPT_API_KEY`, `CORS_ORIGINS`, `LOG_LEVEL`.
- If you need to change secret handling, update `.env.example` and `python_api/.env.example` only.

8) When to open a PR vs commit directly
- If a change touches services (`src/services/*`), auth, Firestore shapes, or backend URL defaults, open a PR and include: local repro steps, a short test plan, and an explanation of whether behaviour changes are backward compatible.

If anything here is unclear or you'd like me to include other files or team conventions, tell me which area to expand and I'll iterate.
