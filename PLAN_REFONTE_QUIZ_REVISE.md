# ESTS-QUIZ — Plan de refonte révisé

Date : 5 septembre 2026. Statut : proposition technique et produit, non implémentée.

Ce document ajuste la mission jointe en 59 sections. Il conserve son périmètre fonctionnel, mais corrige ses dépendances et précise les comportements ambigus. Les lots ci-dessous remplacent l'ancien ordonnancement P0–P3. Les exigences non explicitement modifiées restent applicables.

## 1. Avis d'architecture

La direction est bonne : un studio, une version publiée immuable, une session pilotée par le serveur et des interfaces distinctes. Le problème principal du plan est son ordre : la séparation quiz/version/session, la validation et les permissions sont des prérequis du scoring fiable, pas des travaux à reporter après lui.

Je recommande une évolution progressive de React/Vite et Firestore, avec un noyau métier TypeScript testable et une API serveur dédiée. Une première tranche doit fonctionner de bout en bout avec deux joueurs avant d'étendre le studio et les animations. La capacité de 100 joueurs reste un critère à mesurer, pas une promesse acquise par le choix d'un hébergeur.

## 2. Ce que le dépôt confirme

Les constats suivants viennent du code local. Ils ne prouvent pas que les mêmes règles sont actuellement déployées sur Firebase.

| Constat | Référence | Conséquence |
|---|---|---|
| Calcul live dans un effet React à la révélation | `src/pages/Competition.tsx`, calcul `base = 1000` | Le délai de révélation influence le bonus ; le poids est ignoré |
| Pourcentage réécrit dans le même champ `score` à la fin | `src/services/participantService.ts`, `submitCompetitionAttempt` | Classement intermédiaire et résultat final incohérents |
| Mise à jour des participants et tentatives autorisée à leur utilisateur sans liste stricte de champs | `firestore.rules` | Un joueur peut modifier ses propres valeurs sensibles |
| Lecture des questions avec `isCorrect` par le joueur | `src/pages/Competition.tsx` | Le corrigé peut être inspecté avant de répondre |
| Nouvelle tentative créée au chargement | `createCompetitionAttempt` dans `Competition.tsx` | Reload et multi-onglets peuvent multiplier les tentatives |
| Durée complète réinitialisée au chargement asynchrone | `src/pages/QuizSession.tsx` | Un reload peut accorder du temps supplémentaire |
| Lien live copié vers `/join-quiz/` | `src/components/WaitingRoom.tsx` | Mauvais parcours de participation |
| `team` converti en `classic` | `src/pages/ManualQuizBuilder.tsx` | Fonctionnalité annoncée sans moteur équipe |
| Permissions `list` très larges | `firestore.rules` | Exposition potentielle des quiz, résultats et soumissions |
| Tout `/api/*` redirigé vers Render | `vercel.json` | Ajouter un fichier API live ne suffit pas : le routage doit changer |

Architecture actuelle : React 18, Vite, TypeScript, Firebase Auth et Firestore, services CRUD côté navigateur, backend Flask distant pour les fonctions IA/extraction. Les collections concernées comprennent `quizzes`, `competitions`, leurs sous-collections `participants` et `attempts`, `shareCodes`, `quizResults` et `submissions`.

Le flux actuel est principalement navigateur → Firestore → listeners des autres navigateurs. Les services `manualQuizCore`, `crudService`, `competitionService` et `participantService` centralisent une partie des accès, mais des décisions critiques restent dans les pages.

Réutiliser : identité sombre/cuivre, composants Radix/shadcn, formulaires, i18n, graphiques Recharts et primitives d'animation existantes. Remplacer progressivement les calculs UI, écritures de scores, joins dupliqués et chargements complets de tentatives. Ne supprimer un service ancien qu'après vérification de ses consommateurs.

L'analyse visuelle déjà réalisée ne couvre pas tous les écrans : builder complet, joueur, animateur, projecteur et formats mobiles demandent encore une inspection dans le navigateur. Les propositions graphiques ci-dessous sont donc des spécifications à vérifier, pas des résultats de tests visuels.

