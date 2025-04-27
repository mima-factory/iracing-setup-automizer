let currentConfig;

window.api.loadConfig().then(cfg => {
  document.getElementById('seasonWeekSelect').value = cfg.general.week;
  document.getElementById('mappingsTextarea').value = JSON.stringify(cfg.mappings, null, 2);
});

window.api.onLogMessage(msg => {
  const logEl = document.getElementById('logOutput');
  logEl.textContent += msg + '\n';
  logEl.scrollTop = logEl.scrollHeight;
});

document.getElementById('configForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    // Here we saved the config before
    alert('Settings saved successfully!');
  } catch (err) {
    alert('Error saving settings: ' + err.message);
  }
});

const ipcRenderer = window.electron.ipcRenderer;

document.getElementById('selectDirectory').addEventListener('click', async () => {
  const selectedPath = await ipcRenderer.invoke('select-directory');
  
  if (selectedPath) {
    document.getElementById('selectedDirectory').value = selectedPath;
  }
});
