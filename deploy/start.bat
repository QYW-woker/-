@echo off
chcp 65001 >nul
title 照相馆系统启动

echo.
echo ============================================
echo   照相馆系统启动脚本
echo ============================================
echo.

:: 切换到项目根目录
cd /d "%~dp0.."

:: 检查 Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

:: 检查 pm2
pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 正在安装 pm2...
    npm install -g pm2
    npm install -g pm2-windows-startup
)

:: 检查 .env 文件
if not exist "backend\.env" (
    echo [错误] 未找到 backend\.env 配置文件
    echo 请复制 backend\.env.example 为 backend\.env 并填写配置
    pause
    exit /b 1
)

:: 检查证书
if not exist "backend\certs\cert.pem" (
    echo [警告] 未找到 HTTPS 证书，将以 HTTP 模式启动
    echo 摄像头功能需要 HTTPS，请运行 deploy\generate-cert.ps1 生成证书
    echo.
)

:: 安装依赖（如果 node_modules 不存在）
if not exist "backend\node_modules" (
    echo [提示] 正在安装后端依赖...
    cd backend
    npm install --production
    cd ..
)

:: 停止已有实例
pm2 delete photograph >nul 2>&1

:: 启动服务
echo [启动] 正在启动后端服务...
pm2 start backend\server.js --name photograph --cwd backend

:: 保存 pm2 配置（开机自启）
pm2 save

echo.
echo ============================================
echo   启动完成！
echo ============================================
echo.
pm2 list
echo.
echo 查看日志：pm2 logs photograph
echo 停止服务：pm2 stop photograph
echo 重启服务：pm2 restart photograph
echo.
pause
