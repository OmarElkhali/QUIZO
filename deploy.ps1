# Script de déploiement complet - Frontend + Backend
# Usage: .\deploy.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   QUIZO - Déploiement Complet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Vous devez exécuter ce script depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Fonction pour afficher les erreurs
function Show-Error {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
    exit 1
}

# Fonction pour afficher le succès
function Show-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

# Fonction pour afficher les informations
function Show-Info {
    param($message)
    Write-Host "ℹ️  $message" -ForegroundColor Yellow
}

# 1. BUILD DU FRONTEND
Write-Host ""
Write-Host "📦 1/5 - Build du Frontend..." -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Blue

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Échec du build frontend"
    }
    Show-Success "Frontend build avec succès"
} catch {
    Show-Error "Erreur lors du build frontend: $_"
}

# 2. DÉPLOIEMENT FIREBASE (Firestore Rules + Hosting)
Write-Host ""
Write-Host "🔥 2/5 - Déploiement Firebase..." -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Blue

Show-Info "Déploiement des règles Firestore..."
try {
    firebase deploy --only firestore:rules
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Échec du déploiement des règles Firestore"
    }
    Show-Success "Règles Firestore déployées"
} catch {
    Show-Error "Erreur lors du déploiement Firestore: $_"
}

Show-Info "Déploiement du frontend sur Firebase Hosting..."
try {
    firebase deploy --only hosting
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Échec du déploiement Firebase Hosting"
    }
    Show-Success "Frontend déployé sur Firebase Hosting"
} catch {
    Show-Error "Erreur lors du déploiement Firebase Hosting: $_"
}

# 3. VÉRIFICATION DU BACKEND PYTHON
Write-Host ""
Write-Host "🐍 3/5 - Préparation du Backend Python..." -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Blue

if (-not (Test-Path "python_api")) {
    Show-Error "Dossier python_api introuvable"
}

Push-Location python_api

# Vérifier les fichiers nécessaires
if (-not (Test-Path ".env")) {
    Show-Info "Fichier .env manquant dans python_api/"
    Show-Info "Copiez .env.example vers .env et configurez vos clés API"
    Pop-Location
    Show-Error "Configuration backend incomplète"
}

Show-Info "Vérification des dépendances Python..."
if (-not (Test-Path "requirements.txt")) {
    Pop-Location
    Show-Error "requirements.txt introuvable"
}

Show-Success "Backend Python prêt pour le déploiement"
Pop-Location

# 4. INFORMATION POUR RENDER
Write-Host ""
Write-Host "☁️  4/5 - Déploiement Backend (Render)..." -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Blue

Show-Info "Le backend Python doit être déployé manuellement sur Render.com"
Write-Host ""
Write-Host "Étapes pour déployer sur Render:" -ForegroundColor White
Write-Host "  1. Connectez-vous sur https://render.com" -ForegroundColor Gray
Write-Host "  2. Créez un nouveau 'Web Service'" -ForegroundColor Gray
Write-Host "  3. Connectez votre repository GitHub: OmarElkhali/QUIZO" -ForegroundColor Gray
Write-Host "  4. Configurez:" -ForegroundColor Gray
Write-Host "     - Root Directory: python_api" -ForegroundColor Gray
Write-Host "     - Build Command: pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "     - Start Command: gunicorn app:app" -ForegroundColor Gray
Write-Host "  5. Ajoutez les variables d'environnement:" -ForegroundColor Gray
Write-Host "     - GEMINI_API_KEY" -ForegroundColor Gray
Write-Host "     - OPENROUTER_API_KEY (optionnel)" -ForegroundColor Gray
Write-Host "     - GROQ_API_KEY (optionnel)" -ForegroundColor Gray
Write-Host "     - QWEN_API_KEY (optionnel)" -ForegroundColor Gray
Write-Host "     - CORS_ORIGINS" -ForegroundColor Gray
Write-Host "     - LOG_LEVEL=INFO" -ForegroundColor Gray
Write-Host "  6. Cliquez sur 'Create Web Service'" -ForegroundColor Gray
Write-Host ""
Show-Info "Une fois déployé, notez l'URL du backend (ex: https://votre-app.onrender.com)"

# 5. GIT PUSH
Write-Host ""
Write-Host "🚀 5/5 - Push sur GitHub..." -ForegroundColor Blue
Write-Host "----------------------------------------" -ForegroundColor Blue

Show-Info "Vérification du statut Git..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Show-Info "Fichiers modifiés détectés"
    Write-Host ""
    git status --short
    Write-Host ""
    
    $response = Read-Host "Voulez-vous commiter et pusher ces changements? (o/N)"
    if ($response -eq "o" -or $response -eq "O") {
        $commitMessage = Read-Host "Message du commit"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "chore: mise à jour et déploiement"
        }
        
        try {
            git add .
            git commit -m "$commitMessage"
            git push origin main
            if ($LASTEXITCODE -ne 0) {
                Show-Error "Échec du push Git"
            }
            Show-Success "Code pushé sur GitHub"
        } catch {
            Show-Error "Erreur lors du push Git: $_"
        }
    } else {
        Show-Info "Push Git ignoré"
    }
} else {
    Show-Success "Aucune modification à commiter"
}

# RÉSUMÉ FINAL
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ✅ DÉPLOIEMENT TERMINÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Résumé:" -ForegroundColor White
Write-Host "  ✅ Frontend buildé" -ForegroundColor Green
Write-Host "  ✅ Règles Firestore déployées" -ForegroundColor Green
Write-Host "  ✅ Frontend déployé sur Firebase Hosting" -ForegroundColor Green
Write-Host "  ℹ️  Backend Python: Déploiement manuel sur Render requis" -ForegroundColor Yellow
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor White
Write-Host "  1. Déployez le backend sur Render.com (si pas encore fait)" -ForegroundColor Gray
Write-Host "  2. Mettez à jour VITE_BACKEND_URL dans les variables d'environnement Firebase" -ForegroundColor Gray
Write-Host "  3. Testez votre application sur l'URL Firebase" -ForegroundColor Gray
Write-Host ""
Write-Host "📱 Frontend Vercel: https://quizo-ruddy.vercel.app" -ForegroundColor Cyan
Write-Host "🔗 Backend Render: https://quizo-nued.onrender.com" -ForegroundColor Cyan
Write-Host "� Repository GitHub: https://github.com/OmarElkhali/QUIZO" -ForegroundColor Cyan
Write-Host ""
