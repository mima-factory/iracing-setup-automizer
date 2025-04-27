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

const ipcRenderer = window.electron.ipcRenderer;

document.getElementById('seasonWeekSelect').addEventListener('change', async () => {
  const selectedWeek = document.getElementById('seasonWeekSelect').value;
  await ipcRenderer.invoke('select-week', selectedWeek);
});

document.getElementById('selectDirectory').addEventListener('click', async () => {
  const selectedPath = await ipcRenderer.invoke('select-directory');
  
  if (selectedPath) {
    document.getElementById('selectedDirectory').value = selectedPath;
  }
});

document.getElementById('selectSetupArchive').addEventListener('click', async () => {
  const selectedPath = await ipcRenderer.invoke('select-setup-archive');
  
  if (selectedPath) {
    document.getElementById('selectedSetupArchive').value = selectedPath;
  }
});

document.getElementById('processSetupArchiveButton').addEventListener('click', async () => {
  const selectedSetupArchivePath = document.getElementById('selectedSetupArchive').value;

  if (selectedSetupArchivePath.length === 0) {
    alert('Please select a valid file to process.');
    return;
  }

  try {
    await ipcRenderer.invoke('process-zip-file', selectedSetupArchivePath);
  } catch (err) {
    console.error('Error processing zip file:', err);
  }
});
