# QUIZO - plan d'action des 12 spécialistes

Date de l'audit : 4 octobre 2026. Ce document applique les 12 rôles présentés dans `شركتك كاملة AI .pdf` à QUIZO. Les rôles sont des méthodes de travail, pas des employés autonomes. Aucune campagne, prise de contact ou décision financière n'est lancée par ce document.

## Point de départ vérifié

- QUIZO permet de créer des quiz manuels ou à partir d'un document, de rejoindre une partie par code et d'animer des compétitions en direct (`README.md`, `src/App.tsx`). Le parcours principal est en français, avec d'autres traductions.
- L'ancienne page affichait une offre Pro à **50 MAD/an** et renvoyait vers Lemon Squeezy. L'audit du code n'a trouvé ni gestion d'abonnement, ni webhook, ni contrôle des droits Pro ; le propriétaire a confirmé que l'offre n'est pas opérationnelle. Le paiement et les promesses Pro ont donc été retirés de la page Tarifs. Le prix précédent reste une hypothèse interne, pas une offre disponible.
- Firebase Analytics est initialisé en production (`src/lib/firebase.ts`), mais aucun événement de conversion produit n'a été trouvé dans le frontend. Il n'y a donc pas de taux de conversion vérifié dans ce dossier.
- Le formulaire de contact affichait un succès après un délai local sans transmettre le message (`src/pages/Contact.tsx`). Son remplacement par l'ouverture explicite de la messagerie est une première correction ; il faudra mesurer si les demandes arrivent réellement.
- Les pages de confidentialité et de conditions indiquent `privacy@quizo.com` et `terms@quizo.com`. La propriété et la réception de ces boîtes ne sont pas établies par le dépôt. Leur contenu et les engagements commerciaux nécessitent une revue humaine.

## Décision de positionnement à valider

**Client initial proposé :** enseignants, formateurs et animateurs francophones au Maroc qui disposent déjà d'un cours et veulent lancer un quiz collectif sur téléphone. **Promesse à tester :** « Transformez votre cours en quiz, vérifiez les questions, puis lancez une partie par code. » Il s'agit d'une hypothèse, pas d'une preuve de demande. Les étudiants qui jouent sont les utilisateurs finaux ; l'enseignant ou l'établissement est le payeur potentiel.

