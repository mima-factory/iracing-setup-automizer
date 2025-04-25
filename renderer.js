let currentConfig;

window.api.loadConfig().then(cfg => {
  currentConfig = cfg;
  document.querySelector('input[name=season]').value = cfg.general.season;
  document.querySelector('input[name=series]').value = cfg.general.series;
  document.querySelector('input[name=week]').value = cfg.general.week;
  document.querySelector('input[name=track]').value = cfg.general.track;
  document.querySelector('input[name=base]').value = cfg.general.base;
  document.querySelector('textarea[name=mappings]').value = JSON.stringify(cfg.mappings, null, 2);
});

window.api.onLogMessage(msg => {
  const logEl = document.getElementById('logOutput');
  logEl.textContent += msg + '\n';
  logEl.scrollTop = logEl.scrollHeight;
});

document.getElementById('configForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const newCfg = {
      general: {
        season: document.querySelector('input[name=season]').value,
        series: document.querySelector('input[name=series]').value,
        week: document.querySelector('input[name=week]').value,
        track: document.querySelector('input[name=track]').value,
        base: document.querySelector('input[name=base]').value
      },
      mappings: JSON.parse(document.querySelector('textarea[name=mappings]').value)
    };
    await window.api.saveConfig(newCfg);
    alert('Settings saved successfully!');
  } catch (err) {
    alert('Error saving settings: ' + err.message);
  }
});
