# Script de verification de la connexion Frontend-Backend# Script de vérification de la connexion Frontend-Backend

# Usage: .\check-connection.ps1# Usage: .\check-connection.ps1



Write-Host "========================================" -ForegroundColor CyanWrite-Host "========================================" -ForegroundColor Cyan

Write-Host "   QUIZO - Verification des Connexions" -ForegroundColor CyanWrite-Host "   QUIZO - Vérification des Connexions" -ForegroundColor Cyan

Write-Host "========================================" -ForegroundColor CyanWrite-Host "========================================" -ForegroundColor Cyan

Write-Host ""Write-Host ""



# URLs# URLs

$FRONTEND_URL = "https://quizo-ruddy.vercel.app"$FRONTEND_URL = "https://quizo-ruddy.vercel.app"

$BACKEND_URL = "https://quizo-nued.onrender.com"$BACKEND_URL = "https://quizo-nued.onrender.com"

$BACKEND_HEALTH = "$BACKEND_URL/api/health"$BACKEND_HEALTH = "$BACKEND_URL/api/health"



Write-Host "Verification des services..." -ForegroundColor BlueWrite-Host "🔍 Vérification des services..." -ForegroundColor Blue

Write-Host ""Write-Host ""



# 1. Test Backend Health# 1. Test Backend Health

Write-Host "1. Backend Health Check..." -ForegroundColor YellowWrite-Host "1️⃣  Backend Health Check..." -ForegroundColor Yellow

try {try {

    $response = Invoke-RestMethod -Uri $BACKEND_HEALTH -Method Get -ErrorAction Stop    $response = Invoke-RestMethod -Uri $BACKEND_HEALTH -Method Get -ErrorAction Stop

    Write-Host "   OK Backend operationnel" -ForegroundColor Green    Write-Host "   ✅ Backend opérationnel" -ForegroundColor Green

    Write-Host "   Status: $($response.status)" -ForegroundColor Gray    Write-Host "   📊 Status: $($response.status)" -ForegroundColor Gray

    Write-Host "   Version: $($response.version)" -ForegroundColor Gray    Write-Host "   🔢 Version: $($response.version)" -ForegroundColor Gray

    Write-Host "   Gemini: $($response.services.gemini)" -ForegroundColor Gray    Write-Host "   🤖 Gemini: $($response.services.gemini)" -ForegroundColor Gray

    Write-Host "   ChatGPT: $($response.services.chatgpt)" -ForegroundColor Gray    Write-Host "   💬 ChatGPT: $($response.services.chatgpt)" -ForegroundColor Gray

} catch {} catch {

    Write-Host "   ERREUR Backend inaccessible" -ForegroundColor Red    Write-Host "   ❌ Backend inaccessible" -ForegroundColor Red

    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Red

}}



Write-Host ""Write-Host ""



# 2. Test Frontend# 2. Test Frontend

Write-Host "2. Frontend Vercel..." -ForegroundColor YellowWrite-Host "2️⃣  Frontend Vercel..." -ForegroundColor Yellow

try {try {

    $response = Invoke-WebRequest -Uri $FRONTEND_URL -Method Get -UseBasicParsing -ErrorAction Stop    $response = Invoke-WebRequest -Uri $FRONTEND_URL -Method Get -UseBasicParsing -ErrorAction Stop

    Write-Host "   OK Frontend accessible" -ForegroundColor Green    Write-Host "   ✅ Frontend accessible" -ForegroundColor Green

    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray    Write-Host "   📡 Status Code: $($response.StatusCode)" -ForegroundColor Gray

} catch {} catch {

    Write-Host "   ERREUR Frontend inaccessible" -ForegroundColor Red    Write-Host "   ❌ Frontend inaccessible" -ForegroundColor Red

    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Red

}}



Write-Host ""Write-Host ""



# 3. Configuration locale# 3. Vérification de la configuration locale

Write-Host "3. Configuration locale..." -ForegroundColor YellowWrite-Host "3️⃣  Configuration locale..." -ForegroundColor Yellow

