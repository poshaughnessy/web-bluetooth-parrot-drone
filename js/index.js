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

  // There are 32 'Write Without Response' characteristics in the fa00 service! But only using first one.
  const WRITE_WITHOUT_RESPONSE_CHARACTERISTICS = {
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
            console.log('> characteristicvaluechanged = ' + event.target.value + ' [' + event.target.value.byteLength + ']');
          });
        });

      })
      .catch(error => { console.error('startNotifications error', error)});

  }

  let goButton = document.getElementById('goButton'),
      droneDevice = null,
      gattServer = null;


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

  function handshake() {

    console.log('Handshake...');

    return gattServer.getPrimaryService( SERVICES.fa00 )
      .then(service => { return service.getCharacteristic( WRITE_WITHOUT_RESPONSE_CHARACTERISTICS.fa0b ) })
      .then(characteristic => {

        console.log('Characteristic', characteristic);

        const handshakeCmd = new Uint8Array([0x04, 0x01, 0x00, 0x04, 0x01, 0x00, 0x32, 0x30, 0x31, 0x34, 0x2D, 0x31, 0x30, 0x2D, 0x32, 0x38, 0x00]);

        console.log('Writing handshake command');

        return characteristic.writeValue(handshakeCmd);

      });

  }

  function takeOff() {

    console.log('Take off...');

    return gattServer.getPrimaryService( SERVICES.fa00 )
      .then(service => { return service.getCharacteristic( WRITE_WITHOUT_RESPONSE_CHARACTERISTICS.fa0b ) })
      .then(characteristic => {

        const takeOffCmd = new Uint8Array([0x02, 0x01, 0x00, 0x01, 0x00]);

        console.log('Writing take off command');

        return characteristic.writeValue(takeOffCmd);

      });

  }

  function initialiseAndTakeOff() {

    discover()
      .then(device => { return connect(device) })
      .then(server => { return registerNotifications(server) })
      .then(() => { return handshake() })
      .then(() => { return takeOff() })
      .catch(error => { console.error('Error', error) });

  }

  goButton.addEventListener('click', () => {
    initialiseAndTakeOff();
  });

  /*
  return new Promise(function(resolve) {
    console.log('Waiting...');
    setTimeout(function () {
      resolve();
    }, 30000);
  });
  */

})();
