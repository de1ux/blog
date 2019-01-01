If you don't know about [wiv.js](https://github.com/jjkaufman/wiv.js), congratulations: you were probably a decent human being, spending time with family, and not looking at your phone over the Christmas break.

Simply put, [wiv.js](https://github.com/jjkaufman/wiv.js) is a wavy effect for `div`s. I'm familiar with the HTML5 canvas it uses, so the next natural question to ask is

> can it be repurposed to slowly drive `de1ux.com` readers insane?

In this tutorial, I'll be exploring how to

1. Steal a bunch of code from [wiv.js](https://github.com/jjkaufman/wiv.js)
2. Cause flickering/distortion on non-`div` elements
3. Satisfy an evergrowing compulsion to write code that benefits nothing except your own sick, debilitating desire to see the HTML5 canvas used, whenever, and for whatever twisted reason slithers into your brain

## Text distortion

The first goal of distorting text is to simply plant HTML5 canvases over each text block.

```typescript
let target = document.getElementById('paragraph');

```
