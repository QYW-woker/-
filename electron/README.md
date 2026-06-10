# 拍照体验站 — Windows 桌面版（Electron）

## 目录结构

```
Photograph/
├── frontend/          ← 原 H5 代码，不改动
├── backend/           ← 原后端代码，不改动
└── electron/          ← 本目录，独立 Electron 包装层
    ├── package.json
    ├── main.js
    └── dist-win/      ← 构建输出（.exe 安装包）
```

---

## 首次安装依赖

```bash
cd electron
npm install
```

---

## 本地运行（macOS 开发测试）

确保后端依赖已安装：
```bash
cd ../backend && npm install
```

启动 Electron（会自动构建前端 + 开启 DevTools）：
```bash
cd ../electron
npm run dev
```

---

## 打包 Windows 安装包

### 方式一：在 Windows 机器上构建（推荐，最简单）

1. 把整个 `Photograph/` 目录拷贝到 Windows
2. 安装 Node.js v18+（https://nodejs.org）
3. 执行：
   ```bat
   cd electron
   npm install
   npm run build:win
   ```
4. 输出在 `electron/dist-win/`：
   - `拍照体验站 Setup 1.0.0.exe` — NSIS 安装包
   - `拍照体验站-portable-1.0.0.exe` — 免安装便携版

### 方式二：在 macOS 上交叉编译 Windows 包

需要先安装 Wine：
```bash
brew install --cask wine-stable
```

然后：
```bash
cd electron
npm run build:win
```

> 注意：首次运行 electron-builder 会自动下载 Electron Windows 二进制文件（约 100MB），需要网络。

---

## 只构建目录（不打包，用于快速测试）

```bash
npm run build:dir
```

输出在 `dist-win/win-unpacked/`，直接运行其中的 `拍照体验站.exe` 即可。

---

## 安装后的文件位置（Windows）

- 安装目录：`%LOCALAPPDATA%\Programs\拍照体验站\`
- 相册 / 背景 / 上传文件：安装目录下的 `resources\backend\` 子目录

---

## 常见问题

**Q: 打开后白屏 / 加载转圈很久**
A: 后端启动需要几秒，属正常现象（最多等待 25 秒）。

**Q: 摄像头无法使用**
A: Electron 内置 Chromium，摄像头权限与浏览器相同。首次启动会弹出系统摄像头权限请求，允许即可。
不需要 HTTPS，localhost 环境直接可用。

**Q: 杀毒软件报警**
A: 未经代码签名的 Electron 应用在 Windows 上可能触发 SmartScreen 警告，点击"仍要运行"即可。
如需消除警告，需购买代码签名证书（EV 证书）。

**Q: 如何更新应用**
A: 重新构建并覆盖安装即可，用户数据（相册、背景）不会被删除。
