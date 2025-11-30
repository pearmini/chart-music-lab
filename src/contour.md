---
toc: false
---

```js
import {contour} from "./contour.js";
```

# Contour: Timbre <a href="https://github.com/pearmini/chart-music-lab/blob/main/src/contour.md" target="_blank">&lt;/&gt;</a>

How do you draw contours with sound frequencies? Click buttons to explore! The sounds come from and are inspired by [Spectrogram](https://musiclab.chromeexperiments.com/Spectrogram/).

```js
const data = await FileAttachment("./data/volcano.json").json();
```

```js
const sounds = {
  Flute: await FileAttachment("samples/160210_flute_new_cmajor_scale.mp3").url(),
  Harp: await FileAttachment("samples/160211_spectrogram_harp_new.mp3").url(),
  Whistling: await FileAttachment("samples/160113_whistling.mp3").url(),
  Trombone: await FileAttachment("samples/160113_trombone.mp3").url(),
  "Drum Machine": await FileAttachment("samples/160113_808_loop.mp3").url(),
  Birds: await FileAttachment("samples/160113_birds.mp3").url(),
  Modem: await FileAttachment("samples/160113_modem.mp3").url(),
  "Wine Glass": await FileAttachment("samples/160113_wine_glass.mp3").url(),
};
```

```js
const node = await contour({urls: sounds});

invalidation.then(() => node.dispose());

display(node);
```
