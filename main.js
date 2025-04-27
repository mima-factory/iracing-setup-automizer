const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const AdmZip = require('adm-zip');
const fse = require('fs-extra');
const { config, loadConfig } = require('./services/config');
const { matchSetupPath } = require('./services/matcher');

let mainWindow;
let extractDirectory = path.join(__dirname, 'extraction-dir');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools(); // Open DevTools for debugging during development
  }
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createMainWindow();

  // IPC handlers for loading and saving config
  ipcMain.handle('load-config', async () => {
    loadConfig();
    return config;
  });

  // IPC handlers for loading and saving config
  ipcMain.handle('select-week', async (_, selectedWeek) => {
    config.general.week = selectedWeek;
    mainWindow.webContents.send('log-message', `Selected week: ${selectedWeek}`);
  });

  // IPC handler for selecting a directory
  ipcMain.handle('select-directory', async () => {
    console.log('Selecting directory...');
    const result = dialog.showOpenDialogSync({
      properties: ['openDirectory']
    });
    console.log('Selected directory:', result);
    const selectedPath = result[0];
    if (selectedPath) {
      extractDirectory = selectedPath;
      config.general.extractionDir = selectedPath; // Update the config with the new path
    }
    console.log('Updated extractDirectory:', extractDirectory);
    mainWindow.webContents.send('log-message', `Updated extraction directory: ${extractDirectory}`);
    return result.canceled ? null : selectedPath;
  });

  // IPC handler for selecting a setup archive
  ipcMain.handle('select-setup-archive', async () => {
    console.log('Selecting setup archive...');
    const result = dialog.showOpenDialogSync({
      properties: ['openFile', 'dontAddToRecent'],
      buttonLabel: 'Select Setup Archive',
      title: 'Select Setup Archive',
      filters: [
        { name: 'Archives', extensions: ['zip', 'gzip', 'tar'], },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    console.log('Selected file:', result);
    const selectedPath = result[0];
    if (selectedPath) {
      setupArchive = selectedPath;
    }
    mainWindow.webContents.send('log-message', `Selected setup archive: ${setupArchive}`);
    return result.canceled ? null : selectedPath;
  });

  // IPC handler for processing a ZIP file
  ipcMain.handle('process-zip-file', async (_, filePath) => {
    mainWindow.webContents.send('log-message', `Processing file: ${filePath}`);

    if (!filePath.endsWith('.zip')) {
      mainWindow.webContents.send('log-message', 'Selected file is not a ZIP archive!');
      return;
    }

    if (config.general.week == 'W00') {
      mainWindow.webContents.send('log-message', 'Please set the week in the settings! Stopping processing...');
      return;
    }

    if (app.isPackaged && !config.general.extractionDir == 'extraction-dir') {
      mainWindow.webContents.send('log-message', 'Please set the extraction directory in the settings! Stopping processing...');
      return;
    }

    try {
      await handleZip(filePath);
      mainWindow.webContents.send('log-message', `Processed successfully: ${path.basename(filePath)}`);
    } catch (error) {
      mainWindow.webContents.send('log-message', `Error: ${error.message}`);
    }
  });
});

async function handleZip(zipPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  let matchedFound = 0;
  let matchedNotFound = 0;
  let copiedFiles = 0;
  let skippedFiles = 0;
  let nonMatchingTracks = [];
  let nonMatchingSeries = [];

  for (zipEntry of entries) {
    let entryName = zipEntry.entryName;
    console.log(`Processing entry: ${entryName}`);
    let found = false;

    for (let setupJsonMap of config.mappings.setups) {
      let matchResult = matchSetupPath(entryName, setupJsonMap, config.mappings.tracks, config.mappings.series);
      if (matchResult.result === false) {
        console.log(`Could not match entry: ${entryName}`);
        matchResult.validationErrors.forEach(error => {
          const trackMatch = error.match(/Track not found in map: (?<track>.+)/);
          if (trackMatch) {
            nonMatchingTracks.push(trackMatch.groups.track);
          }
          const seriesMatch = error.match(/Series not found in map: (?<series>.+)/);
          if (seriesMatch) {
            nonMatchingSeries.push(seriesMatch.groups.series);
          }

          console.log(`Validation error: ${error}`);
        });
        continue;
      }
      found = true;
      matchedFound++;

      const match = matchResult.matches;
      const dest = setupJsonMap.destinationTemplate
        .replace('{base}', extractDirectory)
        .replace('{car}', match.car)
        .replace('{seasonYear}', match.seasonYear)
        .replace('{seasonNo}', match.seasonNo)
        .replace('{series}', match.series)
        .replace('{week}', config.general.week)
        .replace('{track}', match.track)
        .replace('\\', path.sep);

      await fse.ensureDir(dest);
      if (await fse.pathExists(path.join(dest, zipEntry.entryName))) {
        console.log(`Entry already exists: ${entryName}`);
        skippedFiles++;
        continue;
      } else {
        zip.extractEntryTo(zipEntry, dest, false, true);
        copiedFiles++;
      }
    }

    if (!found) {
      matchedNotFound++;
    }
  }

  // Make nonMatchingTracks and nonMatchingSeries unique
  nonMatchingTracks = [...new Set(nonMatchingTracks)];
  nonMatchingSeries = [...new Set(nonMatchingSeries)];
  mainWindow.webContents.send('log-message', `Processing completed for: ${path.basename(zipPath)}`);
  mainWindow.webContents.send('log-message', `Matched found: ${matchedFound}`);
  mainWindow.webContents.send('log-message', `Matched not found: ${matchedNotFound}`);
  mainWindow.webContents.send('log-message', `Copied files: ${copiedFiles}`);
  mainWindow.webContents.send('log-message', `Skipped files: ${skippedFiles}`);
  mainWindow.webContents.send('log-message', `Non-matching tracks: ${nonMatchingTracks.join(', ')}`);
  mainWindow.webContents.send('log-message', `Non-matching series: ${nonMatchingSeries.join(', ')}`);
  mainWindow.webContents.send('log-message', '------------------------------------');
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
