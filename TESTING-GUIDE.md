# 🧪 QUIZO - Guide de Test Complet des Fonctionnalités Collaboratives

**Date:** 31 Octobre 2025  
**Version:** 1.0  
**Environnement:** Production (Vercel + Render)

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Test 1: Création de Quiz avec IA](#test-1-création-de-quiz-avec-ia)
3. [Test 2: Création de Quiz Manuel](#test-2-création-de-quiz-manuel)
4. [Test 3: Partage de Quiz](#test-3-partage-de-quiz)
5. [Test 4: Rejoindre par Code](#test-4-rejoindre-par-code)
6. [Test 5: Dashboard Temps Réel](#test-5-dashboard-temps-réel)
7. [Test 6: Scénario Multi-Utilisateurs](#test-6-scénario-multi-utilisateurs)
8. [Test 7: Multi-langue + RTL](#test-7-multi-langue--rtl)
9. [Résultats Attendus](#résultats-attendus)
10. [Troubleshooting](#troubleshooting)

---

## ✅ Prérequis

### URLs de Production
- **Frontend:** https://quizo-ruddy.vercel.app
- **Backend:** https://quizo-nued.onrender.com

### Comptes de Test Requis
1. **Compte Créateur** (vous)
   - Email: Votre email Firebase
   - Utilisé pour créer et gérer les quiz

2. **Participants Anonymes** (pas de compte nécessaire)
   - Juste un nom et email pour rejoindre

### Navigateurs pour Tests Multi-Utilisateurs
- **Onglet 1:** Mode normal (Créateur connecté)
- **Onglet 2:** Mode navigation privée (Participant 1)
- **Onglet 3:** Mode navigation privée (Participant 2)
- **OU:** Différents navigateurs (Chrome, Firefox, Edge)

### Outils Recommandés
- Outil de capture d'écran pour documenter
- Bloc-notes pour noter les codes de partage
- Chronomètre (optionnel)

---

## 🧪 Test 1: Création de Quiz avec IA

### Objectif
Vérifier que la génération de quiz avec l'IA fonctionne correctement.

### Étapes

1. **Ouvrir l'application**
   ```
   URL: https://quizo-ruddy.vercel.app
   ```

2. **Se connecter**
   - Cliquez sur "Connexion" (ou icône utilisateur)
   - Entrez vos identifiants Firebase
   - Vérifiez que vous êtes connecté (avatar visible)

3. **Naviguer vers Create AI Quiz**
   - Cliquez sur "Create AI Quiz" dans la navbar
   - URL: https://quizo-ruddy.vercel.app/create-quiz

4. **Télécharger un document**
   - Glissez-déposez OU cliquez "Parcourir"
   - **Formats acceptés:** PDF, DOCX, TXT
   - **Taille max:** 10 MB
   - **Exemple:** Un fichier de cours (3-5 pages)

5. **Configurer le quiz**
   - **Modèle IA:** Sélectionnez "Gemini" (recommandé)
   - **Difficulté:** Choisissez "Moyen"
   - **Nombre de questions:** 10

6. **Générer le quiz**
   - Cliquez "Générer le quiz"
   - **Attendez:** 40-60 secondes
   - Observez la progression :
     - ⏳ Extraction du texte
     - ⏳ Génération des questions
     - ⏳ Validation des questions
     - ⏳ Sauvegarde du quiz

7. **Vérifier le résultat**
   - Vous êtes redirigé vers "My Quizzes"
   - Le nouveau quiz apparaît dans la liste
   - **Notez le titre du quiz**

### ✅ Résultats Attendus
- [x] Document uploadé avec succès
- [x] Génération complétée sans erreur
- [x] 10 questions générées
- [x] Quiz visible dans "My Quizzes"
- [x] Chaque question a au moins 2 options
- [x] Au moins une option est marquée correcte

### ❌ Erreurs Possibles
- **Timeout:** Backend Render endormi (attendre 1-2 min et réessayer)
- **Gemini API Error:** Quota dépassé (utiliser ChatGPT avec clé API)
- **File too large:** Réduire la taille du fichier

---

## 🧪 Test 2: Création de Quiz Manuel

### Objectif
Créer un quiz manuellement question par question.

### Étapes

1. **Naviguer vers Create Manual Quiz**
   - Cliquez "Create Manual Quiz" dans la navbar
   - URL: https://quizo-ruddy.vercel.app/create-manual-quiz

2. **Remplir le formulaire initial**
   ```
   Titre: "Quiz JavaScript Basique"
   Description: "Test sur les concepts JavaScript ES6"
   Catégorie: "Programmation"
   ```
   - Cliquez "Créer le quiz"

3. **Ajouter Question 1**
   ```
   Question: "Quelle est la différence entre let et var ?"
   
   Option 1: "let a un scope de bloc" ✅ (Correcte)
   Option 2: "var a un scope de bloc" ❌
   Option 3: "Aucune différence" ❌
   Option 4: "let est obsolète" ❌
   ```
   - Cliquez "Ajouter la question"

4. **Ajouter Question 2**
   ```
   Question: "Qu'est-ce qu'une arrow function ?"
   
   Option 1: "Une fonction anonyme" ✅
   Option 2: "Une boucle" ❌
   Option 3: "Un opérateur" ❌
   ```
   - Cliquez "Ajouter la question"

5. **Ajouter Question 3**
   ```
   Question: "Que retourne typeof [] ?"
   
   Option 1: "array" ❌
   Option 2: "object" ✅
   Option 3: "undefined" ❌
   Option 4: "null" ❌
   ```
   - Cliquez "Ajouter la question"

6. **Ajouter Question 4**
   ```
   Question: "Comment déclarer une constante ?"
   
   Option 1: "const x = 10" ✅
   Option 2: "constant x = 10" ❌
   Option 3: "final x = 10" ❌
   ```
   - Cliquez "Ajouter la question"

7. **Ajouter Question 5**
   ```
   Question: "Qu'est-ce que le hoisting ?"
   
   Option 1: "Élévation des déclarations" ✅
   Option 2: "Un framework" ❌
   Option 3: "Une méthode Array" ❌
   ```
   - Cliquez "Ajouter la question"

8. **Enregistrer le quiz**
   - Cliquez "Enregistrer le quiz"
   - Vérifiez la notification de succès
   - Vous êtes redirigé vers "My Quizzes"

9. **Vérifier le quiz créé**
   - Le quiz "Quiz JavaScript Basique" apparaît
   - **Notez ce quiz** (on va le partager ensuite)

### ✅ Résultats Attendus
- [x] Formulaire initial accepté
- [x] 5 questions ajoutées avec succès
- [x] Quiz enregistré dans Firestore
- [x] Quiz visible dans "My Quizzes"
- [x] Badge "Manuel" visible sur la carte du quiz
- [x] `isManual: true` dans Firestore

### ❌ Erreurs Possibles
- **Validation error:** Au moins 2 options requises
- **No correct answer:** Au moins une option doit être correcte
- **Empty question:** Le texte de la question est obligatoire

---

## 🧪 Test 3: Partage de Quiz

### Objectif
Partager le quiz manuel créé et obtenir un code de partage.

### Étapes

1. **Aller dans History**
   - Cliquez "History" dans la navbar
   - URL: https://quizo-ruddy.vercel.app/history

2. **Localiser le quiz**
   - Onglet "My Quizzes" (devrait être actif)
   - Trouvez "Quiz JavaScript Basique"

3. **Ouvrir la boîte de partage**
   - Cliquez sur l'icône **Share** (🔗) sur la carte du quiz
   - Une modal s'ouvre

4. **Copier le code de partage**
   - **Code affiché:** Ex. `JS2025` (6 caractères alphanumériques)
   - Cliquez "Copy Code"
   - **NOTEZ CE CODE** dans un bloc-notes
   
5. **Copier le lien de partage**
   - **Lien affiché:** `https://quizo-ruddy.vercel.app/join/JS2025`
   - Cliquez "Copy Link"

6. **Vérifier dans Firestore** (optionnel)
   ```
   Firebase Console → Firestore → quizzes/{quizId}
   
   Champs à vérifier:
   - shareCode: "JS2025"
   - visibility: "shared"
   - sharedAt: timestamp
   ```

### ✅ Résultats Attendus
- [x] Modal de partage s'ouvre
- [x] Code de 6 caractères généré
- [x] Lien complet affiché
- [x] Copie dans le presse-papiers fonctionne
- [x] Quiz passe de "private" à "shared"

### 📝 À Noter
```
CODE DE PARTAGE: ___________ (notez-le ici)
LIEN DE PARTAGE: ___________
```

---

## 🧪 Test 4: Rejoindre par Code

### Objectif
Rejoindre le quiz partagé en tant que participant anonyme.

### Étapes

1. **Ouvrir un nouvel onglet en navigation privée**
   - **Chrome:** Ctrl+Shift+N
   - **Firefox:** Ctrl+Shift+P
   - **Edge:** Ctrl+Shift+N

2. **Aller sur Join by Code**
   ```
   URL: https://quizo-ruddy.vercel.app/join
   ```

3. **Remplir le formulaire**
   ```
   Code de partage: [VOTRE CODE NOTÉ] (ex: JS2025)
   Votre nom: Alice Dupont
   Votre email: alice.dupont@test.com
   ```

4. **Rejoindre le quiz**
   - Cliquez "Rejoindre le Quiz"
   - Attendez la validation

5. **Vérifier la page du quiz**
   - Vous êtes redirigé vers `/quiz/:quizId`
   - Titre du quiz affiché: "Quiz JavaScript Basique"
   - 5 questions listées
   - Bouton "Commencer" visible

6. **Vérifier dans Firestore** (optionnel)
   ```
   Firestore → participants → [nouveau document]
   
   Champs:
   - participantName: "Alice Dupont"
   - participantEmail: "alice.dupont@test.com"
   - quizId: [l'ID du quiz]
   - status: "joined"
   - joinedAt: timestamp
   ```

### ✅ Résultats Attendus
- [x] Formulaire accepté
- [x] Redirection vers la page du quiz
- [x] Participant créé dans Firestore
- [x] Nom du participant affiché
- [x] Quiz prêt à être démarré

### ❌ Erreurs Possibles
- **Invalid code:** Code expiré ou incorrect
- **Quiz not found:** Quiz supprimé
- **Email already used:** Utiliser un autre email

---

## 🧪 Test 5: Dashboard Temps Réel

### Objectif
Surveiller les participants en temps réel depuis le dashboard créateur.

### Étapes

1. **Retourner à l'onglet créateur**
   - L'onglet normal (pas navigation privée)
   - Vous devez être connecté

2. **Ouvrir le Dashboard**
   - Allez dans "History"
   - Trouvez "Quiz JavaScript Basique"
   - Cliquez "View Dashboard" (icône 📊)
   - URL: https://quizo-ruddy.vercel.app/dashboard/:quizId

3. **Vérifier l'onglet Overview**
   ```
   Statistiques visibles:
   - Total Participants: 1
   - Active Participants: 1
   - Average Score: 0% (pas encore commencé)
   - Completion Rate: 0%
   ```

4. **Vérifier l'onglet Participants**
   ```
   Tableau avec:
   ┌─────────────┬──────────┬───────┬──────────┬──────────┐
   │ Nom         │ Email    │ Statut│ Score    │ Progress │
   ├─────────────┼──────────┼───────┼──────────┼──────────┤
   │ Alice Dupont│ alice... │ Joined│ 0/5      │ 0%       │
   └─────────────┴──────────┴───────┴──────────┴──────────┘
   ```

5. **Vérifier les mises à jour en temps réel**
   - **NE RAFRAÎCHISSEZ PAS la page**
   - Gardez le dashboard ouvert
   - Allez dans l'onglet participant (navigation privée)

6. **Dans l'onglet participant: Commencer le quiz**
   - Cliquez "Commencer le quiz"
   - Le timer démarre

7. **OBSERVER le dashboard (onglet créateur)**
   ```
   Le statut d'Alice devrait changer automatiquement:
   - Statut: "Joined" → "In Progress"
   - Timer commence à compter
   ```

8. **Dans l'onglet participant: Répondre à la Question 1**
   - Sélectionnez "let a un scope de bloc" ✅
   - Cliquez "Suivant"

9. **OBSERVER le dashboard**
   ```
   Mise à jour automatique:
   - Progress: 0% → 20% (1/5)
   - Current Question: 1 → 2
   ```

10. **Continuer à répondre aux questions**
    - Question 2: "Une fonction anonyme" ✅
    - Question 3: "object" ✅
    - Question 4: "const x = 10" ✅
    - Question 5: "Élévation des déclarations" ✅

11. **Soumettre le quiz**
    - Cliquez "Soumettre"
    - Page de résultats s'affiche

12. **OBSERVER le dashboard**
    ```
    Mise à jour finale:
    - Statut: "In Progress" → "Completed"
    - Score: 5/5 (100%)
    - Progress: 100%
    - Completion Rate: 100%
    ```

### ✅ Résultats Attendus
- [x] Dashboard affiche le participant
- [x] Statut change de "Joined" à "In Progress" automatiquement
- [x] Progression augmente en temps réel (20%, 40%, 60%, 80%, 100%)
- [x] Score final affiché quand terminé
- [x] Statistiques Overview mises à jour
- [x] Aucun rafraîchissement manuel nécessaire

### 🎯 Firestore Listeners Actifs
```javascript
// Le dashboard écoute:
1. Collection `participants` → filtre par quizId
2. Collection `attempts` → filtre par quizId
3. Mise à jour en temps réel via onSnapshot()
```

---

## 🧪 Test 6: Scénario Multi-Utilisateurs

### Objectif
Tester avec 3 participants simultanés.

### Configuration
- **Onglet 1:** Dashboard créateur (mode normal, connecté)
- **Onglet 2:** Participant Alice (navigation privée)
- **Onglet 3:** Participant Bob (autre navigateur OU 2ème navigation privée)
- **Onglet 4:** Participant Charlie (autre navigateur)

### Étapes

1. **Créateur: Ouvrir le Dashboard**
   - Onglet 1: Dashboard du quiz "Quiz JavaScript Basique"

2. **Participant Alice: Rejoindre**
   - Onglet 2: https://quizo-ruddy.vercel.app/join
   - Code: [VOTRE CODE]
   - Nom: Alice Dupont
   - Email: alice@test.com
   - **Ne commencez PAS encore**

3. **Participant Bob: Rejoindre**
   - Onglet 3: https://quizo-ruddy.vercel.app/join
   - Code: [VOTRE CODE]
   - Nom: Bob Martin
   - Email: bob@test.com
   - **Ne commencez PAS encore**

4. **Participant Charlie: Rejoindre**
   - Onglet 4: https://quizo-ruddy.vercel.app/join
   - Code: [VOTRE CODE]
   - Nom: Charlie Leroy
   - Email: charlie@test.com
   - **Ne commencez PAS encore**

5. **Vérifier Dashboard (Onglet 1)**
   ```
   Participants Tab devrait afficher:
   ┌──────────────┬─────────────────┬────────┬───────┬──────────┐
   │ Nom          │ Email           │ Statut │ Score │ Progress │
   ├──────────────┼─────────────────┼────────┼───────┼──────────┤
   │ Alice Dupont │ alice@test.com  │ Joined │ 0/5   │ 0%       │
   │ Bob Martin   │ bob@test.com    │ Joined │ 0/5   │ 0%       │
   │ Charlie Leroy│ charlie@test.com│ Joined │ 0/5   │ 0%       │
   └──────────────┴─────────────────┴────────┴───────┴──────────┘
   
   Overview:
   - Total Participants: 3
   - Active: 3
   ```

6. **Alice: Commencer le quiz (Onglet 2)**
   - Cliquez "Commencer"
   - Répondez rapidement aux questions
   - **Objectif:** 5/5 (100%)

7. **Bob: Commencer 10 secondes après (Onglet 3)**
   - Cliquez "Commencer"
   - Répondez lentement
   - **Objectif:** 3/5 (60%) - faites 2 erreurs volontaires

8. **Charlie: Commencer 20 secondes après (Onglet 4)**
   - Cliquez "Commencer"
   - Répondez très lentement
   - **Objectif:** 2/5 (40%) - faites 3 erreurs

9. **Observer Dashboard en continu (Onglet 1)**
   ```
   Mise à jour progressive:
   
   T+10s:
   │ Alice Dupont │ In Progress │ 2/5 │ 40%  │
   │ Bob Martin   │ Joined      │ 0/5 │ 0%   │
   │ Charlie Leroy│ Joined      │ 0/5 │ 0%   │
   
   T+20s:
   │ Alice Dupont │ In Progress │ 4/5 │ 80%  │
   │ Bob Martin   │ In Progress │ 1/5 │ 20%  │
   │ Charlie Leroy│ Joined      │ 0/5 │ 0%   │
   
   T+30s:
   │ Alice Dupont │ Completed   │ 5/5 │ 100% │
   │ Bob Martin   │ In Progress │ 3/5 │ 60%  │
   │ Charlie Leroy│ In Progress │ 1/5 │ 20%  │
   
   T+60s:
   │ Alice Dupont │ Completed   │ 5/5 │ 100% │
   │ Bob Martin   │ Completed   │ 3/5 │ 60%  │
   │ Charlie Leroy│ In Progress │ 4/5 │ 80%  │
   
   T+90s: (Tous terminés)
   │ Alice Dupont │ Completed   │ 5/5 │ 100% │
   │ Bob Martin   │ Completed   │ 3/5 │ 60%  │
   │ Charlie Leroy│ Completed   │ 2/5 │ 40%  │
   
   Overview final:
   - Average Score: 66.7%
   - Completion Rate: 100%
   ```

### ✅ Résultats Attendus
- [x] 3 participants rejoignent successivement
- [x] Dashboard affiche les 3 immédiatement
- [x] Statuts changent en temps réel
- [x] Progression individuelle visible
- [x] Scores différents affichés
- [x] Statistiques Overview précises
- [x] Pas de conflits ou bugs

---

## 🧪 Test 7: Multi-langue + RTL

### Objectif
Vérifier que le système multi-langue fonctionne sur toutes les pages traduites.

### Pages à Tester
1. ✅ Navbar
2. ✅ Hero (Page d'accueil)
3. ✅ CreateQuiz
4. ✅ QuizForm
5. ✅ JoinQuiz
6. ✅ Footer

### Langues à Tester
1. 🇫🇷 Français (par défaut)
2. 🇬🇧 English
3. 🇸🇦 العربية (avec RTL)
4. 🇪🇸 Español
5. 🇨🇳 中文

### Étapes - Test Français → English

1. **Page d'accueil**
   - URL: https://quizo-ruddy.vercel.app
   - Langue actuelle: Français
   - Vérifiez: "QUIZO - Transformez Vos Cours en QCM Interactifs"

2. **Changer la langue**
   - Cliquez sur le sélecteur de langue (🌐 Français)
   - Sélectionnez "🇬🇧 English"

3. **Vérifier les changements**
   ```
   Navbar:
   - "Accueil" → "Home"
   - "Créer un Quiz IA" → "Create AI Quiz"
   - "Rejoindre par Code" → "Join by Code"
   
   Hero:
   - "Apprentissage Intelligent" → "Intelligent Learning"
   - "Transformez Vos Cours" → "Transform Your Courses"
   - "Commencer" → "Get Started"
   - "En savoir plus" → "Learn More"
   
   Features:
   - "Fonctionnalités Clés" → "Key Features"
   - "Génération IA de Questions" → "AI Question Generation"
   ```

### Étapes - Test RTL (Arabe)

1. **Changer en arabe**
   - Cliquez sur le sélecteur de langue
   - Sélectionnez "🇸🇦 العربية"

2. **Vérifier RTL automatique**
   ```
   Layout:
   - Direction: rtl (right-to-left)
   - Texte aligné à droite
   - Logo QUIZO à droite
   - Menu à droite
   - Sélecteur de langue à gauche
   ```

3. **Vérifier les traductions**
   ```
   Navbar:
   - "الصفحة الرئيسية" (Accueil)
   - "إنشاء اختبار بالذكاء الاصطناعي" (Create AI Quiz)
   
   Hero:
   - "التعلم الذكي" (Intelligent Learning)
   - "حوّل دوراتك إلى اختبارات تفاعلية"
   ```

4. **Vérifier les icônes RTL**
   ```
   - Flèches inversées (← devient →)
   - Icônes transformées (scaleX(-1))
   - Dropdowns s'ouvrent à gauche
   ```

5. **Tester la persistance**
   - Rafraîchir la page (F5)
   - Langue reste en arabe (localStorage)
   - RTL toujours actif

### Étapes - Tester sur Join by Code (Arabe)

1. **Aller sur Join by Code**
   - URL: https://quizo-ruddy.vercel.app/join
   - Langue: Arabe (déjà sélectionnée)

2. **Vérifier le formulaire RTL**
   ```
   - Titre: "انضم إلى الاختبار"
   - Labels alignés à droite
   - Inputs avec texte à droite
   - Bouton "انضم إلى الاختبار" (Rejoindre)
   ```

3. **Remplir en arabe (optionnel)**
   ```
   Nom: محمد
   Email: mohamed@test.com
   Code: [VOTRE CODE]
   ```

### ✅ Résultats Attendus - Multi-langue
- [x] Sélecteur de langue visible dans navbar
- [x] 8 langues disponibles avec drapeaux
- [x] Changement instantané sans rafraîchissement
- [x] Toutes les pages traduites changent
- [x] Langue sauvegardée dans localStorage
- [x] Persistance après rafraîchissement

### ✅ Résultats Attendus - RTL (Arabe)
- [x] Direction RTL appliquée automatiquement
- [x] Texte aligné à droite
- [x] Menus positionnés à droite
- [x] Icônes inversées correctement
- [x] Formulaires fonctionnent en RTL
- [x] Pas de chevauchement ou bugs visuels
- [x] Boutons et cartes alignés correctement

---

## 📊 Résultats Attendus - Récapitulatif

### Fonctionnalités Core
| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Création Quiz IA | ✅ | Gemini actif, timeout 180s |
| Création Quiz Manuel | ✅ | Builder complet |
| Partage Quiz | ✅ | Code 6 caractères |
| Rejoindre par Code | ✅ | Anonyme accepté |
| Dashboard Temps Réel | ✅ | onSnapshot actif |
| Multi-participants | ✅ | Jusqu'à 100+ |
| Multi-langue | ✅ | 8 langues |
| RTL (Arabe) | ✅ | CSS complet |

### Performance
| Métrique | Cible | Notes |
|----------|-------|-------|
| Génération IA | < 60s | Gemini rapide |
| Temps réel latency | < 2s | Firestore onSnapshot |
| Load time (frontend) | < 3s | Vercel CDN |
| Backend wake-up | < 60s | Render free tier |

### Couverture Traduction
| Page/Component | Statut | Langues |
|----------------|--------|---------|
| Navbar | ✅ 100% | 8/8 |
| Hero | ✅ 100% | 8/8 |
| CreateQuiz | ✅ 100% | 8/8 |
| QuizForm | ✅ 100% | 8/8 |
| JoinQuiz | ✅ 100% | 8/8 |
| Footer | ✅ 100% | 8/8 |
| Results | ❌ 0% | 0/8 |
| History | ❌ 0% | 0/8 |
| Dashboard | ❌ 0% | 0/8 |
| Quiz | ❌ 0% | 0/8 |
| Auth | ❌ 0% | 0/8 |

**Total:** ~47% (7/15 composants)

---

## 🐛 Troubleshooting

### Problème 1: Backend Timeout
**Symptôme:** Génération de quiz échoue après 30s

**Cause:** Backend Render endormi (free tier)

**Solution:**
1. Ouvrir https://quizo-nued.onrender.com/health
2. Attendre 60 secondes
3. Vérifier `{"status": "healthy"}`
4. Réessayer la génération

### Problème 2: Code de partage invalide
**Symptôme:** "Quiz not found" en rejoignant

**Causes possibles:**
- Code expiré (quiz supprimé)
- Typo dans le code
- Quiz pas encore synchronisé

**Solution:**
1. Vérifier le code (case-sensitive)
2. Régénérer le partage
3. Attendre 5s et réessayer

### Problème 3: Dashboard ne se met pas à jour
**Symptôme:** Statut participant reste "Joined"

**Causes possibles:**
- Firestore rules bloquent
- Listener non actif
- Participant pas vraiment connecté

**Solution:**
1. Rafraîchir le dashboard (F5)
2. Vérifier Firestore Console
3. Check network tab (DevTools)
4. Vérifier que participant a bien cliqué "Commencer"

### Problème 4: RTL cassé en arabe
**Symptôme:** Texte à gauche au lieu de droite

**Causes possibles:**
- rtl.css pas chargé
- `dir="rtl"` pas appliqué sur <html>

**Solution:**
1. Vérifier DevTools Elements: `<html dir="rtl">`
2. Vérifier DevTools Sources: rtl.css chargé
3. Rafraîchir avec Ctrl+Shift+R (hard refresh)
4. Vider le cache navigateur

### Problème 5: Langue ne persiste pas
**Symptôme:** Retour au français après rafraîchissement

**Causes possibles:**
- localStorage désactivé
- Navigation privée (selon navigateur)

**Solution:**
1. Vérifier DevTools → Application → Local Storage
2. Chercher clé `i18nextLng`
3. Utiliser mode normal (pas navigation privée)

### Problème 6: Gemini API quota dépassé
**Symptôme:** "Quota exceeded" ou "429 Too Many Requests"

**Solution:**
1. Utiliser ChatGPT à la place :
   - Sélectionner "ChatGPT" dans le dropdown
   - Entrer votre clé API OpenAI
2. OU attendre 24h (quota quotidien)

---

## 📸 Screenshots à Prendre

Pour documenter vos tests, prenez des screenshots de :

1. ✅ Quiz créé avec IA dans "My Quizzes"
2. ✅ Modal de partage avec code
3. ✅ Formulaire "Join by Code" rempli
4. ✅ Dashboard avec 3 participants actifs
5. ✅ Dashboard avec participants terminés (scores)
6. ✅ Page d'accueil en arabe (RTL)
7. ✅ Sélecteur de langue avec 8 langues
8. ✅ Résultats de quiz (participant)

---

## ✅ Checklist Finale

### Avant de déclarer le test réussi :
- [ ] Quiz IA créé avec succès (10 questions)
- [ ] Quiz manuel créé avec 5 questions
- [ ] Code de partage généré et copié
- [ ] 1 participant a rejoint via code
- [ ] Dashboard affiche le participant
- [ ] Participant a complété le quiz
- [ ] Dashboard affiche score final
- [ ] 3 participants simultanés testés
- [ ] Dashboard temps réel fonctionne
- [ ] 5 langues testées (FR, EN, ES, AR, ZH)
- [ ] RTL arabe fonctionne correctement
- [ ] Langue persiste après refresh
- [ ] Aucune erreur console

### Signature
```
Testé par: _______________
Date: 31 Octobre 2025
Environnement: Production (Vercel + Render)
Résultat global: ☐ PASS  ☐ FAIL
```

---

## 🚀 Prochaines Étapes (Après Tests)

Si tous les tests passent :
1. ✅ Documenter les résultats
2. ✅ Créer des GIFs de démo
3. ⏳ Traduire les 8 pages restantes (Results, History, etc.)
4. ⏳ Créer des tests automatisés (Cypress/Playwright)
5. ⏳ Optimiser les performances
6. ⏳ Ajouter analytics (Plausible/Google Analytics)

---

**Bonne chance pour vos tests ! 🎉**

Si vous rencontrez des problèmes, référez-vous à la section Troubleshooting ou contactez le support.
