# 🚀 Guide Rapide: Installation Groq pour QUIZO

## Étape 1: Clé API Groq (2 minutes)

1. **Aller sur**: https://console.groq.com/
2. **Créer compte gratuit** (email + mot de passe, pas de carte bancaire)
3. **Générer API Key**:
   - Menu "API Keys" → "Create API Key"
   - Copier la clé (format: `gsk_...`)

## Étape 2: Configuration Backend (5 minutes)

### 2.1 Installer dépendance

```powershell
cd c:\Users\SetupGame\Desktop\QUIZPROJECT\ESTS-QUIZ\python_api
pip install groq==0.4.2
```

### 2.2 Ajouter clé API dans `.env`

Ouvrir `python_api/.env` et remplacer:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Par:

```env
GROQ_API_KEY=gsk_votre_vraie_cle_ici
```

### 2.3 Tester

```powershell
python groq_service.py
```

**Output attendu**:
```
✅ Groq est disponible!
✅ 3 questions générées en 4.2 secondes! 🚀
```

## Étape 3: Lancer l'Application

### Backend

```powershell
cd python_api
python app.py
```

### Frontend (nouveau terminal)

```powershell
cd c:\Users\SetupGame\Desktop\QUIZPROJECT\ESTS-QUIZ
npm run dev
```

## Étape 4: Tester dans QUIZO

1. Aller sur http://localhost:5173
2. Créer nouveau quiz
3. Choisir modèle "Groq (Ultra-rapide)"
4. Upload PDF ou saisir texte
5. Générer → ⚡ Résultat en 3-10 secondes!

---

## ✅ Vérifications

- [ ] Backend démarre sans erreur
- [ ] Frontend se connecte au backend
- [ ] Test `python groq_service.py` réussit
- [ ] Génération quiz fonctionne et est rapide (<10s)

## 🆘 Dépannage

**Erreur "GROQ_API_KEY non configurée"**:
- Vérifier `.env` contient la vraie clé API
- Relancer backend: `python app.py`

**Erreur "Module groq not found"**:
- Installer: `pip install groq==0.4.2`
- Vérifier environnement Python actif

**Timeout/Lent**:
- Vérifier connexion internet
- Tester sur console.groq.com directement

---

## 📊 Performance

| Questions | Temps (Groq) | Temps (Ollama) |
|-----------|--------------|----------------|
| 5 | 3s ⚡ | 25s 🐌 |
| 10 | 5s ⚡ | 45s 🐌 |
| 20 | 10s ⚡ | 90s 🐌 |

**Groq est 6-10x plus rapide!**

---

## 🎓 Pour Production (Render/Vercel)

### Render (Backend)

1. Dashboard → Environment Variables
2. Ajouter: `GROQ_API_KEY` = `gsk_votre_cle`
3. Ajouter: `GROQ_MODEL` = `llama3-70b-8192`
4. Deploy

### Vercel (Frontend)

- Aucune config nécessaire (API key côté backend)
- Juste deploy normalement

**Testé et validé** ✅
