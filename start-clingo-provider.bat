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
