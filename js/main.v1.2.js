(function() {

  const STATE_IDLE = 'IDLE';
  const STATE_CONNECTING = 'CONNECTING';
  const STATE_CONNECTED = 'CONNECTED';
  const STATE_DISCONNECTING = 'DISCONNECTING';

  let state = STATE_IDLE;
  let connectButton;

  function setupUI() {

    connectButton = document.getElementById('connectBtn');

    let drone = ParrotDrone(),
      takeOffButton = document.getElementById('takeOffBtn'),
      forwardButton = document.getElementById('forwardBtn'),
      backwardButton = document.getElementById('backwardBtn'),
      leftButton = document.getElementById('leftBtn'),
      rightButton = document.getElementById('rightBtn'),
      hoverButton = document.getElementById('hoverBtn'),
      flipButton = document.getElementById('flipBtn'),
      landButton = document.getElementById('landBtn'),
      emergencyButton = document.getElementById('emergencyBtn');

    connectButton.addEventListener('click', () => {

      console.log('clicked connect button, state is', state);

      if (state === STATE_IDLE) {

        // Connect...
        updateConnectionState(STATE_CONNECTING);
        drone.connect(onDisconnectCallback)
          .then(() => {
            updateConnectionState(STATE_CONNECTED);
          })
          .catch(() => {
            updateConnectionState(STATE_IDLE);
          });

      } else if (state === STATE_CONNECTED) {

        // Disconnect...
        updateConnectionState(STATE_DISCONNECTING);
        drone.disconnect();

      }
    });

    takeOffButton.addEventListener('click', drone.takeOff);
    forwardButton.addEventListener('click', drone.moveForwards);
    backwardButton.addEventListener('click', drone.moveBackwards);
    leftButton.addEventListener('click', drone.moveLeft);
    rightButton.addEventListener('click', drone.moveRight);
    hoverButton.addEventListener('click', drone.hover);
    flipButton.addEventListener('click', drone.flip);
    landButton.addEventListener('click', drone.land);
    emergencyButton.addEventListener('click', drone.emergencyCutOff);

  }

  function onDisconnectCallback() {
    console.log('Disconnected callback');
    updateConnectionState(STATE_IDLE);
  }

  function updateConnectionState(newState) {

    state = newState;

    console.log('State change', state);

    connectButton.innerHTML = getConnectButtonText(state);

    switch (state) {
      case STATE_CONNECTED:
        connectButton.classList.add('connected');
        connectButton.classList.remove('pending');
        break;
      case STATE_CONNECTING:
      case STATE_DISCONNECTING:
        connectButton.classList.add('pending');
        connectButton.classList.remove('connected');
        break;
      default:
        connectButton.classList.remove('pending');
        connectButton.classList.remove('connected');
    }
  }

  function getConnectButtonText(state) {

    switch (state) {
      case STATE_CONNECTED:
        return 'DISCONNECT';
      case STATE_CONNECTING:
        return 'CONNECTING';
      case STATE_DISCONNECTING:
        return 'DISCONNECTING';
      default:
        return 'CONNECT';

    }

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
