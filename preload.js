const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  onLogMessage: callback => ipcRenderer.on('log-message', (_, message) => callback(message))
});
