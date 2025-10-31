# Script de vérification et guide de configuration Render
# Usage: .\fix-render-timeout.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FIX TIMEOUT GUNICORN - RENDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Problème détecté:" -ForegroundColor Yellow
Write-Host "  [CRITICAL] WORKER TIMEOUT (pid:XX)" -ForegroundColor Red
Write-Host "  [ERROR] Worker was sent SIGKILL!" -ForegroundColor Red
Write-Host ""

Write-Host "Cause:" -ForegroundColor Yellow
Write-Host "  Le timeout Gunicorn par défaut (30s) est trop court" -ForegroundColor White
Write-Host "  Gemini API prend 40-60 secondes pour générer les questions" -ForegroundColor White
Write-Host ""

Write-Host "Solution: Augmenter le timeout à 180 secondes" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ÉTAPES À SUIVRE (2 minutes)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Ouvrir Render Dashboard" -ForegroundColor Blue
Write-Host "   URL: https://dashboard.render.com/" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Sélectionner votre service" -ForegroundColor Blue
Write-Host "   Nom: quizo-nued (ou votre nom de service backend)" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Aller dans Settings" -ForegroundColor Blue
Write-Host "   Menu de gauche > Settings" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Modifier 'Start Command'" -ForegroundColor Blue
Write-Host "   Section: Build & Deploy" -ForegroundColor Gray
Write-Host "   Remplacer par:" -ForegroundColor Gray
Write-Host ""
Write-Host "   gunicorn app:app --bind 0.0.0.0:`$PORT --workers 2 --timeout 180 --max-requests 1000 --max-requests-jitter 50" -ForegroundColor Green
Write-Host ""

Write-Host "5. Sauvegarder" -ForegroundColor Blue
Write-Host "   Cliquez sur 'Save Changes'" -ForegroundColor Gray
Write-Host "   Render va redémarrer automatiquement (environ 60 secondes)" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   VÉRIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Voulez-vous ouvrir Render Dashboard maintenant? (o/N)"
if ($response -eq "o" -or $response -eq "O") {
    Start-Process "https://dashboard.render.com/"
    Write-Host "✅ Dashboard ouvert dans votre navigateur" -ForegroundColor Green
}

Write-Host ""
Write-Host "Après modification:" -ForegroundColor Yellow
Write-Host "  1. Attendez 60 secondes (redémarrage automatique)" -ForegroundColor White
Write-Host "  2. Testez sur https://quizo-ruddy.vercel.app" -ForegroundColor White
Write-Host "  3. Uploadez un PDF et générez des questions" -ForegroundColor White
Write-Host "  4. Vérifiez les logs Render (pas de WORKER TIMEOUT)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BONUS: Configuration ChatGPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Erreur détectée:" -ForegroundColor Yellow
Write-Host "  401 Client Error: Unauthorized (ChatGPT API)" -ForegroundColor Red
Write-Host ""

Write-Host "Solutions:" -ForegroundColor Yellow
Write-Host "  A. Si vous avez une clé ChatGPT valide:" -ForegroundColor White
Write-Host "     - Allez dans Render > Environment" -ForegroundColor Gray
Write-Host "     - Vérifiez CHATGPT_API_KEY (format: sk-...)" -ForegroundColor Gray
Write-Host ""
Write-Host "  B. Si vous n'avez pas de clé ChatGPT:" -ForegroundColor White
Write-Host "     - RIEN À FAIRE! Gemini est utilisé par défaut" -ForegroundColor Gray
Write-Host "     - ChatGPT est optionnel" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DOCUMENTATION COMPLÈTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Voir: FIX_TIMEOUT_RENDER.md" -ForegroundColor Cyan
Write-Host ""
