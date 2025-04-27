const fs = require('fs');
const path = require('path');

let configPath = path.join(__dirname, '..', 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function loadConfig() {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

module.exports = {
  config,
  loadConfig,
};
