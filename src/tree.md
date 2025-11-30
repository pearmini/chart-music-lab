---
toc: false
---

# Tree: Chord

Play chords following the structure of tree like this [Turtle Melody](https://editor.p5js.org/luisa/sketches/H11ZbqNa7).

```js
import {tree} from "./tree.js";
import {html} from "npm:htl";
```

```js
const names = await FileAttachment("./data/names.json").json();
```

```js
const trees = names.map((item) => tree(item.name));
```

<div class="grid grid-cols-3">
${trees.map(node => html`<div class="card">${node}</div>`)}
</div>
