@echo off
title BookIN Backend Server
cd /d "%~dp0backend"
echo ========================================================
echo Starting BookIN FastAPI GraphQL Backend on port 8000...
echo GraphQL IDE: http://127.0.0.1:8000/graphql
echo Health Check: http://127.0.0.1:8000/health
echo ========================================================
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
