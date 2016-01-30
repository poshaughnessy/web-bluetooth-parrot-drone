var goButton = document.getElementById('goButton');


goButton.addEventListener('click', () => {

  navigator.bluetooth.requestDevice({
      filters: [{
        namePrefix: 'Travis_' // Travis (Airborne Cargo) drone - change to RS_ for Rolling Spider, etc.
      }]
    })
    .then(device => {

      console.log('Discovered device!', device);

    })
    .catch(error => {
      console.error('Error', error);
    });

});
