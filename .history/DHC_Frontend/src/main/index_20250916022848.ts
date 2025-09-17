import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn, ChildProcess } from 'child_process'
import icon from '../../resources/icon.png?asset'

// Go 后端进程
let goBackendProcess: ChildProcess | null = null

// 启动 Go 后端服务
function startGoBackend(): void {
  const backendPath = join(__dirname, '../../../backend')

  try {
    // 启动 Go 后端服务
    goBackendProcess = spawn('go', ['run', 'main.go'], {
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    goBackendProcess.stdout?.on('data', (data) => {
      console.log('Go 后端输出:', data.toString())
    })

    goBackendProcess.stderr?.on('data', (data) => {
      console.error('Go 后端错误:', data.toString())
    })

    goBackendProcess.on('close', (code) => {
      console.log(`Go 后端进程退出，退出码: ${code}`)
      goBackendProcess = null
    })

    goBackendProcess.on('error', (err) => {
      console.error('启动 Go 后端失败:', err)
    })

    console.log('Go 后端服务已启动')
  } catch (error) {
    console.error('启动 Go 后端时发生错误:', error)
  }
}

// 停止 Go 后端服务
function stopGoBackend(): void {
  if (goBackendProcess) {
    goBackendProcess.kill()
    goBackendProcess = null
    console.log('Go 后端服务已停止')
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 启动 Go 后端服务
  startGoBackend()

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
    // 停止 Go 后端服务
    stopGoBackend()
    app.quit()
  }
})

// 应用退出时停止后端服务
app.on('before-quit', () => {
  stopGoBackend()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
