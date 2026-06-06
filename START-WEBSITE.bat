@echo off
title NEXUS — local server
cd /d "%~dp0"

if not exist "node_modules\" (
  echo Installing dependencies first...
  call npm.cmd install
  if errorlevel 1 (
    echo npm install failed. Make sure Node.js is installed.
    pause
    exit /b 1
  )
)

echo.
echo Starting NEXUS at http://localhost:3000
echo Keep this window open while you use the site.
echo To stop: close this window or press Ctrl+C
echo.

start "" "http://localhost:3000"
call npm.cmd start

pause
