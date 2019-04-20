---
title: "Realtime Canvas With Go and Typescript"
date: 2019-04-19T22:29:15-06:00
tags: ["go", "canvas", "grpc", "typescript", "testing", "realtime", "puppeteer"]
---

## What

I quickly wrote an app that lets users paint on an HTML5 canvas together.

{{< figure src="/images/dual-screens.gif" width="600" >}}

Puppeteer is used to simulate headless browser users (instead of direct API calls).

{{< figure src="/images/with-agent.gif" width="600" >}}

If you've read any of my [gRPC with Typescript and Go](posts/grpc-with-typescript-and-go-part-1) posts, you'll be familiar with the tech -- it's an RPC service with two methods

{{< highlight proto "hl_lines=16-17">}}
...

service DrawService {
  rpc SendDrawing(Drawing) returns (None);
  rpc GetDrawings(None) returns (stream Drawings) {}
}

...
{{< / highlight >}}

Right now, Puppeteer simulates a single user. I'm surprised at how little code is needed to do headless browser testing!

{{< highlight typescript >}}
import * as puppeteer from 'puppeteer';

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  console.log("Looping on move...");
  for (let i = 0; i < 1000; i++) {
    await page.mouse.move(Math.random() * 500, Math.random() * 500);
    await sleep(100);
  }
  console.log("Looping on move...done");

  await browser.close();
})();
{{< / highlight >}}

The source is [here](https://gitlab.com/de1ux/realtime-canvas-editor).

## Why

For fun most of all -- I love the HTML5 canvas.

This is a reminder about how hard session management is. I've made a couple[^1] sins[^2] just to be done in an afternoon. Even languages like Go let you compile a gun to shoot yourself in the foot with.

Next time we'll expand on this!

[^1]: [Memory leak -- sessions are never reaped](https://gitlab.com/de1ux/realtime-canvas-editor/blob/master/server/main.go#L48)
[^2]: [Race condition on new sessions](https://gitlab.com/de1ux/realtime-canvas-editor/blob/master/server/main.go#L63)