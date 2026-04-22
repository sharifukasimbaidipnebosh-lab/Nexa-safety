@echo off
:: =============================================================
:: Nexa Safety — Local Development Setup Script (Windows)
:: Requires: winget (Windows Package Manager, ships with Win 11
::           and Win 10 21H2+) or Chocolatey as a fallback.
:: =============================================================

setlocal EnableDelayedExpansion
title Nexa Safety — Setup

echo.
echo ============================================================
echo   Nexa Safety -- Development Environment Setup (Windows)
echo ============================================================
echo.

:: ---------------------------------------------------------------
:: 1. Check Node.js
:: ---------------------------------------------------------------
echo [1/5] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    echo         Download it from https://nodejs.org
    echo         or run:  winget install OpenJS.NodeJS.LTS
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo [OK]    Node.js found: %NODE_VER%

:: ---------------------------------------------------------------
:: 2. Check npm
:: ---------------------------------------------------------------
echo.
echo [2/5] Checking npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed. It normally ships with Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo [OK]    npm found: %NPM_VER%

:: ---------------------------------------------------------------
:: 3. Install PostgreSQL client (psql)
:: ---------------------------------------------------------------
echo.
echo [3/5] Checking PostgreSQL client (psql)...
where psql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('psql --version') do set PSQL_VER=%%v
    echo [OK]    psql found: %PSQL_VER%
    goto :install_deps
)

echo [WARN]  psql not found -- attempting to install PostgreSQL client tools...

:: Try winget first
where winget >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO]  Running: winget install PostgreSQL.PostgreSQL
    winget install --id PostgreSQL.PostgreSQL --silent --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% EQU 0 (
        echo [OK]    PostgreSQL installed via winget.
        echo [WARN]  You may need to restart your terminal for psql to be on PATH.
        echo         Default location: C:\Program Files\PostgreSQL\<version>\bin
        goto :install_deps
    )
    echo [WARN]  winget install failed. Trying Chocolatey...
)

:: Try Chocolatey
where choco >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO]  Running: choco install postgresql --params '/Password:postgres'
    choco install postgresql --params "/Password:postgres" -y
    if %ERRORLEVEL% EQU 0 (
        echo [OK]    PostgreSQL installed via Chocolatey.
        goto :install_deps
    )
)

echo [ERROR] Could not auto-install psql.
echo         Please install PostgreSQL manually:
echo           https://www.postgresql.org/download/windows/
echo         Then add the bin directory to your PATH, e.g.:
echo           C:\Program Files\PostgreSQL\18\bin
pause
exit /b 1

:: ---------------------------------------------------------------
:: 4. Install npm dependencies
:: ---------------------------------------------------------------
:install_deps
echo.
echo [4/5] Installing npm dependencies...
if not exist "package.json" (
    echo [ERROR] package.json not found. Run this script from the project root.
    pause
    exit /b 1
)
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo [OK]    npm dependencies installed.

:: ---------------------------------------------------------------
:: 5. Create .env from .env.example
:: ---------------------------------------------------------------
echo.
echo [5/5] Setting up .env file...
if exist ".env" (
    echo [WARN]  .env already exists -- skipping. Edit it manually if needed.
    goto :instructions
)
if not exist ".env.example" (
    echo [ERROR] .env.example not found. Cannot create .env.
    pause
    exit /b 1
)
copy ".env.example" ".env" >nul
echo [OK]    .env created from .env.example
echo [WARN]  Open .env and fill in your DATABASE_URL before starting the server.

:: ---------------------------------------------------------------
:: Instructions
:: ---------------------------------------------------------------
:instructions
echo.
echo ============================================================
echo   Nexa Safety -- Setup Complete
echo ============================================================
echo.
echo   1. Configure your database connection
echo      Edit .env and set DATABASE_URL to your PostgreSQL
echo      connection string.
echo      Railway example:
echo        DATABASE_URL=postgresql://postgres:^<password^>@^<host^>:^<port^>/railway
echo.
echo   2. Initialise the database schema
echo      The server auto-creates all tables on first boot.
echo      Or run manually:
echo        psql "%DATABASE_URL%" -f db-init.sql
echo.
echo   3. (Optional) Load sample data
echo        psql "%DATABASE_URL%" -f seed-data.sql
echo.
echo   4. Start the development server
echo        npm start
echo      API available at http://localhost:3000
echo.
echo   5. Connect to the database interactively
echo        psql "%DATABASE_URL%"
echo.
echo ============================================================
echo.
pause
endlocal
