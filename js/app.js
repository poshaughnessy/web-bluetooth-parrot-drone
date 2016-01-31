'use strict';

let App = function() {

  /**
   * Services:
   *  - fa00 - contains 'write without response' characteristics starting with fa...
   *  - fb00 - contains 'notify' characteristics starting with fb...
   *  - fc00 - contains 'write' characteristic ffc1, not currently used
   *  - fd21 - contains 'read write notify' characteristics fd22, fd23, fd24
   *  - fd51 - contains 'read write notify' characteristics fd52, fd53, fd54
   *  - fe00 - contains characteristics fe01, fe02, not currently used
   */

  let connectButton = document.getElementById('connectBtn'),
    takeOffButton = document.getElementById('takeOffBtn'),
    landButton = document.getElementById('landBtn'),
    emergencyButton = document.getElementById('emergencyBtn'),
    stateEl = document.getElementById('state'),
    droneDevice = null,
    gattServer = null,
    // Used to store the 'counter' that's sent to each characteristic
    steps = {
      'fa0a': 1,
      'fa0b': 1,
      'fa0c': 1
    },
    services = {},
    characteristics = {};


  function getUUID(uniqueSegment) {
    return '9a66' + uniqueSegment + '-0800-9191-11e4-012d1540cb8e';
  }

  function startNotifications(serviceID, characteristicID) {

    console.log('Start notifications', characteristicID);

    return _getCharacteristic(serviceID, characteristicID)
      .then(characteristic => {

        characteristic.startNotifications().then(() => {
          characteristic.addEventListener('characteristicvaluechanged', event => {
            console.log('Notification from:', characteristicID);
            console.log('> characteristicvaluechanged', event.target.value, event.target.value.byteLength);
          });
        });

      })
      .catch(error => { console.error('startNotifications error', error)});

  }

  function discover() {
    console.log('Searching for drone...');
    return navigator.bluetooth.requestDevice({
      filters: [{
        namePrefix: 'Travis_' // Travis (Airborne Cargo) drone - change to RS_ for Rolling Spider, etc.
      }]
    });
  }

  function connect(device) {

    console.log('Discovered drone', device);

    droneDevice = device;

    return droneDevice.connectGATT()
      .then(server => {
        gattServer = server;
      });

  }

  function _getCharacteristic(serviceID, characteristicID) {

    return new Promise(function(resolve, reject) {

      const char = characteristics[characteristicID];

      // If we already have it cached...
      if (char) {
        resolve(char);
      } else {

        return _getService(serviceID)
          .then(service => { return service.getCharacteristic( getUUID(characteristicID) ) })
          .then(characteristic => {
            characteristics[characteristicID] = characteristic;
            resolve(characteristic);
          })
          .catch(error => {
            console.error('_getCharacteristic error', error);
            reject(error);
          });
      }

    });

  }

  function _getService(serviceID) {

    return new Promise(function(resolve, reject) {

      const service = services[serviceID];

      // If we already have it cached...
      if (service) {
        resolve(service);
      } else {

        return gattServer.getPrimaryService(getUUID(serviceID))
          .then(service => {
            services[serviceID] = service;
            resolve(service);
          })
          .catch(error => {
            console.error('_getService error', error);
            reject(error);
          });

      }

    });

  }

  function _writeCommand(characteristic, commandArray) {

    var buffer = new ArrayBuffer(commandArray.length);
    var command = new Uint8Array(buffer);
    command.set(commandArray);

    console.log('Write command', command);

    return characteristic.writeValue(command);

  }

  function writeTo(serviceID, characteristicID, commandArray) {

    return _getCharacteristic(serviceID, characteristicID)
      .then(characteristic => {
        return _writeCommand(characteristic, commandArray);
      })
      .then(() => {
        console.log('Written command');
      });

  }


  function initialiseConnection() {

    console.log('Connect');
    
    return discover()
      .then(device => { return connect(device) })
      .then(() => { return registerNotifications() })
      .then(() => { return wait(1000) })
      .then(() => {
        console.log('Connected')
        stateEl.innerHTML = 'Connected';
      });

  }

  function takeOff() {

    console.log('Take off...');
    return writeTo('fa00', 'fa0b', [4, steps.fa0b++, 2, 0, 1, 0]);

  }

  function land() {

    console.log('Land...');
    return writeTo('fa00', 'fa0b', [4, steps.fa0b++, 2, 0, 3, 0]);

  }

  function emergencyCutOff() {

    console.warn('Emergency cut off');
    return writeTo('fa00', 'fa0c', [0x02, steps.fa0c++ & 0xFF, 0x02, 0x00, 0x04, 0x00]);

  }

  function wait(millis) {
    return new Promise(function(resolve) {
      setInterval(() => {
        resolve();
      }, millis);
    });
  }

  connectButton.addEventListener('click', () => {
    initialiseConnection();
  });

  takeOffButton.addEventListener('click', () => {
    takeOff();
  });

  landButton.addEventListener('click', () => {
    land();
  });

  emergencyButton.addEventListener('click', () => {
    emergencyCutOff();
  });

  function registerNotifications() {

    console.log('Register notifications...');

    ['fb0f', 'fb0e', 'fb1b', 'fb1c'].forEach((key) => {
      startNotifications('fb00', key);
    });

    ['fd22', 'fd23', 'fd24'].forEach((key) => {
      startNotifications('fd21', key);
    });

    ['fd52', 'fd53', 'fd54'].forEach((key) => {
      startNotifications('fd51', key);
    });

  }

};

App();
