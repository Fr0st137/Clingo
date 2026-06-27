@echo off
setlocal

cd /d "%~dp0outputs\clingo-platform"

echo.
echo === Clingo Platform ===
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nie jest zainstalowany albo nie jest dostepny w PATH.
  echo Zainstaluj Node.js, a potem uruchom ten plik ponownie.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm nie jest dostepny w PATH.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalowanie zaleznosci npm...
  call npm install
  if errorlevel 1 (
    echo Instalacja zaleznosci nie powiodla sie.
    pause
    exit /b 1
  )
)

where docker >nul 2>nul
if not errorlevel 1 (
  echo Uruchamianie PostgreSQL/PostGIS i Redis przez Docker...
  docker compose up -d
) else (
  echo Docker nie jest dostepny. Pomijam PostgreSQL/PostGIS i Redis.
  echo Frontend nadal sie wlaczy, a API uzyje danych zapasowych tam, gdzie moze.
)

echo.
set WEB_PORT=3000
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  set WEB_PORT=3001
)
netstat -ano | findstr /R /C:":%WEB_PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set WEB_PORT=3002
)

echo Startuje backend NestJS na http://localhost:4000
start "Clingo API" cmd /k "cd /d %cd% && call npm.cmd run dev:api"

echo Startuje frontend Next.js na http://localhost:%WEB_PORT%
start "Clingo Web" cmd /k "cd /d %cd% && call npm.cmd --workspace apps/web run dev -- -p %WEB_PORT%"

echo.
echo Gotowe. Za chwile otworz:
echo http://localhost:%WEB_PORT%
echo.
timeout /t 5 >nul
start http://localhost:%WEB_PORT%

endlocal
