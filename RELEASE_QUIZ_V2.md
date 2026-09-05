# Livraison progressive — quiz manuel et live

## Périmètre de cette livraison

Cette livraison ne termine pas le plan de refonte. Elle corrige des parcours existants et introduit un moteur live V2 désactivé par défaut.

### Corrections utilisables sans activer V2

- Validation des questions, réponses distinctes, bonne réponse unique et limites des options.
- Protection contre les doubles clics de sauvegarde et retrait du mode équipe non implémenté.
- Entrée par code unifiée, liens de salle corrigés et identification du participant courant.
- Prévisualisation avec essai local, cartes de réponses accessibles, raccourcis clavier et animations réduites selon les préférences système.
- Échéance conservée après rechargement du quiz asynchrone ; correction de la barre de temps à zéro.
- Vérification TypeScript effective du frontend et du serveur dans le build.
- Ancien moteur Flask live en mémoire désactivé par défaut ; aucun appel frontend à ces routes identifié.

### V2 : préparé, pas encore activé en production

- Commandes animateur avec contrôle de propriétaire, révision et idempotence.
- Questions figées et corrigés privés ; projections Firestore réservées aux membres.
- Réponses verrouillées, scoring serveur pondéré, bonus vitesse/série, note pédagogique séparée.
- Révélation atomique, timeouts, classement final stable, limite de 100 participants.
- Console animateur, écran projecteur authentifié, reprise des envois interrompus.

L'activation exige les règles Firestore validées et publiées, un secret serveur `FIREBASE_SERVICE_ACCOUNT_JSON` sur le projet Vercel QUIZO, puis `ENABLE_LIVE_V2=true`. Ne jamais préfixer ce secret par `VITE_`. GET `/api/session` indique seulement l'état de configuration, pas un test complet de disponibilité.

## Vérifications effectuées localement

- Build Vite et vérifications TypeScript : réussis.
- 9 tests unitaires du barème, de l'échéance et de la validation : réussis.
- 3 scénarios sur émulateur Firestore isolé `demo-quizo-live-tests` : réussis, comprenant 100 réponses simultanées, concurrence animateur, rejeu des requêtes, timeout et refus des accès/écritures interdits.
- Parcours public accueil et rejoindre : rendu contrôlé sur navigateur, rejoindre en 390 × 844 et ordinateur, aucune erreur JavaScript détectée.
- Python : compilation et contrôle local health/ancienne route live.

Ces tests ne constituent pas une mesure de capacité ou de latence en production. Le parcours complet authentifié V2 reste à vérifier en préproduction avant activation.

## Blocages et limites connus

- Le compte de service peut lire les règles Firebase de production mais la validation REST renvoie 403. L'ancienne version du dépôt correspond aux règles actives au contrôle initial. Aucune règle distante n'a été remplacée.
- Les permissions et le scoring des sessions historiques restent ceux de l'ancien moteur ; V2 ne les sécurise pas rétroactivement.
- Le moteur V2 ne prend pas encore en charge planification personnalisée, pause, équipes, QR code, historique/dashboard complet ni mode asynchrone serveur. Ne pas l'activer comme remplacement général avant résolution de ces écarts et recette.
- Les quotas gratuits ne garantissent ni disponibilité permanente du backend Render ni capacité de production.
- L'installation npm signale des vulnérabilités dans l'arbre de dépendances existant : audit ciblé et mises à jour compatibles restent nécessaires.

## Déploiement et retour arrière

Le push sur `main` déclenche Vercel. Render QUIZO a l'auto-déploiement désactivé : déclencher séparément après le push. Vérifier `/api/health`, le SHA `release` et `/api/session` après publication. Conserver V2 désactivé pour cette livraison.

En cas de régression, redéployer la révision précédente sur chaque plateforme. Les règles et données historiques n'étant pas migrées par ce push, ce retour arrière ne nécessite pas de suppression de données.
