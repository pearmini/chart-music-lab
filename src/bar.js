import {randomNoise} from "./noise.js";
import * as Tone from "npm:tone";
import * as d3 from "npm:d3";

const constrain = (r, x, y) => {
  const distance = Math.sqrt(x * x + y * y);
  if (distance > r) {
    const scale = r / distance;
    x = x * scale;
    y = y * scale;
  }
  return [x, y];
};

const map = (x, inMin, inMax, outMin, outMax) => {
  return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export async function tracksof(urls) {
  const tracks = urls.map((url) => {
    const player = new Tone.Player(url).toDestination();
    const meter = new Tone.Meter();
    const wave = new Tone.Waveform(256);
    meter.normalRange = true;
    player.connect(meter);
    player.connect(wave);
    return {
      player,
      meter,
      wave,
      setVolume: (val) => player.volume.rampTo(val),
    };
  });

  await Tone.loaded;

  return await new Promise((resolve) => {
    setInterval(() => {
      const loaded = tracks.every(({player}) => player.loaded);
      if (loaded) resolve(tracks);
    }, 10);
  });
}

export function bar({tracks, width}) {
  const height = width;
  const innerRadius = 120;
  const middleRadius = 250;
  const outerRadius = Math.min(width, height) / 2;
  const controlRadius = innerRadius / 2;

  let isPlaying = false;

  const toggle = () => {
    if (isPlaying) {
      tracks.forEach(({player}) => player.stop());
      isPlaying = false;
    } else {
      tracks.forEach(({player}) => player.start());
      isPlaying = true;
    }
  };

  const colors = ["#DAB55D", "#3A705A"];

  const scaleX = d3
    .scaleBand()
    .domain(tracks.map((_, i) => i))
    .range([0, 2 * Math.PI])
    .align(0);

  const scaleY = d3.scaleRadial().domain([0, 1]).range([middleRadius, outerRadius]);

  const scaleColor = d3.scaleOrdinal().domain([0, 1]).range(colors);

  const scaleColor2 = d3.scaleLinear().domain([0, tracks.length]).range(colors).interpolate(d3.interpolateRgb);

  const bars = (volumes) => {
    const series = d3
      .stack()
      .keys(d3.union(volumes.map((d) => d.level)))
      .value(([, D], key) => D.get(key).volume)(
      d3.index(
        volumes,
        (d) => d.index,
        (d) => d.level
      )
    );

    const arc = d3
      .arc()
      .innerRadius((d) => scaleY(d[0]))
      .outerRadius((d) => scaleY(d[1]))
      .startAngle((d) => scaleX(d.data[0]))
      .endAngle((d) => scaleX(d.data[0]) + scaleX.bandwidth())
      .padAngle(1.5 / middleRadius)
      .padRadius(middleRadius);

    return series.map((S) => {
      const mapped = S.map((d) => ({d: arc(d)}));
      mapped.key = S.key;
      return mapped;
    });
  };

  const lines = (waveforms) => {
    const series = d3.groups(waveforms, (d) => d.key);

    if (series.length === 0) return [];

    const scaleX = d3
      .scaleLinear()
      .domain([0, series[0][1].length])
      .range([0, 2 * Math.PI]);

    const d = middleRadius - innerRadius;

    const scaleY = d3
      .scaleLinear()
      .domain([-1, 1])
      .range([middleRadius - d * 2, middleRadius]);

    const scaleStroke = d3.scaleLinear().domain([0, 1]).range([0, 6]);

    const scaleOpacity = d3.scaleLinear().domain([0, 1]).range([0.75, 1]);

    const line = d3
      .lineRadial()
      .curve(d3.curveCardinalClosed)
      .angle((d) => scaleX(d.index))
      .radius((d) => scaleY(d.value));

    return series.map(([key, S], i) => {
      const extent = d3.extent(S, (d) => d.value);
      const diff = Math.abs(extent[1] - extent[0]);
      return {
        d: line(S),
        color: scaleColor2(key),
        strokeWidth: scaleStroke(diff),
        strokeOpacity: scaleOpacity(diff),
      };
    });
  };

  const randomRadius = randomNoise(0, innerRadius / 2);
  const randomAngle = randomNoise(0, Math.PI * 2);

  let count = 0;
  let preX;
  let preY;
  let offsetX = 0;
  let offsetY = 0;
  let volumes = [];
  let waveforms = [];
  let isDragging = false;
  let controlX = 0;
  let controlY = 0;

  const drag = d3
    .drag()
    .on("start", () => {
      isDragging = true;
      preX = controlX;
      preY = controlY;
    })
    .on("drag", (event) => {
      const r = innerRadius / 2;
      let {x, y} = event;
      [x, y] = constrain(r, x, y);
      controlX = x;
      controlY = y;
    })
    .on("end", () => {
      isDragging = false;
      offsetX += controlX - preX;
      offsetY += controlY - preY;
    });

  const svg = d3
    .create("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("width", "100%")
    .style("height", "auto")
    .style("font", "10px sans-serif")
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
    .on("click", toggle);

  const circle = svg.append("circle").call(drag);

  const loop = () => {
    // data
    updateVolume();
    updateData();
    updateControl();

    // graphics
    updateCircle();
    updateBars();
    updateLines();
  };

  const timer = d3.interval(loop);

  const updateControl = () => {
    const isStop = tracks.every((d) => d.player.state === "stopped");

    if (isDragging || !isPlaying || isStop) return;

    const radius = randomRadius(count / 100);
    const angle = randomAngle(count / 100);
    let x = radius * Math.cos(angle) + offsetX;
    let y = radius * Math.sin(angle) + offsetY;
    [x, y] = constrain(innerRadius / 2, x, y);
    controlX = x;
    controlY = y;
    count++;
  };

  const updateData = () => {
    volumes = tracks.flatMap(({meter}, i) => [
      {
        index: i,
        level: 0,
        volume: meter.getValue() / 2,
      },
      {
        index: i,
        level: 1,
        volume: meter.getValue() / 2,
      },
    ]);

    waveforms = tracks.flatMap(({wave}, i) => {
      const waves = Array.from(wave.getValue());
      return waves.map((d, index) => ({value: d, index, key: i}));
    });
  };

  const updateCircle = () => {
    circle
      .attr("cx", controlX)
      .attr("cy", controlY)
      .attr("r", controlRadius)
      .attr("fill", isDragging ? colors[0] : colors[1])
      .style("cursor", isPlaying ? (isDragging ? "grabbing" : "grab") : "pointer");
  };

  const updateBars = () => {
    const data = bars(volumes);
    svg
      .selectAll(".bar")
      .data(data)
      .join("g")
      .attr("class", "bar")
      .attr("fill", (d) => scaleColor(d.key))
      .selectAll("path")
      .data((d) => d)
      .join("path")
      .attr("d", (d) => d.d);
  };

  const updateLines = () => {
    const data = lines(waveforms);
    svg
      .selectAll(".line")
      .data(data)
      .join("path")
      .attr("class", "line")
      .attr("d", (d) => d.d)
      .attr("stroke", (d) => d.color)
      .attr("fill", "none")
      .attr("stroke-width", (d) => d.strokeWidth)
      .attr("stroke-opacity", (d) => d.strokeOpacity);
  };

  const updateVolume = () => {
    const x = controlX;
    const y = controlY;
    const r = innerRadius / 2;
    for (let i = 0; i < tracks.length; i++) {
      const {player} = tracks[i];
      const pa = scaleX(i) + scaleX.bandwidth() / 2 - Math.PI / 2;
      const pr = innerRadius;
      const px = pr * Math.cos(pa);
      const py = pr * Math.sin(pa);
      const dx = px - x;
      const dy = py - y;
      const pd = Math.sqrt(dx * dx + dy * dy);
      const density = map(pd, r * 2, r * 3, 0, 1);
      const clamped = Math.min(1, Math.max(density, 0));
      const t = clamped * -60;
      player.volume.rampTo(t);
    }
  };

  const dispose = () => {
    timer.stop();
    tracks.forEach(({player}) => player.stop());
  };

  return {root: svg, dispose};
}
