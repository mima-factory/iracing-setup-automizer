const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const AdmZip = require('adm-zip');
const fse = require('fs-extra');
const config = require('./config.json');
const mappings = config.mappings;
const season = config.general.season;
const series = config.general.series;
const week = config.general.week;
const track = config.general.track;

let mainWindow;
const WATCH_DIRECTORY = path.join(__dirname, 'inbox');  // Place new ZIPs here
//const BASE_DIRECTORY = 'C:/Users/DeinName/Documents/iRacing';
//const BASE_DIRECTORY = 'C:\Users\Martin\ElectronProjects\iracing-setup-automizer\testDocuments';
const BASE_DIRECTORY = path.join(__dirname, 'setup-dist');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createMainWindow();

  // Start watching for new ZIP files
  chokidar.watch(WATCH_DIRECTORY, { ignoreInitial: true, depth: 0 })
    .on('add', async filePath => {
      if (!filePath.endsWith('.zip')) return;
      mainWindow.webContents.send('log-message', `Detected new ZIP: ${path.basename(filePath)}`);
      try {
        await handleZip(filePath);
        mainWindow.webContents.send('log-message', `Processed successfully: ${path.basename(filePath)}`);
      } catch (error) {
        mainWindow.webContents.send('log-message', `Error: ${error.message}`);
        // Optionally move to an 'Unsorted' folder
      }
    });
});

async function handleZip(zipPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  for (let { entryName } of entries) {
    for (let map of mappings) {
      const regex = new RegExp(map.pattern);
      const match = entryName.match(regex);
      // Only proceed if regex has captured both car and track
      if (!match || match.length < 3) continue;
      const car = match[1];
      // Build destination path
      const destinationDir = map.destinationTemplate
        .replace('{base}', BASE_DIRECTORY)
        .replace('{car}', car)
        .replace('{season}', season)
        .replace('{series}', series)
        .replace('{week}', week)
        .replace('{track}', track)
        .replace('/', '\\'); 
      console.log(`Destination template: ${map.destinationTemplate}`);
      console.log(`Destination: ${destinationDir}`);
      // Extract all files to a temp directory
      const tempDir = path.join(app.getPath('temp'), `setup-${Date.now()}`);
      zip.extractAllTo(tempDir, true);

      // Ensure destination exists and copy files
      await fse.ensureDir(destinationDir);
      await fse.copy(tempDir, destinationDir, { overwrite: true });

      return;
    }
  }

  throw new Error('No matching mapping found for any provider');
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
