'use strict';

(function() {

  const SERVICES = {
    'fa00': formatUUID('fa00'),
    'fb00': formatUUID('fb00'),
    'fc00': formatUUID('fc00'),
    'fd21': formatUUID('fd21'),
    'fd51': formatUUID('fd51'),
    'fe00': formatUUID('fe00')
  };

  // There are 32 'Write Without Response' characteristics in the fa00 service! But only using a couple of them.
  const WRITE_WITHOUT_RESPONSE_CHARACTERISTICS = {
    'fa0a': formatUUID('fa0a'),
    'fa0b': formatUUID('fa0b')
  };
  
  // There are 32 'Notify' characteristics in the fb00 service! But only using four of them.
  const NOTIFY_CHARACTERISTICS = {
    'fb0f': formatUUID('fb0f'),
    'fb0e': formatUUID('fb0e'),
    'fb1b': formatUUID('fb1b'),
    'fb1c': formatUUID('fb1c')
  };

  // There is 1 'Write' characteristic in the fc00 service. Not currently used.
  const WRITE_CHARACTERISTIC = {
    'ffc1': formatUUID('ffc1')
  }

  // There are 3 'Read Write Notify' characteristics in the fd21 service.
  const READ_WRITE_NOTIFY_CHARACTERISTICS_1 = {
    'fd22': formatUUID('fd22'),
    'fd23': formatUUID('fd23'),
    'fd24': formatUUID('fd24')
  };

  // There are 3 'Read Write Notify' characteristics in the fd51 service
  const READ_WRITE_NOTIFY_CHARACTERISTICS_2 = {
    'fd52': formatUUID('fd52'),
    'fd53': formatUUID('fd53'),
    'fd54': formatUUID('fd54')
  };

  // There are 2 more characteristics in the fe00 service. Not currently used.
  const MISC_CHARACTERISTICS = {
    'fe01': formatUUID('fe01'),
    'fe02': formatUUID('fe02')
  };

  //const Buffer = window.buffer.Buffer;

  let goButton = document.getElementById('goButton'),
    droneDevice = null,
    gattServer = null,
    ping = null,
    driveStepsRemaining = 0,
    // Used to store the 'counter' that's sent to each characteristic
    steps = {
      'fa0a': 1,
      'fa0b': 1,
      'fa0c': 1
    },
    speeds = {
      yaw: 0, // turn
      pitch: 0, // forward/backward
      roll: 0, // left/right
      altitude: 0 // up/down
    };



  function formatUUID(uniqueSegment) {
    return '9a66' + uniqueSegment + '-0800-9191-11e4-012d1540cb8e';
  }

  function startNotifications(service, characteristicUUID) {

    console.log('Start notifications', characteristicUUID);

    service.getCharacteristic(characteristicUUID)
      .then(characteristic => {

        characteristic.startNotifications().then(() => {
          characteristic.addEventListener('characteristicvaluechanged', event => {
            console.log('Notification from:', characteristicUUID);
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

    return droneDevice.connectGATT();

  }

  function registerNotifications(server) {

    console.log('Register notifications...');

    gattServer = server;

    return gattServer.getPrimaryService( SERVICES.fb00 )
      .then(service => {

        console.log('Service', service);

        ['fb0f', 'fb0e', 'fb1b', 'fb1c'].forEach((key) => {
          startNotifications(service, NOTIFY_CHARACTERISTICS[key]);
        });

      })
      .then(() => {return gattServer.getPrimaryService( SERVICES.fd21 )})
      .then(service => {

        console.log('Service', service);

        ['fd22', 'fd23', 'fd24'].forEach((key) => {
          startNotifications(service, READ_WRITE_NOTIFY_CHARACTERISTICS_1[key]);
        });

      })
      .then(() => {return gattServer.getPrimaryService( SERVICES.fd51 )})
      .then(service => {

        console.log('Service', service);

        ['fd52', 'fd53', 'fd54'].forEach((key) => {
          startNotifications(service, READ_WRITE_NOTIFY_CHARACTERISTICS_2[key]);
        });

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
  */

  function hover() {

    driveStepsRemaining = 0;
    speeds.roll = 0;
    speeds.pitch = 0;
    speeds.yaw = 0;
    speeds.altitude = 0;

  }

  function takeOff() {

    console.log('Take off...');

    return gattServer.getPrimaryService( SERVICES.fa00 )
      .then(service => { return service.getCharacteristic( WRITE_WITHOUT_RESPONSE_CHARACTERISTICS.fa0b ) })
      .then(characteristic => {

        console.log('Writing take off command');

        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array.set([4, steps.fa0b++, 2, 0, 1, 0]);
        characteristic.writeValue(buffer).then(function onResolve(){
          console.log('takeoff success');
        }, function onReject(){
          console.log('takeoff failed');
        });

      });

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

    return gattServer.getPrimaryService( SERVICES.fa00 )
      .then(service => { return service.getCharacteristic( WRITE_WITHOUT_RESPONSE_CHARACTERISTICS.fa0b ) })
      .then(characteristic => {

        console.log('Writing land command');

        // 4, (byte)mSettingsCounter, 2, 0, 3, 0
        var buffer = new ArrayBuffer(6);
        var array = new Uint8Array(buffer);
        array.set([4, steps.fa0b++, 2, 0, 3, 0]);
        characteristic.writeValue(buffer).then(function onResolve() {
          console.log('landing success');
        }, function onReject() {
          console.log('landing failed');
        });

      });

  }

  function initialiseAndTakeOff() {

    discover()
      .then(device => { return connect(device) })
      .then(server => { return registerNotifications(server) })
      .then(() => { return wait(1000) })
      .then(() => { return takeOff() })
      .then(() => { return wait(5000) })
      .then(() => { return land() })
      .catch(error => { console.error('Error', error) });

  }

  goButton.addEventListener('click', () => {
    initialiseAndTakeOff();
  });

})();
