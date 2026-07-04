@echo off
cd /d "D:\CV SAAS\cv-scanner\backend"
echo.
echo [1/2] Running database migration...
call npm run migrate
echo.
echo [2/2] Starting backend server...
echo.
npm run dev
pause
