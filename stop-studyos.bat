@echo off
title StudyOS — Ustavljam...
echo  Ustavljam StudyOS...
taskkill /F /FI "WINDOWTITLE eq StudyOS Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq StudyOS Frontend*" >nul 2>&1
:: Zapri tudi node procese na tipičnih portih
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do taskkill /F /PID %%a >nul 2>&1
echo  ✓  StudyOS zaustavljen.
timeout /t 2 /noisy >nul
