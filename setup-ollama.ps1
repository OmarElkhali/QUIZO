# Script de configuration Ollama pour QUIZO
Write-Host "Configuration Ollama pour QUIZO" -ForegroundColor Cyan
Write-Host ""

# Vérifier Ollama
Write-Host "Vérification d'Ollama..." -ForegroundColor Yellow
try {
    $version = ollama --version 2>$null
    Write-Host "Ollama installé: $version" -ForegroundColor Green
} catch {
    Write-Host "Ollama non installé" -ForegroundColor Red
    Write-Host "Installez depuis: https://ollama.com/download" -ForegroundColor Yellow
    exit
}

# Lister les modèles
Write-Host ""
Write-Host "Modèles disponibles:" -ForegroundColor Yellow
ollama list

Write-Host ""
Write-Host "Pour télécharger qwen2.5:7b:" -ForegroundColor Green
Write-Host "  ollama pull qwen2.5:7b" -ForegroundColor White
Write-Host ""
Write-Host "Pour tester:" -ForegroundColor Green
Write-Host "  cd python_api" -ForegroundColor White
Write-Host "  python ollama_service.py" -ForegroundColor White
