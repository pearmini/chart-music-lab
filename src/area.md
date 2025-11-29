---
toc: false
---

```js
import {area} from "./area.js";
```

# Area: AV Instrument

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
const node = await area({urls, width, cancelURL});

invalidation.then(() => node.dispose());

display(node);
```
