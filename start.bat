@echo off
cd /d C:\Photograph\backend
set NODE_ENV=production
set PORT=4000
set HOST=0.0.0.0
set PUBLIC_URL=http://172.16.0.222:4000
set IMAGE_EXPIRE_HOURS=2
set MAX_FILE_SIZE_MB=10
set REMOVE_BG_API_KEY=1CaygSeenxYmVFsxfTBYsF65
node server.js
pause
