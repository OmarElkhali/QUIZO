# 🧪 QUIZO - Test en Direct - Scénario Complet

**Date:** 31 Octobre 2025  
**Testeur:** Omar Elkhali  
**Durée estimée:** 30 minutes

---

## 📋 Préparation (5 minutes)

### Outils Nécessaires
- [ ] Navigateur principal (Chrome/Firefox) - Créateur
- [ ] Navigateur en navigation privée - Participant 1
- [ ] Autre navigateur OU deuxième navigation privée - Participant 2
- [ ] Bloc-notes pour noter les codes
- [ ] Chronomètre (optionnel)

### Vérification des Services

1. **Ouvrir un terminal et exécuter:**
```bash
node check-services.js
```

**Résultat attendu:**
```
✓ Frontend (Vercel): OK (200)
✓ Backend Health (Render): OK (200)
✓ Backend Extract API: OK (405)
```

⚠️ **Si Backend timeout:** Ouvrir https://quizo-nued.onrender.com/health et attendre 60s

---

## ✅ ÉTAPE 1: Création du Quiz (10 minutes)

### 1.1 Connexion

1. **Ouvrir:** https://quizo-ruddy.vercel.app
2. **Cliquer:** Icône utilisateur (en haut à droite)
3. **Se connecter** avec Google ou Email/Password
4. **Vérifier:** Avatar visible dans la navbar

✅ **Checkpoint:** [ ] Connecté avec succès

---

### 1.2 Accéder à la Création Manuelle

1. **Cliquer:** "Create Manual Quiz" dans la navbar
2. **URL vérifiée:** `/create-manual-quiz`

✅ **Checkpoint:** [ ] Page de création ouverte

---

### 1.3 Formulaire Initial

**Remplir:**
```
Titre: Équations du Second Degré
Description: Quiz sur le chapitre 5 - Discriminant et résolutions
Catégorie: Mathématiques
```

**Cliquer:** "Créer le quiz"

✅ **Checkpoint:** [ ] Redirection vers Quiz Builder

---

### 1.4 Ajouter les 10 Questions

#### Question 1
```
Question: Quelle est la forme générale d'une équation du second degré ?

Options:
☑️ ax² + bx + c = 0
☐ ax + b = 0
☐ ax³ + bx² + cx + d = 0
☐ a/x + b = 0
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q1:** [ ] Question ajoutée

---

#### Question 2
```
Question: Comment calcule-t-on le discriminant Δ ?

Options:
☑️ Δ = b² - 4ac
☐ Δ = b² + 4ac
☐ Δ = 4ac - b²
☐ Δ = a² - 4bc
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q2:** [ ] Question ajoutée

---

#### Question 3
```
Question: Si Δ > 0, combien de solutions réelles l'équation possède-t-elle ?

Options:
☑️ 2 solutions distinctes
☐ 1 solution double
☐ Aucune solution
☐ Infinité de solutions
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q3:** [ ] Question ajoutée

---

#### Question 4
```
Question: Si Δ = 0, quelle est la solution ?

Options:
☑️ x = -b / 2a
☐ x = b / 2a
☐ x = -b / a
☐ x = 0
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q4:** [ ] Question ajoutée

---

#### Question 5
```
Question: Pour l'équation x² - 5x + 6 = 0, quelle est la valeur de Δ ?

Options:
☑️ 1
☐ 25
☐ -24
☐ 0
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q5:** [ ] Question ajoutée

---

#### Question 6
```
Question: Les solutions de x² - 5x + 6 = 0 sont :

Options:
☑️ x₁ = 2 et x₂ = 3
☐ x₁ = 1 et x₂ = 6
☐ x₁ = -2 et x₂ = -3
☐ Pas de solution
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q6:** [ ] Question ajoutée

---

#### Question 7
```
Question: Pour résoudre ax² + bx + c = 0 avec Δ > 0, on utilise :

Options:
☑️ x = (-b ± √Δ) / 2a
☐ x = (-b ± √Δ) / a
☐ x = (b ± √Δ) / 2a
☐ x = -b / 2a
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q7:** [ ] Question ajoutée

---

#### Question 8
```
Question: Si Δ < 0, dans quel ensemble trouve-t-on les solutions ?

Options:
☑️ Dans ℂ (nombres complexes)
☐ Dans ℝ (nombres réels)
☐ Dans ℕ (nombres naturels)
☐ Il n'y a pas de solution
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q8:** [ ] Question ajoutée

---

#### Question 9
```
Question: L'équation x² - 4 = 0 a pour solutions :

Options:
☑️ x₁ = 2 et x₂ = -2
☐ x = 4
☐ x = 2
☐ Pas de solution
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q9:** [ ] Question ajoutée

---

#### Question 10
```
Question: Quelle équation a un discriminant nul ?