## 3. Changements majeurs au plan initial

1. Passer quiz/version/session, séparation du corrigé et validation serveur en P0.
2. Traiter accessibilité, clavier, focus et reduced-motion dès la création des composants.
3. Séparer résultat de réponse et état de connexion : une déconnexion n'est pas une réponse incorrecte.
4. Ajouter une unicité métier par tentative et question, en plus de `submissionId`.
5. Versionner aussi les règles de score, les règles de session et l'algorithme de départage.
6. Distinguer calcul privé du score et publication du score : les bonus peuvent révéler la correction avant la phase autorisée.
7. Ajouter une phase de finalisation récupérable avant le résultat définitif.
8. Définir les pauses, extensions, tentatives multiples et arrivées tardives avant l'implémentation.
9. Réduire les lectures et écritures du live ; un agrégat unique modifié à chaque réponse est un point de contention.
10. Livrer une tranche complète et testée avant le studio enrichi ; conserver audio/vidéo, bibliothèque et PDF avancé en lots tardifs.

## 4. Architecture cible

Conserver le frontend React/Vite. Utiliser Firebase Auth pour l'identité, Firestore pour la persistance et la diffusion, et une API Node/TypeScript sur Vercel comme choix initial à valider par une mesure de latence et les droits d'accès serveur disponibles. Render garde les traitements IA/extraction.

Les commandes passent par l'API ; les navigateurs écoutent seulement les vues Firestore autorisées. Le serveur vérifie identité, permissions, règles et transitions. Les bibliothèques serveur qui accèdent à Firestore avec des privilèges administratifs doivent appliquer ces contrôles elles-mêmes.

Réserver `/api/live/*` au moteur live et conserver un routage explicite des routes Flask existantes. Vérifier également les erreurs API JSON et les liens profonds SPA. Aucune migration vers Next.js, aucun deuxième système de synchronisation ne sont nécessaires pour cette première version.

Organisation logique à adapter aux dossiers existants :

- `domain/quiz` : schémas, validation et compatibilité des modes.
- `domain/session` : machine à états et règles de commandes.
- `domain/scoring` : calcul pur, départage et invariants.
- `server/live` : authentification, transactions, permissions et projections.
- `services/liveClient` et hooks : commandes, abonnement, reprise et file locale.
- composants partagés : QuestionStage, AnswerOption, QuestionTimer, AnswerFeedback, GameScore, StreakIndicator, Leaderboard, ConnectionStatus.

La preview utilise ces composants et les fonctions pures avec un adaptateur local en mémoire. Elle ne dispose pas du chemin d'écriture des statistiques réelles.

## 5. Données, publication et confidentialité

| Objet | Contenu et accès |
|---|---|
| Quiz | Métadonnées et brouillon, accessibles aux personnes autorisées à éditer |
| Questions du brouillon | Documents individuels avec identifiants stables, ordre et révision |
| Version publiée | Manifeste immuable, questions figées, empreinte et version du schéma |
| Corrigés de version | Documents privés, séparés du contenu distribué |
| Session | Référence de version, règles figées, mode, état, échéances et révision |
| Participant/tentative | Identité privée, tentative active, progression et cumuls autoritatifs |
| Réponse | Une décision par tentative/question, données nécessaires à l'audit |
| Vue joueur | Question autorisée, accusé de réception et résultats publiables |
| Vue projecteur/classement | Données publiques minimales, aucun email ni corrigé anticipé |
| Agrégats et journal | Statistiques dérivées et commandes de session auditables |

Ne pas stocker tout le quiz enrichi dans un document sans limite de taille. Les médias sont des références de fichiers. La publication construit une version complète depuis une révision cohérente du brouillon, vérifie son intégrité puis la rend disponible. Une session ne peut jamais référencer une version partiellement écrite.

La publication en deux étapes doit tolérer une interruption et nettoyer les versions incomplètes. L'historique publié est immuable ; un correctif produit une nouvelle version. Ne pas distribuer toutes les questions futures au joueur live. Séparer également les explications lorsqu'elles dévoilent la réponse.