Les offres concurrentes montrent que « PDF vers quiz » est déjà proposé par [Kahoot!](https://support.kahoot.com/hc/en-us/articles/40803785990675-How-to-generate-a-kahoot-with-AI) et [Wooclap](https://www.wooclap.com/en/ai-artificial-intelligence-future/). La différenciation de QUIZO doit donc être démontrée par son expérience de cours en français/arabe, la facilité d'animation, la qualité des corrections et un prix local compréhensible, plutôt que par la seule présence d'IA.

## Les 12 livrables

### 1. Business Strategist - marché et modèle

**Livrable :** une fiche client avec trois problèmes à tester : préparation des questions trop longue, participation difficile à suivre, correction collective peu pratique. Faire 8 entretiens avec des enseignants/formateurs et noter pour chacun la solution utilisée aujourd'hui, la fréquence des quiz, le budget et l'objection principale. **Décision :** choisir un seul segment prioritaire si au moins 5 entretiens confirment le même besoin et qu'au moins 3 acceptent un essai en classe. Ces seuils sont des critères de travail, pas des résultats observés.

### 2. Pricing Analyst - offre et prix

**Livrable :** comparer trois offres à proposer en entretien : gratuit avec limites vérifiées ; licence enseignant annuelle ; licence établissement sur devis. Pour chaque offre, calculer `marge brute = prix encaissé - frais de paiement - coût IA - hébergement marginal - support`. Tester l'intérêt pour 50 MAD/an sans le présenter comme prix validé par le marché. Avant toute remise en vente, implémenter et vérifier le checkout, l'activation Pro, les quotas et l'assistance annoncés.

### 3. Trend Researcher - veille utile

**Livrable :** une veille mensuelle sur quatre sujets : génération depuis supports de cours, contrôle humain des réponses IA, animation collective, rapports pédagogiques. Comparer QUIZO à [Kahoot!](https://kahoot.com/schools/plans/) et [Wooclap](https://www.wooclap.com/en/quiz-maker/) sur un scénario identique : importer un cours, corriger une question, lancer une session, lire les résultats. Consigner le temps, les frictions et les limites constatées, sans copier leur interface.

### 4. Instagram Curator - calendrier éditorial

**Livrable :** quatre semaines, deux contenus par semaine : (S1) vidéo « un cours devient un quiz » et carrousel « vérifier une question IA » ; (S2) démonstration d'une partie par code et astuce de correction ; (S3) mode animateur et exemple de retour après séance ; (S4) témoignage autorisé d'un enseignant et FAQ. Chaque contenu renvoie vers une seule action mesurable : créer un quiz d'essai. Aucun témoignage, statistique d'élèves ou capture de classe sans accord.

### 5. LinkedIn Content Creator - trois brouillons

1. « Préparer un quiz à partir d'un cours ne devrait pas demander de recopier chaque question. Sur QUIZO, l'IA propose un brouillon, l'enseignant vérifie, puis la classe rejoint la partie avec un code. Nous cherchons des enseignants pour tester ce parcours en conditions réelles. »
2. « Ce que nous voulons mesurer pendant nos premiers essais : temps de préparation, facilité de rejoindre la partie et utilité de la correction. Si vous animez des cours, quel est le point qui vous ralentit le plus aujourd'hui ? »
3. « Une bonne question générée par IA reste une proposition. Avant de la poser à une classe, il faut vérifier la réponse et l'explication. C'est le contrôle que nous voulons rendre simple dans QUIZO. »

Ces textes sont des brouillons. Les exemples de résultats devront venir de tests réels avant publication.

### 6. Growth Hacker - trois expériences

| Expérience | Changement limité | Mesure principale | Condition d'arrêt |
| --- | --- | --- | --- |
| Première création | Montrer un exemple de quiz avant inscription | Visiteurs qui démarrent puis terminent un premier quiz | Aucun gain après un échantillon défini à l'avance |
| Première partie | Expliquer le code de participation au moment du partage | Créateurs qui lancent une session avec au moins un participant | Hausse des erreurs d'entrée de code |
| Retour enseignant | Proposer un retour court après la première session | Réponses exploitables / sessions terminées | Taux de plainte ou abandon en hausse |

Avant de tester : définir les événements `signup_complete`, `quiz_created`, `live_started`, `first_participant_joined`, `session_completed` avec consentement et minimisation des données. Ne pas annoncer de pourcentage de croissance sans données.

### 7. Outbound Strategist - recherche de premiers pilotes

**Cible :** 20 enseignants ou responsables pédagogiques dont la matière et le format de cours se prêtent à un quiz collectif. Préparer une fiche par contact avec établissement, cours, justification et canal de contact public. **Brouillon individuel :** « Bonjour [nom], j'ai vu que vous animez [cours]. QUIZO permet de transformer un support en quiz vérifiable et de lancer une partie par code. Seriez-vous disponible pour un essai de 15 minutes sur un support de votre choix ? Je recueillerai vos retours sur la préparation et l'animation. » Aucun message n'est envoyé sans décision explicite du propriétaire de QUIZO.

### 8. Proposal Strategist - offre pilote

**Proposition d'une page :** essai de 2 semaines avec un enseignant volontaire, un cours fourni par lui, une session animée et un entretien de retour. Livrables : quiz relu par l'enseignant, lien/code de session et synthèse des difficultés rencontrées. Définir par écrit qui peut voir les supports et les résultats, la durée de conservation, le support disponible, les fonctionnalités réellement actives et l'éventuel prix après l'essai. Éviter toute promesse de performance pédagogique non mesurée.

### 9. Financial Analyst - modèle de décision

**Entrées à relever chaque mois :** abonnements encaissés, frais Lemon Squeezy, coûts des fournisseurs IA par génération, Vercel/Render/Firebase/stockage, temps de support et remboursements. Calculer `revenu net = encaissements - remboursements - frais de paiement`, `marge brute = revenu net - coûts variables` et `point mort en abonnés = coûts fixes / marge brute par abonné` si la marge est positive. Scénarios à comparer : volume prévu, volume à -20 %, coût IA à +20 %. Aucun chiffre prévisionnel n'est ajouté tant que les entrées réelles ne sont pas connues.

### 10. Customer Service - réponse fiable

**Règle :** accuser réception seulement lorsqu'un vrai canal a pris le message en charge. La page contact ouvre maintenant la messagerie de l'utilisateur avec sujet et contenu préparés ; elle ne prétend plus avoir envoyé le message. Modèles de réponse à préparer pour : document illisible (demander type/taille et message d'erreur, jamais une clé API), code de partie invalide (demander code et heure, vérifier la session), problème de paiement (demander référence de commande, jamais données de carte). Escalader tout problème de données personnelles ou de paiement au propriétaire du produit.

### 11. Feedback Synthesizer - transformer les retours en décisions

**Tableau minimal :** date, segment, étape du parcours, citation ou résumé fidèle, fréquence, gravité, lien vers preuve, action, état. Classer les retours sous `création`, `qualité IA`, `partie live`, `prix`, `support`. Chaque semaine, choisir au plus trois problèmes en donnant priorité aux bugs bloquants et aux plaintes répétées. Aucune synthèse d'avis clients n'est possible actuellement : aucun corpus d'avis n'a été fourni.

### 12. Legal Document Review - liste de vérification

**À faire revoir par un professionnel :** identité et coordonnées de l'éditeur, exactitude des adresses `@quizo.com`, traitement des supports importés et des réponses d'élèves, sous-traitants IA, durée de conservation, suppression, modalités du plan payant, rétractation/remboursements applicables et cohérence avec le checkout. Le dépôt ne prouve pas que les boîtes légales existent ni que les droits Pro annoncés sont appliqués. Ce diagnostic produit n'est pas une validation juridique.

## Ordre de travail proposé

1. **Cette semaine :** corriger le contact fictif ; vérifier les boîtes de contact ; définir les cinq événements du tunnel ; spécifier les droits Pro avant toute remise en vente.
2. **Deux semaines :** faire 8 entretiens, un essai complet en classe, mesurer le temps de création et les erreurs rencontrées ; seulement ensuite choisir le message principal.
3. **Après validation :** publier les contenus avec preuves réelles, lancer une campagne de 20 contacts ciblés et tester l'offre pilote.

**Décisions réservées au propriétaire :** adresse de support, futurs tarifs Pro, budget marketing, accès aux données utilisateurs, publication des contenus et envoi de messages à des prospects.

Sources : PDF fourni par l'utilisateur ; [dépôt Agency Agents](https://github.com/msitarzewski/agency-agents) (méthode des rôles) ; pages officielles Kahoot! et Wooclap liées plus haut. Les instructions d'installation et exemples du PDF n'ont pas été exécutés.
