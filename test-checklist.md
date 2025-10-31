# ✅ QUIZO - Checklist de Test Rapide

**Date:** 31 Octobre 2025  
**Version:** 1.0

---

## 🚀 Tests Rapides (15 minutes)

### ✅ Test 1: Page d'Accueil Multi-langue (2 min)

1. Ouvrir https://quizo-ruddy.vercel.app
2. Vérifier textes en français :
   - [ ] "QUIZO - Transformez Vos Cours en QCM Interactifs"
   - [ ] "Apprentissage Intelligent"
   - [ ] Bouton "Commencer"
3. Changer en English :
   - [ ] Titre devient "Transform Your Courses into Interactive MCQs"
   - [ ] Badge devient "Intelligent Learning"
   - [ ] Bouton devient "Get Started"
4. Changer en العربية (Arabe) :
   - [ ] Direction devient RTL (texte à droite)
   - [ ] "التعلم الذكي" visible
   - [ ] Logo QUIZO à droite
5. Rafraîchir (F5) :
   - [ ] Langue reste en arabe
   - [ ] RTL toujours actif

**Résultat:** ☐ PASS  ☐ FAIL

---

### ✅ Test 2: Création Quiz Manuel (3 min)

1. Se connecter (si pas déjà fait)
2. Cliquer "Create Manual Quiz"
3. Remplir :
   ```
   Titre: Test Rapide
   Description: Quiz de test
   Catégorie: Test
   ```
4. Ajouter 3 questions rapides :
   ```
   Q1: "2+2 ?" → Options: 3, 4✅, 5, 6
   Q2: "Capitale France ?" → Options: Londres, Paris✅, Berlin
   Q3: "1+1 ?" → Options: 1, 2✅, 3
   ```
5. Cliquer "Enregistrer le quiz"
6. Vérifier dans "My Quizzes" :
   - [ ] Quiz "Test Rapide" visible
   - [ ] Badge "Manuel"
   - [ ] 3 questions

**Résultat:** ☐ PASS  ☐ FAIL  
**Code du quiz:** ___________

---

### ✅ Test 3: Partage du Quiz (1 min)

1. Dans "History", trouver "Test Rapide"
2. Cliquer icône Share 🔗
3. Vérifier modal :
   - [ ] Code 6 caractères visible
   - [ ] Lien complet affiché
   - [ ] Bouton "Copy Code" fonctionne
4. **NOTER LE CODE:** ___________

**Résultat:** ☐ PASS  ☐ FAIL

---

### ✅ Test 4: Rejoindre par Code (2 min)

1. Ouvrir navigation privée (Ctrl+Shift+N)
2. Aller sur https://quizo-ruddy.vercel.app/join
3. Remplir :
   ```
   Code: [VOTRE CODE NOTÉ]
   Nom: Test User
   Email: test@test.com
   ```
4. Cliquer "Rejoindre le Quiz"
5. Vérifier :
   - [ ] Redirection vers page quiz
   - [ ] Titre "Test Rapide" affiché
   - [ ] 3 questions visibles
   - [ ] Bouton "Commencer" présent

**Résultat:** ☐ PASS  ☐ FAIL

---

### ✅ Test 5: Dashboard Temps Réel (4 min)

1. **Onglet 1 (créateur):** Ouvrir Dashboard du quiz
   - History → "Test Rapide" → "View Dashboard"
   - Vérifier Participants tab :
     - [ ] "Test User" visible
     - [ ] Statut "Joined"
     - [ ] Score 0/3

2. **Onglet 2 (participant):** Commencer le quiz
   - Cliquer "Commencer le quiz"

3. **Retour Onglet 1 (sans rafraîchir) :**
   - [ ] Statut change à "In Progress" automatiquement
   - [ ] Timer démarre

4. **Onglet 2:** Répondre aux questions
   - Q1: 4 ✅
   - Q2: Paris ✅
   - Q3: 2 ✅
   - Cliquer "Soumettre"

5. **Onglet 1 (observer en temps réel) :**
   - [ ] Progress: 0% → 33% → 66% → 100%
   - [ ] Statut final: "Completed"
   - [ ] Score: 3/3 (100%)
   - [ ] Overview mis à jour (Average Score: 100%)

**Résultat:** ☐ PASS  ☐ FAIL

---

### ✅ Test 6: Multi-langue sur Join Page (1 min)

1. Dans l'onglet navigation privée
2. Retourner sur /join (pas encore rejoint)
3. Changer langue en Español :
   - [ ] "Unirse al Cuestionario" (titre)
   - [ ] "Código de Compartir" (label)
   - [ ] "Unirse al Cuestionario" (bouton)
4. Changer en 中文 :
   - [ ] "加入测验" (visible)

**Résultat:** ☐ PASS  ☐ FAIL

---

### ✅ Test 7: RTL Complet (2 min)

1. Sur la page d'accueil
2. Changer en العربية (Arabe)
3. Vérifier TOUS les éléments RTL :
   - [ ] Navbar : Logo à droite, menu à droite
   - [ ] Hero : Texte aligné à droite
   - [ ] Boutons : Icônes inversées (flèches)
   - [ ] Features cards : Layout inversé
   - [ ] Sélecteur langue : À gauche (inverse)
4. Naviguer vers CreateQuiz :
   - [ ] Formulaire en RTL
   - [ ] Labels alignés à droite
5. Naviguer vers Join :
   - [ ] Inputs en RTL
   - [ ] Texte à droite

**Résultat:** ☐ PASS  ☐ FAIL

---

## 📊 Résultat Global

| Test | Résultat | Temps |
|------|----------|-------|
| 1. Multi-langue | ☐ PASS ☐ FAIL | ___min |
| 2. Quiz Manuel | ☐ PASS ☐ FAIL | ___min |
| 3. Partage | ☐ PASS ☐ FAIL | ___min |
| 4. Rejoindre | ☐ PASS ☐ FAIL | ___min |
| 5. Dashboard RT | ☐ PASS ☐ FAIL | ___min |
| 6. Multi-langue Join | ☐ PASS ☐ FAIL | ___min |
| 7. RTL Complet | ☐ PASS ☐ FAIL | ___min |

**Total:** ___/7 tests réussis  
**Temps total:** ___min  
**Statut:** ☐ TOUS PASS  ☐ AU MOINS 1 FAIL

---

## 🐛 Bugs Trouvés

Si un test échoue, notez ici :

**Test #___ :**
- **Problème:**
- **Étape:**
- **Message d'erreur:**
- **Screenshot:**

---

## ✅ Si Tous les Tests Passent

Félicitations ! Toutes les fonctionnalités collaboratives fonctionnent :

- ✅ Création de quiz manuel
- ✅ Partage avec code
- ✅ Rejoindre anonyme
- ✅ Dashboard temps réel
- ✅ Multi-participants
- ✅ Multi-langue (8 langues)
- ✅ RTL (Arabe)

**Prochaines étapes recommandées :**
1. Traduire les pages restantes (Results, History, Dashboard, Quiz, Auth)
2. Tester avec 5+ participants simultanés
3. Créer des quiz avec IA (Gemini)
4. Partager avec de vrais utilisateurs

---

**Testé par:** _______________  
**Date:** _______________  
**Signature:** _______________
