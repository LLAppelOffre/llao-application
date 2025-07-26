@echo off
echo ========================================
echo Installation de LLAO Application
echo ========================================

echo.
echo Installation du backend API...
cd api
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dépendances Python
    pause
    exit /b 1
)

echo.
echo Installation du frontend client...
cd ../client
npm install
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dépendances Node.js
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation terminée avec succès !
echo ========================================
echo.
echo Pour démarrer l'application :
echo 1. Backend API : cd api && python -m uvicorn server.main:app --reload
echo 2. Frontend Client : cd client && npm run dev
echo.
pause 