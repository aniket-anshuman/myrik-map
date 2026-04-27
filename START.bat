@echo off
REM ================================================
REM Issue Reporting System - Startup Script
REM ================================================

echo.
echo ========================================
echo  Issue Reporting System
echo  Backend API + Frontend UI
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking Node.js...
node --version
echo.

echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/4] Creating upload directory...
if not exist "uploads\issues" (
    mkdir uploads\issues
    echo Created: uploads\issues
) else (
    echo Already exists: uploads\issues
)
echo.

echo [4/4] Starting server...
echo.
echo ========================================
echo  Server starting on port 3000
echo  Open browser: http://localhost:3000
echo  Press Ctrl+C to stop
echo ========================================
echo.

REM Start the server
npm start

pause