## 6. Contrat des réponses et score

Le client fournit `sessionId`, `questionId`, `selectedOptionId` et `submissionId`. Le serveur retrouve la tentative active et le participant depuis l'identité authentifiée. Il refuse les champs de score, les options inconnues et les états incompatibles.

Deux protections complémentaires :

- Une répétition du même `submissionId`, avec le même contenu, retourne le même accusé sans seconde attribution.
- La clé métier tentative/question interdit une deuxième réponse verrouillée, même avec un autre `submissionId`. Réutiliser un identifiant avec un contenu différent retourne un conflit explicite.

L'enregistrement de la réponse et la mise à jour des cumuls du participant sont atomiques. Les transactions peuvent être rejouées : aucun effet externe, tirage aléatoire ou notification dans leur callback. L'heure de réception utilisée est capturée côté serveur et sa convention est testée face aux fermetures concurrentes.

Conserver la formule demandée :

```text
base = weight × 100
ratio = clamp(1 − activeResponseTimeMs / scoringTimeLimitMs, 0, 1)
speedBonus = base × 0,50 × ratio
streakBonus = base × 0,10 × min(previousStreak, 3)
awardedGamePoints = correct ? Math.round(base + speedBonus + streakBonus) : 0
pedagogicalScore = earnedWeight / possibleWeight × 100
```

Arrondir une seule fois les points attribués. Conserver les poids obtenus/possibles pour les calculs exacts ; arrondir le pourcentage seulement pour l'affichage. Une erreur ou un timeout réinitialise la série. Le test de référence reste **320 points** pour poids 2, durée 20 s, réponse 4 s et série précédente 2.

Le détail affiché doit totaliser les points réellement attribués même quand les bonus ont des décimales. Stocker `scoringVersion` et les paramètres nécessaires à une reproduction exacte.

Au moment de répondre, retourner « enregistrée » sans révéler `correct`, bonus ou nouveau total si la correction est différée. Publier ces informations à la révélation seulement.

Départage : points de jeu, bonnes réponses, score pédagogique exact, temps cumulé, date de fin, puis identifiant stable pour une égalité totale. Les absences ne valent pas zéro milliseconde dans le temps cumulé : elles utilisent la durée de référence pour éviter de favoriser l'abstention. Le rang doit être attribué par la même logique côté serveur ; trier une table ne recalcule pas les rangs.

## 7. Règles des modes et cas limites

| Sujet | Décision recommandée |
|---|---|
| Teacher-led classé | Première réponse acceptée verrouillée, une tentative par participant, correction différée |
| Entraînement | Réponse modifiable possible, feedback immédiat possible, pas de classement compétitif par défaut |
| Asynchrone classé | Progression et délais individuels serveur ; pas de bonus vitesse si les réponses restent modifiables |
| Mélange | Ordre des questions commun en live ; ordre des options propre au joueur possible, avec IDs stables |
| Arrivée tardive | Refusée par défaut en partie classée ; si autorisée, participation hors classement principal et couverture indiquée |
| Tentatives asynchrones multiples | Politique de classement figée : première, dernière ou meilleure ; jamais un choix implicite du dashboard |
| Reprise | Même identité et tentative ; changer de navigateur exige une identité récupérable, non un simple pseudo |

Ajouter une phase `closed` entre question et révélation, et `finalizing` avant `completed`. Chaque commande animateur contient un identifiant idempotent et une révision attendue : deux onglets ne peuvent pas avancer deux fois silencieusement.

Le temps visible se reconstruit depuis les échéances serveur et une estimation du décalage d'horloge. Le serveur refuse une nouvelle réponse lorsque `receivedAt >= deadlineAt`. La fermeture et la soumission concurrentes sont arbitrées par l'ordre transactionnel ; aucun timestamp fourni par le joueur ne peut antidater une réponse.

Pause : conserver le temps restant, bloquer les réponses, exclure les intervalles de pause du temps actif. Reprendre produit une nouvelle échéance serveur. Une pause laisse cependant du temps pour réfléchir : dans le profil classé strict, autoriser la pause entre questions seulement. Le profil pédagogique permet la pause pendant une question et journalise cette intervention.

