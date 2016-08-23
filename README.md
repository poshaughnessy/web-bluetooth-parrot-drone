# Web Bluetooth Parrot Mini Drone Controller

Controlling a Parrot Mini Drone from Chrome for Android, using [Web Bluetooth](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web?hl=en).

![Parrot mini drone](docs/images/parrot-mini-drone.jpg?raw=true "Parrot mini drone") 
 
## Setup

Currently requires Chrome for Android.

Run the web app up on your dev machine with any simple web server that can serve static files, e.g.: `python -m SimpleHTTPServer 8080`

Go to `chrome://inspect/#devices` and enable port forwarding for port 8080.
Now you should be able to visit `localhost:8080` on your Android device, to see the dashboard. 

NB. You can't just point to an IP address because Web Bluetooth requires HTTPS, if not serving from `localhost`. 

If you wish to host a version somewhere, it will need to be over HTTPS and you will need the [Web Bluetooth flag enabled in the browser](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web#before-we-start) or to register your site for an [origin trial](https://github.com/jpchase/OriginTrials).

It's currently configured for a "Travis" (Airborne Cargo) drone, but you can switch the type of mini drone to look
for - see `DRONE_BLUETOOTH_NAME_PREFIX` at the top of app.js.   

## Safety warning

This code isn't bulletproof and the Web Bluetooth API is still pretty new. Please observe the usual caution with drone flying as well as making sure you have a backup method of disabling the drone in the event of a bug! (A technique I have used is to raise something like a strong piece of card up towards the drone from underneath. When it detects it has been touched, the drone should shut down automatically).

## Then...

* Ensure the drone is switched on and the lights are green.

* Press the 'Connect' button.

![App screenshot](docs/images/app.png?raw=true "App screenshot")

* Select your drone name to pair with.

![Pair screen](docs/images/pair-screen.png?raw=true "Pair screen")

* Now you're in control! Try Take Off, Flip and Land.  

## Troubleshooting

Unfortunately it is a bit flaky at the moment. I need to spend some more time getting it to work more reliably and figuring out if there are issues with the app code, the Web Bluetooth API, and/or the actual commands we're sending to the drone. For the best chance of success, close and re-open Chrome for Android first (plus reload the page if you made changes).
If that still fails, try switching the drone off and on again, wait for the green lights, and then try the above again. You can have the remote debugging tools open in Chrome to see the console logs and this may help you to see where it's going wrong, at least.

If you spot any fixes / improvements that could be made, PRs are very welcome!

## Demo Video

[https://youtu.be/-FO9thLaiug](https://youtu.be/-FO9thLaiug)

## Thanks

I am indebted to [voodootikigod's rolling spider] project for demonstrating how to communicate with the drone.

Thanks also to [@beaufortfrancois](https://github.com/beaufortfrancois) for working with me to get the demo working 
better!
