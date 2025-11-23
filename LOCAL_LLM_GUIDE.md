# Guide d'implémentation d'un LLM Local pour QUIZO

Ce guide vous montre comment implémenter un LLM open-source local (comme Qwen) pour remplacer ou compléter Gemini/ChatGPT dans votre application QUIZO.

## 📋 Table des matières

1. [Pourquoi un LLM local ?](#pourquoi-un-llm-local)
2. [Option 1 : Ollama (Recommandé)](#option-1-ollama-recommandé)
3. [Option 2 : LM Studio](#option-2-lm-studio)
4. [Option 3 : Serveur Python avec Transformers](#option-3-serveur-python-avec-transformers)
5. [Intégration dans QUIZO](#intégration-dans-quizo)

---

## Pourquoi un LLM local ?

### ✅ Avantages
- **Gratuit** : Pas de coûts d'API
- **Privé** : Vos données restent locales
- **Contrôle total** : Personnalisation complète
- **Pas de limites de taux** : Utilisez autant que vous voulez
- **Open-source** : Modèles comme Qwen, Llama, Mistral

### ❌ Inconvénients
- Nécessite plus de ressources (RAM, GPU recommandé)
- Plus lent que les API cloud (selon votre matériel)
- Configuration initiale plus complexe

### 🎯 Modèles recommandés pour QUIZO
1. **Qwen2.5-7B** - Excellent pour le français, questions QCM
2. **Llama-3.1-8B** - Très performant, multilingue
3. **Mistral-7B** - Rapide, bon en français
4. **Phi-3** - Léger, parfait pour PC modestes

---

## Option 1 : Ollama (Recommandé)

### Installation

#### Windows
```powershell
# Télécharger depuis https://ollama.com/download
# Ou avec winget
winget install Ollama.Ollama
```

#### Démarrer Ollama
```powershell
# Ollama démarre automatiquement après installation
# Vérifier que ça tourne
ollama list
```

### Télécharger Qwen2.5
```powershell
# Modèle 7B (recommandé - ~4.7 GB)
ollama pull qwen2.5:7b

# Ou version 14B si vous avez une bonne carte graphique (~8.5 GB)
ollama pull qwen2.5:14b

# Ou version française optimisée
ollama pull qwen2.5:7b-instruct
```

### Tester Qwen localement
```powershell
# Test interactif
ollama run qwen2.5:7b

# Demander une question QCM
# "Génère une question QCM en français sur Firebase avec 4 options"
```

### Serveur Ollama API
Ollama expose automatiquement une API REST sur `http://localhost:11434`

```powershell
# Tester l'API
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:7b",
  "prompt": "Génère une question QCM en français",
  "stream": false
}'
```

---

## Option 2 : LM Studio

### Installation
1. Télécharger depuis https://lmstudio.ai/
2. Installer l'application
3. Dans l'interface, chercher "Qwen 2.5" ou "Llama 3.1"
4. Télécharger le modèle (format GGUF)
5. Démarrer le serveur local (onglet "Local Server")

### Configuration
- Port par défaut : `http://localhost:1234`
- Compatible avec OpenAI API
- Interface graphique pour tester les prompts

---

## Option 3 : Serveur Python avec Transformers

### Installation des dépendances
```bash
pip install transformers torch accelerate bitsandbytes flask
```

### Code du serveur (voir `local_llm_server.py` créé)

Avantages :
- Contrôle total sur le modèle
- Peut utiliser quantization (4-bit, 8-bit) pour économiser la RAM
- Personnalisation complète

---

## Intégration dans QUIZO

### 1. Créer un nouveau service backend

Voir fichiers créés :
- `python_api/local_llm_server.py` - Serveur LLM local
- `python_api/ollama_service.py` - Intégration Ollama
- `src/services/localLlmService.ts` - Client frontend

### 2. Modifier le backend Flask existant

Ajout d'une option `local` dans `modelType` :
```python
model_type = data.get('modelType', 'gemini')
if model_type == 'local':
    # Utiliser Ollama ou serveur local
    content = generate_with_local_llm(prompt)
```

### 3. Mettre à jour le frontend

Dans `CreateQuiz.tsx`, ajouter l'option "LLM Local" :
```typescript
<option value="local">Qwen Local (Gratuit)</option>
```

---

## Configuration recommandée

### Pour PC avec GPU NVIDIA (16GB+ VRAM)
```bash
ollama pull qwen2.5:14b
# Ou Llama 3.1 70B en quantization
```

### Pour PC sans GPU ou GPU modeste
```bash
ollama pull qwen2.5:7b
# Ou Phi-3 Mini
ollama pull phi3:mini
```

### Pour serveur/production
- Utiliser LM Studio ou serveur Python avec quantization 4-bit
- Load balancing entre plusieurs modèles
- Cache des réponses courantes

---

## Comparaison de performance

| Modèle | Taille | RAM requise | Qualité (FR) | Vitesse |
|--------|--------|-------------|--------------|---------|
| Qwen2.5-7B | 4.7 GB | 8 GB | ⭐⭐⭐⭐⭐ | Rapide |
| Llama-3.1-8B | 5 GB | 10 GB | ⭐⭐⭐⭐ | Rapide |
| Mistral-7B | 4.1 GB | 8 GB | ⭐⭐⭐⭐⭐ | Très rapide |
| Phi-3 Mini | 2.3 GB | 4 GB | ⭐⭐⭐ | Ultra rapide |
| Gemini API | - | - | ⭐⭐⭐⭐⭐ | Variable |
| ChatGPT API | - | - | ⭐⭐⭐⭐⭐ | Variable |

---

## Prochaines étapes

1. **Installer Ollama** (5 minutes)
2. **Télécharger Qwen2.5** (`ollama pull qwen2.5:7b`)
3. **Tester l'API** (voir exemples ci-dessus)
4. **Intégrer dans QUIZO** (utiliser les fichiers créés)
5. **Optimiser les prompts** pour la génération de QCM

---

## Ressources

- Ollama : https://ollama.com/
- Qwen Models : https://huggingface.co/Qwen
- LM Studio : https://lmstudio.ai/
- Transformers : https://huggingface.co/docs/transformers

---

## Support et Debug

### Problème : Ollama ne démarre pas
```powershell
# Redémarrer le service
Stop-Process -Name "ollama" -Force
ollama serve
```

### Problème : Mémoire insuffisante
- Utiliser un modèle plus petit (Phi-3 Mini)
- Activer la quantization 4-bit
- Fermer les autres applications

### Problème : Génération trop lente
- Vérifier que GPU est utilisé (`nvidia-smi`)
- Réduire la longueur du prompt
- Utiliser un modèle plus petit

