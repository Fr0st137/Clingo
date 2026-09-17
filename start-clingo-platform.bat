@echo off
setlocal

cd /d "%~dp0outputs\clingo-platform"

set "CLINGO_MODE=preview"
if /i "%~1"=="dev" set "CLINGO_MODE=dev"

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

call :boot_docker_desktop

set "POSTGRES_HOST=127.0.0.1"
set "POSTGRES_PORT=55432"
set "POSTGRES_DB=clingo"
set "POSTGRES_USER=clingo"
set "POSTGRES_PASSWORD=clingo"

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
    call :seed_database
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

if /i "%CLINGO_MODE%"=="preview" (
  echo Przygotowuje szybka wersje strony. Kompilacja odbywa sie raz, przed otwarciem.
  call npm.cmd run build:web
  if errorlevel 1 (
    echo Nie udalo sie przygotowac strony. Sprawdz blad powyzej.
    pause
    exit /b 1
  )
)

netstat -ano | findstr /R /C:":4000 .*LISTENING" >nul
if errorlevel 1 (
  echo Startuje backend NestJS na http://localhost:4000
  start "Clingo API" cmd /k "cd /d %cd% && call npm.cmd run dev:api"
) else (
  echo Backend na porcie 4000 jest juz uruchomiony.
)

echo Startuje frontend Next.js na http://localhost:%WEB_PORT%
if /i "%CLINGO_MODE%"=="dev" (
  start "Clingo Web" cmd /k "cd /d %cd% && call npm.cmd --workspace apps/web run dev -- -p %WEB_PORT%"
) else (
  start "Clingo Web" cmd /k "cd /d %cd% && call npm.cmd --workspace apps/web run start -- -p %WEB_PORT%"
)

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

:boot_docker_desktop
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

:seed_database
if not exist "apps\api\src\seed.ts" (
  echo Nie znaleziono skryptu importu danych startowych.
  exit /b 0
)

echo Sprawdzanie i uzupelnianie danych startowych w bazie danych...
cmd /c "set CLINGO_SKIP_AUTO_SEED=true&& set TYPEORM_SYNC=true&& call npm.cmd --workspace apps/api run seed"
if errorlevel 1 (
  echo [BLAD] Nie udalo sie automatycznie zaimportowac danych startowych.
  echo Szczegoly bledu powinny byc widoczne powyzej.
  echo API nadal sprobuje wystartowac. Jesli dane sa niepelne, sprawdz Docker Desktop i uruchom ten plik ponownie.
  exit /b 0
)

echo Dane startowe w bazie danych sa gotowe.
exit /b 0
