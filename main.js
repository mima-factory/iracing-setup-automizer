const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const AdmZip = require('adm-zip');
const fse = require('fs-extra');
const { config, loadConfig, saveConfigToDisk } = require('./services/config');
const { matchSetupPath } = require('./services/matcher');

let mainWindow;
const WATCH_DIRECTORY = path.join(__dirname, 'inbox');
let BASE_DIRECTORY = path.join(__dirname, config.general.iracingSetupsFolder);

if (!app.isPackaged) {
  // If the app is not packaged, it is dev mode => use the setup-dist/ directory in the project folder
  BASE_DIRECTORY = path.join(__dirname, 'setup-dist');
}


function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createMainWindow();

  // IPC handlers for loading and saving config
  ipcMain.handle('load-config', async () => {
    loadConfig();
    return config;
  });

  ipcMain.handle('save-config', async (event, newConfig) => {
    saveConfigToDisk(newConfig);
    return true;
  });

  // Watch for new ZIP files
  chokidar.watch(WATCH_DIRECTORY, { ignoreInitial: true, depth: 0 })
    .on('add', async filePath => {
      if (!filePath.endsWith('.zip')) return;
      mainWindow.webContents.send('log-message', `Detected new ZIP: ${path.basename(filePath)}`);
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
        .replace('{base}', BASE_DIRECTORY)
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
