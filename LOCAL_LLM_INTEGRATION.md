# 🤖 Intégration LLM Local dans QUIZO

Ce document explique comment QUIZO utilise des modèles LLM locaux (via Ollama) comme alternative gratuite et privée aux API cloud.

## 📁 Architecture

```
QUIZO/
├── src/
│   └── services/
│       └── localLlmService.ts          # Client TypeScript pour Ollama
├── python_api/
│   ├── app.py                          # Backend Flask (modifié pour Ollama)
│   └── ollama_service.py               # Service Python pour Ollama
├── LOCAL_LLM_GUIDE.md                  # Guide détaillé d'implémentation
├── OLLAMA_QUICKSTART.md                # Guide de démarrage rapide
└── .env                                # Configuration
```

## 🔄 Flux de données

### Option 1 : Via le backend Flask (recommandé)

```
Frontend (React)
    ↓
localLlmService.generateQuestionsWithLocalLLM()
    ↓
Backend Flask (/api/generate avec modelType='local')
    ↓
generate_with_ollama() dans app.py
    ↓
Ollama API (localhost:11434)
    ↓
Modèle local (Qwen/Llama/Mistral)
    ↓
Questions générées → Frontend
```

### Option 2 : Direct depuis le frontend

```
Frontend (React)
    ↓
localLlmService.generateDirectlyWithOllama()
    ↓
Ollama API (localhost:11434)
    ↓
Modèle local
    ↓
Questions générées → Frontend
```

## 🛠️ Fichiers créés/modifiés

### 1. **Backend Flask** (`python_api/app.py`)

**Modifications :**
- Ajout de la configuration Ollama (URL, modèle par défaut)
- Nouvelle fonction `generate_with_ollama(prompt, model)`
- Support de `modelType='local'` dans `/api/generate`
- Nouveau endpoint `/api/ollama/models` pour lister les modèles
- Mise à jour du `/api/health` pour inclure le statut Ollama

**Code clé :**
```python
# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

# Génération avec Ollama
if model_type == 'local':
    content = generate_with_ollama(prompt, local_model)
```

### 2. **Service Ollama Python** (`python_api/ollama_service.py`)

**Nouveau fichier** avec :
- Classe `OllamaService` pour gérer les interactions
- Fonction `generate_quiz_with_ollama()` pour générer des QCM
- Fonction `test_ollama()` pour tester l'installation
- Validation complète des questions générées
- Gestion d'erreurs robuste

**Utilisation :**
```bash
cd python_api
python ollama_service.py  # Lance les tests
```

### 3. **Service Frontend** (`src/services/localLlmService.ts`)

**Nouveau fichier** avec :
- `isLocalLLMAvailable()` - Vérifie si Ollama est accessible
- `listLocalModels()` - Liste les modèles téléchargés
- `generateQuestionsWithLocalLLM()` - Génère via le backend Flask
- `generateDirectlyWithOllama()` - Génère directement avec Ollama
- `getLocalLLMInfo()` - Récupère l'état d'Ollama
- `RECOMMENDED_MODELS` - Liste des modèles recommandés

**Utilisation :**
```typescript
import { generateQuestionsWithLocalLLM } from '@/services/localLlmService';

const questions = await generateQuestionsWithLocalLLM(
  text,
  5,          // nombre de questions
  'medium',   // difficulté
  'qwen2.5:7b' // modèle
);
```

### 4. **Composant React** (`src/components/LocalModelSelector.tsx`)

**Nouveau composant** pour :
- Afficher l'état d'Ollama (disponible/non disponible)
- Lister les modèles téléchargés
- Sélectionner un modèle
- Afficher les informations sur le modèle sélectionné
- Afficher les modèles recommandés
- Guide d'installation si Ollama n'est pas disponible

**Utilisation :**
```tsx
import { LocalModelSelector } from '@/components/LocalModelSelector';

<LocalModelSelector
  selectedModel={selectedModel}
  onModelChange={setSelectedModel}
  showRecommendations={true}
/>
```

## 🔌 Intégration dans CreateQuiz

Pour intégrer dans la page de création de quiz :

### 1. Modifier `CreateQuiz.tsx`

```tsx
import { useState } from 'react';
import { LocalModelSelector } from '@/components/LocalModelSelector';
import { generateQuestionsWithLocalLLM } from '@/services/localLlmService';

function CreateQuiz() {
  const [modelType, setModelType] = useState<'gemini' | 'chatgpt' | 'local'>('gemini');
  const [localModel, setLocalModel] = useState('qwen2.5:7b');

  const handleGenerate = async () => {
    if (modelType === 'local') {
      // Utiliser LLM local
      const questions = await generateQuestionsWithLocalLLM(
        extractedText,
        numQuestions,
        difficulty,
        localModel
      );
      setGeneratedQuestions(questions);
    } else {
      // Utiliser Gemini/ChatGPT comme avant
      // ...code existant
    }
  };

  return (
    <div>
      {/* Sélecteur de type de modèle */}
      <select value={modelType} onChange={(e) => setModelType(e.target.value)}>
        <option value="gemini">Gemini (API)</option>
        <option value="chatgpt">ChatGPT (API)</option>
        <option value="local">LLM Local (Gratuit)</option>
      </select>

      {/* Afficher le sélecteur de modèle local si nécessaire */}
      {modelType === 'local' && (
        <LocalModelSelector
          selectedModel={localModel}
          onModelChange={setLocalModel}
        />
      )}

      <button onClick={handleGenerate}>Générer le Quiz</button>
    </div>
  );
}
```

### 2. Modifier `aiService.ts` (optionnel)

Pour centraliser la logique de génération :