if (Test-Path ".env.local") {if (Test-Path ".env.local") {

    $envContent = Get-Content ".env.local" -Raw    $envContent = Get-Content ".env.local" -Raw

    if ($envContent -match "VITE_BACKEND_URL=(.+)") {    if ($envContent -match "VITE_BACKEND_URL=(.+)") {

        $backendUrl = $matches[1].Trim()        $backendUrl = $matches[1].Trim()

        if ($backendUrl -eq "https://quizo-nued.onrender.com/api") {        if ($backendUrl -eq "https://quizo-nued.onrender.com/api") {

            Write-Host "   OK .env.local correct" -ForegroundColor Green            Write-Host "   ✅ .env.local correctement configuré" -ForegroundColor Green

            Write-Host "   Backend URL: $backendUrl" -ForegroundColor Gray            Write-Host "   🔗 Backend URL: $backendUrl" -ForegroundColor Gray

        } else {        } else {

            Write-Host "   ATTENTION .env.local pointe vers: $backendUrl" -ForegroundColor Yellow            Write-Host "   ⚠️  .env.local pointe vers: $backendUrl" -ForegroundColor Yellow

            Write-Host "   Devrait etre: https://quizo-nued.onrender.com/api" -ForegroundColor Yellow            Write-Host "   💡 Devrait être: https://quizo-nued.onrender.com/api" -ForegroundColor Yellow

        }        }

    } else {    } else {

        Write-Host "   ATTENTION VITE_BACKEND_URL non trouve" -ForegroundColor Yellow        Write-Host "   ⚠️  VITE_BACKEND_URL non trouvé dans .env.local" -ForegroundColor Yellow

    }    }

} else {} else {

    Write-Host "   ATTENTION Fichier .env.local non trouve" -ForegroundColor Yellow    Write-Host "   ⚠️  Fichier .env.local non trouvé" -ForegroundColor Yellow

}}



Write-Host ""Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan

Write-Host "   RESUME" -ForegroundColor Cyan# 4. Test CORS (simulation)

Write-Host "========================================" -ForegroundColor CyanWrite-Host "4️⃣  Test CORS Backend..." -ForegroundColor Yellow

Write-Host ""Write-Host "   ℹ️  Pour tester CORS, ouvrez:" -ForegroundColor Cyan

Write-Host "   📱 $FRONTEND_URL" -ForegroundColor Cyan

Write-Host "A VERIFIER SUR RENDER.COM:" -ForegroundColor YellowWrite-Host "   🔧 Ouvrez la console (F12)" -ForegroundColor Cyan

Write-Host "CORS_ORIGINS=https://quizo-ruddy.vercel.app,http://localhost:5173,http://localhost:8080" -ForegroundColor GrayWrite-Host "   👀 Vérifiez qu'il n'y a pas d'erreur CORS" -ForegroundColor Cyan

Write-Host ""

Write-Host ""

Write-Host "A VERIFIER SUR VERCEL.COM:" -ForegroundColor Yellow

Write-Host "VITE_BACKEND_URL=https://quizo-nued.onrender.com/api" -ForegroundColor Gray# Résumé

Write-Host ""Write-Host "========================================" -ForegroundColor Cyan

Write-Host "   📋 RÉSUMÉ" -ForegroundColor Cyan

Write-Host "URLS:" -ForegroundColor CyanWrite-Host "========================================" -ForegroundColor Cyan

Write-Host "Render: https://dashboard.render.com/" -ForegroundColor GrayWrite-Host ""

Write-Host "Vercel: https://vercel.com/dashboard" -ForegroundColor Gray

Write-Host ""Write-Host "✅ À VÉRIFIER SUR RENDER.COM:" -ForegroundColor Yellow

Write-Host "   Variable CORS_ORIGINS doit contenir:" -ForegroundColor White
Write-Host "   https://quizo-ruddy.vercel.app,http://localhost:5173,http://localhost:8080" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ À VÉRIFIER SUR VERCEL.COM:" -ForegroundColor Yellow
Write-Host "   Variable VITE_BACKEND_URL doit être:" -ForegroundColor White
Write-Host "   https://quizo-nued.onrender.com/api" -ForegroundColor Gray
Write-Host ""

Write-Host "🔗 URLs de configuration:" -ForegroundColor Cyan
Write-Host "   Render: https://dashboard.render.com/" -ForegroundColor Gray
Write-Host "   Vercel: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host ""

Write-Host "📖 Documentations:" -ForegroundColor Cyan
Write-Host "   Render: RENDER_CONFIG.md" -ForegroundColor Gray
Write-Host "   Vercel: VERCEL_CONFIG.md" -ForegroundColor Gray
Write-Host ""
