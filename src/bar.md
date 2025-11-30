---
toc: false
---

```js
import {bar, tracksof} from "./bar.js";
```

# Bar: Composition Eye

How do you use a single circle to mix different tracks? How do you draw bars with tracks? Click the circle and drag it!

```js
const sounds = [
  await FileAttachment("samples/Bass.m4a").url(),
  await FileAttachment("samples/Drum.m4a").url(),
  await FileAttachment("samples/Other.m4a").url(),
  await FileAttachment("samples/Piano.m4a").url(),
  await FileAttachment("samples/Vocal.m4a").url(),
];

const urls = d3.shuffle([...sounds, ...sounds]);
```

```js
const tracks = await tracksof(urls);
const {root, dispose} = bar({tracks, width});
invalidation.then(() => dispose());
```

<div class="card">
${root.node()}
</div>
