# ⚡ Commandes rapides - LLM Local QUIZO

## 🚀 Installation (première fois uniquement)

### Installer Ollama
```powershell
# Option 1 : Automatique (recommandé)
.\setup-ollama.ps1

# Option 2 : Avec winget
winget install Ollama.Ollama

# Option 3 : Manuel
# Aller sur https://ollama.com/download
```

### Télécharger le modèle recommandé
```powershell
ollama pull qwen2.5:7b
```

---

## 🎯 Utilisation quotidienne

### Démarrer QUIZO avec LLM local

```powershell
# Terminal 1 : Backend
cd python_api
python app.py

# Terminal 2 : Frontend
npm run dev

# Ouvrir : http://localhost:5173
```

---

## 📦 Gestion des modèles

### Lister les modèles installés
```powershell
ollama list
```

### Télécharger un modèle
```powershell
# Pour PC standard (8-16GB RAM)
ollama pull qwen2.5:7b        # 4.7 GB - Recommandé

# Pour PC modeste (4-8GB RAM)
ollama pull phi3:mini         # 2.3 GB - Léger

# Pour PC puissant (32GB+ RAM, bon GPU)
ollama pull qwen2.5:14b       # 8.5 GB - Qualité max

# Alternatives
ollama pull mistral:7b        # 4.1 GB - Rapide, excellent FR
ollama pull llama3.1:8b       # 5 GB - Multilingue
```

### Supprimer un modèle
```powershell
ollama rm qwen2.5:7b
```

### Tester un modèle interactivement
```powershell
ollama run qwen2.5:7b

# Dans le chat :
# "Génère une question QCM en français sur Firebase"

# Pour quitter : /bye
```

---

## 🧪 Tests

### Test Python du service Ollama
```powershell
cd python_api
python ollama_service.py
```

**Résultat attendu :**
```
✅ Ollama est disponible!
📦 Modèles disponibles: qwen2.5:7b
✅ 2 questions générées avec succès!
```

### Test de l'API Flask
```powershell
# Terminal 1 : Démarrer le backend
cd python_api
python app.py

# Terminal 2 : Tester l'endpoint
curl -X POST http://localhost:5001/api/generate `
  -H "Content-Type: application/json" `
  -d '{
    "text": "Firebase est une plateforme...",
    "numQuestions": 2,
    "difficulty": "easy",
    "modelType": "local",
    "localModel": "qwen2.5:7b"
  }'
```

### Vérifier l'état du service
```powershell
curl http://localhost:5001/api/health
```

**Résultat attendu :**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "services": {
    "gemini": true,
    "chatgpt": false,
    "ollama": true,
    "ollama_models": ["qwen2.5:7b"]
  }
}
```

---

## 🔧 Dépannage

### Ollama ne démarre pas
```powershell
# Vérifier si Ollama tourne
Get-Process ollama

# Si non, démarrer manuellement
ollama serve

# Dans un autre terminal, vérifier
ollama list
```

### Vérifier l'API Ollama
```powershell
curl http://localhost:11434/api/tags
```

### Réinstaller Ollama
```powershell
# Désinstaller
winget uninstall Ollama.Ollama

# Supprimer les données (optionnel)
Remove-Item -Recurse -Force "$env:USERPROFILE\.ollama"

# Réinstaller
winget install Ollama.Ollama

# Redémarrer l'ordinateur
Restart-Computer
```

### Libérer de la mémoire
```powershell
# Arrêter Ollama
Stop-Process -Name "ollama" -Force

# Redémarrer
ollama serve

# Ou redémarrer Windows
Restart-Computer
```

---

## 📊 Informations système

### Vérifier la RAM disponible
```powershell
Get-CimInstance Win32_OperatingSystem | 
  Select-Object FreePhysicalMemory, TotalVisibleMemorySize |
  Format-List
```

### Vérifier le GPU (NVIDIA)
```powershell
nvidia-smi
```

### Vérifier l'espace disque
```powershell
Get-PSDrive C | Select-Object Used, Free
```

---

## ⚙️ Configuration

### Créer/Modifier .env backend
```powershell
# Créer depuis l'exemple
cd python_api
Copy-Item .env.example .env

# Éditer
notepad .env
```

**Contenu minimal :**
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173
```

### Créer/Modifier .env frontend
```powershell
# Créer
cd ..
Copy-Item .env.example .env

# Éditer
notepad .env
```

**Ajouter :**
```bash
VITE_BACKEND_URL=http://localhost:5001/api
VITE_LOCAL_LLM_URL=http://localhost:11434
```

---

## 🎓 Scénarios d'utilisation

