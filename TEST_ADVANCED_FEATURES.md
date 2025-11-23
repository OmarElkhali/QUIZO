# 🧪 GUIDE DE TEST - AMÉLIORATIONS GROQ

**Version**: 2.1  
**Date**: 23 Novembre 2025

---

## 📋 CHECKLIST DE TEST

### ✅ 1. Retry Automatique

**Test**: Simuler erreur réseau temporaire

**Méthode**:
```powershell
# Terminal 1: Démarrer backend
cd python_api
python app.py

# Terminal 2: Test avec interruption réseau
# Pendant la génération, désactiver/réactiver WiFi brièvement
```

**Résultat Attendu**:
```
🔄 Attempt 1/3...
⚠️ Attempt 1 failed: Connection error
⏳ Retrying in 1.0s...
🔄 Attempt 2/3...
✅ Generation completed in 8.5s
```

**Critères de Succès**:
- [ ] Retry automatique déclenché
- [ ] Délai croissant (1s, 2s, 4s)
- [ ] Génération complète après retry

---

### ✅ 2. Détection de Duplicatas

**Test**: Forcer génération avec texte court

**Commande**:
```typescript
const text = "Python est un langage. Python est populaire.";

const questions = await generateQuestionsWithGroq(text, {
  numQuestions: 10,
  model: 'llama-3.3-70b-versatile'
});
```

**Résultat Attendu (Backend)**:
```
🔍 Found 2 duplicate questions, filtering...
✅ 8/10 questions generated successfully (2 duplicates removed)
```

**Critères de Succès**:
- [ ] Duplicatas détectés dans les logs
- [ ] Questions filtrées automatiquement
- [ ] Log indique nombre de duplicatas

---

### ✅ 3. Cache In-Memory

**Test**: Requête identique 2 fois

**Commande**:
```typescript
// Appel 1
console.time('Premier appel');
const q1 = await generateQuestionsWithGroq(text, { numQuestions: 5 });
console.timeEnd('Premier appel');

// Appel 2 (identique)
console.time('Deuxième appel (cache)');
const q2 = await generateQuestionsWithGroq(text, { numQuestions: 5 });
console.timeEnd('Deuxième appel (cache)');
```

**Résultat Attendu**:
```
Premier appel: 3542ms
💾 Questions récupérées du cache (économie de temps et requêtes)
Deuxième appel (cache): 2ms
```

**Critères de Succès**:
- [ ] Premier appel: 3-10s
- [ ] Deuxième appel: <10ms
- [ ] Message cache affiché
- [ ] Questions identiques

---

### ✅ 4. Métriques de Performance

**Test**: Générer plusieurs quiz et afficher stats

**Commande**:
```typescript
import { getGroqMetrics, resetGroqMetrics } from '@/services/groqService';

resetGroqMetrics();

// Générer 3 quiz
await generateQuestionsWithGroq(text1, { numQuestions: 5 });
await generateQuestionsWithGroq(text2, { numQuestions: 10 });
await generateQuestionsWithGroq(text1, { numQuestions: 5 }); // Cache hit

const metrics = getGroqMetrics();
console.log('📊 Métriques:', metrics);
```

**Résultat Attendu**:
```json
{
  "totalRequests": 3,
  "successfulRequests": 3,
  "failedRequests": 0,
  "averageResponseTime": 4230.5,
  "cacheHits": 1
}
```

**Critères de Succès**:
- [ ] totalRequests = 3
- [ ] cacheHits = 1 (troisième appel)
- [ ] averageResponseTime < 10000ms
- [ ] failedRequests = 0

---

### ✅ 5. Fallback Intelligent

**Test**: Timeout avec suggestion

**Méthode**: Demander trop de questions pour déclencher timeout

**Commande**:
```typescript
try {
  // Forcer timeout (mock ou vraie limite)
  await generateQuestionsWithGroq(longText, {
    numQuestions: 100,  // Trop pour un seul appel
    model: 'llama-3.3-70b-versatile'
  });
} catch (error) {
  console.log('Erreur:', error.message);
}
```

**Résultat Attendu**:
```
💡 Suggestion: Essayez le modèle llama-3.1-8b-instant (plus rapide)
Timeout Groq après 100 questions. Réduisez le nombre ou utilisez llama-3.1-8b-instant.
```

**Critères de Succès**:
- [ ] Message d'erreur explicite
- [ ] Suggestion de modèle alternatif
- [ ] Conseil actionnable

