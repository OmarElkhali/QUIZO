# 🚀 Guide de démarrage rapide - LLM Local avec Ollama

Ce guide vous aide à configurer un LLM local (Qwen, Llama, Mistral) pour QUIZO en 10 minutes.

## ✅ Étape 1 : Installer Ollama (5 minutes)

### Windows

```powershell
# Option 1 : Téléchargement direct
# Allez sur https://ollama.com/download et téléchargez l'installateur Windows

# Option 2 : Avec winget
winget install Ollama.Ollama
```

Après installation, **redémarrez votre ordinateur** pour que Ollama démarre automatiquement.

### Vérifier l'installation

```powershell
# Ouvrir PowerShell et taper :
ollama --version

# Devrait afficher : ollama version is 0.x.x
```

---

## ✅ Étape 2 : Télécharger un modèle (5 minutes)

### Modèle recommandé pour démarrer : Qwen 2.5 (7B)

```powershell
# Télécharger Qwen 2.5 - Excellent pour le français
ollama pull qwen2.5:7b

# ⏳ Cela prendra 5-10 minutes (télécharge ~4.7 GB)
```

### Autres options selon votre matériel

```powershell
# PC modeste (8GB RAM, pas de GPU) :
ollama pull phi3:mini          # Léger (2.3 GB)

# PC puissant (16GB+ RAM, bon GPU) :
ollama pull qwen2.5:14b        # Meilleure qualité (8.5 GB)

# Alternative française excellente :
ollama pull mistral:7b         # Rapide et performant (4.1 GB)
```

### Vérifier les modèles téléchargés

```powershell
ollama list

# Affiche les modèles disponibles
```

---

## ✅ Étape 3 : Tester Ollama (2 minutes)

### Test interactif

```powershell
ollama run qwen2.5:7b

# Dans le chat qui s'ouvre, demander :
# "Génère une question QCM en français sur Firebase avec 4 options"

# Pour quitter : /bye
```

### Test de l'API

```powershell
# Vérifier que l'API fonctionne
curl http://localhost:11434/api/tags

# Devrait retourner la liste des modèles en JSON
```

---

## ✅ Étape 4 : Configurer QUIZO (1 minute)

### Créer/modifier le fichier `.env`

Dans le dossier `python_api/`, créez ou éditez `.env` :

```bash
# Configuration Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Vos autres clés API (optionnelles)
GEMINI_API_KEY=votre_clé_si_vous_en_avez_une
CHATGPT_API_KEY=votre_clé_si_vous_en_avez_une
```

### Frontend `.env`

Dans le dossier racine, créez ou éditez `.env` :

```bash
VITE_BACKEND_URL=http://localhost:5001/api
VITE_LOCAL_LLM_URL=http://localhost:11434
```

---

## ✅ Étape 5 : Tester avec QUIZO

### Démarrer le backend Flask

```powershell
cd python_api
python app.py

# Devrait afficher :
# INFO - Ollama configuré sur: http://localhost:11434 avec modèle par défaut: qwen2.5:7b
# INFO - Démarrage du serveur Flask sur le port 5001
```

### Tester le service Ollama Python

```powershell
# Dans le dossier python_api
python ollama_service.py

# Devrait afficher :
# ✅ Ollama est disponible!
# 📦 Modèles disponibles: qwen2.5:7b
# ✅ 2 questions générées avec succès!
```

### Utiliser dans l'interface QUIZO

1. Ouvrir QUIZO dans le navigateur
2. Aller sur la page "Créer un Quiz"
3. Uploader un fichier PDF/DOCX
4. Dans "Type de modèle", sélectionner **"LLM Local"**
5. Sélectionner votre modèle (ex: qwen2.5:7b)
6. Cliquer sur "Générer le Quiz"

---

## 🔧 Dépannage

### Problème : "Ollama n'est pas disponible"

```powershell
# Solution 1 : Vérifier qu'Ollama tourne
Get-Process ollama

# Si rien n'apparaît, démarrer Ollama manuellement :
ollama serve

# Ensuite dans un autre terminal :
ollama list
```

### Problème : "Le modèle qwen2.5:7b n'est pas disponible"

```powershell
# Vérifier les modèles téléchargés
ollama list

# Si vide, télécharger :
ollama pull qwen2.5:7b
```

### Problème : Génération trop lente

```powershell
# Solution 1 : Utiliser un modèle plus petit
ollama pull phi3:mini
ollama run phi3:mini

# Solution 2 : Vérifier l'utilisation du GPU (NVIDIA)
nvidia-smi   # Doit montrer "ollama" dans les processus

# Solution 3 : Réduire le texte source
# Dans QUIZO, uploader des fichiers plus petits (<5 pages)
```

### Problème : Erreur de mémoire

```powershell
# Solution : Utiliser un modèle plus léger
ollama pull phi3:mini   # Nécessite seulement 4GB RAM

# Ou fermer les autres applications
# Chrome, VSCode, etc.
```

---

## 📊 Comparaison de performance

Testé sur un PC avec **16GB RAM, RTX 3060 (12GB VRAM)** :

| Modèle | Temps/question | Qualité | RAM utilisée |
|--------|---------------|---------|--------------|
| qwen2.5:7b | ~8s | ⭐⭐⭐⭐⭐ | 6 GB |
| qwen2.5:14b | ~15s | ⭐⭐⭐⭐⭐ | 10 GB |
| llama3.1:8b | ~10s | ⭐⭐⭐⭐ | 7 GB |
| mistral:7b | ~7s | ⭐⭐⭐⭐⭐ | 6 GB |
| phi3:mini | ~4s | ⭐⭐⭐ | 3 GB |
| **Gemini API** | ~5s | ⭐⭐⭐⭐⭐ | 0 GB |

---

## 🎯 Utilisation avancée

### Télécharger plusieurs modèles

```powershell
# Avoir le choix selon vos besoins
ollama pull qwen2.5:7b      # Qualité
ollama pull phi3:mini       # Vitesse
ollama pull mistral:7b      # Équilibre
```

### Changer de modèle dans QUIZO

1. Backend : modifier `OLLAMA_MODEL` dans `.env`
2. Frontend : sélectionner dans le dropdown "Modèle Local"
3. Les modèles sont auto-détectés depuis Ollama

### Optimiser pour production

```bash
# .env pour production
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
LOG_LEVEL=WARNING   # Moins de logs
```

---

## 🎉 Félicitations !

Vous avez maintenant un LLM **100% gratuit et privé** pour QUIZO !

### Avantages :
- ✅ **Gratuit** : Pas de coûts d'API
- ✅ **Privé** : Vos données restent locales
- ✅ **Illimité** : Générez autant de quiz que vous voulez
- ✅ **Hors ligne** : Fonctionne sans Internet (après téléchargement)

### Prochaines étapes :
- Tester différents modèles pour trouver le meilleur pour vous
- Créer des quiz sur vos cours
- Partager avec vos étudiants
- Contribuer au projet QUIZO sur GitHub

---

## 📚 Ressources

- **Ollama** : https://ollama.com
- **Qwen Models** : https://huggingface.co/Qwen
- **Mistral** : https://mistral.ai
- **Llama** : https://ai.meta.com/llama

## 💬 Support

Si vous rencontrez des problèmes :
1. Vérifier la section [Dépannage](#-dépannage) ci-dessus
2. Consulter les logs : `python_api/app.py` affiche des messages détaillés
3. Ouvrir une issue sur GitHub

---

**Bon quiz ! 🎓**
