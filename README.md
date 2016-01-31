# Web Bluetooth Parrot Mini Drone Demo

Controlling a Parrot Mini Drone from Chrome for Android, using [Web Bluetooth](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web?hl=en).
 
## Instructions

Requires Chrome for Android Dev edition.

Run with: `python -m SimpleHTTPServer 8080`

Enable port forwarding for port 8080 and visit `localhost:8080` on your device. NB. You can't just point to an IP 
address because Web Bluetooth requires `https` if not `localhost`. 

If you have trouble debugging in the standard Chrome version, try Chrome Canary.
