---
toc: false
---

```js
import {area} from "./area.js";
```

# Area: AV Instrument

> Press _a_, _s_, _d_, _f_ to play sounds, _c_ to clear the canvas

```js
const urls = [
  await FileAttachment("samples/tears.wav").url(),
  await FileAttachment("samples/takerimba.wav").url(),
  await FileAttachment("samples/blip.wav").url(),
  await FileAttachment("samples/punch.wav").url(),
];

const cancelURL = await FileAttachment("samples/cancel.wav").url();
```

```js
const {root, dispose} = await area({urls, width, cancelURL});

invalidation.then(() => dispose());
```

<div class="card">
${root.node()}
</div>
