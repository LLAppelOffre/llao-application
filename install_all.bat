@echo off
echo === Installation backend Python ===
cd backend-frontend

if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate

echo Installation des dépendances Python...
pip install --upgrade pip
pip install -r requirements.txt

if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo Fichier .env créé à partir de .env.example
    ) else (
        echo Attention: Pas de .env.example trouvé!
    )
) else (
    echo Fichier .env déjà présent.
)

cd ..

echo === Installation frontend Node.js ===
cd llao-frontend
if exist node_modules (
    echo Les dépendances Node.js sont déjà installées.
) else (
    npm install
)
cd ..

echo.
echo === Installation terminée ===
echo Pour lancer le backend :
echo   cd backend-frontend
echo   venv\Scripts\activate
echo   python app.py
echo.
echo Pour lancer le frontend :
echo   cd llao-frontend
echo   npm run dev
pause 