Extension +5/+10 : augmenter le délai d'acceptation, garder le dénominateur du bonus vitesse initial. Les réponses déjà notées restent inchangées ; après la durée initiale, le bonus vitesse vaut zéro. Désactiver cette intervention dans le profil strict.

Ne pas dépendre d'un `setTimeout` serveur pour la correction. La deadline suffit à rendre une réponse tardive irrecevable même sans animateur connecté. La prochaine commande ou lecture d'état réconcilie la phase expirée. Si une transition visuelle automatique est exigée sans aucun client actif, prévoir un ordonnanceur durable explicitement budgété.

Les timeouts manquants sont matérialisés par une finalisation idempotente en lots récupérables. Le classement définitif n'est publié qu'après réconciliation de toutes les questions applicables. Les participants exclus conservent leur historique avec un statut d'exclusion ; ils ne disparaissent pas des preuves d'audit.

La présence est indicative : `lastSeenAt` et seuil documenté. Distinguer connecté récemment, connexion incertaine, réponse en attente et temps écoulé. Ne pas pénaliser une simple perte de heartbeat.

## 8. Performance et budget gratuit

Éviter une écriture du document de session ou d'un agrégat global à chaque réponse. Les réponses et cumuls individuels sont la vérité ; les statistiques sont reconstruisibles. Pour les compteurs live, utiliser des agrégats répartis si les mesures l'exigent, puis une consolidation exacte à la fermeture.

Le joueur écoute sa vue, la phase publique et les classements publiés. L'animateur reçoit les compteurs nécessaires. Aucun joueur ne télécharge toutes les tentatives ; le dashboard utilise pagination et agrégats. Les médianes exactes se calculent depuis les données finales, pas à partir d'une moyenne de moyennes.

Exemple de dimensionnement : 100 joueurs × 20 questions = 2 000 réponses. Si chaque réponse modifie un classement écouté par 100 joueurs, cela peut produire environ 200 000 livraisons de mises à jour, avant les autres lectures. Publier un classement à la fin de chaque question change fortement ce coût. Mesurer ensuite les opérations réellement facturables, les reconnexions et les lectures de règles.

Au 5 septembre 2026, la documentation Firestore indique notamment 50 000 lectures et 20 000 écritures gratuites par jour. Vercel Hobby est destiné à l'usage personnel non commercial. Render Free s'endort après 15 minutes sans trafic et son redémarrage peut prendre environ une minute. Ces conditions justifient la séparation du live et des traitements Flask, sans garantir une latence constante sur le gratuit.

Ne pas activer une facturation pour respecter ce plan. Avant mise en service : vérifier le plan réellement utilisé, l'éligibilité, la région Firestore, les quotas et les accès serveur. Si le budget gratuit est insuffisant, limiter les sessions simultanées, réduire la fréquence de publication et proposer un mode pédagogique sans vitesse. Ne jamais basculer silencieusement les scores vers un autre stockage.

## 9. Studio et publication

Conserver les quatre étapes, mais nommer l'étape Règles « Paramètres de session par défaut » : ce sont des préférences copiées au lancement, et non le contenu immuable lui-même.

Desktop : liste à gauche, édition centrale prioritaire, panneau contextuel à droite repliable. L'assistant IA est fermé par défaut et ne masque pas les réglages utiles. À largeur intermédiaire, passer à deux panneaux. Mobile : liste et éditeur distincts, réglages en drawer, actions principales accessibles sans couvrir les champs.

La barre supérieure affiche titre éditable, statut réel de sauvegarde, tester, vérifier et publier. L'écran de lancement permet de sélectionner une version et de relire les règles avant de créer la session.

Validation minimale dès P0 : question non vide, au moins deux options distinctes, exactement une bonne réponse, poids et durée valides, IDs uniques, limites de taille et compatibilité du mode. Un contenu de cinq ou six options peut être publié pour l'asynchrone, mais son lancement live est bloqué avec la liste précise des questions incompatibles.

