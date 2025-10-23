# 🚀 Guide de Démarrage Rapide - QUIZO

## ⚡ Démarrage Rapide (5 minutes)

### 1. Configuration des Variables d'Environnement

#### Backend Python
```bash
cd python_api
cp .env.example .env
# Éditer .env et ajouter vos clés API
```

#### Frontend React
```bash
# Créer .env à la racine si nécessaire
cp .env.example .env
# Les clés Firebase sont déjà configurées dans src/lib/firebase.ts
```

### 2. Installation des Dépendances

#### Backend
```bash
cd python_api
pip install -r requirements.txt
```

#### Frontend
```bash
npm install
```

### 3. Démarrer les Serveurs

#### Backend (Terminal 1)
```bash
cd python_api
python app.py
# Serveur démarré sur http://localhost:5000
```

#### Frontend (Terminal 2)
```bash
npm run dev
# Application disponible sur http://localhost:8080
```

### 4. Tester

#### Health Check Backend
```bash
curl http://localhost:5000/api/health
```

Réponse attendue:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "services": {
    "gemini": true,
    "chatgpt": true
  }
}
```

## 🔒 Sécurité - Checklist

Avant de commiter ou déployer:

- [ ] ✅ Fichier `.env` est dans `.gitignore`
- [ ] ✅ Aucune clé API hardcodée dans le code
- [ ] ✅ CORS configuré avec les bons domaines
- [ ] ✅ Règles Firestore déployées
- [ ] ✅ Clés Firebase Admin sécurisées

## 📦 Structure des Fichiers de Configuration

```
QUIZO/
├── .env                          # ❌ NE PAS COMMITER
├── .env.example                  # ✅ Template public
├── python_api/
│   ├── .env                      # ❌ NE PAS COMMITER
│   ├── .env.example             # ✅ Template public
│   └── requirements.txt         # ✅ Dépendances mises à jour
├── firestore.rules              # ✅ Règles de sécurité
├── SECURITY.md                  # ✅ Politique de sécurité
└── CORRECTIONS_APPLIED.md       # ✅ Détails des corrections
```

## 🐛 Problèmes Courants

### "Module pypdf not found"
```bash
cd python_api
pip install pypdf==3.17.4
```

### "GEMINI_API_KEY not configured"
```bash
# Éditer python_api/.env et ajouter:
GEMINI_API_KEY=votre_clé_ici
```

### CORS Error
```bash
# Vérifier python_api/.env:
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
```

### Firestore Permission Denied
```bash
# Déployer les nouvelles règles:
firebase deploy --only firestore:rules
```

## 📝 Scripts Utiles

### Vérifier les dépendances obsolètes
```bash
# Python
pip list --outdated

# Node
npm outdated
```

### Audit de sécurité
```bash
# Frontend
npm audit

# Backend
pip install safety
safety check
```

### Linting
```bash
# Frontend
npm run lint

# Backend (optionnel)
pip install flake8
flake8 python_api/app.py
```

## 🔄 Workflow Git

```bash
# Vérifier que .env n'est pas tracké
git status

# Si .env apparaît, l'ajouter à .gitignore
echo ".env" >> .gitignore
echo "python_api/.env" >> .gitignore

# Commiter les changements
git add .
git commit -m "fix: sécurité et mise à jour des dépendances"
git push
```

## 🚀 Déploiement Production

### Backend (Render/Heroku)
1. Configurer les variables d'environnement sur la plateforme
2. S'assurer que `gunicorn` est installé
3. Utiliser `gunicorn app:app` comme commande de démarrage

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Output: `dist/`
3. Configurer les variables d'environnement `VITE_*`

### Firestore
```bash
firebase deploy --only firestore:rules
```

## 📞 Support

- Documentation: Voir `README.md`
- Sécurité: Voir `SECURITY.md`
- Corrections: Voir `CORRECTIONS_APPLIED.md`
- Instructions IA: Voir `.github/copilot-instructions.md`

## ✨ Fonctionnalités

- ✅ Génération de quiz par IA (Gemini/ChatGPT)
- ✅ Création manuelle de quiz
- ✅ Compétitions en temps réel
- ✅ Leaderboard
- ✅ Partage par code
- ✅ Authentification Firebase
- ✅ Extraction PDF/DOCX

## 🎯 Prochaines Étapes

1. [ ] Ajouter des tests unitaires
2. [ ] Implémenter le cache Redis
3. [ ] Ajouter le rate limiting
4. [ ] Configurer le monitoring
5. [ ] Optimiser les requêtes Firestore
6. [ ] Choisir Firebase OU Supabase pour le stockage

Bon développement ! 🚀
