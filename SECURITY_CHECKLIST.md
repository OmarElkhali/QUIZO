# QUIZO Security Checklist

## Immediate Rotation Required

Credentials shown in terminal/chat output must be treated as compromised, even if they were test keys:

- GitHub personal access token previously embedded in the git remote URL
- Supabase `service_role` key
- Stripe test secret key
- Any Firebase Admin service account JSON that may have been displayed or copied outside the local machine

Rotate/revoke these in the provider dashboards before any beta launch. Do not paste the new values into chats, docs, commits, issues, or CI logs.

## Repository Rules

- Never commit `.env`, `.env.local`, `python_api/.env`, service account JSON, Firebase Admin SDK keys, API tokens, or private credentials.
- Keep `.env.example` files placeholder-only.
- Keep git remotes token-free: `git remote -v` must show `https://github.com/OmarElkhali/QUIZO.git`.
- Keep Firebase Admin credentials server-side only through environment variables such as `GOOGLE_APPLICATION_CREDENTIALS`.
- Never expose Supabase `service_role` keys in frontend code. Frontend may use only public anon/publishable keys.
- Never send provider API keys to the browser.

## Local Checks Before Commit

```powershell
git status --short
git remote -v
git ls-files | Select-String -Pattern "env$|service-account|firebase-adminsdk|serviceAccountKey"
rg -n -i "api[_-]?key|secret|service_role|firebase-adminsdk|private_key|github_pat|ghp_|sk_live|sk_test" --glob "!node_modules/**" --glob "!dist/**" --glob "!python_api/.venv/**"
```

If any real secret appears, remove it from the working tree and rotate it. If it was committed, rewrite history only after coordinating with the repository owner.

## Backend Logging

- Log provider names, status codes, and sanitized errors only.
- Do not print request payloads that may contain tokens or user secrets.
- Do not return provider stack traces to the frontend in production.
