@echo off
echo ========================================
echo Démarrage de LLAO Application
echo ========================================

echo.
echo Démarrage du backend API...
start "LLAO API" cmd /k "cd api && python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Attente de 3 secondes pour le démarrage de l'API...
timeout /t 3 /nobreak > nul

echo.
echo Démarrage du frontend client...
start "LLAO Client" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo Application démarrée !
echo ========================================
echo.
echo Backend API : http://localhost:8000
echo Frontend Client : http://localhost:5173
echo Documentation API : http://localhost:8000/docs
echo.
pause 