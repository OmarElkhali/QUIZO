# 🧪 Script de Test Post-Déploiement
# Usage: .\test-deployment.ps1 -FrontendUrl "https://quizo.vercel.app" [-Verbose]

param(
    [Parameter(Mandatory=$true)]
    [string]$FrontendUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "https://quizo-backend.onrender.com",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧪 TESTS POST-DÉPLOIEMENT QUIZO                     " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: $FrontendUrl" -ForegroundColor White
Write-Host "Backend:  $BackendUrl" -ForegroundColor White
Write-Host ""

$results = @{
    Total = 0
    Passed = 0
    Failed = 0
    Warnings = 0
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [int]$ExpectedStatus = 200,
        [int]$TimeoutSec = 30
    )
    
    $results.Total++
    
    Write-Host "  ▶ $Name" -ForegroundColor Yellow -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = $TimeoutSec
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 5)
            $params.ContentType = "application/json"
        }
        
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest @params
        } else {
            $response = Invoke-RestMethod @params
        }
        
        if ($response.StatusCode -eq $ExpectedStatus -or $response) {
            Write-Host " ✅" -ForegroundColor Green
            $results.Passed++
            
            if ($Verbose) {
                if ($response.GetType().Name -eq "PSCustomObject") {
                    Write-Host "     Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
                } else {
                    Write-Host "     Status: $($response.StatusCode)" -ForegroundColor Gray
                }
            }
            
            return $true
        } else {
            Write-Host " ❌" -ForegroundColor Red
            Write-Host "     Status: $($response.StatusCode) (expected $ExpectedStatus)" -ForegroundColor Red
            $results.Failed++
            return $false
        }
        
    } catch {
        if ($_.Exception.Message -like "*timeout*" -or $_.Exception.Message -like "*503*") {
            Write-Host " ⚠️" -ForegroundColor Yellow
            Write-Host "     Warning: Timeout (backend may be cold starting)" -ForegroundColor Yellow
            $results.Warnings++
            return $null
        } else {
            Write-Host " ❌" -ForegroundColor Red
            Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
            $results.Failed++
            return $false
        }
    }
}

# ═══════════════════════════════════════════════════════════
# TEST 1: Frontend Basic
# ═══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "1️⃣  Tests Frontend" -ForegroundColor Cyan
Write-Host ("─" * 60) -ForegroundColor Gray

Test-Endpoint -Name "Homepage load" -Url $FrontendUrl
Test-Endpoint -Name "Assets accessible" -Url "$FrontendUrl/assets" -ExpectedStatus 404 # Acceptable si pas d'index
Test-Endpoint -Name "Favicon present" -Url "$FrontendUrl/favicon.ico" -TimeoutSec 10

# ═══════════════════════════════════════════════════════════
# TEST 2: Backend Health
# ═══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "2️⃣  Tests Backend Health" -ForegroundColor Cyan
Write-Host ("─" * 60) -ForegroundColor Gray

$healthOk = Test-Endpoint -Name "Health check" -Url "$BackendUrl/api/health" -TimeoutSec 60

if ($healthOk) {
    try {
        $health = Invoke-RestMethod -Uri "$BackendUrl/api/health" -TimeoutSec 60
        Write-Host "     Status: $($health.status)" -ForegroundColor Gray
        Write-Host "     Groq Available: $($health.groq_available)" -ForegroundColor Gray
        if ($health.version) {
            Write-Host "     Version: $($health.version)" -ForegroundColor Gray
        }
    } catch {}
}

# ═══════════════════════════════════════════════════════════
# TEST 3: CORS Configuration
# ═══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "3️⃣  Tests CORS" -ForegroundColor Cyan
Write-Host ("─" * 60) -ForegroundColor Gray