---

### ✅ 6. Tokens Adaptatifs

**Test**: Vérifier logs backend pour différents volumes

**Commandes**:
```python
# Test 1: 5 questions
service.generate_quiz(text, num_questions=5)

# Test 2: 20 questions
service.generate_quiz(text, num_questions=20)

# Test 3: 40 questions
service.generate_quiz(text, num_questions=40)
```

**Résultat Attendu (Backend)**:
```
# Test 1
📊 Token estimation: 5 questions → 4096 max_tokens

# Test 2
📊 Token estimation: 20 questions → 6000 max_tokens

# Test 3
📊 Token estimation: 40 questions → 8192 max_tokens (limite)
```

**Critères de Succès**:
- [ ] 5 questions → 4096 tokens
- [ ] 20 questions → 6000 tokens
- [ ] 40 questions → 8192 tokens (plafonné)
- [ ] Toutes les questions générées

---

### ✅ 7. Prompt Optimisé (100% Questions)

**Test**: Demander exactement 30 questions

**Commande**:
```python
questions = service.generate_quiz(
    text=long_text,
    num_questions=30,
    difficulty="medium"
)
print(f"Généré: {len(questions)}/30")
```

**Résultat Attendu**:
```
🚀 Generating 30 questions with Groq (llama-3.3-70b-versatile)...
📊 Token estimation: 30 questions → 8192 max_tokens
⚡ Generation completed in 9.23s
✅ 30/30 questions generated successfully
📊 Metrics: 100.0% valid, 3.2 q/s
```

**Critères de Succès**:
- [ ] 30/30 questions générées
- [ ] Aucun avertissement "manque X questions"
- [ ] Temps < 15s
- [ ] Taux de validation 100%

---

## 🔬 TESTS D'INTÉGRATION

### Test A: Workflow Complet

```typescript
import { 
  generateQuestionsWithGroq, 
  clearGroqCache, 
  getGroqMetrics,
  resetGroqMetrics 
} from '@/services/groqService';

async function testWorkflow() {
  console.log('🧪 Test Workflow Complet');
  
  resetGroqMetrics();
  clearGroqCache();
  
  const text = `
    Python est un langage de programmation créé en 1991 par Guido van Rossum.
    Il est connu pour sa syntaxe claire et sa grande communauté.
    Python est utilisé dans le web, la data science, l'IA et l'automatisation.
  `;
  
  // Étape 1: Première génération
  console.log('\n📝 Étape 1: Première génération (5 questions)');
  const start1 = Date.now();
  const q1 = await generateQuestionsWithGroq(text, { 
    numQuestions: 5,
    model: 'llama-3.3-70b-versatile'
  });
  console.log(`✅ Durée: ${Date.now() - start1}ms`);
  console.log(`✅ Questions: ${q1.length}`);
  
  // Étape 2: Cache hit
  console.log('\n💾 Étape 2: Même requête (cache)');
  const start2 = Date.now();
  const q2 = await generateQuestionsWithGroq(text, { 
    numQuestions: 5,
    model: 'llama-3.3-70b-versatile'
  });
  console.log(`✅ Durée: ${Date.now() - start2}ms (devrait être <10ms)`);
  
  // Étape 3: Gros volume
  console.log('\n📦 Étape 3: Gros volume (30 questions)');
  const start3 = Date.now();
  const q3 = await generateQuestionsWithGroq(text, { 
    numQuestions: 30,
    model: 'llama-3.3-70b-versatile'
  });
  console.log(`✅ Durée: ${Date.now() - start3}ms`);
  console.log(`✅ Questions: ${q3.length}/30`);
  
  // Métriques finales
  console.log('\n📊 Métriques Finales:');
  const metrics = getGroqMetrics();
  console.log(JSON.stringify(metrics, null, 2));
  
  // Assertions
  console.log('\n✅ VÉRIFICATIONS:');
  console.assert(q1.length === 5, '❌ Étape 1: 5 questions attendues');
  console.assert(q2.length === 5, '❌ Étape 2: 5 questions attendues (cache)');
  console.assert(q3.length >= 28, '❌ Étape 3: Minimum 28/30 questions');
  console.assert(metrics.cacheHits === 1, '❌ 1 cache hit attendu');
  console.assert(metrics.successfulRequests === 3, '❌ 3 succès attendus');
  
  console.log('\n🎉 Workflow complet réussi!');
}

testWorkflow();
```

