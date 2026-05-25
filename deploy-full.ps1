# 🚀 Script de Déploiement Automatique QUIZO
# Usage: .\deploy-full.ps1 [-Environment prod|staging] [-SkipTests] [-Force]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('prod', 'staging')]
    [string]$Environment = 'prod',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

# Configuration
$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$BACKEND_DIR = Join-Path $PROJECT_ROOT "python_api"
$FRONTEND_DIR = $PROJECT_ROOT

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    🚀 DÉPLOIEMENT AUTOMATIQUE QUIZO v3.0              " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Fonction: Afficher section
function Show-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "▶ $Title" -ForegroundColor Yellow
    Write-Host ("─" * 60) -ForegroundColor Gray
}

# Fonction: Vérifier prérequis
function Test-Prerequisites {
    Show-Section "Vérification des prérequis"
    
    $prerequisites = @{
        "Git" = "git --version"
        "Node.js" = "node --version"
        "NPM" = "npm --version"
        "Vercel CLI" = "vercel --version"
    }
    
    $allGood = $true
    foreach ($tool in $prerequisites.Keys) {
        try {
            $version = Invoke-Expression $prerequisites[$tool] 2>&1
            Write-Host "  ✅ $tool : $version" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ $tool : Non installé" -ForegroundColor Red
            $allGood = $false
        }
    }
    
    if (-not $allGood) {
        throw "Prérequis manquants. Installez les outils requis."
    }
    
    Write-Host ""
}

