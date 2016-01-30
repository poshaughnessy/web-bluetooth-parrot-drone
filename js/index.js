(function() {

  const SERVICE_UUIDS = [
    '9a66fa00-0800-9191-11e4-012d1540cb8e',
    '9a66fb00-0800-9191-11e4-012d1540cb8e',
    '9a66fc00-0800-9191-11e4-012d1540cb8e',
    '9a66fd21-0800-9191-11e4-012d1540cb8e',
    '9a66fd51-0800-9191-11e4-012d1540cb8e',
    '9a66fe00-0800-9191-11e4-012d1540cb8e'
  ];

  const CHARACTERISTIC_UUIDS = [
    '9a66fa0b-0800-9191-11e4-012d1540cb8e'
  ];

  let goButton = document.getElementById('goButton'),
      droneDevice = null;


  function takeOff() {

  }


  goButton.addEventListener('click', () => {

    navigator.bluetooth.requestDevice({
        filters: [{
          namePrefix: 'Travis_' // Travis (Airborne Cargo) drone - change to RS_ for Rolling Spider, etc.
        }]
      })
      .then(device => {

        console.log('Discovered Parrot Mini Drone!', device);

        droneDevice = device;

        return device.connectGATT();

      })
      .then(server => {

        console.log('GATT server', server);

        return server.getPrimaryService( SERVICE_UUIDS[0] );

      })
      .then(service => {

        console.log('Service', service);

        return service.getCharacteristic( CHARACTERISTIC_UUIDS[0] );

      })
      .then(characteristic => {

        console.log('Characteristic', characteristic);

        //takeOff();

      })
      .catch(error => {
        console.error('Error', error);
      });

  });


})();
