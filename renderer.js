window.api.onLogMessage(message => {
  const logElement = document.getElementById('logOutput');
  logElement.textContent += message + '\n';
});
