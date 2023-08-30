# Cloudy

A weather station with a fronted UI and PHP backend was my first-ever web project. It has been 4 years since I finished it, and I've decided to do it again but with my current knowledge.

Another reason for this project is that I wanted to learn how to design schematics and PCBs.
You can see the (hopefully) live data on the [website](https://cloudy.pkozak.org).

## Hardware

The station uses a BME280 sensor to measure temperature, humidity and pressure. Besides uploading the data, it's also shown on a 0.96" OLED display.

The schematics and PCB use an ESP32-C3-MINI-N4, but because of the costs of manufacturing, assembly/stencil and
shipping, I've decided to assemble it on a breadboard with an ESP32-WROOM devkit.

The schematics also include a 3.3V voltage regulator, USB type C for power and programming, and a header for a PM2.5 sensor that I could integrate later if I'd like to (It's expensive).

I'm also considering adding a battery and maybe even a solar panel to make it completely wireless. I'd have to do some
calculations to see if it's possible and beneficial at all.

As for the future sensors, aside from the PM2.5 sensor, I'd like to add a rain sensor and an anemometer.
The first one is cheap and easy to do, but the second one is not so much. Anemometers are expensive, and I don't have the tools to make one myself.
Even if I had one, I do not have an appropriate location to install it.

## Software

The software for the station is in the [driver folder](./driver). It's written in C++ and uses Arduino libraries. For the backend, I've decided to use Supabase, because of the REST database API and the real-time features which allowed an easy integration with the microcontroller.