Options:
☑️ x² - 6x + 9 = 0
☐ x² - 5x + 6 = 0
☐ x² + 1 = 0
☐ x² - 4 = 0
```
**Cliquer:** "Ajouter la question"

✅ **Checkpoint Q10:** [ ] Question ajoutée

---

### 1.5 Enregistrer le Quiz

1. **Cliquer:** "Enregistrer le quiz"
2. **Attendre:** Notification de succès
3. **Vérifier:** Redirection vers "My Quizzes"
4. **Localiser:** Quiz "Équations du Second Degré" dans la liste

✅ **Checkpoint Final Étape 1:** [ ] Quiz créé avec 10 questions

**Temps écoulé:** _____ minutes

---

## ✅ ÉTAPE 2: Partage du Quiz (2 minutes)

### 2.1 Accéder à l'Historique

1. **Cliquer:** "History" dans la navbar
2. **Vérifier:** Onglet "My Quizzes" actif
3. **Localiser:** Quiz "Équations du Second Degré"

---

### 2.2 Ouvrir la Modal de Partage

1. **Cliquer:** Icône **Share** 🔗 sur la carte du quiz
2. **Vérifier:** Modal s'ouvre

---

### 2.3 Copier le Code

**Informations affichées:**
```
Code de partage: _____________ (noter ici)
Lien de partage: _____________ (noter ici)
```

1. **Cliquer:** "Copy Code"
2. **Noter le code** dans un bloc-notes ou ci-dessus

✅ **Checkpoint Étape 2:** [ ] Code de partage copié et noté

**Code noté:** `___________`

---

## ✅ ÉTAPE 3: Les Élèves Rejoignent (5 minutes)

### 3.1 Participant 1 - Marie

#### 3.1.1 Ouvrir Navigation Privée
- **Chrome:** Ctrl+Shift+N
- **Firefox:** Ctrl+Shift+P
- **Edge:** Ctrl+Shift+N

#### 3.1.2 Accéder à Join by Code
**URL:** https://quizo-ruddy.vercel.app/join

#### 3.1.3 Remplir le Formulaire
```
Code de partage: [VOTRE CODE NOTÉ CI-DESSUS]
Nom: Marie Dubois
Email: marie.dubois@test.com
```

#### 3.1.4 Rejoindre
**Cliquer:** "Rejoindre le Quiz"

#### 3.1.5 Vérifier
- [ ] Redirection vers page du quiz
- [ ] Titre "Équations du Second Degré" visible
- [ ] 10 questions listées
- [ ] Bouton "Commencer" présent

✅ **Checkpoint Marie:** [ ] Marie a rejoint avec succès

**⚠️ NE PAS ENCORE COMMENCER LE QUIZ**

---

### 3.2 Participant 2 - Thomas

#### 3.2.1 Ouvrir Deuxième Navigation Privée
**Utiliser un autre navigateur** (si Chrome utilisé, ouvrir Firefox)

OU **Ouvrir une deuxième fenêtre de navigation privée**

#### 3.2.2 Accéder à Join by Code
**URL:** https://quizo-ruddy.vercel.app/join

#### 3.2.3 Remplir le Formulaire
```
Code de partage: [VOTRE CODE]
Nom: Thomas Martin
Email: thomas.martin@test.com
```

#### 3.2.4 Rejoindre
**Cliquer:** "Rejoindre le Quiz"

✅ **Checkpoint Thomas:** [ ] Thomas a rejoint avec succès

**⚠️ NE PAS ENCORE COMMENCER LE QUIZ**

---

### 3.3 Participant 3 - Sophie (Optionnel)

Si vous avez un 3ème navigateur ou un smartphone :

```
Code: [VOTRE CODE]
Nom: Sophie Leroy
Email: sophie.leroy@test.com
```

✅ **Checkpoint Sophie:** [ ] Sophie a rejoint (optionnel)

---

## ✅ ÉTAPE 4: Surveillance Temps Réel (10 minutes)

### 4.1 Ouvrir le Dashboard (Onglet Créateur)

#### 4.1.1 Retourner à l'Onglet Principal
**L'onglet où vous êtes connecté (pas navigation privée)**

#### 4.1.2 Aller dans History
**Cliquer:** "History" dans la navbar

#### 4.1.3 Ouvrir le Dashboard
1. **Localiser:** Quiz "Équations du Second Degré"
2. **Cliquer:** "View Dashboard" (icône 📊)
3. **URL:** `/dashboard/:quizId`

---

### 4.2 Vérifier l'Onglet Overview

**Statistiques visibles:**
```
Total Participants: ____ (devrait être 2 ou 3)
Active Participants: 0 (personne n'a commencé)
Average Score: 0%
Completion Rate: 0%
```

✅ **Checkpoint Overview:** [ ] Participants visibles mais pas encore actifs

---

### 4.3 Vérifier l'Onglet Participants

**Cliquer:** Onglet "Participants"

**Tableau attendu:**
```
┌───────────────┬────────────────────┬────────┬───────┬──────────┐
│ Nom           │ Email              │ Statut │ Score │ Progress │
├───────────────┼────────────────────┼────────┼───────┼──────────┤
│ Marie Dubois  │ marie.dubois@...   │ Joined │ 0/10  │ 0%       │
│ Thomas Martin │ thomas.martin@...  │ Joined │ 0/10  │ 0%       │
└───────────────┴────────────────────┴────────┴───────┴──────────┘
```

✅ **Checkpoint Participants:** [ ] 2+ participants avec statut "Joined"

---

### 4.4 Test Temps Réel - Marie Commence

#### 4.4.1 Onglet Marie (Navigation Privée)
**Cliquer:** "Commencer le quiz"

#### 4.4.2 Observer Dashboard (Onglet Créateur)
**⏱️ IMPORTANT:** Ne pas rafraîchir la page !

**Changement attendu en 1-2 secondes:**
```
Marie Dubois | Statut: Joined → In Progress
             | Timer: 00:00 → 00:01, 00:02...
```

✅ **Checkpoint Temps Réel 1:** [ ] Statut Marie change automatiquement

---

### 4.5 Test Temps Réel - Marie Répond aux Questions

#### 4.5.1 Onglet Marie
**Répondre rapidement aux questions:**

- Q1: ✅ ax² + bx + c = 0 → Suivant
- Q2: ✅ Δ = b² - 4ac → Suivant
- Q3: ✅ 2 solutions distinctes → Suivant
- Q4: ✅ x = -b / 2a → Suivant
- Q5: ✅ 1 → Suivant

**⏸️ PAUSE APRÈS Q5**

#### 4.5.2 Observer Dashboard
**Mise à jour progressive attendue:**
```
Marie Dubois | Progress: 0% → 10% → 20% → 30% → 40% → 50%
             | Score: Pas encore affiché (quiz non terminé)
             | Current Question: 1 → 2 → 3 → 4 → 5 → 6
```

✅ **Checkpoint Temps Réel 2:** [ ] Progression Marie visible en temps réel

---

### 4.6 Test Temps Réel - Thomas Commence Pendant que Marie Continue

#### 4.6.1 Onglet Thomas (Deuxième Navigation Privée)
**Cliquer:** "Commencer le quiz"

#### 4.6.2 Observer Dashboard
**Mise à jour attendue:**
```
┌───────────────┬────────────────┬─────────────┬───────┬──────────┐
│ Marie Dubois  │ marie...       │ In Progress │ -     │ 50%      │
│ Thomas Martin │ thomas...      │ In Progress │ -     │ 0%       │
└───────────────┴────────────────┴─────────────┴───────┴──────────┘
```

✅ **Checkpoint Temps Réel 3:** [ ] Les 2 participants affichés en temps réel

---

### 4.7 Terminer les Quiz

#### 4.7.1 Marie Termine (Onglet Marie)
**Continuer à répondre:**
- Q6: ✅ x₁ = 2 et x₂ = 3
- Q7: ✅ x = (-b ± √Δ) / 2a
- Q8: ✅ Dans ℂ (nombres complexes)
- Q9: ✅ x₁ = 2 et x₂ = -2
- Q10: ✅ x² - 6x + 9 = 0

**Cliquer:** "Soumettre"

**Résultat Marie:**
```
Score: 10/10 (100%)
Temps: ~2-3 minutes
```

#### 4.7.2 Observer Dashboard
**Mise à jour attendue:**
```
Marie Dubois | Statut: In Progress → Completed
             | Score: - → 10/10 (100%)
             | Progress: 50% → 100%
```

✅ **Checkpoint Temps Réel 4:** [ ] Marie passe à "Completed" automatiquement

---

#### 4.7.3 Thomas Fait des Erreurs Volontaires (Onglet Thomas)
**Répondre avec 3 erreurs:**
- Q1: ✅ Correct
- Q2: ✅ Correct
- Q3: ❌ **ERREUR VOLONTAIRE** (choisir mauvaise réponse)
- Q4: ✅ Correct
- Q5: ✅ Correct
- Q6: ❌ **ERREUR VOLONTAIRE**
- Q7: ✅ Correct
- Q8: ❌ **ERREUR VOLONTAIRE**
- Q9: ✅ Correct
- Q10: ✅ Correct

**Soumettre**

**Résultat Thomas:**
```
Score: 7/10 (70%)
```

#### 4.7.4 Observer Dashboard Final
**Statistiques finales attendues:**
```
┌───────────────┬────────────────┬───────────┬───────┬──────────┐
│ Marie Dubois  │ marie...       │ Completed │ 10/10 │ 100%     │
│ Thomas Martin │ thomas...      │ Completed │ 7/10  │ 100%     │
└───────────────┴────────────────┴───────────┴───────┴──────────┘

Overview:
- Total Participants: 2
- Active: 0 (tous terminés)
- Completed: 2
- Average Score: 85%
- Completion Rate: 100%
```

✅ **Checkpoint Temps Réel Final:** [ ] Tous les participants terminés, stats correctes

---

## ✅ ÉTAPE 5: Analyse des Résultats (5 minutes)

### 5.1 Vérifier l'Onglet Results (Dashboard)

**Cliquer:** Onglet "Results"

**Statistiques attendues:**

#### Distribution des Scores
```
10/10: █████████ (1 participant) - 50%
7/10:  █████████ (1 participant) - 50%
```

#### Questions les Plus Difficiles
```
Q8 (Nombres complexes): 50% de réussite (Thomas a échoué)
Q6 (Solutions): 50% de réussite (Thomas a échoué)
Q3 (Δ > 0): 50% de réussite (Thomas a échoué)
```

✅ **Checkpoint Results:** [ ] Statistiques affichées correctement

---

### 5.2 Analyse

**Questions à améliorer:**
1. Q8 - Nombres complexes (50% réussite)
2. Q6 - Calcul de solutions (50% réussite)
3. Q3 - Interprétation de Δ (50% réussite)

**Actions recommandées:**
- [ ] Prévoir révision sur les nombres complexes
- [ ] Exercices supplémentaires sur le calcul de solutions
- [ ] Réexpliquer l'interprétation du discriminant

✅ **Checkpoint Analyse:** [ ] Points faibles identifiés

---

## 📊 Résultats du Test

### Récapitulatif des Checkpoints

**ÉTAPE 1 - Création du Quiz:**
- [ ] Connexion réussie
- [ ] 10 questions ajoutées
- [ ] Quiz enregistré

**ÉTAPE 2 - Partage:**
- [ ] Code généré et copié

**ÉTAPE 3 - Participants:**
- [ ] Marie a rejoint
- [ ] Thomas a rejoint

**ÉTAPE 4 - Temps Réel:**
- [ ] Dashboard affiche participants
- [ ] Statut change automatiquement (Joined → In Progress)
- [ ] Progression visible en temps réel
- [ ] Scores finaux affichés
- [ ] Statistiques Overview correctes

**ÉTAPE 5 - Analyse:**
- [ ] Résultats affichés
- [ ] Questions difficiles identifiées

---

## ✅ Validation Finale

**Le test est RÉUSSI si:**
- [x] Toutes les checkpoints ÉTAPE 1 cochées
- [x] Toutes les checkpoints ÉTAPE 2 cochées
- [x] Toutes les checkpoints ÉTAPE 3 cochées
- [x] Toutes les checkpoints ÉTAPE 4 cochées
- [x] Toutes les checkpoints ÉTAPE 5 cochées

**Résultat global:** ☐ PASS  ☐ FAIL

---

## 🐛 Problèmes Rencontrés (si FAIL)

**Si un test échoue, documenter ici:**

### Problème 1
- **Étape:** _____
- **Description:** _____
- **Message d'erreur:** _____
- **Screenshot:** _____

### Problème 2
- **Étape:** _____
- **Description:** _____
- **Message d'erreur:** _____

---

## 📝 Notes Additionnelles

**Observations:**
- Temps total du test: _____ minutes
- Performance Dashboard: _____ (rapide/lent)
- Latence temps réel: _____ secondes
- Bugs mineurs: _____

**Commentaires:**
_____

---

## 🎯 Conclusion

**Si PASS:**
✅ Toutes les fonctionnalités temps réel fonctionnent parfaitement !
- Dashboard se met à jour automatiquement
- Multi-participants fonctionne
- Statistiques correctes
- QUIZO est prêt pour une utilisation réelle !

**Si FAIL:**
Consultez TESTING-GUIDE.md section "Troubleshooting" pour résoudre les problèmes.

---

**Testé par:** _______________  
**Date:** _______________  
**Signature:** _______________
