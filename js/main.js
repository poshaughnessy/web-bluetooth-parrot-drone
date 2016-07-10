(function() {

  function setupUI() {

    let drone = ParrotDrone(),
      connectButton = document.getElementById('connectBtn'),
      takeOffButton = document.getElementById('takeOffBtn'),
      flipButton = document.getElementById('flipBtn'),
      landButton = document.getElementById('landBtn'),
      emergencyButton = document.getElementById('emergencyBtn');

    connectButton.addEventListener('click', () => {
      connectButton.innerHTML = 'CONNECTING...';
      drone.connect()
        .then(() => {
          connectButton.innerHTML = 'CONNECTED';
        })
        .catch(() => {
          connectButton.innerHTML = 'CONNECT';
        });
    });

    takeOffButton.addEventListener('click', drone.takeOff);
    flipButton.addEventListener('click', drone.flip);
    landButton.addEventListener('click', drone.land);
    emergencyButton.addEventListener('click', drone.emergencyCutOff);
  }

  function installServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope:', registration.scope);
      }).catch(function(err) {
        console.log('ServiceWorker registration failed:', err);
      });
    }
  }

  setupUI();
  installServiceWorker();

})();
