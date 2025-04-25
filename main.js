const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const AdmZip = require('adm-zip');
const fse = require('fs-extra');
let configPath = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function saveConfigToDisk(newConfig) {
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
  config = newConfig;
}

let mainWindow;
const WATCH_DIRECTORY = path.join(__dirname, 'inbox');
//const BASE_DIRECTORY = 'C:/Users/DeinName/Documents/iRacing';
//const BASE_DIRECTORY = 'C:\Users\Martin\ElectronProjects\iracing-setup-automizer\testDocuments';
const BASE_DIRECTORY = path.join(__dirname, 'setup-dist');


function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
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

  for (zipEntry of entries) {
    let entryName = zipEntry.entryName;
    mainWindow.webContents.send('log-message', `Processing entry: ${entryName}`);
    // console.log({ zipEntry });
    for (let map of config.mappings) {
      const regex = new RegExp(map.pattern);
      const match = entryName.match(regex);
      if (!match || match.length < 4) {
        mainWindow.webContents.send('log-message', `No match for entry: ${entryName}`);
        console.log({ match });
        continue;
      }
      const car = match[1];
      const event = match[2];
      const setupFilename = match[3];
      mainWindow.webContents.send('log-message', `Found match: ${car}, ${event}, ${setupFilename}`);

      const dest = map.destinationTemplate
        // .replace('{base}', config.general.base)
        .replace('{base}', BASE_DIRECTORY)
        .replace('{car}', car)
        .replace('{season}', config.general.season)
        .replace('{series}', config.general.series)
        .replace('{week}', config.general.week)
        .replace('{track}', config.general.track)
        .replace('\\', path.sep);
console.log({ dest });
      const tempDir = path.join(app.getPath('temp'), `setup-${Date.now()}`);
      await fse.ensureDir(dest);
      zip.extractEntryTo(zipEntry, dest, false, true);
      // await fse.copy(tempDir, dest, { overwrite: true });
      // return;
    }
  }
  throw new Error('No matching mapping found');
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
