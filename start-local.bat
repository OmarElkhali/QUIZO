@echo off
title QUIZO - Start Local Development Setup
echo ====================================================
echo             QUIZO LOCAL STARTUP UTILITY            
echo ====================================================
echo.

cd /d "%~dp0"

:: 1. Verify Node.js dependencies
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing node packages...
    call npm install
) else (
    echo [INFO] Node.js packages already installed.
)

:: 2. Launch Backend in a separate window
echo [INFO] Starting Flask Backend in a new window...
start "QUIZO Backend API" cmd /c "cd python_api && start_backend.bat"

:: 3. Launch Frontend in current window
echo [INFO] Starting Vite Frontend...
echo.
echo ====================================================
echo  Frontend should open at http://localhost:5173      
echo  Backend API running at http://localhost:5000       
echo ====================================================
echo.
call npm run dev
pause
