---
toc: false
---

# Github Melody Sequencer <a href="https://github.com/pearmini/chart-music-lab/blob/main/src/grid.md" target="_blank">&lt;/&gt;</a>

What do my [GitHub](https://github.com/pearmini) contributions sound like?

```js
import * as Tone from "npm:tone";
import {Mutable} from "observablehq:stdlib";
```

```js
const year = (d) => d.getUTCFullYear();
const week = (d) => d3.utcWeek.count(d3.utcYear(d), d);
const day = (d) => d.getUTCDay();
```

```js
const data = (await FileAttachment("./data/contributions.csv").csv())
  .map((d) => ({count: +d.contributionCount, date: new Date(d.date)}))
  .filter((d) => {
    const year = d.date.getUTCFullYear();
    return year >= 2021 && year <= 2024;
  });
const key = (year, day, week) => `${year},${day},${week}`;
const datumByTime = new Map(data.map((d) => [key(year(d.date), day(d.date), week(d.date)), d]));
const domainCount = d3.extent(data.map((d) => d.count));
const totalWeeks = d3.extent(data.map((d) => week(d.date)))[1] + 1;
```

```js
function getCount(row, col) {
  const year = 2024 - ((row / 7) | 0);
  const day = row % 7;
  const week = col;
  return datumByTime.get(key(year, day, week));
}
```

```js
const A1 = await FileAttachment("samples/A1.mp3").url();
const C2 = await FileAttachment("samples/C2.mp3").url();
const E2 = await FileAttachment("samples/E2.mp3").url();
const G2 = await FileAttachment("samples/G2.mp3").url();

const player = new Tone.Sampler({A1, C2, E2, G2});

await Tone.loaded;

player.toDestination();

Tone.Transport.scheduleRepeat(onBeat, "4n");

const threshold = Mutable(7);
const updateThreshold = (v) => (threshold.value = v);

const currentStep = Mutable(0);

const timeSignature = [4, 4];
const nMeasures = 2;
const numberOfOctaves = Array.from(new Set(data.map((d) => d.date.getUTCFullYear()))).length;
const nTracks = 7 * numberOfOctaves;
const nSteps = totalWeeks;
const noteNames = ["C", "D", "E", "F", "G", "A", "B", "C"];
const baseOctave = 1;

function onBeat(time) {
  const [measure, beat] = Tone.Transport.position.split(":").map((d) => +d);
  const velocity = 0.5;

  currentStep.value = (measure * timeSignature[0] + beat) % nSteps;

  for (let track = 0; track < nTracks; track++) {
    if (getCount(track, currentStep.value)?.count > threshold.value) {
      // The bottom track should have the lowest note
      const notePos = nTracks - 1 - track;
      const octave = baseOctave + Math.floor(notePos / 7);
      const noteName = noteNames[notePos % 7];
      const pitch = noteName + octave;
      player.triggerAttack(pitch, time);
    }
  }
}
```

```js
const isPlaying = view(
  Inputs.button(
    [
      ["Play", () => true],
      ["Stop", () => false],
    ],
    {value: false, label: "Controls"}
  )
);
```

```js
const range = Inputs.range(domainCount, {step: 1, value: 7, label: "Threshold"});
range.onchange = (v) => updateThreshold(+v.target.value);
display(range);
```

```js
if (!isPlaying) {
  Tone.Transport.stop();
} else {
  if (player.loaded) Tone.Transport.start();
}
```

```js
function getUTCMonthWeek(year, weekNum) {
  const firstWeekStart = d3.utcWeek.offset(d3.utcYear(new Date(Date.UTC(year, 0, 1))), weekNum);
  const monthStart = d3.utcMonth(firstWeekStart);
  const monthWeek = Math.floor((firstWeekStart - monthStart) / (7 * 24 * 60 * 60 * 1000));
  return [firstWeekStart.getUTCMonth(), monthWeek];
}
```

```js
const cellChart = Plot.plot({
  width: 1200,
  height: 680,
  marginBottom: 5,
  marginTop: 20,
  fx: {axis: false},
  fy: {tickFormat: (d) => d + "", reverse: true},
  x: {
    axis: "top",
    tickSize: 0,
    tickFormat: (d) => {
      d3.utcWeek.offset();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const [monthIndex, monthWeek] = getUTCMonthWeek(2024, +d);
      return monthWeek === 0 ? months[monthIndex] : "";
    },
  },
  y: {
    tickSize: 0,
    tickFormat: (d) => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[+d];
    },
  },
  marks: [
    Plot.cell(data, {
      fy: (d) => year(d.date),
      x: (d) => week(d.date),
      y: (d) => day(d.date),
      fill: (d) => d.count,
      inset: 0.5,
      tip: {
        format: {
          count: true,
          date: true,
          x: false,
          y: false,
          fy: false,
          fill: false,
        },
      },
      channels: {
        date: (d) => d.date,
        count: (d) => d.count,
      },
    }),
  ],
});

postprocess();

function postprocess() {
  const isSelect = (index) => data[index].count > threshold;
  const r = (d) => (isSelect(d) ? 2 : 10);
  const opacity = (d) => (isSelect(d) ? 1 : 0.5);
  const scaleScale = d3.scaleLinear([0, 5], [1, 0.7]).clamp(true);

  d3.select(cellChart)
    .selectAll("rect")
    .attr("rx", r)
    .attr("ry", r)
    .attr("fill-opacity", opacity)
    .attr("transform", (index) => {
      const x = week(data[index].date);
      const t = scaleScale(Math.abs(x - currentStep));
      return x === currentStep || !isPlaying ? "" : `scale(${t}, ${t})`;
    })
    .attr("transform-origin", function () {
      const element = d3.select(this);
      const x = +element.attr("x");
      const y = +element.attr("y");
      const width = +element.attr("width");
      const height = +element.attr("height");
      return `${x + width / 2} ${y + height / 2}`;
    });

  if (isPlaying) {
    const scaleX = cellChart.scale("x");
    const scaleFy = cellChart.scale("fy");
    const offset = (scaleX.step - scaleX.bandwidth) / 2;
    const rectX = scaleX.apply(currentStep) - offset;
    const [rectY, rectY1] = scaleFy.range;
    const rectHeight = rectY1 - rectY;
    const rectWidth = scaleX.step;
    const style = d3.select(cellChart).select("style").node();
    const rect = d3
      .create("svg:rect")
      .attr("x", rectX - 5)
      .attr("y", rectY - 5)
      .attr("width", rectWidth + 10)
      .attr("height", rectHeight + 10)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("fill", "#000")
      .node();
    cellChart.insertBefore(rect, style);
  }
}
```

```js
display(html`<div style="padding-top:1em" class="card">${cellChart}</div>`);
```
