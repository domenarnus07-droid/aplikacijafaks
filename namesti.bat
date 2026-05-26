@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title StudyOS — Namestitev precice

echo.
echo  ================================================
echo   StudyOS — Namestitev precice na namizje
echo  ================================================
echo.

:: Zgradi aplikacijo (ce dist se ne obstaja)
if not exist "dist\index.html" (
  echo  Gradim aplikacijo, prosim pocakaj...
  call npm run build
  if errorlevel 1 (
    echo.
    echo  NAPAKA: Gradnja ni uspela. Preveri npm in Node.js.
    pause
    exit /b 1
  )
  echo  Aplikacija zgrajena!
  echo.
)

:: Pot do VBS zaganjalnika
set "VBS_POT=%~dp0StudyOS.vbs"

:: Ustvari precico na namizju s PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $desktop = [Environment]::GetFolderPath('Desktop'); ^
   $s = $ws.CreateShortcut($desktop + '\StudyOS.lnk'); ^
   $s.TargetPath = 'wscript.exe'; ^
   $s.Arguments = '\""%VBS_POT%\"\"'; ^
   $s.WorkingDirectory = '%~dp0'; ^
   $s.Description = 'StudyOS - Student Workspace'; ^
   $s.IconLocation = 'C:\Windows\System32\shell32.dll,220'; ^
   $s.Save()"

if errorlevel 1 (
  echo  NAPAKA pri ustvarjanju precice.
  pause
  exit /b 1
)

echo.
echo  ================================================
echo   Precica "StudyOS" je bila dodana na namizje!
echo  ================================================
echo.
echo  Od zdaj naprej: dvoklikni "StudyOS" na namizju.
echo  Terminal se ne bo odprl.
echo.
pause
