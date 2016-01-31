'use strict';

(function() {

  /*
  const SERVICES = {
    'fa00': getUUID('fa00'),
    'fb00': getUUID('fb00'),
    'fc00': getUUID('fc00'),
    'fd21': getUUID('fd21'),
    'fd51': getUUID('fd51'),
    'fe00': getUUID('fe00')
  };

  // There are 32 'Write Without Response' characteristics in the fa00 service! But only using a couple of them.
  const WRITE_WITHOUT_RESPONSE_CHARACTERISTICS = {
    'fa0a': getUUID('fa0a'),
    'fa0b': getUUID('fa0b')
  };
  
  // There are 32 'Notify' characteristics in the fb00 service! But only using four of them.
  const NOTIFY_CHARACTERISTICS = {
    'fb0f': getUUID('fb0f'),
    'fb0e': getUUID('fb0e'),
    'fb1b': getUUID('fb1b'),
    'fb1c': getUUID('fb1c')
  };

  // There is 1 'Write' characteristic in the fc00 service. Not currently used.
  const WRITE_CHARACTERISTIC = {
    'ffc1': getUUID('ffc1')
  }

  // There are 3 'Read Write Notify' characteristics in the fd21 service.
  const READ_WRITE_NOTIFY_CHARACTERISTICS_1 = {
    'fd22': getUUID('fd22'),
    'fd23': getUUID('fd23'),
    'fd24': getUUID('fd24')
  };

  // There are 3 'Read Write Notify' characteristics in the fd51 service
  const READ_WRITE_NOTIFY_CHARACTERISTICS_2 = {
    'fd52': getUUID('fd52'),
    'fd53': getUUID('fd53'),
    'fd54': getUUID('fd54')
  };

  // There are 2 more characteristics in the fe00 service. Not currently used.
  const MISC_CHARACTERISTICS = {
    'fe01': getUUID('fe01'),
    'fe02': getUUID('fe02')
  };
  */

  //const Buffer = window.buffer.Buffer;

  let goButton = document.getElementById('goBtn'),
    stopButton = document.getElementById('stopBtn'),
    emergencyButton = document.getElementById('emergencyBtn'),
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
    /*
    ping = null,
    driveStepsRemaining = 0,
    speeds = {
      yaw: 0, // turn
      pitch: 0, // forward/backward
      roll: 0, // left/right
      altitude: 0 // up/down
    },
    */


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

    //var command = new Uint8Array(commandArray);

    var buffer = new ArrayBuffer(commandArray.length);
    var command = new Uint8Array(buffer);
    command.set(commandArray);

    return characteristic.writeValue(command).then(() => {
      console.log('Written command');
    });

  }

  function writeTo(serviceID, characteristicID, commandArray) {

    _getCharacteristic(serviceID, characteristicID)
      .then(characteristic => {
        return _writeCommand(characteristic, commandArray);
      });

  }

  function takeOff() {

    console.log('Take off...');
    return writeTo('fa00', 'fa0b', [4, steps.fa0b++, 2, 0, 1, 0]);

  }

  function wait(millis) {

    return new Promise(function(resolve) {
      setInterval(() => {
        resolve();
      }, millis);
    });

  }

  function land() {

    console.log('Land...');
    writeTo('fa00', 'fa0b', [4, steps.fa0b++, 2, 0, 3, 0]);

  }

  function emergencyCutOff() {

    console.warn('Emergency cut off');
    writeTo('fa00', 'fa0c', [0x02, steps.fa0c++ & 0xFF, 0x02, 0x00, 0x04, 0x00]);

  }

  function initialiseAndTakeOff() {

    discover()
      .then(device => { return connect(device) })
      .then(() => { return registerNotifications() })
      .then(() => { return wait(1000) })
      .then(() => { return takeOff() })
      .then(() => { return wait(3000) })
      .then(() => { return land() })
      .catch(error => { console.error('Error', error) });

  }

  goButton.addEventListener('click', () => {
    initialiseAndTakeOff();
  });


  stopButton.addEventListener('click', () => {
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

  /*
  function handshake() {

    console.log('Handshake...');

    return new Promise(function(resolve) {
      setTimeout(function () {
        return gattServer.getPrimaryService(SERVICES.fa00)
          .then(service => {
            return service.getCharacteristic(WRITE_WITHOUT_RESPONSE_CHARACTERISTICS.fa0b)
          })
          .then(characteristic => {

            console.log('Characteristic', characteristic);

            const handshakeCmd = new Uint8Array([0x04, ++steps.fa0b, 0x00, 0x04, 0x01, 0x00, 0x32, 0x30, 0x31, 0x34, 0x2D, 0x31, 0x30, 0x2D, 0x32, 0x38, 0x00]);

            console.log('Writing handshake command');

            resolve(characteristic.writeValue(handshakeCmd));

          });
      }, 100);
    });

  }

  function startPing() {

    return new Promise(function(resolve) {

      ping = setInterval(() => {
        var buffer = new Buffer(19);
        buffer.fill(0);
        buffer.writeInt16LE(2, 0);
        buffer.writeInt16LE(++steps.fa0a, 1);
        buffer.writeInt16LE(2, 2);
        buffer.writeInt16LE(0, 3);
        buffer.writeInt16LE(2, 4);
        buffer.writeInt16LE(0, 5);
        buffer.writeInt16LE((driveStepsRemaining ? 1 : 0), 6);

        buffer.writeInt16LE(speeds.roll, 7);
        buffer.writeInt16LE(speeds.pitch, 8);
        buffer.writeInt16LE(speeds.yaw, 9);
        buffer.writeInt16LE(speeds.altitude, 10);
        buffer.writeFloatLE(0, 11);

        return gattServer.getPrimaryService(SERVICES.fa00)
          .then(service => {
            return service.getCharacteristic(WRITE_WITHOUT_RESPONSE_CHARACTERISTICS.fa0a)
          })
          .then(characteristic => {
            console.log('Ping write');
            characteristic.writeValue(buffer);
          });

        if (driveStepsRemaining < 0) {
          // go on the last command blindly
        } else if (driveStepsRemaining > 1) {
          // decrement the drive chain
          driveStepsRemaining--;
        } else {
          // reset to hover states
          hover();
        }

      }, 50);

      setInterval(() => {
        resolve();
      }, 100);

    });

  }

  function calibrate() {

    return gattServer.getPrimaryService(SERVICES.fa00)
      .then(service => {
        return service.getCharacteristic(WRITE_WITHOUT_RESPONSE_CHARACTERISTICS.fa0b)
      })
      .then(characteristic => {
        characteristic.writeValue(new Uint8Array([0x02, ++steps.fa0b & 0xFF, 0x02, 0x00, 0x00, 0x00]));
      });

  }

  function hover() {

    driveStepsRemaining = 0;
    speeds.roll = 0;
    speeds.pitch = 0;
    speeds.yaw = 0;
    speeds.altitude = 0;

  }
  */

})();
