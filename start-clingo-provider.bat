@echo off
setlocal

echo.
echo === Clingo - Panel wykonawcy ===
echo.

cd /d "%~dp0outputs\clingo-platform"
if errorlevel 1 (
  echo Nie znaleziono folderu projektu outputs\clingo-platform.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":3001 .*LISTENING" >nul
if not errorlevel 1 (
  echo Panel na porcie 3001 jest juz uruchomiony.
  start "" "http://localhost:3001"
  exit /b 0
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Nie znaleziono Node.js i npm. Zainstaluj Node.js LTS i uruchom ten plik ponownie.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalowanie zaleznosci projektu...
  call npm.cmd install
  if errorlevel 1 (
    echo Instalacja zaleznosci nie powiodla sie.
    pause
    exit /b 1
  )
)

call :ensure_backend_dependencies
if errorlevel 1 (
  echo Nie mozna uruchomic panelu bez bazy danych i API.
  pause
  exit /b 1
)

call :ensure_api
if errorlevel 1 (
  echo Backend nie potwierdzil gotowosci. Sprawdz komunikaty w oknie "Clingo API".
  pause
  exit /b 1
)

echo Uruchamiam panel wykonawcy na http://localhost:3001
echo Pozostaw otwarte okno "Clingo - Panel wykonawcy", aby panel dzialal.
start "Clingo - Panel wykonawcy" cmd /k "npm.cmd run dev:provider"

echo Czekam na gotowosc panelu...
powershell.exe -NoProfile -Command "$providerDeadline = (Get-Date).AddSeconds(60); do { try { $providerResponse = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing -TimeoutSec 3; if ($providerResponse.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $providerDeadline); exit 1"
if errorlevel 1 (
  echo Panel nie potwierdzil gotowosci. Sprawdz komunikaty w oknie panelu.
  echo Po uruchomieniu otworz http://localhost:3001
  pause
  exit /b 1
)

start "" "http://localhost:3001"
endlocal
exit /b 0

:ensure_backend_dependencies
where docker >nul 2>nul
if errorlevel 1 (
  echo Nie znaleziono Docker Desktop. Jest wymagany do uruchomienia bazy Clingo.
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo Uruchamiam Docker Desktop...
  if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
  ) else if exist "%LocalAppData%\Docker\Docker Desktop.exe" (
    start "" "%LocalAppData%\Docker\Docker Desktop.exe"
  ) else (
    start "" "Docker Desktop"
  )

  echo Czekam na Docker Engine...
  for /L %%i in (1,1,60) do (
    docker info >nul 2>nul
    if not errorlevel 1 goto :docker_ready
    timeout /t 2 /nobreak >nul
  )
  echo Docker Engine nie uruchomil sie w ciagu 2 minut.
  exit /b 1
)

:docker_ready
echo Uruchamiam PostgreSQL/PostGIS i Redis...
docker compose up -d
if errorlevel 1 (
  echo Nie udalo sie uruchomic kontenerow projektu.
  exit /b 1
)

echo Czekam na PostgreSQL...
for /L %%i in (1,1,60) do (
  docker compose exec -T postgres pg_isready -U clingo -d clingo >nul 2>nul
  if not errorlevel 1 goto :postgres_ready
  timeout /t 2 /nobreak >nul
)
echo PostgreSQL nie potwierdzil gotowosci w ciagu 2 minut.
exit /b 1

:postgres_ready
echo PostgreSQL jest gotowy na porcie 55432.
exit /b 0

:ensure_api
netstat -ano | findstr /R /C:":4000 .*LISTENING" >nul
if not errorlevel 1 (
  echo API na porcie 4000 jest juz uruchomione.
  exit /b 0
)

echo Uruchamiam API Clingo na http://localhost:4000...
start "Clingo API" cmd /k "cd /d %cd% && call npm.cmd run dev:api"
echo Czekam na gotowosc API...
for /L %%i in (1,1,60) do (
  netstat -ano | findstr /R /C:":4000 .*LISTENING" >nul
  if not errorlevel 1 exit /b 0
  timeout /t 1 /nobreak >nul
)
exit /b 1
