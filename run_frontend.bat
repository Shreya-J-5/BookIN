@echo off
title BookIN Frontend Dev Server
cd /d "%~dp0frontend"
echo ========================================================
echo Starting BookIN React Frontend on port 5173...
echo Application URL: http://localhost:5173
echo ========================================================
npm run dev
pause
