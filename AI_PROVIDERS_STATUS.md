# AI Providers Status - QUIZO

Derniere verification: 2026-05-05

## Resume

| Provider | Role | Variable | Modele par defaut |
|---|---|---|---|
| Gemini | Provider production par defaut | `GEMINI_API_KEY` | `gemini-2.5-flash` |
| OpenRouter | Fallback multi-modeles | `OPENROUTER_API_KEY` | `qwen/qwen3.6-flash` |
| Groq | Fallback rapide | `GROQ_API_KEY` | `qwen/qwen3-32b` |
| Qwen | Direct ou via OpenRouter | `QWEN_API_KEY` ou `OPENROUTER_API_KEY` | `qwen-plus` |
| Ollama local | Fallback local gratuit | aucune cle | `qwen2.5:7b` |

## Fallback backend

Ordre applique par `/api/generate`:

1. Gemini
2. OpenRouter
3. Groq
4. Qwen
5. Ollama local
6. Generateur local a partir du texte extrait

Les cles restent uniquement cote backend. Les erreurs fournisseur sont sanitisees avant logs/reponses.

## Limites beta gratuite

- 20 questions IA maximum par quiz (`MAX_AI_QUESTIONS_PER_QUIZ`)
- 10 MB maximum par upload (`MAX_UPLOAD_SIZE_MB`)
- Uploads acceptes: PDF, DOCX, TXT

## Notes d'exploitation

- Gemini doit rester le provider production par defaut.
- OpenRouter peut servir Qwen si `QWEN_API_KEY` n'est pas configuree.
- Ollama ne doit jamais bloquer les autres providers s'il n'est pas lance localement.
