/**
 * Electron 主进程
 *
 * 启动流程：
 *  1. 用 ELECTRON_RUN_AS_NODE=1 fork 后端 Express 服务（端口 4000）
 *     → 使用 Electron 内置 Node.js，无需目标机器额外安装 Node
 *  2. 在主进程内启动静态文件服务器（端口 5173）
 *     → 提供 frontend/dist 静态资源，并把 /api/* 代理到后端
 *  3. 等两个端口都就绪后，打开 BrowserWindow 加载 http://127.0.0.1:5173/
 */

const { app, BrowserWindow, dialog, session } = require('electron')
const { fork }   = require('child_process')
const path       = require('path')
const net        = require('net')

const isDev = !app.isPackaged

let backendProc  = null
let staticServer = null
let mainWindow   = null

// ── 路径辅助 ──────────────────────────────────────────────────────────────
// dev:  相对于 electron/ 目录往上找
// prod: 文件在 resources/ 下（electron-builder extraResources）
function res(...segments) {
  const base = isDev ? path.join(__dirname, '..') : process.resourcesPath
  return path.join(base, ...segments)
}

// ── 等待端口监听就绪 ──────────────────────────────────────────────────────
function waitPort(port, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    function probe() {
      const sock = new net.Socket()
      sock.setTimeout(1000)
      sock.once('connect', () => { sock.destroy(); resolve() })
      sock.once('error',   retry)
      sock.once('timeout', retry)
      sock.connect(port, '127.0.0.1')
      function retry() {
        sock.destroy()
        if (Date.now() > deadline) reject(new Error(`端口 ${port} 等待超时`))
        else setTimeout(probe, 400)
      }
    }
    probe()
  })
}

// ── 1. 启动后端 Express 服务 ───────────────────────────────────────────────
function startBackend() {
  const entry = res('backend', 'server.js')
  const cwd   = res('backend')

  backendProc = fork(entry, [], {
    cwd,
    // 关键：用 Electron 自身可执行文件以 Node 模式运行，
    // 无需目标 Windows 机器单独安装 Node.js
    execPath: process.execPath,
    execArgv: [],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',  // 让 Electron 以纯 Node 模式运行
      PORT: '4000',
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      // 可写数据目录：打包后 resources/ 只读，必须用 userData
      DATA_DIR: app.getPath('userData'),
    },
  })

  backendProc.on('error', (err) => console.error('[backend error]', err))
  backendProc.on('exit',  (code) => console.log('[backend exit]', code))

  return waitPort(4000)
}

// ── 2. 启动前端静态服务 + API 代理 ──────────────────────────────────────────
function startStaticServer() {
  return new Promise((resolve, reject) => {
    const express = require('express')
    const { createProxyMiddleware } = require('http-proxy-middleware')

    const srv      = express()
    const distPath = res('frontend', 'dist')

    // /api/* → 后端 4000
    srv.use('/api', createProxyMiddleware({
      target:      'http://127.0.0.1:4000',
      changeOrigin: true,
      logLevel:    'warn',
    }))

    // 前端静态文件
    srv.use(express.static(distPath))

    // SPA fallback（vue-router hash 模式，其实不需要，但加上更稳）
    srv.get('*', (_req, res_) => res_.sendFile(path.join(distPath, 'index.html')))

    staticServer = srv.listen(5173, '127.0.0.1', () => resolve())
    staticServer.on('error', reject)
  })
}

// ── 3. 创建窗口 ──────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        900,
    minHeight:       600,
    title:           '拍照体验站',
    backgroundColor: '#0a0a1a',
    show:            false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
    },
  })

  mainWindow.loadURL('http://127.0.0.1:5173/')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // dev 模式打开 DevTools
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── App 生命周期 ─────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // 授予摄像头/麦克风权限（Electron 默认不弹系统授权对话框）
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media')
  })
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return permission === 'media'
  })

  try {
    console.log('[electron] 启动后端...')
    await startBackend()
    console.log('[electron] 后端就绪 :4000')

    console.log('[electron] 启动静态服务...')
    await startStaticServer()
    console.log('[electron] 静态服务就绪 :5173')

    createWindow()
  } catch (err) {
    console.error('[electron] 启动失败:', err)
    dialog.showErrorBox('启动失败', `无法启动应用服务：\n\n${err.message}`)
    app.quit()
  }
})

app.on('window-all-closed', () => app.quit())

app.on('before-quit', () => {
  backendProc?.kill()
  staticServer?.close()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
