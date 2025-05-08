const { contextBridge, ipcRenderer } = require('electron');
window.ipcRenderer = ipcRenderer; // Expose ipcRenderer to the renderer process

contextBridge.exposeInMainWorld('api', {
  onLogMessage: cb => ipcRenderer.on('log-message', (_, msg) => cb(msg)),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  selectWeek: () => ipcRenderer.invoke('select-week'),
  loadGngDatapacks: () => ipcRenderer.invoke('load-gng-datapacks'),
  onLogDatapackPreview: cb => ipcRenderer.on('log-datapack-preview', (_, msg) => cb(msg)),
  onShowGngDatapacks: cb => ipcRenderer.on('show-gng-datapack', (_, datapacks) => cb(datapacks)),
  onCopyGngDatapacks: cb => ipcRenderer.on('copy-gng-datapacks', (_, datapackIds) => cb(datapackIds)),
  onLogDatapackCopy: cb => ipcRenderer.on('log-datapack-copy', (_, msg) => cb(msg)),
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  },
});
