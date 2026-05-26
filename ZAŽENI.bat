@echo off
title StudyOS
cd /d "%~dp0"

echo.
echo  ========================================
echo   StudyOS — Zaganjam...
echo  ========================================
echo.

REM Terminal 1: Express API + Vite
start "StudyOS - Dev Server" cmd /k "npm run dev"

REM Počakaj 4 sekunde da se Vite zagotovi
timeout /t 4 /nobreak >nul

REM Terminal 2: Electron (ki bo počakal na Vite sam)
start "StudyOS - Electron" cmd /k "npm run electron"

echo  Vse je zagnjano!
timeout /t 2 /nobreak >nul
exit
