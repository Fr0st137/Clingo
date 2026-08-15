@echo off
setlocal

cd /d "%~dp0outputs\clingo-platform"

echo.
echo === Clingo Platform ===
echo.

call :ensure_node
if errorlevel 1 (
  pause
  exit /b 1
)

call :ensure_npm
if errorlevel 1 (
  pause
  exit /b 1
)

call :ensure_docker

call :start_docker_if_needed

if not exist "node_modules" (
  echo Instalowanie zaleznosci npm...
  call npm.cmd install
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
  if errorlevel 1 (
    echo Docker jest zainstalowany, ale nie udalo sie uruchomic kontenerow.
    echo Upewnij sie, ze Docker Desktop jest wlaczony, a potem uruchom ten plik ponownie.
    echo Frontend nadal sie wlaczy, a API uzyje danych zapasowych tam, gdzie moze.
  ) else (
    call :wait_for_docker_services
    call :seed_provider_profiles
  )
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
exit /b 0

:ensure_winget
where winget >nul 2>nul
if not errorlevel 1 (
  exit /b 0
)

echo Nie znaleziono winget, czyli instalatora aplikacji Windows.
echo Zainstaluj "App Installer" ze sklepu Microsoft Store, a potem uruchom ten plik ponownie.
exit /b 1

:ensure_node
where node >nul 2>nul
if not errorlevel 1 (
  echo Node.js jest zainstalowany.
  exit /b 0
)

echo Node.js nie jest zainstalowany. Instaluje Node.js LTS...
call :ensure_winget
if errorlevel 1 (
  exit /b 1
)
winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo Nie udalo sie zainstalowac Node.js automatycznie.
  exit /b 1
)

set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js zostal zainstalowany, ale nie jest jeszcze dostepny w PATH.
  echo Zamknij to okno i uruchom start-clingo-platform.bat ponownie.
  exit /b 1
)
exit /b 0

:ensure_npm
where npm.cmd >nul 2>nul
if not errorlevel 1 (
  echo npm jest zainstalowany.
  exit /b 0
)

echo npm nie jest dostepny, chociaz Node.js powinien go zawierac.
echo Sprobuj zamknac to okno i uruchomic start-clingo-platform.bat ponownie.
exit /b 1

:ensure_docker
where docker >nul 2>nul
if not errorlevel 1 (
  echo Docker jest zainstalowany.
  exit /b 0
)

echo Docker Desktop nie jest zainstalowany. Instaluje Docker Desktop...
call :ensure_winget
if errorlevel 1 (
  echo Kontynuuje bez Dockera.
  exit /b 0
)
winget install --id Docker.DockerDesktop --exact --source winget --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo Nie udalo sie zainstalowac Docker Desktop automatycznie.
  echo Kontynuuje bez Dockera.
  exit /b 0
)

where docker >nul 2>nul
if errorlevel 1 (
  echo Docker Desktop zostal zainstalowany, ale moze wymagac restartu komputera lub recznego uruchomienia.
  echo Kontynuuje bez Dockera.
  exit /b 0
)
exit /b 0

:start_docker_if_needed
where docker >nul 2>nul
if errorlevel 1 (
  exit /b 0
)

docker info >nul 2>nul
if not errorlevel 1 (
  echo Docker jest wlaczony.
  exit /b 0
)

echo Docker jest zainstalowany, ale nie jest wlaczony. Uruchamiam Docker Desktop...
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
  start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
) else if exist "%LocalAppData%\Docker\Docker Desktop.exe" (
  start "" "%LocalAppData%\Docker\Docker Desktop.exe"
) else (
  start "" "Docker Desktop"
)

echo Czekam na uruchomienie Docker Engine...
for /L %%i in (1,1,60) do (
  docker info >nul 2>nul
  if not errorlevel 1 (
    echo Docker jest wlaczony.
    exit /b 0
  )
  timeout /t 2 /nobreak >nul
)

echo Docker Desktop nie zdazyl sie uruchomic.
echo Jesli widzisz okno Docker Desktop, poczekaj az zakonczy start i uruchom ten plik ponownie.
exit /b 0

:wait_for_docker_services
echo Czekam na gotowosc PostgreSQL/PostGIS...
for /L %%i in (1,1,60) do (
  docker compose exec -T postgres pg_isready -U clingo -d clingo >nul 2>nul
  if not errorlevel 1 (
    echo PostgreSQL/PostGIS jest gotowy.
    goto :wait_for_redis
  )
  timeout /t 2 /nobreak >nul
)

echo PostgreSQL/PostGIS nie zdazyl potwierdzic gotowosci.
echo API moze wystartowac z opoznieniem lub wymagac ponownego uruchomienia.

:wait_for_redis
echo Czekam na gotowosc Redis...
for /L %%i in (1,1,30) do (
  docker compose exec -T redis redis-cli ping >nul 2>nul
  if not errorlevel 1 (
    echo Redis jest gotowy.
    exit /b 0
  )
  timeout /t 1 /nobreak >nul
)

echo Redis nie zdazyl potwierdzic gotowosci.
echo API nadal sprobuje wystartowac.
exit /b 0

:seed_provider_profiles
if not exist "scripts\seed-provider-profiles.js" (
  exit /b 0
)

echo Uzupelnianie testowych profili w bazie danych...
call node scripts\seed-provider-profiles.js
if errorlevel 1 (
  echo Nie udalo sie automatycznie uzupelnic profili w bazie danych.
  echo API nadal sprobuje wystartowac. Jesli na tablicy widzisz za malo profili, zrestartuj platforme po uruchomieniu Dockera.
  exit /b 0
)

exit /b 0