Le studio enrichi ajoute duplication, déplacement clavier et drag-and-drop, suppression avec Undo, édition en masse, import avec prévisualisation des erreurs et export réel. Utiliser des documents de question et une révision attendue pour éviter les écrasements entre onglets.

Autosave après environ 800 ms d'inactivité, file d'écriture ordonnée, reprise locale et détection de conflit. « Enregistré » signifie accusé serveur reçu. Une version publiée n'est pas créée à chaque autosave. Undo/Redo agit sur le brouillon, jamais sur une session en cours.

Les textes de questions et options sont prioritaires. Images et formules suivent ; audio et vidéo viennent après validation des contraintes mobile, poids des fichiers, droits d'accès et échecs de chargement. Les imports, URLs et contenus enrichis doivent être validés ; éviter l'injection HTML et les formules exécutables dans les exports CSV.

## 10. Joueur, animateur et projecteur

Join unique : code normalisé, résolution serveur, contrôle actif/expiration, identité minimale et récupération de tentative. Un code désactivé ne doit jamais être réactivé par un fallback vers les anciens documents. Réserver les nouveaux codes atomiquement ; gérer un éventuel conflit entre codes historiques au lieu de choisir arbitrairement.

Lobby : QR généré localement, copie du lien vérifiée, règles lisibles, pseudonyme contrôlé, limite de participants atomique, verrouillage et exclusion. Ne pas présenter l'authentification anonyme comme une garantie contre plusieurs identités ; un contrôle d'identité renforcé est nécessaire pour un examen.

Joueur : numéro et texte de question dominants, timer secondaire lisible, réponses à grandes zones tactiles, lettre + forme + couleur, état d'envoi explicite. Montrer les points et la série sans concurrencer la lecture. Éviter de déplacer les boutons pendant l'interaction. Le feedback réseau ne doit jamais annoncer une réponse enregistrée avant confirmation.

Animateur : action principale dépendante de la phase, commandes secondaires regroupées, timer serveur, compteur de réponses distinct de la présence, état de finalisation et erreurs récupérables. Révéler doit fermer les réponses atomiquement. Protéger Terminer et Annuler contre les clics accidentels. Les raccourcis ignorent les champs, menus et dialogues actifs.

Projecteur : route séparée et autorisation de lecture limitée/révocable ; l'identifiant de session seul n'accorde aucun droit d'administration. Code et QR dans le lobby, grands textes pendant la question, distribution uniquement au moment permis, podium à la fin. Aucun email ni donnée privée.

Classement : top 5 et joueur courant, rang précédent/nouveau, points gagnés et écart. Publication par phase plutôt qu'à chaque réponse. Réserver l'animation de rang aux mises à jour définitives de la question.

## 11. Dashboard et indicateurs

Séparer onglets Vue d'ensemble, Questions, Participants et Sessions. Chaque graphique indique sa population, sa version de quiz, son mode et ses filtres. Ne pas fusionner les points de sessions aux règles différentes.

- Inscrits : participants uniques enregistrés dans la session.
- Présents : estimation récente de connexion, avec sa définition visible.
- Démarrés : participants ayant commencé une tentative.
- Terminés : participants ayant une tentative terminée selon la politique retenue.
- Taux de complétion des participants : participants terminés / participants démarrés. Afficher séparément un taux par tentative si utile.
- Réussite d'une question : bonnes réponses / participants éligibles à cette question, avec nombre de réponses et omissions explicites.
- Score pédagogique : poids obtenus / poids possibles ; afficher la progression séparément en cours de partie.
- Aucune donnée : afficher « — », pas un zéro inventé.

Les moyennes et médianes finales utilisent une population stable. Les comparaisons intersessions signalent les différences de version, d'ordre et de règles. Ne pas présenter une corrélation de difficulté comme une conclusion pédagogique certaine.

Exports CSV participants/réponses/anonymisés dès le lot dashboard, avec les mêmes filtres et définitions que l'écran. PDF synthétique ensuite. Limiter les données personnelles aux besoins réels, prévoir conservation et suppression, et retirer les médias locaux/cache privé lors d'une déconnexion utilisateur si nécessaire.