# Fonction: Vérifier Git status
function Test-GitStatus {
    Show-Section "Vérification Git"
    
    Set-Location $PROJECT_ROOT
    
    # Vérifier si branch main
    $currentBranch = git rev-parse --abbrev-ref HEAD
    Write-Host "  Branch actuelle: $currentBranch" -ForegroundColor White
    
    if ($currentBranch -ne "main" -and -not $Force) {
        $response = Read-Host "Vous n'êtes pas sur main. Continuer? (y/n)"
        if ($response -ne "y") {
            throw "Déploiement annulé."
        }
    }
    
    # Vérifier modifications non commitées
    $status = git status --porcelain
    if ($status -and -not $Force) {
        Write-Host "  ⚠️  Modifications non commitées détectées:" -ForegroundColor Yellow
        Write-Host $status -ForegroundColor Gray
        
        $response = Read-Host "Commit et push automatiquement? (y/n)"
        if ($response -eq "y") {
            git add .
            $commitMsg = Read-Host "Message de commit"
            if (-not $commitMsg) { $commitMsg = "🚀 Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
            git commit -m $commitMsg
            git push origin $currentBranch
            Write-Host "  ✅ Changements committés et pushés" -ForegroundColor Green
        } else {
            throw "Commitez vos changements avant de déployer."
        }
    } else {
        Write-Host "  ✅ Aucune modification en attente" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Fonction: Build et test local
function Invoke-LocalBuild {
    Show-Section "Build et tests locaux"
    
    Set-Location $FRONTEND_DIR
    
    Write-Host "  📦 Installation dépendances..." -ForegroundColor White
    npm install --silent
    
    if (-not $SkipTests) {
        Write-Host "  🧪 Linting..." -ForegroundColor White
        npm run lint
        
        Write-Host "  🏗️  Build production..." -ForegroundColor White
        npm run build
        
        if (Test-Path "dist") {
            $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Host "  ✅ Build réussi ($([math]::Round($distSize, 2)) MB)" -ForegroundColor Green
        } else {
            throw "Build failed: dossier dist non créé"
        }
    } else {
        Write-Host "  ⏭️  Tests skippés (--SkipTests)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Fonction: Déployer backend sur Render
function Deploy-Backend {
    Show-Section "Déploiement Backend (Render)"
    
    Write-Host "  🐍 Backend sera déployé automatiquement via GitHub" -ForegroundColor White
    Write-Host "  📡 Render détecte les commits sur main et redéploie" -ForegroundColor Gray
    
    # Vérifier render.yaml existe
    $renderConfig = Join-Path $PROJECT_ROOT "render.yaml"
    if (Test-Path $renderConfig) {
        Write-Host "  ✅ render.yaml présent" -ForegroundColor Green
    } else {
        Write-Host "  ❌ render.yaml manquant!" -ForegroundColor Red
        throw "Configuration Render manquante"
    }
    
    # Check si deploy hook configuré
    if ($env:RENDER_DEPLOY_HOOK) {
        Write-Host "  🚀 Trigger deploy hook Render..." -ForegroundColor White
        try {
            Invoke-RestMethod -Uri $env:RENDER_DEPLOY_HOOK -Method Post
            Write-Host "  ✅ Backend déploiement déclenché" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Deploy hook fail (déploiement auto GitHub actif)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ℹ️  Deploy hook non configuré (auto-deploy GitHub actif)" -ForegroundColor Cyan
    }
    
    Write-Host ""
}

# Fonction: Déployer frontend sur Vercel
function Deploy-Frontend {
    Show-Section "Déploiement Frontend (Vercel)"
    
    Set-Location $FRONTEND_DIR
    
    # Vérifier vercel.json existe
    $vercelConfig = Join-Path $FRONTEND_DIR "vercel.json"
    if (Test-Path $vercelConfig) {
        Write-Host "  ✅ vercel.json présent" -ForegroundColor Green
    } else {
        Write-Host "  ❌ vercel.json manquant!" -ForegroundColor Red
        throw "Configuration Vercel manquante"
    }
    
    # Déployer
    Write-Host "  🚀 Déploiement Vercel..." -ForegroundColor White
    
    if ($Environment -eq "prod") {
        Write-Host "  🌍 Mode: PRODUCTION" -ForegroundColor Magenta
        vercel --prod --yes
    } else {
        Write-Host "  🧪 Mode: STAGING (Preview)" -ForegroundColor Yellow
        vercel --yes
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Frontend déployé avec succès!" -ForegroundColor Green
    } else {
        throw "Déploiement Vercel échoué (exit code: $LASTEXITCODE)"
    }
    
    Write-Host ""
}

# Fonction: Vérifier déploiements
function Test-Deployments {
    Show-Section "Vérification des déploiements"
    
    $vercelUrl = Read-Host "URL Vercel déployée (ou Enter pour skip)"
    $renderUrl = "https://quizo-backend.onrender.com"
    
    if ($vercelUrl) {
        Write-Host "  🌐 Test Frontend ($vercelUrl)..." -ForegroundColor White
        try {
            $response = Invoke-WebRequest -Uri $vercelUrl -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✅ Frontend accessible (200 OK)" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ❌ Frontend inaccessible: $_" -ForegroundColor Red
        }
    }
    
    Write-Host "  🐍 Test Backend ($renderUrl/api/health)..." -ForegroundColor White
    try {
        $healthResponse = Invoke-RestMethod -Uri "$renderUrl/api/health" -TimeoutSec 30
        Write-Host "  ✅ Backend: $($healthResponse.status)" -ForegroundColor Green
        Write-Host "     Groq: $($healthResponse.groq_available)" -ForegroundColor Gray
    } catch {
        Write-Host "  ⚠️  Backend: En cours de démarrage (timeout normal)" -ForegroundColor Yellow
        Write-Host "     Render free tier: premier accès peut prendre 30-60s" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# Fonction: Résumé final
function Show-Summary {
    Show-Section "Résumé du déploiement"
    
    Write-Host "  ✅ Backend: Auto-déployé via GitHub → Render" -ForegroundColor Green
    Write-Host "  ✅ Frontend: Déployé sur Vercel" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "     1. Vérifier logs Render: https://dashboard.render.com" -ForegroundColor White
    Write-Host "     2. Vérifier deploy Vercel: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "     3. Tester application complète" -ForegroundColor White
    Write-Host "     4. Configurer monitoring (UptimeRobot)" -ForegroundColor White
    Write-Host ""
    Write-Host "  🔗 URLs importantes:" -ForegroundColor Cyan
    Write-Host "     Backend: https://quizo-backend.onrender.com" -ForegroundColor Gray
    Write-Host "     Frontend: (voir output Vercel ci-dessus)" -ForegroundColor Gray
    Write-Host ""
}

# ═══════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════

try {
    $startTime = Get-Date
    
    # Exécuter étapes
    Test-Prerequisites
    Test-GitStatus
    Invoke-LocalBuild
    Deploy-Backend
    Deploy-Frontend
    Test-Deployments
    Show-Summary
    
    $duration = (Get-Date) - $startTime
    
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!                 " -ForegroundColor Green
    Write-Host "  ⏱️  Durée: $([math]::Round($duration.TotalMinutes, 2)) minutes" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  ❌ DÉPLOIEMENT ÉCHOUÉ                                " -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Yellow
    Write-Host "  • Vérifiez les logs ci-dessus" -ForegroundColor White
    Write-Host "  • Consultez DEPLOY_GUIDE.md pour dépannage" -ForegroundColor White
    Write-Host "  • Utilisez --Force pour ignorer warnings" -ForegroundColor White
    Write-Host "  • Utilisez --SkipTests pour skip build local" -ForegroundColor White
    Write-Host ""
    
    exit 1
}
