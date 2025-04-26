const fs = require('fs');
const path = require('path');

let configPath = path.join(__dirname, '..', 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function loadConfig() {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfigToDisk(newConfig) {
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
  config = newConfig;
}

module.exports = {
  config,
  loadConfig,
  saveConfigToDisk,
};
