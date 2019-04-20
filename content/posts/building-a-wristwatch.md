---
title: "Building a wristwatch"
date: 2019-03-22T3:22:00-06:00
tags: ["microcontroller", "watch", "arduino"]
---

In my personal life, I like collecting watches.

Usually I go after cheap quartz watches. The weirder the better.

{{< figure src="https://images-na.ssl-images-amazon.com/images/I/71GdvsCpAjL._UL1500_.jpg" width="200" >}}

How else would you let others know your ***extremeness*** and ***athleticism***?

I've always wondered what it would be like to build my own wrist watch... start simple, maybe work my way up to a smart watch?

Enjoy

## Attempt 1

The first microcontroller I chose was the ATtiny85. Praised for its low power consumption, this 8-bit MCU sports *512B* of memory and either SPI or I2C out.

{{< figure src="https://cdn.sparkfun.com//assets/parts/2/9/7/0/09378-1.jpg" width="200" >}}

And it's a pleasure to program. If you have an Arduino Uno laying around, wire it up ([diagram](https://www.hackster.io/arjun/programming-attiny85-with-arduino-uno-afb829)) and upload a program.

I decided to solder it together with a MAX7219 display driver and a 4 digit 7 segment display.

![asdf](/images/baw-1.gif)

Powered by a CR2032 coin cell, this baby could tell you time for about a _whole day_. Further optimization could include

* maybe not powering the LEDs full-time
* getting better at soldering, or just wiring in general
* adding an RTC so the time wasn't lost when the battery dies

Besides losing the time, using the internal 8MHz clock the MCU provides caused me to lose 3 seconds every minute.

_Score_ **(7/10)**: its hardly a real watch by anyone's standard, but the satisfaction of escaping the Arduino cage is real

## Attempt 2

I had some parts laying around from home automation, so I cheated and put together this

![asdf](/images/baw-2.gif)

A Rapberry Pi Zero W with an Pimoroni Inky Phat display. Sandwiched between the two is a battery pack meant for full-sized Raspberry Pi's. Power lasted for a whopping 16 hours, with the screen updating in 10s intervals.

The only optimizations I tried were turning off the bluetooth, wifi and hdmi modules.

_Score_ **(2/10)**: puncturing the oversized lipo battery would let you pretend to shoot fireballs from your wrist

## Attempt 3

This is a Sharp Memory LCD, a cool display that combines the low-power consumption of an epaper display with the fast refresh rate of an LCD.

![asdf](/images/baw-3.gif)

Driving it requires buffering the entire contents of the display (3Kb) before shipping it down the wire. Unfortunately this disqualifies the ATtiny85.

 _Score_ **(4/10)**: the display is much nicer and shows promise, but it needs a much bigger MCU

## Attempt 4

I fried both the screen and the board in this attempt.

![asdf](/images/baw-4.gif)

After the frying, it still works well if you can communicate time through one functioning row of white pixels. Not pictured is the deader-than-a-doornail Teensy 3.2.

_Score_ **(1/10)**: Teensy's ain't cheap

## Attempt 5

Equipped with a greater respect for the sensitivity of microelectronics, I married an Adafruit Feather with the same Sharp Memory LCD from Attempt 3.

![asdf](/images/baw-5.gif)

![asdf](/images/baw-6.gif)

_Score_ **(7/10)**: turned out pretty good!

## What's next

Etching my own PCBs, or paying someone to print some PCBs for me.

All of these attempts point out the painfully obvious -- development boards (Arduino, Feather, etc) don't scale down to a wrist very well. And while my soldering skills are getting better, stacking integrated circuits and microcontrollers make wiring options limited.

..and I want to experiment with the ATtiny85 some more.

Stay tuned!
