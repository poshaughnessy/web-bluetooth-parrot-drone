# Web Bluetooth Parrot Mini Drone Controller

Controlling a Parrot Mini Drone from a web browser, using [Web Bluetooth](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web?hl=en).

![Parrot mini drone](docs/images/parrot-mini-drone.jpg?raw=true "Parrot mini drone") 

## Demo Video

[![Demo video](https://j.gifs.com/wp482w.gif)](https://youtu.be/gXu3G3cg52k)
 
[(https://youtu.be/gXu3G3cg52k)](https://youtu.be/gXu3G3cg52k) 
 
## Setup

Currently [requires Chrome or Opera](http://caniuse.com/#feat=web-bluetooth), or Samsung Internet Beta with Web Bluetooth switched on in `internet://flags`.

Run the web app up on your dev machine with any simple web server that can serve static files, e.g.: `python -m SimpleHTTPServer 8080`

Go to `chrome://inspect/#devices` and enable port forwarding for port 8080.
Now you should be able to visit `localhost:8080` on your Android device, to see the dashboard. 

NB. You can't just point to an IP address because Web Bluetooth requires HTTPS, if not serving from `localhost`. 

If you wish to host a version somewhere, it will need to be over HTTPS.

## Safety warning

There may be bugs! Please observe the usual caution with drone flying as well as making sure you have a backup method 
of disabling the drone in the event of a bug! (A technique I have used is to raise something like a strong piece of 
card up towards the drone from underneath. When it detects it has been touched, the drone should shut down automatically).

## Then...

* Ensure the drone is switched on and the lights are green.

* Press the 'Connect' button.

![App screenshot](docs/images/app.png?raw=true "App screenshot")

* Select your drone name to pair with.

![Pair screen](docs/images/pair-screen.png?raw=true "Pair screen")

* Now you're in control! Try Take Off, Flip and Land.  

## Troubleshooting

I still need to fix taking off multiple times - for now you will need to refresh the page.

If it doesn't work, try switching the drone off and on again, wait for the green lights, and then try the above again.
Please note the drone will need to have enough battery life remaining or it may silently ignore commands.

If you *still* have trouble, you can have the remote debugging tools open in Chrome to see the console logs and this 
may help you to see where it's going wrong, at least. If you spot any fixes / improvements that could be made, PRs are 
welcome!

## Parrot Drone Docs

If you are interested to learn more about the API to communicate with the drone, you can find 
[links to docs here](https://github.com/voodootikigod/node-rolling-spider/issues/78).

## Thanks

I am indebted to [voodootikigod's rolling spider](https://github.com/voodootikigod/node-rolling-spider) project for 
demonstrating how to communicate with the drone. This demo borrows a lot from it.

Thanks also to [@beaufortfrancois](https://github.com/beaufortfrancois) for collaborating with me to get the demo 
working better!
