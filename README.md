# Web Bluetooth Parrot Mini Drone Controller

Controlling a Parrot Mini Drone from Chrome for Android, using [Web Bluetooth](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web?hl=en).

![Parrot mini drone](docs/images/parrot-mini-drone.jpg?raw=true "Parrot mini drone") 
 
## Setup

Requires Chrome for Android Dev edition.

Run up on your dev machine with: `python -m SimpleHTTPServer 8080`

Go to [chrome://inspect/#devices](chrome://inspect/#devices) and enable port forwarding for port 8080.
Now you should be able to visit `localhost:8080` on your device, to see the dashboard. 

NB. You can't just point to an IP address because Web Bluetooth requires HTTPS, if not serving from `localhost`. 

If you have trouble debugging in the standard Chrome version, try Chrome Canary (it worked better for me).

It's currently configured for a "Travis" (Airborne Cargo) drone, but you can switch the type of mini drone to look
for - see `DRONE_BLUETOOTH_NAME_PREFIX` at the top of app.js.   

## Safety warning

This code isn't bullet proof. Please observe the usual caution as well as making sure you have a backup method of 
disabling the drone in the event of a bug (a technique I have used is to raise something like a strong piece of card
up towards the drone from underneath. When it detects it has been touched, the drone should shut down automatically).

## Then...

* Ensure the drone is switched on and the lights are green.

* Press the 'Connect' button.

![App screenshot](docs/images/app.png?raw=true "App screenshot")

* Select your drone name to pair with.

![Pair screen](docs/images/pair-screen.png?raw=true "Pair screen")

* Now you're in control! Try Take Off and Land. Flips coming soon!  
 

## Video

Coming soon...
