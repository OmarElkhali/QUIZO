# 🔧 FIX TIMEOUT GUNICORN SUR RENDER

## Le Problème
```
[CRITICAL] WORKER TIMEOUT (pid:83)
[ERROR] Worker (pid:83) was sent SIGKILL! Perhaps out of memory?
```

**Cause** : Le worker Gunicorn a un timeout de **30 secondes par défaut**, mais Gemini prend **40-60 secondes** pour générer 10 questions complexes.

## Solution : Augmenter le timeout Gunicorn à 180 secondes

### Option 1 : Via Render Dashboard (RAPIDE - 2 minutes)

1. **Allez sur Render** : https://dashboard.render.com/
2. **Sélectionnez votre service** `quizo-nued` (backend Python)
3. **Cliquez sur "Settings"** dans le menu de gauche
4. **Trouvez "Build & Deploy"** > **"Start Command"**
5. **Remplacez** la commande actuelle par :
   ```bash
   gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 180 --max-requests 1000 --max-requests-jitter 50
   ```

6. **Cliquez sur "Save Changes"**
7. **Redéployez** : Le service redémarre automatiquement (≈ 60 secondes)

### Option 2 : Via render.yaml (AUTOMATIQUE - déjà configuré)

Le fichier `render.yaml` est déjà à jour avec `--timeout 120`. Pour que Render l'utilise automatiquement :

1. **Supprimez le service actuel** sur Render Dashboard (⚠️ sauvegardez vos variables d'environnement)
2. **Créez un nouveau service** via "Blueprint" :
   - Repository : `OmarElkhali/QUIZO`
   - Branch : `main`
   - Blueprint : `render.yaml`
3. **Ajoutez vos variables d'environnement** (CORS_ORIGINS, GEMINI_API_KEY, etc.)
4. **Déployez**

## Explication des paramètres

```bash
gunicorn app:app \
  --bind 0.0.0.0:$PORT \         # Écoute sur le port Render
  --workers 2 \                   # 2 workers pour Free tier (512 MB RAM)
  --timeout 180 \                 # ⭐ Timeout de 180 secondes (3 minutes)
  --max-requests 1000 \           # Redémarre worker après 1000 requêtes (évite memory leaks)
  --max-requests-jitter 50        # Ajoute un délai aléatoire pour éviter tous les workers redémarrent en même temps
```

### Pourquoi 180 secondes ?
- Gemini API : **40-60 secondes** pour 10 questions complexes
- Network latency : **5-10 secondes**
- Parsing/Validation : **5-10 secondes**
- **Total** : ≈ 60-80 secondes → **180 secondes** = marge de sécurité confortable

## Problème ChatGPT (bonus)

```
2025-10-31 11:28:14 - app - ERROR - Erreur lors de l'appel à l'API ChatGPT: 401 Client Error: Unauthorized
```

Votre clé ChatGPT n'est pas valide. **Solutions** :

### A. Si vous avez une clé valide :
1. Allez sur Render Dashboard > Environment
2. Vérifiez que `CHATGPT_API_KEY` est bien configurée
3. Format attendu : `sk-proj-...` (commence par `sk-`)
4. Testez la clé sur https://platform.openai.com/api-keys

### B. Si vous n'avez pas de clé ChatGPT :
**Rien à faire** ! Le système utilise automatiquement Gemini comme fallback. ChatGPT est **optionnel**.

Pour désactiver les messages d'erreur ChatGPT, retirez `CHATGPT_API_KEY` de vos variables d'environnement Render.

## Vérification après déploiement

1. **Attendez 60 secondes** que Render redémarre
2. **Testez** sur https://quizo-ruddy.vercel.app
3. **Uploadez un PDF** et générez 10 questions
4. **Vérifiez les logs Render** : plus de `WORKER TIMEOUT` ! ✅

## Monitoring

Surveillez les logs Render pendant 24h pour confirmer :
```bash
# Logs normaux attendus :
2025-10-31 XX:XX:XX - app - INFO - Utilisation de l'API Gemini avec le SDK officiel
2025-10-31 XX:XX:XX - app - INFO - Envoi de la requête à Gemini...
# ... 40-60 secondes plus tard ...
2025-10-31 XX:XX:XX - app - INFO - Questions générées avec succès
127.0.0.1 - - [...] "POST /api/generate HTTP/1.1" 200 XXXX
```

**Pas de WORKER TIMEOUT = problème résolu !** 🎉

---

**Temps estimé** : 2 minutes (Option 1) ou 10 minutes (Option 2)  
**Coût** : 0€ (changement de configuration uniquement)
