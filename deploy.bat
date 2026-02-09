@echo off
echo ========================================
echo    RANC LIPANJ 850 - Deployment Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js nije instaliran!
    echo Preuzmite sa: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js pronaden: 
node --version
echo.

REM Install backend dependencies
echo [1/3] Instalacija dependencies...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Greska pri instalaciji dependencies!
    pause
    exit /b 1
)
echo [OK] Dependencies instalirani
echo.

REM Initialize database
echo [2/3] Inicijalizacija baze podataka...
call npm run init-db
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Greska pri inicijalizaciji baze!
    pause
    exit /b 1
)
echo [OK] Baza inicijalizirana
echo.

REM Start the server
echo [3/3] Pokretanje servera...
echo.
echo ========================================
echo    Server pokrenut na: http://localhost:3000
echo    Admin panel: http://localhost:3000/login.html
echo    Korisnik: admin / ranc850
echo ========================================
echo.
echo Pritisnite Ctrl+C za zaustavljanje servera
echo.

call npm start

