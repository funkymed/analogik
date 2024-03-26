const { app, BrowserWindow, Menu, globalShortcut } = require("electron");

let mainWindow;

Menu.setApplicationMenu(null);

const createWindow = () => {
  globalShortcut.register("Escape", function () {
    mainWindow.close();
  });

  mainWindow = new BrowserWindow({
    frame: false,
    resizable: true,
    transparent: false,
    // width: 1920,
    // height: 1080,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
    },
  });

  // mainWindow.webContents.openDevTools();

  mainWindow.center();
  mainWindow.setMenu(null);
  mainWindow.setFullScreen(true);
  mainWindow.loadFile("build/index.html");
  mainWindow.loadURL("file://" + __dirname + "/build/index.html");
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", function () {
  globalShortcut.unregister("Escape");
  globalShortcut.unregisterAll();
});
