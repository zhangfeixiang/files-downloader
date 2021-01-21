import { app, BrowserWindow, Menu, globalShortcut } from 'electron'


/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  // 隐藏菜单栏 
  Menu.setApplicationMenu(null)
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  // Electron在mac下快捷键失效的问题及解决
  if (process.platform === 'darwin') {
    let contents = mainWindow.webContents
    globalShortcut.register('CommandOrControl+C', () => {
      contents.copy()
    })
    globalShortcut.register('CommandOrControl+V', () => {
      contents.paste()
    })
    globalShortcut.register('CommandOrControl+X', () => {
      contents.cut()
    })
    globalShortcut.register('CommandOrControl+A', () => {
      contents.selectAll()
    })
  }

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Electron在mac下快捷键失效的问题及解决
  mainWindow.on('focus', () => {
    // mac下快捷键失效的问题
    if (process.platform === 'darwin') {
      let contents = mainWindow.webContents
      globalShortcut.register('CommandOrControl+C', () => {
        contents.copy()
      })
      globalShortcut.register('CommandOrControl+V', () => {
        contents.paste()
      })
      globalShortcut.register('CommandOrControl+X', () => {
        contents.cut()
      })
      globalShortcut.register('CommandOrControl+A', () => {
        contents.selectAll()
      })
    }
  })
  mainWindow.on('blur', () => {
    globalShortcut.unregisterAll() // 注销键盘事件
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
