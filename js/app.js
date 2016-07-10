(function() {

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

  takeOffButton.addEventListener('click', () => {
    drone.takeOff();
  });

  flipButton.addEventListener('click', () => {
    drone.flip();
  });

  landButton.addEventListener('click', () => {
    drone.land();
  });

  emergencyButton.addEventListener('click', () => {
    drone.emergencyCutOff();
  });

})();
