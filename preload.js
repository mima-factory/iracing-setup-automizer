const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  onLogMessage: cb => ipcRenderer.on('log-message', (_, msg) => cb(msg)),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: cfg => ipcRenderer.invoke('save-config', cfg)
});
