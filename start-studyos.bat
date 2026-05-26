@echo off
title StudyOS — Zaganjam...
color 1F
cls

echo.
echo  ===================================
echo    StudyOS  ^|  FERI IPT
echo  ===================================
echo.
echo  [1/2] Zaganjam streznik (port 5000)...

cd /d "%~dp0"

:: Zaženi backend (Express + MongoDB)
start "StudyOS Backend" /min cmd /c "node studyos/server/index.js"

:: Počakaj sekundo da se backend zažene
timeout /t 2 /noisy >nul

echo  [2/2] Zaganjam frontend (port 5173)...

:: Zaženi Vite dev server
start "StudyOS Frontend" /min cmd /c "npm run dev"

:: Počakaj da se Vite zažene
timeout /t 3 /noisy >nul

echo.
echo  ✓  Aplikacija teče na: http://localhost:5173
echo.
echo  Odpri v Chrome/Edge in klikni gumb "Namesti app"
echo  da namestiš StudyOS kot namizno aplikacijo.
echo.
echo  Za zapiranje zapri obe okni v opravilni vrstici.
echo.

:: Odpri brskalnik
start "" "http://localhost:5173"

echo  Pritisnite katerokoli tipko za zapiranje tega okna...
pause >nul
