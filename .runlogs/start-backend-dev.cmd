@echo off
cd /d "C:\Users\PC\Desktop\Inmobiliaria\backend"
set JWT_SECRET=dev_local_secret_2026
npm run start:dev > "C:\Users\PC\Desktop\Inmobiliaria\.runlogs\backend-dev.log" 2>&1
