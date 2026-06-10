# 照相馆系统 — 部署指南

> 适用系统：Windows 10 / Windows Server
> Node.js 版本要求：18.x 或以上

---

## 目录

1. [系统架构说明](#1-系统架构说明)
2. [前置准备](#2-前置准备)
3. [项目部署](#3-项目部署)
4. [HTTPS 证书配置](#4-https-证书配置)
5. [环境变量配置](#5-环境变量配置)
6. [手机扫码下载配置](#6-手机扫码下载配置)
7. [启动服务](#7-启动服务)
8. [开机自动启动](#8-开机自动启动)
9. [防火墙配置](#9-防火墙配置)
10. [验证部署](#10-验证部署)
11. [常见问题解答](#11-常见问题解答)

---

## 1. 系统架构说明

```
┌─────────────────────────────────────────────────────┐
│  前端（已内置于后端）                                   │
│  拍照界面、背景替换、人像抠图                            │
└───────────────┬─────────────────────────────────────┘
                │ HTTPS 4000 端口
┌───────────────▼─────────────────────────────────────┐
│  后端 Node.js 服务                                    │
│  • HTTPS :4000  → 主服务（前端页面 + API）             │
│  • HTTP  :4001  → 图片下载服务（供手机扫码访问）         │
└─────────────────────────────────────────────────────┘
```

**为什么需要两个端口？**
- 摄像头功能要求浏览器必须在 HTTPS 环境下运行，因此主服务使用 HTTPS（4000）
- 手机扫码下载图片时，自签名证书会被手机浏览器拒绝，因此图片下载走 HTTP（4001）

---

## 2. 前置准备

### 2.1 安装 Node.js

1. 访问 https://nodejs.org/ 下载 **LTS 版本（18.x 或以上）**
2. 安装时勾选 "Add to PATH"
3. 安装完成后打开 PowerShell 验证：
   ```powershell
   node -v    # 应显示 v18.x.x 或更高
   npm -v     # 应显示版本号
   ```

### 2.2 安装 Git for Windows（生成证书必需）

1. 访问 https://git-scm.com/download/win 下载安装
2. 安装时保持默认选项即可
3. 安装后 PowerShell 中可使用 openssl 命令

### 2.3 安装 pm2（进程守护）

以管理员身份打开 PowerShell，执行：
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

---

## 3. 项目部署

### 3.1 复制项目文件

将项目文件夹（如 `Photograph`）复制到服务器，建议放在：
```
C:\Photograph\
```

目录结构应如下：
```
C:\Photograph\
├── backend\
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── controllers\
│   ├── routes\
│   ├── middleware\
│   └── utils\
├── frontend\
│   └── dist\          ← 前端已构建好，无需重新编译
└── deploy\
    ├── generate-cert.ps1
    └── start.bat
```

### 3.2 安装后端依赖

打开 PowerShell，进入后端目录：
```powershell
cd C:\Photograph\backend
npm install --production
```

---

## 4. HTTPS 证书配置

**摄像头功能必须使用 HTTPS**，需要生成自签名证书。

### 方法一：使用自动脚本（推荐）

以**管理员身份**运行 PowerShell，执行：
```powershell
cd C:\Photograph
.\deploy\generate-cert.ps1
```

脚本会自动检测本机 IP 并生成证书到 `backend\certs\` 目录。

### 方法二：手动使用 OpenSSL

打开 Git Bash 或含 OpenSSL 的 PowerShell：
```bash
# 将 192.168.1.100 替换为服务器实际 IP
openssl req -x509 -newkey rsa:2048 \
  -keyout C:\Photograph\backend\certs\key.pem \
  -out C:\Photograph\backend\certs\cert.pem \
  -days 3650 -nodes \
  -subj "/CN=192.168.1.100"
```

证书生成后目录结构：
```
backend\
└── certs\
    ├── cert.pem   ← 证书文件
    └── key.pem    ← 私钥文件
```

> **注意**：证书是自签名的，首次用浏览器访问时会出现安全警告，点击"高级" → "继续访问"即可。

---

## 5. 环境变量配置

复制配置模板文件：
```powershell
copy C:\Photograph\backend\.env.example C:\Photograph\backend\.env
```

用记事本编辑 `.env`：
```powershell
notepad C:\Photograph\backend\.env
```

**必须修改的配置项：**

```ini
# 替换为服务器实际 IP 地址
PUBLIC_URL=https://192.168.1.100:4000

# 手机扫码下载地址（见第6节）
IMAGE_PUBLIC_URL=http://192.168.1.100:4001

# remove.bg API 密钥（人像抠图功能）
REMOVE_BG_API_KEY=你的API密钥
```

**查询本机 IP 地址：**
```powershell
ipconfig | findstr "IPv4"
```

---

## 6. 手机扫码下载配置

这是部署中最关键的一步。根据使用场景选择配置方式：

### 场景 A：所有用户在同一 WiFi 网络下（局域网模式）

适用于：企业内网、活动现场提供统一 WiFi、所有人连接同一局域网

`.env` 配置：
```ini
IMAGE_PUBLIC_URL=http://192.168.1.100:4001
```

### 场景 B：用户使用手机 4G/5G 数据流量扫码下载（公网模式）⭐推荐

适用于：不能要求用户连接特定 WiFi、对外开放使用的场景

需要使用 **Cloudflare Tunnel** 将 4001 端口穿透到公网：

**步骤 1**：下载 cloudflared（Windows 版本）
- 访问：https://github.com/cloudflare/cloudflared/releases
- 下载：`cloudflared-windows-amd64.exe`
- 重命名为 `cloudflared.exe` 放到 `C:\Photograph\deploy\`

**步骤 2**：启动穿透隧道
```powershell
cd C:\Photograph\deploy
.\cloudflared.exe tunnel --url http://localhost:4001
```

**步骤 3**：复制输出的公网地址，例如：
```
https://abc-123-def.trycloudflare.com
```

**步骤 4**：更新 `.env`：
```ini
IMAGE_PUBLIC_URL=https://abc-123-def.trycloudflare.com
```

**步骤 5**：重启后端服务：
```powershell
pm2 restart photograph
```

> **注意**：免费的 Cloudflare Tunnel 每次重启地址会变化，需要重新配置 `.env`。
> 如需固定地址，注册 Cloudflare 账号后可使用命名隧道（永久固定 URL）。

---

## 7. 启动服务

### 方法一：使用启动脚本（推荐）

双击运行 `deploy\start.bat`，或在 PowerShell 中执行：
```powershell
C:\Photograph\deploy\start.bat
```

### 方法二：手动启动

```powershell
cd C:\Photograph\backend
pm2 start server.js --name photograph
pm2 save
```

### 确认启动成功

启动日志应包含以下内容：
```
后端服务已启动 (HTTPS)
  本地访问：https://localhost:4000
  健康检查：https://localhost:4000/api/health

[cleanup] 定时清理任务已启动（每小时一次）
  图片下载服务 (HTTP)：http://localhost:4001/api/image/
```

**若只看到 HTTP（无 HTTPS）字样**，说明证书未配置，请回到第 4 节生成证书。

---

## 8. 开机自动启动

执行以下命令，确保服务器重启后自动恢复运行：

```powershell
pm2-startup install
pm2 save
```

验证：
```powershell
pm2 list   # 应看到 photograph 进程处于 online 状态
```

---

## 9. 防火墙配置

以**管理员身份**运行 PowerShell，开放所需端口：

```powershell
# 开放主服务端口（HTTPS，浏览器访问）
netsh advfirewall firewall add rule name="Photograph HTTPS 4000" dir=in action=allow protocol=TCP localport=4000

# 开放图片下载端口（HTTP，手机扫码）
netsh advfirewall firewall add rule name="Photograph HTTP 4001" dir=in action=allow protocol=TCP localport=4001
```

---

## 10. 验证部署

### 10.1 验证服务运行状态
```powershell
pm2 list
```
`photograph` 进程应显示 `online`。

### 10.2 验证主服务（浏览器）

在服务器本机或同网络电脑浏览器访问：
```
https://192.168.1.100:4000
```
首次访问会有证书警告，点击"高级" → "继续访问（不安全）"。

### 10.3 验证图片下载端口（手机）

手机浏览器访问：
```
http://192.168.1.100:4001/api/image/test
```
应返回：`{"success":false,"message":"无效的图片 ID"}`
收到此 JSON 说明端口正常。

### 10.4 全流程测试

1. 电脑浏览器打开主页 → 应能正常调起摄像头
2. 完成拍照 → 应显示二维码
3. 手机扫描二维码 → 应能正常下载图片

---

## 11. 常见问题解答

---

### Q1：浏览器显示"您的连接不是私密连接"

**原因**：使用了自签名证书，浏览器默认不信任。

**解决**：
1. 点击"高级"
2. 点击"继续访问 192.168.x.x（不安全）"

每台需要使用系统的电脑首次访问时都需要操作一次。

---

### Q2：摄像头无法打开 / 提示需要权限

**原因 A**：使用了 HTTP 而非 HTTPS。

**解决**：确认 `backend\certs\` 目录下有 `cert.pem` 和 `key.pem` 文件，并重启服务。

**原因 B**：浏览器未授权摄像头权限。

**解决**：点击浏览器地址栏左侧的锁形图标 → 允许摄像头权限，然后刷新页面。

---

### Q3：手机扫码后一直转圈 / 无法下载图片

**原因 A**：手机使用 4G/5G 流量，无法访问局域网 IP。

**解决**：配置 Cloudflare Tunnel（见第 6 节场景 B），并更新 `IMAGE_PUBLIC_URL`。

**原因 B**：4001 防火墙端口未开放。

**解决**：以管理员权限运行第 9 节的防火墙命令。

**原因 C**：`.env` 中 `IMAGE_PUBLIC_URL` 未配置或配置错误。

**解决**：检查 `.env` 文件，确认 `IMAGE_PUBLIC_URL` 填写正确，然后 `pm2 restart photograph`。

---

### Q4：手机扫码出现 ERR_EMPTY_RESPONSE

**原因**：手机尝试用 HTTPS 访问，但遇到了自签名证书被拒绝。

**解决**：确认 `IMAGE_PUBLIC_URL` 使用的是 `http://` 而非 `https://`（4001 端口是 HTTP）。

---

### Q5：服务启动报错 EADDRINUSE（端口被占用）

**原因**：服务已在运行，或上次未正常关闭。

**解决**：
```powershell
# 停止所有 node 进程
taskkill /IM node.exe /F

# 重新启动
pm2 start C:\Photograph\backend\server.js --name photograph
```

---

### Q6：重启服务器后服务没有自动启动

**原因**：未执行 pm2 开机自启配置。

**解决**：
```powershell
pm2-startup install
pm2 save
```

---

### Q7：人像抠图功能不工作

**原因**：`REMOVE_BG_API_KEY` 未配置或 API 额度用完。

**解决**：
1. 访问 https://www.remove.bg/api 注册获取 API Key
2. 更新 `.env` 中的 `REMOVE_BG_API_KEY`
3. 执行 `pm2 restart photograph`

免费账号每月有一定免费额度，超出需付费。

---

### Q8：查看运行日志

```powershell
# 实时日志
pm2 logs photograph

# 只看错误
pm2 logs photograph --err

# 查看历史日志文件
type C:\Users\Administrator\.pm2\logs\photograph-out.log
type C:\Users\Administrator\.pm2\logs\photograph-error.log
```

---

### Q9：更新系统文件后如何重启

```powershell
pm2 restart photograph
```

---

## 快速参考

| 操作 | 命令 |
|------|------|
| 查看服务状态 | `pm2 list` |
| 启动服务 | `pm2 start C:\Photograph\backend\server.js --name photograph` |
| 停止服务 | `pm2 stop photograph` |
| 重启服务 | `pm2 restart photograph` |
| 查看日志 | `pm2 logs photograph` |
| 查看本机IP | `ipconfig \| findstr IPv4` |
| 开放防火墙端口 | 见第 9 节 |
