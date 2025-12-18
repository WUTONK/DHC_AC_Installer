import { app, shell, BrowserWindow, ipcMain, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// 后端进程管理
let backendProcess: ChildProcess | null = null

function startBackend(): void {
  // 获取后端可执行文件路径
  // Windows 上需要 .exe 扩展名，其他平台不需要
  const backendExecutable = process.platform === 'win32' ? 'main.exe' : 'main'
  const backendPath = is.dev
    ? join(__dirname, '../../../DHC_Backend', backendExecutable)
    : join(process.resourcesPath, backendExecutable)

  console.log('Starting backend at:', backendPath)

  // 启动后端进程
  backendProcess = spawn(backendPath, [], {
    cwd: is.dev ? join(__dirname, '../../../DHC_Backend') : process.resourcesPath,
    stdio: 'inherit',
    shell: false
  })

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error)
  })

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend process exited with code ${code} and signal ${signal}`)
    backendProcess = null
  })
}

function stopBackend(): void {
  if (backendProcess) {
    console.log('Stopping backend process...')
    if (process.platform === 'win32') {
      // Windows 使用 taskkill
      spawn('taskkill', ['/pid', backendProcess.pid!.toString(), '/f', '/t'])
    } else {
      // macOS/Linux 使用 kill
      backendProcess.kill('SIGTERM')
    }
    backendProcess = null
  }
}

function createMenu(): void {
  const isMac = process.platform === 'darwin'

  // Electron's menu typing is quite strict across versions; keep runtime-safe structure,
  // and cast once to avoid verbose per-item literal typing.
  const template = ([
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }]
              }
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: (_: Electron.MenuItem, focusedWindow: Electron.BrowserWindow | undefined) => {
            if (focusedWindow) {
              if (process.platform === 'darwin') {
                focusedWindow.webContents.setZoomFactor(720 / 1080)
              } else {
                focusedWindow.webContents.setZoomFactor(1.0)
              }
            }
          }
        },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close' }])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ] as unknown) as Electron.MenuItemConstructorOptions[]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow(): void {
  // Create the browser window.
  // 设计尺寸：1920x1080 (Windows)，在 macOS 中缩放到 1280x720 显示
  const designWidth = 1920
  const designHeight = 1080
  const scaleFactor = 720 / 1080 // 720h 显示 1080h 的内容

  // 根据平台设置窗口大小
  const isMacOS = process.platform === 'darwin'
  const windowWidth = isMacOS ? Math.round(designWidth * scaleFactor) : designWidth // macOS: 1280, Windows: 1920
  const windowHeight = isMacOS ? Math.round(designHeight * scaleFactor) : designHeight // macOS: 720, Windows: 1080
  // 最小窗口尺寸：所有平台都设置为 720p
  const minWidth = 1280
  const minHeight = 720

  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: minWidth,
    minHeight: minHeight, // 所有平台：最小 1280x720 (720p)
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 设置页面缩放：仅在 macOS 上应用缩放
  // 在 macOS 上：在 720h 窗口中显示 1080h 的内容（缩放比例 = 720 / 1080 = 0.6667）
  // 在 Windows 上：使用正常缩放（1.0），显示原始 1920x1080 设计
  mainWindow.webContents.on('did-finish-load', () => {
    if (process.platform === 'darwin') {
      // 仅在 macOS 上应用缩放
      mainWindow.webContents.setZoomFactor(scaleFactor) // 0.6667，让 1080h 内容显示在 720h 窗口中
    } else {
      // Windows 和其他平台使用正常缩放
      mainWindow.webContents.setZoomFactor(1.0)
    }
  })

  // 强制保持 16:9 窗口比例
  let isResizing = false
  const aspectRatio = 16 / 9

  // 使用 will-resize 事件（在 macOS 上可能不会触发，但作为第一道防线）
  mainWindow.on('will-resize', (event, newBounds) => {
    if (isResizing) return

    const currentBounds = mainWindow.getBounds()
    const widthDelta = Math.abs(newBounds.width - currentBounds.width)
    const heightDelta = Math.abs(newBounds.height - currentBounds.height)

    event.preventDefault()
    isResizing = true

    if (widthDelta > heightDelta) {
      // 宽度变化更大，根据宽度计算高度
      const newHeight = Math.round(newBounds.width / aspectRatio)
      mainWindow.setSize(newBounds.width, newHeight)
    } else {
      // 高度变化更大，根据高度计算宽度
      const newWidth = Math.round(newBounds.height * aspectRatio)
      mainWindow.setSize(newWidth, newBounds.height)
    }

    setTimeout(() => {
      isResizing = false
    }, 0)
  })

  // 使用 resize 事件作为补充（在 will-resize 不工作时强制保持比例）
  mainWindow.on('resize', () => {
    if (isResizing) return

    const bounds = mainWindow.getBounds()
    const currentRatio = bounds.width / bounds.height
    const tolerance = 0.01 // 允许 1% 的误差

    if (Math.abs(currentRatio - aspectRatio) > tolerance) {
      isResizing = true
      const newHeight = Math.round(bounds.width / aspectRatio)
      mainWindow.setSize(bounds.width, newHeight)

      setTimeout(() => {
        isResizing = false
      }, 0)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 添加启动参数来禁用安全策略
app.commandLine.appendSwitch('--disable-web-security')
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor')
app.commandLine.appendSwitch('--allow-running-insecure-content')
app.commandLine.appendSwitch('--disable-site-isolation-trials')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Ensure macOS Dock/app name is not the default "Electron" (especially in dev)
  app.setName('DHC')

  // Ensure macOS Dock icon matches our app icon (especially in dev)
  if (process.platform === 'darwin') {
    try {
      const dockIcon = nativeImage.createFromPath(icon)
      if (!dockIcon.isEmpty()) {
        app.dock?.setIcon(dockIcon)
      }
    } catch (e) {
      console.warn('Failed to set Dock icon:', e)
    }
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.dhc.acinstaller')

  createMenu()

  // 启动后端服务
  if (!is.dev || process.env['START_BACKEND'] !== 'false') {
    startBackend()
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handler for API requests
  ipcMain.handle('api-request', async (_, url) => {
    try {
      const response = await fetch(url)
      const data = await response.json()

      // 返回完整的响应信息，包括状态码
      return {
        success: true,
        data,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        status: 0,
        statusText: 'Network Error',
        ok: false
      }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackend()
    app.quit()
  }
})

// 应用退出时停止后端
app.on('before-quit', () => {
  stopBackend()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
