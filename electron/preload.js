const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  quit: () => ipcRenderer.invoke("app:quit"),
  toggleFullscreen: () => ipcRenderer.invoke("app:toggleFullscreen"),
  isFullscreen: () => ipcRenderer.invoke("app:isFullscreen"),
  getAppVersion: () => ipcRenderer.invoke("app:getAppVersion"),
});