## 12. Animation et accessibilité

Conserver cuivre/orange pour l'identité ; utiliser les couleurs de réponse seulement pour les choix. Prévoir contraste lisible, texte long, arabe RTL, focus visible et navigation clavier dès les composants de base.

Animations retenues : transition 220–300 ms, cascade 40–60 ms si elle ne retarde pas l'accès aux réponses, sélection légère, feedback correct inférieur à une seconde, compteur de points et déplacement de rang. Une animation ne retarde jamais le début réel de la fenêtre de réponse ; prévoir un compte à rebours serveur commun avant l'ouverture.

Pas de rebonds permanents ni d'animation répétée au reload. Confettis limités aux événements marquants, sons activés volontairement et préférence persistée. Avec reduced-motion, supprimer déplacements importants et confettis, conserver un changement d'état instantané ou un fondu court. Ne pas annoncer chaque tick du timer aux lecteurs d'écran.

## 13. Ordre de livraison et critères de passage

| Lot | Travail | Critère avant de poursuivre |
|---|---|---|
| 0 — Référence et contrats | Tests isolés, inventaire données/routes, décisions de score, états et permissions | Échecs actuels reproduits et comportements attendus écrits |
| 1 — Fondations P0 | Types, validation, versions privées/publiques, API authentifiée, règles, routage | Joueur incapable de lire un corrigé ou d'écrire un score ; version cohérente |
| 2 — Partie complète P0 | Join, reprise, réponse atomique, timer, révélation, finalisation, classement | Deux joueurs, plusieurs questions, points exacts, reload et retry sans duplication |
| 3 — Résilience et charge | Commandes concurrentes, timeouts, limites, agrégats, instrumentation | 100 joueurs en staging ; aucun double score, agrégats finaux réconciliés |
| 4 — Expériences live P1 | Lobby/QR, console, projecteur, preview, accessibilité de base | Parcours utilisable mobile/clavier sans accès privé indu |
| 5 — Studio P2 | Structure adaptative, autosave, conflits, Undo, import/export | Aucun brouillon perdu dans les scénarios de crash et de double onglet |
| 6 — Analyse P2 | Dashboard cohérent, historique paginé, CSV | Valeurs et exports égaux aux réponses sources |
| 7 — Enrichissement P3 | Animations, sons, médias avancés, PDF, bibliothèque | Vérification visuelle et performance sur matrice complète |

Pas d'estimation « tout terminé en quelques jours » avant le lot 2 : la migration et les accès cloud déterminent une partie importante de l'effort. Estimer ensuite chaque lot à partir d'une tranche réellement livrée.

## 14. Migration et retour arrière

1. Inventorier les données et identifier explicitement les sessions actives. Produire un rapport de migration en lecture seule.
2. Ajouter le nouveau format et ses règles fermées par défaut. Créer les index avant de basculer les lecteurs.
3. Déployer l'API et le nouveau client derrière un indicateur de version. Les nouveaux jeux utilisent le nouveau moteur ; les anciens restent identifiés comme historiques.
4. Convertir les quiz par lots idempotents avec correspondance des IDs et contrôle de cohérence. Ne pas reconstruire de faux temps de réponse à partir de données absentes.
5. Les anciennes sessions actives doivent se terminer ou être clôturées explicitement avant le retrait de leur chemin d'écriture. Leur score historique ne doit pas être présenté comme certifié par le nouveau moteur.
6. Migrer les anciens codes avec contrôle d'expiration et de collision. Faire rediriger les anciennes routes vers les nouveaux écrans compatibles.
7. Réduire les permissions legacy après adaptation de tous les consommateurs, y compris les parcours IA qui partagent des collections. Vérifier que les anciens quiz restent consultables par leurs propriétaires.
8. Le retour arrière désactive les nouvelles créations si nécessaire et conserve l'accès aux sessions déjà créées. Il ne réactive pas les écritures de scores côté joueur.

Ne pas recalculer arbitrairement les résultats historiques. Conserver leur formule connue ou l'étiquette « historique — méthode ancienne ». La préservation des données n'implique pas leur maintien en lecture publique.