### Scénario 1 : Première utilisation
```powershell
# 1. Installer Ollama
.\setup-ollama.ps1

# 2. Redémarrer si demandé
Restart-Computer

# 3. Télécharger le modèle
ollama pull qwen2.5:7b

# 4. Démarrer QUIZO
cd python_api ; python app.py
# Nouveau terminal : npm run dev

# 5. Créer un quiz avec "LLM Local"
```

---

### Scénario 2 : Utilisation quotidienne
```powershell
# Vérifier qu'Ollama tourne
Get-Process ollama

# Démarrer le backend
cd python_api ; python app.py

# Démarrer le frontend (nouveau terminal)
npm run dev

# Aller sur http://localhost:5173
```

---

### Scénario 3 : Tester un nouveau modèle
```powershell
# Télécharger
ollama pull mistral:7b

# Tester interactivement
ollama run mistral:7b

# Demander : "Génère 3 questions sur la photosynthèse"

# Si bon, mettre à jour le .env
cd python_api
notepad .env
# Changer : OLLAMA_MODEL=mistral:7b

# Redémarrer le backend
```

---

### Scénario 4 : PC lent, optimiser
```powershell
# Supprimer les gros modèles
ollama rm qwen2.5:14b

# Installer le modèle léger
ollama pull phi3:mini

# Fermer les applications
# Chrome, VSCode, etc.

# Générer avec moins de questions
# Dans QUIZO : 3 questions au lieu de 10
```

---

### Scénario 5 : Erreur "modèle non trouvé"
```powershell
# Vérifier les modèles
ollama list

# Si le modèle manque, le télécharger
ollama pull qwen2.5:7b

# Vérifier le .env
cd python_api
notepad .env
# S'assurer que OLLAMA_MODEL correspond à un modèle installé

# Redémarrer le backend
```

---

## 📚 Documentation

### Guides disponibles
```powershell
# Ouvrir les guides
notepad OLLAMA_QUICKSTART.md          # Démarrage rapide
notepad LOCAL_LLM_GUIDE.md            # Guide complet
notepad LOCAL_LLM_INTEGRATION.md      # Intégration technique
notepad SUMMARY_LLM_LOCAL.md          # Résumé implémentation
notepad STUDENT_GUIDE_LLM.md          # Guide étudiant
notepad COMMANDS_QUICK_REF.md         # Ce fichier
```

---

## 🆘 Support

### Logs du backend
```powershell
# Démarrer avec plus de logs
cd python_api
$env:LOG_LEVEL="DEBUG"
python app.py

# Les logs montreront :
# - Requêtes Ollama
# - Réponses générées
# - Erreurs détaillées
```

### Vérifier les versions
```powershell
# Ollama
ollama --version

# Python
python --version

# Node.js
node --version

# npm
npm --version
```

### Nettoyer et recommencer
```powershell
# Backend
cd python_api
Remove-Item -Recurse -Force __pycache__
pip install -r requirements.txt

# Frontend
cd ..
Remove-Item -Recurse -Force node_modules
npm install

# Ollama
Stop-Process -Name "ollama" -Force
ollama serve
```

---

## 💡 Astuces

### Astuce 1 : Créer un alias pour démarrer QUIZO
```powershell
# Ajouter à votre profil PowerShell
notepad $PROFILE

# Ajouter :
function Start-Quizo {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\SetupGame\Desktop\QUIZPROJECT\ESTS-QUIZ\python_api'; python app.py"
    Start-Sleep -Seconds 2
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\SetupGame\Desktop\QUIZPROJECT\ESTS-QUIZ'; npm run dev"
}

# Utiliser :
Start-Quizo
```

---

### Astuce 2 : Automatiser le démarrage d'Ollama au démarrage
```powershell
# Créer une tâche planifiée
$action = New-ScheduledTaskAction -Execute "ollama" -Argument "serve"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "Ollama" -Action $action -Trigger $trigger

# Désactiver si nécessaire
Unregister-ScheduledTask -TaskName "Ollama" -Confirm:$false
```

---

### Astuce 3 : Monitoring du GPU pendant la génération
```powershell
# Terminal 1 : Démarrer la génération dans QUIZO

# Terminal 2 : Surveiller le GPU en temps réel
nvidia-smi -l 1

# Appuyer sur Ctrl+C pour arrêter
```

---

## 🔗 Liens utiles

- **Ollama** : https://ollama.com
- **Models** : https://ollama.com/library
- **Qwen** : https://huggingface.co/Qwen
- **Mistral** : https://mistral.ai
- **Documentation QUIZO** : https://github.com/OmarElkhali/QUIZO

---

## 📝 Notes

- Tous les modèles sont téléchargés dans : `C:\Users\<votre-nom>\.ollama\models`
- La config Ollama est dans : `C:\Users\<votre-nom>\.ollama`
- Les logs Flask sont dans la console où vous avez lancé `python app.py`

---

**Dernière mise à jour : Novembre 2025**  
**Version : 1.0**
