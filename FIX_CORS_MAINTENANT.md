# 🚨 FIX CORS URGENT - À FAIRE MAINTENANT

## Le Problème
Votre backend Render répond correctement (200 OK), mais le **navigateur bloque la réponse** car l'origine `https://quizo-ruddy.vercel.app` n'est pas autorisée dans CORS.

## La Solution (5 minutes)

### Étape 1 : Aller sur Render Dashboard
1. Ouvrez : https://dashboard.render.com/
2. Connectez-vous avec votre compte
3. Cliquez sur votre service **quizo-nued** (celui qui héberge le backend Python)

### Étape 2 : Configurer CORS_ORIGINS
1. Dans le menu de gauche, cliquez sur **"Environment"**
2. Cherchez la variable `CORS_ORIGINS` (si elle n'existe pas, cliquez sur **"Add Environment Variable"**)
3. Mettez cette valeur EXACTE :
   ```
   https://quizo-ruddy.vercel.app,http://localhost:5173,http://localhost:8080
   ```
   ⚠️ **IMPORTANT** : 
   - PAS d'espace après les virgules
   - PAS de slash `/` à la fin des URLs
   - HTTPS pour Vercel, HTTP pour localhost

4. Cliquez sur **"Save Changes"**

### Étape 3 : Attendre le redéploiement
- Render va automatiquement redémarrer votre service (≈ 30-60 secondes)
- Vous verrez "Build in progress..." puis "Live"

### Étape 4 : Tester
1. Retournez sur https://quizo-ruddy.vercel.app
2. Essayez de créer un quiz avec un fichier PDF
3. Ouvrez la console (F12) et vérifiez qu'il n'y a plus d'erreur CORS

## Vérification Rapide

Si vous voulez vérifier que CORS est bien configuré, ouvrez la console de votre navigateur et exécutez :

```javascript
fetch('https://quizo-nued.onrender.com/api/health', {
  method: 'GET',
  headers: { 'Origin': 'https://quizo-ruddy.vercel.app' }
})
.then(r => r.json())
.then(data => console.log('✅ CORS OK:', data))
.catch(e => console.error('❌ CORS KO:', e))
```

Si vous voyez `✅ CORS OK`, c'est bon !

## Pourquoi ce problème ?

Le backend Flask utilise `flask-cors` qui lit la variable `CORS_ORIGINS`. Sans cette configuration, seul `localhost` est autorisé. Votre frontend Vercel est considéré comme une "origine étrangère" et est bloqué par la politique de sécurité du navigateur.

---

**Temps estimé : 5 minutes**
**Coût : 0€** (changement de configuration uniquement)