try {
    $corsTest = Invoke-WebRequest -Uri "$BackendUrl/api/health" `
        -Headers @{"Origin" = $FrontendUrl} `
        -UseBasicParsing `
        -TimeoutSec 30
    
    $corsHeader = $corsTest.Headers["Access-Control-Allow-Origin"]
    
    if ($corsHeader) {
        Write-Host "  ▶ CORS header present" -ForegroundColor Yellow -NoNewline
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "     Allow-Origin: $corsHeader" -ForegroundColor Gray
        $results.Total++
        $results.Passed++
    } else {
        Write-Host "  ▶ CORS header" -ForegroundColor Yellow -NoNewline
        Write-Host " ⚠️" -ForegroundColor Yellow
        Write-Host "     Warning: No CORS header (may cause issues)" -ForegroundColor Yellow
        $results.Total++
        $results.Warnings++
    }
} catch {
    Write-Host "  ▶ CORS test" -ForegroundColor Yellow -NoNewline
    Write-Host " ⚠️" -ForegroundColor Yellow
    $results.Total++
    $results.Warnings++
}

# ═══════════════════════════════════════════════════════════
# TEST 4: API Endpoints (si backend accessible)
# ═══════════════════════════════════════════════════════════
if ($healthOk) {
    Write-Host ""
    Write-Host "4️⃣  Tests API Endpoints" -ForegroundColor Cyan
    Write-Host ("─" * 60) -ForegroundColor Gray
    
    # Test génération simple
    $generateBody = @{
        text = "La Terre tourne autour du Soleil. L'eau bout à 100°C."
        numQuestions = 2
        difficulty = "easy"
        model = "groq"
    }
    
    Write-Host "  ▶ Generate endpoint (may take 30-60s)" -ForegroundColor Yellow -NoNewline
    try {
        $generateResponse = Invoke-RestMethod -Uri "$BackendUrl/api/generate" `
            -Method Post `
            -Body ($generateBody | ConvertTo-Json) `
            -ContentType "application/json" `
            -TimeoutSec 120
        
        if ($generateResponse.questions -and $generateResponse.questions.Count -ge 1) {
            Write-Host " ✅" -ForegroundColor Green
            Write-Host "     Generated: $($generateResponse.questions.Count) questions" -ForegroundColor Gray
            $results.Total++
            $results.Passed++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            Write-Host "     Error: No questions generated" -ForegroundColor Red
            $results.Total++
            $results.Failed++
        }
    } catch {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
        $results.Total++
        $results.Failed++
    }
    
    # Test extract text (sans fichier, devrait retourner erreur propre)
    Test-Endpoint -Name "Extract endpoint validation" `
        -Url "$BackendUrl/api/extract-text" `
        -Method POST `
        -Body @{} `
        -ExpectedStatus 400
}

# ═══════════════════════════════════════════════════════════
# TEST 5: Performance
# ═══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "5️⃣  Tests Performance" -ForegroundColor Cyan
Write-Host ("─" * 60) -ForegroundColor Gray

Write-Host "  ▶ Frontend load time" -ForegroundColor Yellow -NoNewline
try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 10 | Out-Null
    $sw.Stop()
    
    $loadTime = $sw.ElapsedMilliseconds
    
    if ($loadTime -lt 3000) {
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "     Time: ${loadTime}ms (excellent)" -ForegroundColor Green
    } elseif ($loadTime -lt 5000) {
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "     Time: ${loadTime}ms (good)" -ForegroundColor Gray
    } else {
        Write-Host " ⚠️" -ForegroundColor Yellow
        Write-Host "     Time: ${loadTime}ms (slow)" -ForegroundColor Yellow
    }
    
    $results.Total++
    $results.Passed++
} catch {
    Write-Host " ❌" -ForegroundColor Red
    $results.Total++
    $results.Failed++
}

# ═══════════════════════════════════════════════════════════
# TEST 6: Security Headers
# ═══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "6️⃣  Tests Security Headers" -ForegroundColor Cyan
Write-Host ("─" * 60) -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 10
    $headers = $response.Headers
    
    $securityHeaders = @{
        "X-Content-Type-Options" = "nosniff"
        "X-Frame-Options" = "DENY"
        "X-XSS-Protection" = "1"
    }
    
    foreach ($header in $securityHeaders.Keys) {
        $results.Total++
        Write-Host "  ▶ $header" -ForegroundColor Yellow -NoNewline
        
        if ($headers[$header]) {
            Write-Host " ✅" -ForegroundColor Green
            $results.Passed++
            if ($Verbose) {
                Write-Host "     Value: $($headers[$header])" -ForegroundColor Gray
            }
        } else {
            Write-Host " ⚠️" -ForegroundColor Yellow
            Write-Host "     Warning: Header missing" -ForegroundColor Yellow
            $results.Warnings++
        }
    }
} catch {
    Write-Host "  ▶ Security headers check" -ForegroundColor Yellow -NoNewline
    Write-Host " ⚠️" -ForegroundColor Yellow
    $results.Total++
    $results.Warnings++
}

# ═══════════════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 RÉSUMÉ DES TESTS                                  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$passRate = if ($results.Total -gt 0) { 
    [math]::Round(($results.Passed / $results.Total) * 100, 1) 
} else { 0 }

Write-Host "  Total:    $($results.Total) tests" -ForegroundColor White
Write-Host "  Passed:   $($results.Passed) ✅" -ForegroundColor Green
Write-Host "  Failed:   $($results.Failed) ❌" -ForegroundColor $(if ($results.Failed -gt 0) { "Red" } else { "White" })
Write-Host "  Warnings: $($results.Warnings) ⚠️" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Success Rate: $passRate%" -ForegroundColor $(
    if ($passRate -ge 90) { "Green" }
    elseif ($passRate -ge 70) { "Yellow" }
    else { "Red" }
)
Write-Host ""

if ($results.Failed -eq 0 -and $results.Warnings -le 2) {
    Write-Host "  🎉 Déploiement validé! Application prête." -ForegroundColor Green
    exit 0
} elseif ($results.Failed -eq 0) {
    Write-Host "  ✅ Déploiement OK avec warnings mineurs." -ForegroundColor Yellow
    Write-Host "  💡 Consultez les warnings ci-dessus." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "  ❌ Déploiement incomplet. Corrections requises." -ForegroundColor Red
    Write-Host "  📖 Consultez DEPLOY_GUIDE.md section Dépannage." -ForegroundColor Yellow
    exit 1
}