## 15. Tests et exploitation

Unitaires : formule 320, bornes, arrondis, séries, égalités, validation, pause/extension et transitions. Tests de propriétés : pourcentage entre 0 et 100, somme des attributions égale au total, aucun gain supplémentaire sur replay.

Intégration API + émulateur : tokens, rôles, option invalide, expiration, limites, même réponse répétée, nouvel identifiant pour la même question, payload contradictoire, deux commandes animateur, reprise et crash pendant finalisation. Les règles testent les accès directs ; les échéances et commandes métier sont testées dans l'API puisque le client n'écrit plus les réponses.

E2E : deux puis plusieurs joueurs, plusieurs questions, bonne/mauvaise réponse, timeout, déconnexion, reload, deux onglets, arrivée tardive, preview sans écriture, restauration du builder, anciens codes, export et accès projecteur. Tester les valeurs persistées, pas seulement les textes affichés.

Charge en environnement isolé : 100 joueurs répondant dans une courte fenêtre, retries, fermeture simultanée, redémarrage de fonction et reconnexions. Mesurer p50/p95/p99 de confirmation, délais de publication, contention, erreurs et consommation. Objectifs initiaux à valider : p95 de confirmation inférieur à 1 seconde et publication inférieure à 2 secondes dans la région testée ; publier séparément les résultats à froid et sous réseau dégradé.

Matrice visuelle : 360, 390, 768, 1024, 1440, 1920 px ; sombre, clair si disponible, français, arabe RTL, texte long, zoom 200 %, reduced-motion et clavier seul. Vérifier aussi écran tactile, focus des drawers, médias absents et réponses longues.

Prévoir logs structurés sans tokens ni réponses privées, identifiant de requête, compteur de refus par raison, métrique de finalisation et procédure de réconciliation. Aucune charge ni création massive de comptes en production. Une panne réseau doit produire un état récupérable ; elle ne justifie jamais une confirmation fictive.

## 16. Évaluation structurée des règles locales

```json
{
  "score": 1,
  "summary": "Règles locales critiques pour un quiz compétitif ; déploiement distant non vérifié dans cette révision.",
  "findings": [
    {
      "check": "The Update Bypass",
      "severity": "critical",
      "issue": "Les participants et tentatives sont modifiables par leur utilisateur sans restriction des champs sensibles.",
      "recommendation": "Réserver les résultats aux écritures serveur et limiter strictement les éventuels champs éditables."
    },
    {
      "check": "Field-Level vs. Identity-Level Security",
      "severity": "critical",
      "issue": "Les permissions list sur plusieurs collections sont ouvertes à tout utilisateur authentifié.",
      "recommendation": "Aligner les requêtes et règles sur la propriété ou l'appartenance effective à la session."
    },
    {
      "check": "Business Logic vs. Rules",
      "severity": "critical",
      "issue": "Les documents de quiz accessibles contiennent les bonnes réponses.",
      "recommendation": "Séparer les corrigés privés et les vues distribuables selon la phase."
    },
    {
      "check": "Storage Abuse and Type Safety",
      "severity": "major",
      "issue": "Les écritures autorisées n'imposent pas systématiquement types, tailles et champs permis.",
      "recommendation": "Valider les payloads serveur et les rares écritures directes autorisées."
    }
  ]
}
```

## 17. Sources d'infrastructure vérifiées

- [Contention et transactions Firestore](https://firebase.google.com/docs/firestore/transaction-data-contention) : justifie de limiter les documents partagés modifiés dans les transactions de réponse.
- [Quotas Firestore](https://firebase.google.com/docs/firestore/quotas) : quotas gratuits et taille maximale de document.
- [Vercel Hobby](https://vercel.com/docs/plans/hobby) : conditions d'usage et limites du plan.
- [Render Free](https://render.com/docs/free) : mise en veille, redémarrage et stockage local éphémère.

Ce plan ne vaut ni validation de capacité en production ni preuve de correction déployée. Sa première livraison attendue est une partie complète dont chaque point peut être expliqué et reproduit depuis les données serveur.
