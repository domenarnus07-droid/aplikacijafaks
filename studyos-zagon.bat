@echo off
title StudyOS
cd /d "%~dp0"
echo.
echo  ╔══════════════════════════════════════╗
echo  ║        StudyOS se zaganja...         ║
echo  ╚══════════════════════════════════════╝
echo.
echo  Aplikacija bo dostopna na:
echo  http://localhost:5000
echo.
start "" "http://localhost:5000"
node server/index.js
