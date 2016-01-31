/**
 * Services:
 *  - fa00 - contains 'write without response' characteristics starting with fa...
 *  - fb00 - contains 'notify' characteristics starting with fb...
 *  - fc00 - contains 'write' characteristic ffc1, not currently used
 *  - fd21 - contains 'read write notify' characteristics fd22, fd23, fd24
 *  - fd51 - contains 'read write notify' characteristics fd52, fd53, fd54
 *  - fe00 - contains characteristics fe01, fe02, not currently used
 */

'use strict';

// 'Travis_' for Airborne Cargo drone. Change to 'RS_' for Rolling Spider.
const DRONE_BLUETOOTH_NAME_PREFIX = 'Travis_';

let App = function() {

  let connectButton = document.getElementById('connectBtn'),
    takeOffButton = document.getElementById('takeOffBtn'),
    flipButton = document.getElementById('flipBtn'),
    landButton = document.getElementById('landBtn'),
    emergencyButton = document.getElementById('emergencyBtn'),
    connected = false,
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

  function startNotificationsForCharacteristic(serviceID, characteristicID) {

    console.log('Start notifications for', characteristicID);

    return new Promise((resolve, reject) => {
      return _getCharacteristic(serviceID, characteristicID)
        .then(characteristic => {
          console.log('Got characteristic, now start notifications', characteristicID, characteristic);
          characteristic.startNotifications()
            .then(() => {
              console.log('Started notifications for', characteristicID);

              characteristic.addEventListener('characteristicvaluechanged', event => {

                console.log('Notification from:', characteristicID);
                //console.log('> characteristicvaluechanged', event.target.value, event.target.value.byteLength);

                var char = event.characteristic;
                var value = char.value;

                console.log(char, value);

                if (characteristicID === 'fb0e') {

                  var eventList = ['fsLanded', 'fsTakingOff', 'fsHovering',
                    'fsUnknown', 'fsLanding', 'fsCutOff'];

                  var array = new Uint8Array(value);

                  if (eventList[array[6]] === 'fsHovering') {
                    console.log('Hovering - ready to go');
                  } else {
                    console.log('Not hovering... Not ready', array[6]);
                  }
                  if ([1, 2, 3, 4].indexOf(array[6]) >= 0) {
                    console.log('Flying');
                  }
                  else {
                    console.log('Not flying');
                  }

                }
              });

              resolve();
          });

        })
        .catch(error => {
          console.error('startNotifications error', error);
          reject();
        });
    });

  }

  function discover() {
    console.log('Searching for drone...');
    return navigator.bluetooth.requestDevice({
        filters: [{
          namePrefix: DRONE_BLUETOOTH_NAME_PREFIX
        }]
      })
      .then((device) => {
        console.log('Discovered drone', device);
        droneDevice = device;
      });
  }

  /**
   * XXX Not sure why we need to keep calling this, but if we don't, we often get "GATT Service no longer exists" errors
   */
  function connectGATT() {

    console.log('Connect GATT');

    return droneDevice.connectGATT()
      .then(server => {
        console.log('GATT server', server);
        gattServer = server;
      });

  }

  function _getService(serviceID) {

    return new Promise((resolve, reject) => {

      const service = services[serviceID];

      // If we already have it cached...
      /*
      if (service) {
        console.log('Return cached service', service);
        resolve(service);
      } else {
      */

        console.log('Get service', getUUID(serviceID));

        return gattServer.getPrimaryService(getUUID(serviceID))
          .then(service => {
            console.log('Obtained service', service);
            services[serviceID] = service;
            resolve(service);
          })
          .catch(error => {
            console.error('_getService error', error);
            reject(error);
          });

      //}

    });

  }

  function _getCharacteristic(serviceID, characteristicID) {

    return new Promise((resolve, reject) => {

      const char = characteristics[characteristicID];

      // If we already have it cached...
      /*
      if (char) {
        console.log('Return cached characteristic', char);
        resolve(char);
      } else {
      */

        return _getService(serviceID)
          .then(service => {
            return service.getCharacteristic( getUUID(characteristicID) )
          })
          .then(characteristic => {
            characteristics[characteristicID] = characteristic;
            console.log('Obtained characteristic', characteristic);
            resolve(characteristic);
          })
          .catch(error => {
            console.error('_getCharacteristic error', error);
            reject(error);
          });

      //}

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
        console.log('Got characteristic, now write');
        return _writeCommand(characteristic, commandArray)
          .then(() => {console.log('Written command');});
      });

  }

  function connect() {

    console.log('Connect');
    connectButton.innerHTML = 'CONNECTING...';

    return discover()
      .then(() => { return connectGATT(); })
      .then(() => { return wait(100); })
      .then(() => { return startNotifications() })
      .then(() => {
        connected = true;
        connectButton.innerHTML = 'CONNECTED';
        console.log('Connected');
      });

  }


  function takeOff() {

    console.log('Take off...');
    return droneDevice.connectGATT()
      .then(() => {return writeTo('fa00', 'fa0b', [4, steps.fa0b++, 2, 0, 1, 0]);});

  }

  function flip() {

    console.log('Flip...');
    return droneDevice.connectGATT()
      .then(() => {return writeTo('fa00', 'fa0b', [4, steps.fa0b++, 2, 4, 0, 0, 2, 0, 0, 0]);});

  }

  function land() {

    console.log('Land...');
    return droneDevice.connectGATT()
      .then(() => {return writeTo('fa00', 'fa0b', [4, steps.fa0b++, 2, 0, 3, 0]);});

  }

  function emergencyCutOff() {

    console.warn('Emergency cut off');
    return droneDevice.connectGATT()
      .then(() => {return writeTo('fa00', 'fa0c', [0x02, steps.fa0c++ & 0xFF, 0x02, 0x00, 0x04, 0x00]);});

  }

  function wait(millis) {
    console.log('wait', millis);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('waited');
        resolve();
      }, millis);
    });
  }

  connectButton.addEventListener('click', () => {
    if (!connected) {
      connect();
    }
  });

  takeOffButton.addEventListener('click', () => {
    takeOff();
  });

  flipButton.addEventListener('click', () => {
    flip();
  });

  landButton.addEventListener('click', () => {
    land();
  });

  emergencyButton.addEventListener('click', () => {
    emergencyCutOff();
  });

  function startNotifications() {

    console.log('Start notifications...');

    return startNotificationsForCharacteristic('fb00', 'fb0f')
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fb00', 'fb0e')})
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fb00', 'fb1b')})
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fb00', 'fb1c')})
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fd21', 'fd22')})
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fd21', 'fd23')})
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fd21', 'fd24')})
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fd51', 'fd52')})
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fd51', 'fd53')})
      .then(() => {return wait(100);})
      .then(() => {return startNotificationsForCharacteristic('fd51', 'fd54')})
      .then(() => {return wait(100);})
      .then(() => {console.log('Finished starting notifications');})
      .catch((error) => {console.error('Failed to start notifications', error);});

  }

};

App();
