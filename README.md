# Web Bluetooth Parrot Mini Drone Demo

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

## Then...

* Ensure the drone is switched on and the lights are green.
* Press the 'Connect' button
* Select your drone name to pair with (see screenshot below)
* Now you're in control! Try Take Off and Land.

![Pair screen](docs/images/pair-screen.png?raw=true "Pair screen")

![App screenshot](docs/images/app.png?raw=true "App screenshot")

## Video

Coming soon...