**Résultat Attendu**:
```
🧪 Test Workflow Complet

📝 Étape 1: Première génération (5 questions)
✅ Durée: 3542ms
✅ Questions: 5

💾 Étape 2: Même requête (cache)
💾 Questions récupérées du cache (économie de temps et requêtes)
✅ Durée: 3ms (devrait être <10ms)

📦 Étape 3: Gros volume (30 questions)
✅ Durée: 9234ms
✅ Questions: 30/30

📊 Métriques Finales:
{
  "totalRequests": 3,
  "successfulRequests": 3,
  "failedRequests": 0,
  "averageResponseTime": 4259.33,
  "cacheHits": 1
}

✅ VÉRIFICATIONS:
✅ Étape 1: OK
✅ Étape 2: OK (cache)
✅ Étape 3: OK (30/30)
✅ Cache hits: OK
✅ Succès: OK

🎉 Workflow complet réussi!
```

---

## 🎯 TESTS DE CHARGE

### Test Performance: 50 Questions

```typescript
async function testPerformance() {
  const longText = `...texte de 5000 mots...`;
  
  console.time('50 questions');
  const questions = await generateQuestionsWithGroq(longText, {
    numQuestions: 50,
    model: 'llama-3.3-70b-versatile'
  });
  console.timeEnd('50 questions');
  
  console.log(`Généré: ${questions.length}/50`);
  console.log(`Temps par question: ${(performance.now() / questions.length).toFixed(0)}ms`);
}
```

**Critères de Succès**:
- [ ] ≥ 45/50 questions générées (90%)
- [ ] Temps total < 20s
- [ ] Pas d'erreur critique

---

## 🐛 TESTS D'ERREUR

### Test 1: API Key Invalide

```python
# Modifier temporairement .env
GROQ_API_KEY=invalid_key_xyz

# Relancer backend
python app.py
```

**Résultat Attendu**:
```
❌ Authentication error, no retry
ValueError: GROQ_API_KEY invalid
```

### Test 2: Modèle Inexistant

```typescript
await generateQuestionsWithGroq(text, {
  model: 'fake-model-xyz'
});
```

**Résultat Attendu**:
```
❌ Invalid model, no retry
Modèle Groq obsolète. Utilisez: llama-3.3-70b-versatile, llama-3.1-8b-instant...
```

### Test 3: Texte Trop Court

```typescript
await generateQuestionsWithGroq('Python', { numQuestions: 5 });
```

**Résultat Attendu**:
```
❌ Le texte source doit contenir au moins 50 caractères
```

---

## 📊 RAPPORT DE TEST

### Template

```markdown
# Rapport de Test - Améliorations Groq
Date: __________
Testeur: __________

## Tests Fonctionnels
- [ ] Retry automatique
- [ ] Détection duplicatas
- [ ] Cache in-memory
- [ ] Métriques performance
- [ ] Fallback intelligent
- [ ] Tokens adaptatifs
- [ ] Prompt optimisé

## Tests d'Intégration
- [ ] Workflow complet
- [ ] 50 questions
- [ ] Erreurs gérées

## Métriques Finales
- Taux de succès: ____%
- Taux de cache: ____%
- Temps moyen: ____s

## Problèmes Rencontrés
1. _________
2. _________

## Recommandations
- _________
- _________
```

---

## 🚀 COMMANDES RAPIDES

### Reset Complet

```powershell
# Backend
cd python_api
rm -rf __pycache__
python app.py

# Frontend
npm run dev
# Dans console navigateur:
clearGroqCache()
resetGroqMetrics()
```

### Monitoring Live

```typescript
// Ajouter dans DevTools Console
setInterval(() => {
  const m = getGroqMetrics();
  console.log(`📊 ${m.successfulRequests}/${m.totalRequests} | Cache: ${m.cacheHits} | Avg: ${(m.averageResponseTime/1000).toFixed(1)}s`);
}, 5000);
```

---

## ✅ VALIDATION FINALE

Tous les tests passent si:
1. ✅ Retry fonctionne (logs visibles)
2. ✅ Duplicatas détectés (>0 dans logs)
3. ✅ Cache fonctionne (<10ms deuxième appel)
4. ✅ Métriques correctes
5. ✅ Fallback suggère alternatives
6. ✅ Tokens adaptatifs (logs backend)
7. ✅ 30/30 questions générées

**Status**: 🎉 PRODUCTION READY
