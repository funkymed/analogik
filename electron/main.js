const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  session,
} = require("electron");
const path = require("path");
const { createMenu } = require("./menu");
const { loadWindowState, saveWindowState } = require("./windowState");

let mainWindow;

// IPC handlers for preload API
ipcMain.handle("app:quit", () => {
  app.quit();
});

ipcMain.handle("app:toggleFullscreen", () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return mainWindow.isFullScreen();
  }
  return false;
});

ipcMain.handle("app:isFullscreen", () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.handle("app:getAppVersion", () => {
  return app.getVersion();
});

const createWindow = () => {
  const windowState = loadWindowState();

  globalShortcut.register("Escape", function () {
    mainWindow.close();
  });

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    frame: false,
    resizable: true,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Set Content Security Policy headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "media-src 'self' blob: data:",
            "font-src 'self' data:",
            "connect-src 'self' blob: data:",
            "worker-src 'self' blob:",
          ].join("; "),
        ],
      },
    });
  });

  // Restrict navigation to prevent navigating away from the app
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "file:") {
      event.preventDefault();
    }
  });

  // Block new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  if (!windowState.x && !windowState.y) {
    mainWindow.center();
  }
  mainWindow.setFullScreen(windowState.isFullScreen);
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Save window state on close
  mainWindow.on("close", () => {
    saveWindowState(mainWindow);
  });

  mainWindow.loadFile("build/index.html");
};

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", function () {
  globalShortcut.unregister("Escape");
  globalShortcut.unregisterAll();
});
