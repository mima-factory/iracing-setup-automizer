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

window.api.onLogDatapackPreview(msg => {
  const logElement = document.getElementById('datapackPreview');
  logElement.textContent += msg + '\n';
  logElement.scrollTop = logElement.scrollHeight;
});

window.api.onLogDatapackCopy(msg => {
  const logElement = document.getElementById('datapackLog');
  logElement.textContent += msg + '\n';
  logElement.scrollTop = logElement.scrollHeight;
});

window.api.onShowGngDatapacks(datapacksWithTargets => {
  const selectElement = document.getElementById('gngDatapacksSelect');
  // Clear existing options
  selectElement.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.text = 'Select data packs to copy...';
  defaultOption.value = 'default';
  selectElement.add(defaultOption);
  let lastCar = null;
  let carOption = null;
  
  // Start a regular loop over the datapacks
  for (let index = 0; index < datapacksWithTargets.length; index++) {
    const datapackWithTarget = datapacksWithTargets[index];
    console.log({index, datapackWithTarget: datapackWithTarget});
    if (lastCar !== datapackWithTarget.car) {
      if (lastCar !== null) {
        selectElement.add(carOption);  
      }
      const car = datapackWithTarget.car;
      carOption = document.createElement('optgroup');
      carOption.label = car;
    }
    lastCar = datapackWithTarget.car;
    const datapack = datapackWithTarget.dataPack;

    const option = document.createElement('option');
    option.text = `${datapack.seasonYear}S${datapack.seasonNo} W${datapack.week} ${datapack.track} ${datapack.series}${datapack.isWet ? ' WET' : ''}`;
    option.value = index;
    carOption.appendChild(option);
  }

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
    document.getElementById('selectedSetupArchive').value = selectedPath.join(';');
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
    console.log('Error processing zip file:', err);
  }
});

document.getElementById('loadGngDatapacks').addEventListener('click', async () => {
  const selectedElement = document.getElementById('gngSeriesSelect');
  const selectedSeries = Array.from(selectedElement.options).filter(function (option) {
    return option.selected;
  }).map(function (option) {
    return option.value;
  });

  await ipcRenderer.invoke('load-gng-datapacks', selectedSeries);
});

document.getElementById('copyGngDatapacks').addEventListener('click', async () => {
  const selectElement = document.getElementById('gngDatapacksSelect');
  const selectedDatapackIds = Array.from(selectElement.options).filter(function (option) {
    return option.selected;
  }).map(function (option) {
    return option.value;
  });

  await ipcRenderer.invoke('copy-gng-datapacks', selectedDatapackIds);
});

document.getElementById('selectSetupsDirectory').addEventListener('click', async () => {
  const selectedPath = await ipcRenderer.invoke('select-setups-directory');
  
  if (selectedPath) {
    document.getElementById('selectedSetupsDirectory').value = selectedPath;
  }
});

document.getElementById('selectTargetDirectory').addEventListener('click', async () => {
  const selectedPath = await ipcRenderer.invoke('select-target-directory');
  
  if (selectedPath) {
    document.getElementById('selectedTargetDirectory').value = selectedPath;
  }
});
