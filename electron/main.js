const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
} = require('electron');

let mainWindow;

Menu.setApplicationMenu(null);

app.on('ready', () => {
  globalShortcut.register('Escape', function(){
    mainWindow.close();
  });

  mainWindow = new BrowserWindow({
    frame: false,
    resizable: true,
    transparent: false,
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // mainWindow.webContents.openDevTools()

  mainWindow.center();
  mainWindow.setMenu(null);
  mainWindow.setFullScreen(true);
  mainWindow.loadURL('file://' + __dirname + '/build/index.html');
});

app.on('will-quit', function(){
  globalShortcut.unregister('Escape');
  globalShortcut.unregisterAll();
});