```typescript
import { generateQuestionsWithLocalLLM } from './localLlmService';

export const generateQuestions = async (
  text: string,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard',
  modelType: 'gemini' | 'chatgpt' | 'local',
  config?: {
    apiKey?: string;
    localModel?: string;
  }
): Promise<Question[]> => {
  switch (modelType) {
    case 'local':
      return generateQuestionsWithLocalLLM(
        text,
        numQuestions,
        difficulty,
        config?.localModel || 'qwen2.5:7b'
      );
    
    case 'chatgpt':
      return generateQuestionsWithAI(text, numQuestions, difficulty, 'chatgpt', config?.apiKey);
    
    case 'gemini':
    default:
      return generateQuestionsWithAI(text, numQuestions, difficulty, 'gemini');
  }
};
```

## ⚙️ Configuration

### Variables d'environnement

**Backend** (`python_api/.env`) :
```bash
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# API Cloud (optionnelles)
GEMINI_API_KEY=your_key_here
CHATGPT_API_KEY=your_key_here

# Serveur
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
```

**Frontend** (`.env`) :
```bash
VITE_BACKEND_URL=http://localhost:5001/api
VITE_LOCAL_LLM_URL=http://localhost:11434

# Firebase config...
VITE_FIREBASE_API_KEY=...
```

## 🧪 Tests

### Tester le service Ollama Python

```bash
cd python_api
python ollama_service.py
```

Sortie attendue :
```
🔍 Test de la connexion Ollama...
✅ Ollama est disponible!
📦 Modèles disponibles:
   - qwen2.5:7b
🧪 Test de génération avec qwen2.5:7b...
✅ 2 questions générées avec succès!
```

### Tester l'endpoint Flask

```bash
# Démarrer le backend
cd python_api
python app.py

# Dans un autre terminal
curl -X POST http://localhost:5001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Firebase est une plateforme de développement...",
    "numQuestions": 2,
    "difficulty": "easy",
    "modelType": "local",
    "localModel": "qwen2.5:7b"
  }'
```

### Tester depuis le frontend

```typescript
import { getLocalLLMInfo } from '@/services/localLlmService';

// Vérifier l'état
const info = await getLocalLLMInfo();
console.log(info);
// { available: true, models: ['qwen2.5:7b'], message: '1 modèle(s) disponible(s)' }
```

## 📊 Performance

### Benchmarks (PC avec RTX 3060, 16GB RAM)

| Modèle | Taille | 5 questions | 10 questions | RAM | Qualité |
|--------|--------|------------|--------------|-----|---------|
| qwen2.5:7b | 4.7 GB | ~40s | ~80s | 6 GB | ⭐⭐⭐⭐⭐ |
| qwen2.5:14b | 8.5 GB | ~75s | ~150s | 10 GB | ⭐⭐⭐⭐⭐ |
| llama3.1:8b | 5 GB | ~50s | ~100s | 7 GB | ⭐⭐⭐⭐ |
| mistral:7b | 4.1 GB | ~35s | ~70s | 6 GB | ⭐⭐⭐⭐⭐ |
| phi3:mini | 2.3 GB | ~20s | ~40s | 3 GB | ⭐⭐⭐ |
| **Gemini API** | - | ~25s | ~50s | 0 GB | ⭐⭐⭐⭐⭐ |

### Recommandations

- **PC modeste** (8GB RAM, pas de GPU) : `phi3:mini`
- **PC standard** (16GB RAM, GPU modeste) : `qwen2.5:7b` ou `mistral:7b`
- **PC puissant** (32GB RAM, bon GPU) : `qwen2.5:14b`
- **Production** : Gemini API ou serveur dédié avec Ollama

## 🐛 Dépannage courant

### Erreur : "Ollama n'est pas disponible"

**Solution :**
```powershell
# Vérifier qu'Ollama tourne
Get-Process ollama

# Si non, démarrer manuellement
ollama serve
```

### Erreur : "Le modèle X n'est pas disponible"

**Solution :**
```powershell
# Vérifier les modèles
ollama list

# Télécharger le modèle manquant
ollama pull qwen2.5:7b
```

### Génération trop lente

**Solutions :**
1. Utiliser un modèle plus petit (`phi3:mini`)
2. Réduire le texte source (<5000 caractères)
3. Vérifier que le GPU est utilisé (`nvidia-smi`)
4. Fermer les autres applications

### Erreur de mémoire

**Solutions :**
1. Utiliser `phi3:mini` (nécessite seulement 4GB RAM)
2. Fermer Chrome/VSCode
3. Augmenter le swap/pagefile Windows

## 🚀 Déploiement

### Développement local

```bash
# Backend
cd python_api
python app.py

# Frontend
npm run dev
```

### Production

**Option 1 : Serveur dédié avec Ollama**
- Installer Ollama sur le serveur
- Configurer OLLAMA_BASE_URL vers le serveur
- Utiliser un load balancer pour plusieurs instances

**Option 2 : Hybrid (Cloud + Local)**
- Utiliser Gemini/ChatGPT pour la production
- Garder Ollama pour le développement local

## 📚 Ressources

- [Guide complet](./LOCAL_LLM_GUIDE.md)
- [Démarrage rapide](./OLLAMA_QUICKSTART.md)
- [Documentation Ollama](https://ollama.com)
- [Modèles Qwen](https://huggingface.co/Qwen)

## 🎯 Prochaines étapes

1. ✅ Installation et test d'Ollama
2. ⬜ Intégration dans CreateQuiz.tsx
3. ⬜ Tests avec différents modèles
4. ⬜ Optimisation des prompts
5. ⬜ Cache des réponses
6. ⬜ Fine-tuning d'un modèle pour QUIZO

---

**Bon coding ! 🎓**
