# Cloudy

A weather station with a fronted UI and PHP backend was my first-ever web project.
It has been 4 years since I finished it, and I've decided to do it again but with my current knowledge.

Another reason for this project is that I wanted to learn how to design schematics and PCBs.
You can see the (hopefully) live data on the [website](https://cloudy.pkozak.org).

## Hardware

![Schematic of the weather station](/schematics/schematic.png)

The station uses a BME280 sensor to measure temperature, humidity and pressure.

The [schematics](/schematics/) and PCB use an ESP32-C3-MINI-N4,
but because of the costs of manufacturing, assembly/stencil and shipping,
I've decided to assemble it on a breadboard with an ESP32-WROOM devkit for now.

The [schematics](/schematics/) also include a 3.3V voltage regulator, USB type C for power and programming,
and an IDC header for a PMS7003 air quality sensor that I plant to integrate later.

As for the future sensors, aside from the PM2.5 sensor, I'd like to add a rain sensor and an anemometer.
The first one is cheap and easy to do, but the second one is not so much.
Anemometers are expensive, and I don't have the tools to make one myself.
Even if I had one, I do not have an appropriate location to install it.

## Software

The software for the station is in the [driver folder](./driver).
It's written in C++ and uses Arduino libraries.
For the backend, I've decided to use Supabase,
because of the REST database API and the real-time features which allowed an easy integration with the microcontroller.

## Issues/Caveats

-   One issue is that I don't have a fully shaded place to put the sensor.
    That results in ridiculously high temperature
    readings when the sun is shining on it.
    I'm working on a solution for that.
-   Air quality sensors operate on 5V, and it's not a problem while on USB power.
    The battery voltage is regulated to 3.3V.
    So adding a dedicated 5V boost converter is not really sensible and inefficient,
    so while working off the battery, the air quality sensor will be turned off.
