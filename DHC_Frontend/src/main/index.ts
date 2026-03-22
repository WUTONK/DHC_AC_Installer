import { app, shell, BrowserWindow, ipcMain, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// ============================================
// 后端进程管理
// ============================================
// 存储后端进程的引用，用于后续停止进程
let backendProcess: ChildProcess | null = null

/**
 * 启动后端服务进程
 *
 * 作用：启动一个独立的进程来运行后端服务（DHC_Backend）
 * 为什么需要：后端服务提供 HTTP API，前端通过请求这些 API 获取数据
 *
 * 工作流程：
 * 1. 根据平台选择可执行文件（Windows: main.exe, macOS/Linux: main）
 * 2. 根据环境选择路径（开发环境 vs 生产环境）
 * 3. 使用 spawn 启动进程
 * 4. 监听进程事件（错误、退出）
 */
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

/**
 * 停止后端服务进程
 *
 * 作用：优雅地关闭后端进程
 * 为什么需要：应用退出时，需要清理资源，避免僵尸进程
 *
 * 注意：不同平台使用不同的终止方式
 * - Windows: 使用 taskkill 命令
 * - macOS/Linux: 使用 kill 信号
 */
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

/**
 * 创建应用主窗口
 *
 * 作用：创建一个浏览器窗口来显示 React 应用
 *
 * 关键配置说明：
 * - preload: 预加载脚本路径，用于在渲染进程加载前执行代码
 * - webPreferences: 安全设置
 *   - sandbox: false - 关闭沙箱（方便开发）
 *   - contextIsolation: false - 关闭上下文隔离（方便开发，但安全性较低）
 *   - nodeIntegration: true - 允许使用 Node.js API（方便开发）
 *
 * 窗口尺寸策略：
 * - Windows: 1920x1080（原始设计尺寸）
 * - macOS: 1280x720（缩放显示，实际内容还是 1080p）
 */
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

  // IPC test - 测试 IPC 通信是否正常
  ipcMain.on('ping', () => console.log('pong'))

  // ============================================
  // IPC 处理器：处理来自渲染进程的 API 请求
  // ============================================
  //
  // 作用：当渲染进程调用 window.api.requestApi(url) 时，这个函数会被执行
  //
  // 工作流程：
  // 1. 渲染进程通过 IPC 发送请求（包含 URL）
  // 2. 主进程接收请求，使用 fetch 发送 HTTP 请求到后端
  // 3. 后端返回数据
  // 4. 主进程通过 IPC 返回结果给渲染进程
  //
  // 为什么需要：渲染进程不能直接发送 HTTP 请求（安全限制），需要通过主进程代理
  ipcMain.handle(
    'api-request',
    async (
      _,
      url: string,
      options?: { method?: string; body?: string; headers?: Record<string, string> }
    ) => {
      try {
        const init: RequestInit = {
          method: options?.method ?? 'GET'
        }
        if (options?.body !== undefined) {
          init.body = options.body
        }
        if (options?.headers && Object.keys(options.headers).length > 0) {
          init.headers = options.headers
        }
        const response = await fetch(url, init)
        const text = await response.text()
        let data: unknown
        try {
          data = text ? JSON.parse(text) : null
        } catch {
          data = text
        }

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
    }
  )

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
