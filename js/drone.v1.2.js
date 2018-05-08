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

const DEFAULT_SPEED = 50;
const DEFAULT_DRIVE_STEPS = 40;

let ParrotDrone = function() {

  let droneDevice = null,
    gattServer = null,
    // Used to store the 'counter' that's sent to each characteristic
    steps = {
      'fa0a': 1,
      'fa0b': 1,
      'fa0c': 1
    },
    speeds = {
      yaw: 0,     // turn
      pitch: 0,   // forward/backward
      roll: 0,    // left/right
      altitude: 0 // up/down
    },
    ping = null,
    driveStepsRemaining = 0,
    services = {},
    characteristics = {},
    onDisconnectCallback = null;

  function _getUUID(uniqueSegment) {
    return '9a66' + uniqueSegment + '-0800-9191-11e4-012d1540cb8e';
  }

  function _startNotificationsForCharacteristic(serviceID, characteristicID) {

    console.log('Start notifications for', characteristicID);

    return new Promise((resolve, reject) => {
      return _getCharacteristic(serviceID, characteristicID)
        .then(characteristic => {
          console.log('Got characteristic, now start notifications', characteristicID, characteristic);
          characteristic.startNotifications()
            .then(() => {
              console.log('Started notifications for', characteristicID);

              characteristic.addEventListener('characteristicvaluechanged', event => {

                const array = new Uint8Array(event.target.value.buffer);

                let a = [];
                for (let i = 0; i < array.byteLength; i++) {
                  a.push('0x' + ('00' + array[i].toString(16)).slice(-2));
                }

                console.log('Notification from ' + characteristicID + ': ' + a.join(' '));

                if (characteristicID === 'fb0e') {

                  var eventList = ['fsLanded', 'fsTakingOff', 'fsHovering',
                    'fsUnknown', 'fsLanding', 'fsCutOff'];

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

                } else if (characteristicID === 'fb0f') {

                  const batteryLevel = array[array.length - 1];

                  console.log(`Battery Level: ${batteryLevel}%`);

                  if (batteryLevel < 10) {
                    console.error('Battery level too low!');
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

  function _discover() {
    console.log('Searching for drone...');
    return navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'RS_' },
          { namePrefix: 'Mars_' },
          { namePrefix: 'Travis_'}
        ],
        optionalServices: [
          _getUUID('fa00'),
          _getUUID('fb00'),
          _getUUID('fd21'),
          _getUUID('fd51')
        ]
      })
      .then((device) => {
        console.log('Discovered drone', device);
        droneDevice = device;
      });
  }

  function _connectGATT() {

    console.log('Connect GATT');

    droneDevice.addEventListener('gattserverdisconnected', _handleDisconnect);

    return droneDevice.gatt.connect()
      .then(server => {
        console.log('GATT server', server);
        gattServer = server;
      });

  }

  function _reset() {
    ping = null;
    driveStepsRemaining = 0;
    services = {};
    characteristics = {};
    onDisconnectCallback = null;
  }

  function _handleDisconnect() {

    if (onDisconnectCallback && typeof onDisconnectCallback === 'function') {
      onDisconnectCallback();
    }

    _reset();

    droneDevice.removeEventListener('gattserverdisconnected', _handleDisconnect);

  }

  function _getService(serviceID) {

    return new Promise((resolve, reject) => {

      const service = services[serviceID];

      // If we already have it cached...
      if (service) {
        console.log('Return cached service', service);
        resolve(service);
      } else {

        console.log('Get service', _getUUID(serviceID));

        return gattServer.getPrimaryService(_getUUID(serviceID))
          .then(service => {
            console.log('Obtained service', service);
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

  function _getCharacteristic(serviceID, characteristicID) {

    return new Promise((resolve, reject) => {

      const char = characteristics[characteristicID];

      // If we already have it cached...
      if (char) {
        console.log('Return cached characteristic', char);
        resolve(char);
      } else {

        return _getService(serviceID)
          .then(service => {
            return service.getCharacteristic( _getUUID(characteristicID) )
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
      }

    })

  }

  function _writeCommand(characteristic, commandArray) {

    var buffer = new ArrayBuffer(commandArray.length);
    var command = new Uint8Array(buffer);
    command.set(commandArray);

    console.log('Write command', command);

    return characteristic.writeValue(command);

  }


  function _writeTo(serviceID, characteristicID, commandArray) {

    return _getCharacteristic(serviceID, characteristicID)
      .then(characteristic => {
        console.log('Got characteristic, now write');
        return _writeCommand(characteristic, commandArray)
          .then(() => {console.log('Written command');});
      });

  }

  function _startNotifications() {

    console.log('Start notifications...');

    return _startNotificationsForCharacteristic('fb00', 'fb0f')
      .then(() => {return _startNotificationsForCharacteristic('fb00', 'fb0e')})
      .then(() => {return _startNotificationsForCharacteristic('fb00', 'fb1b')})
      .then(() => {return _startNotificationsForCharacteristic('fb00', 'fb1c')})
      .then(() => {return _startNotificationsForCharacteristic('fd21', 'fd22')})
      .then(() => {return _startNotificationsForCharacteristic('fd21', 'fd23')})
      .then(() => {return _startNotificationsForCharacteristic('fd21', 'fd24')})
      .then(() => {return _startNotificationsForCharacteristic('fd51', 'fd52')})
      .then(() => {return _startNotificationsForCharacteristic('fd51', 'fd53')})
      .then(() => {return _startNotificationsForCharacteristic('fd51', 'fd54')})
      .then(() => {console.log('Finished starting notifications');})
      .catch((error) => {console.error('Failed to start notifications', error);});

  }

  function _handshake() {

    console.log('Handshake');

    return droneDevice.gatt.connect()
      .then(() => {
        return _writeTo('fa00', 'fa0b', [4, ++steps.fa0b, 0, 4, 1, 0, 0x32, 0x30, 0x31, 0x34, 0x2D, 0x31, 0x30, 0x2D, 0x32, 0x38, 0x00]);
      });

  }

  function _hover() {

    console.log('Hover');

    driveStepsRemaining = 0;
    speeds.yaw = 0;
    speeds.pitch = 0;
    speeds.roll = 0;
    speeds.altitude = 0;

  }

  function _startPing() {

    console.log('Start ping');

    ping = setInterval(() => {

      console.log('Ping...');

      _writeTo('fa00', 'fa0a',
        [
          2,
          ++steps.fa0a,
          2,
          0,
          2,
          0,
          driveStepsRemaining ? 1 : 0,
          speeds.roll,
          speeds.pitch,
          speeds.yaw,
          speeds.altitude,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ])
        .catch(_onBluetoothError);

      if (driveStepsRemaining > 0) {

        driveStepsRemaining--;

        if (driveStepsRemaining === 0) {
          console.log('Move complete, reset to hover state');
          _hover();
        } else {
          console.log('Drive steps remaining', driveStepsRemaining);
        }

      }

    }, 50);

  }

  function _setSpeed(property, speed, driveSteps) {

    console.log(`Change ${property} to ${speed}`);

    const props = ['yaw', 'pitch', 'roll', 'altitude'];

    for (let i=0; i < props.length; i++) {

      const prop = props[i];

      if (property === prop) {
        speeds[prop] = speed;
      } else {
        speeds[prop] = 0;
      }

      driveStepsRemaining = driveSteps;

    }
  }

  function _onBluetoothError(err) {

    console.error('Error!', err);
    clearInterval(ping);

  }

  return {

    connect: function(disconnectCallback) {

      onDisconnectCallback = disconnectCallback;

      return new Promise((resolve) => {

        console.log('Connect');

        return _discover()
          .then(() => {
            return _connectGATT();
          })
          .then(() => {
            return _startNotifications()
          })
          .then(() => {
            return new Promise(resolve => {
              setTimeout(() => {
                _handshake().then(resolve);
              }, 100);
            });
          })
          .then(() => {
            console.log('Completed handshake');
            resolve();
          });


      });

    },

    disconnect: function() {

      console.log('Disconnect');
      droneDevice.gatt.disconnect();

    },

    takeOff: function() {

      console.log('Take off...');
      return droneDevice.gatt.connect()
        .then(() => {
          // "Flat trim" which you are meant to call before taking off
          return _writeTo('fa00', 'fa0b', [2, ++steps.fa0b & 0xFF, 2, 0, 0, 0]);
        })
        .then(() => {
          // Actual command to take off
          return _writeTo('fa00', 'fa0b', [4, ++steps.fa0b, 2, 0, 1, 0]);
        })
        .then(() => {
          _startPing();
        })
        .catch(_onBluetoothError);

    },

    flip: function() {

      console.log('Flip...');
      return droneDevice.gatt.connect()
        .then(() => {
          return _writeTo('fa00', 'fa0b', [4, ++steps.fa0b, 2, 4, 0, 0, 2, 0, 0, 0]);
        })
        .catch(_onBluetoothError);

    },

    land: function() {

      console.log('Land...');
      return droneDevice.gatt.connect()
        .then(() => {
          return _writeTo('fa00', 'fa0b', [4, ++steps.fa0b, 2, 0, 3, 0]);
        })
        .then(() => {
          clearInterval(ping);
        })
        .catch(_onBluetoothError);

    },

    emergencyCutOff: function() {

      console.warn('Emergency cut off!');
      return droneDevice.gatt.connect()
        .then(() => {
          return _writeTo('fa00', 'fa0c', [0x02, ++steps.fa0c & 0xFF, 0x02, 0x00, 0x04, 0x00]);
        })
        .then(() => {
          clearInterval(ping);
        })
        .catch(_onBluetoothError);

    },

    hover: function() {
      _hover();
    },

    moveForwards: function() {
      _setSpeed('pitch', DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
    },

    moveBackwards: function() {
      _setSpeed('pitch', -DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
    },

    moveLeft: function() {
      _setSpeed('yaw', -DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
    },

    moveRight: function() {
      _setSpeed('yaw', DEFAULT_SPEED, DEFAULT_DRIVE_STEPS);
    }

  };

}
