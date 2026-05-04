# 🤖 AI Providers Status — QUIZO

> Dernière vérification : 2026-05-04

## Résumé

| Provider | Status | Clé configurée | Modèle |
|---|---|---|---|
| **Gemini** | ✅ Fonctionnel | `GEMINI_API_KEY` ✅ | `gemini-2.5-flash` |
| **OpenRouter** | ⚠️ Clé expirée | `OPENROUTER_API_KEY` ❌ | `qwen/qwen3.6-flash` |
| **ChatGPT** | ❌ Non configuré | `CHATGPT_API_KEY` ❌ | `gpt-4o-mini` |
| **Groq** | ❌ Non configuré | `GROQ_API_KEY` ❌ | `qwen/qwen3-32b` |
| **Qwen** | ❌ Non configuré | `QWEN_API_KEY` ❌ | `qwen-plus` |
| **Ollama** | ❌ Non installé | N/A (local) | `qwen2.5:7b` |

---

## Détails par Provider

### Gemini — ✅ Fonctionnel (Provider Principal)
- **SDK :** `google-generativeai` v0.8.6 (fonctionne mais deprecated, migration vers `google.genai` recommandée)
- **Modèle :** `gemini-2.5-flash`
- **Clé :** Configurée dans `python_api/.env`
- **Note :** Le SDK v0.8+ affiche un avertissement de dépréciation mais fonctionne correctement

### OpenRouter — ⚠️ Clé expirée
- **Erreur :** `401 - User not found`
- **Raison :** La clé API `sk-or-v1-...` semble expirée ou révoquée
- **Pour réactiver :**
  1. Se connecter sur [openrouter.ai](https://openrouter.ai)
  2. Générer une nouvelle clé API
  3. Mettre à jour `OPENROUTER_API_KEY` dans `python_api/.env`
- **Coût estimé :** Modèles gratuits disponibles (`qwen/qwen3-4b:free`, `meta-llama/llama-3.1-8b-instruct:free`)

### ChatGPT — ❌ Non configuré
- **Pour activer :**
  1. Obtenir une clé API sur [platform.openai.com](https://platform.openai.com/api-keys)
  2. Ajouter `CHATGPT_API_KEY=sk-...` dans `python_api/.env`
- **Coût estimé :** ~$0.15 / million tokens (gpt-4o-mini)

### Groq — ❌ Non configuré
- **Pour activer :**
  1. Obtenir une clé API sur [console.groq.com](https://console.groq.com)
  2. Ajouter `GROQ_API_KEY=gsk_...` dans `python_api/.env`
- **Coût estimé :** Gratuit (tier gratuit généreux)

### Qwen Direct — ❌ Non configuré
- **Pour activer :**
  1. Obtenir une clé API sur [dashscope.aliyun.com](https://dashscope.aliyun.com)
  2. Ajouter `QWEN_API_KEY=sk-...` dans `python_api/.env`
- **Alternative :** Qwen est aussi accessible via OpenRouter (pas besoin de clé séparée)

### Ollama — ❌ Non installé
- **Pour activer :**
  1. Installer Ollama : [ollama.com/download](https://ollama.com/download)
  2. Exécuter : `ollama pull qwen2.5:7b`
  3. Lancer Ollama (tourne sur `localhost:11434`)
- **Coût :** Gratuit (exécution locale)
- **Prérequis :** GPU recommandé pour des performances acceptables

---

## Système de Fallback

Le backend QUIZO inclut un **mécanisme de fallback automatique** :
1. Si le provider demandé échoue → essaie de générer des questions localement à partir du texte source
2. Les questions fallback sont basiques mais garantissent une réponse
3. Un warning est inclus dans la réponse pour informer l'utilisateur
