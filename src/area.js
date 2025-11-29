import * as Tone from "npm:tone";
import * as d3 from "npm:d3";

function interpolate(urls) {
  return urls.map((_, i) => ((i + 1) * 1) / (urls.length + 1)).map(d3.interpolateCool);
}

export async function area({width, cancelURL, urls} = {}) {
  const schemes = "Categorical";
  const height = width * 0.618;
  const marginLeft = 0;
  const marginRight = 0;
  const marginTop = 50;
  const marginBottom = 50;
  const frameRate = 10;

  const players = urls.map((url) => new Tone.Player(url).toDestination());
  const cancel = new Tone.Player(cancelURL).toDestination();

  const analyzers = players.map((player) => {
    const analyzer = new Tone.Waveform(256);
    player.connect(analyzer);
    return analyzer;
  });

  await Tone.loaded;

  const colors = schemes === "Categorical" ? d3.schemeObservable10 : interpolate(urls);

  const svg = d3
    .create("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("background-color", "black");

  let data = [];

  const timer = d3.interval(loop, 1000 / frameRate);

  window.addEventListener("keydown", keydown);

  function dispose() {
    window.removeEventListener("keydown", keydown);
    timer.stop();
  }

  function loop() {
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (player.state === "started") {
        const analyzer = analyzers[i];
        const id = Math.random();
        const waves = Array.from(analyzer.getValue());
        if (waves.every((d) => d === 0 || d === -Infinity)) return;
        const indexed = waves.map((d, j) => ({
          index: j,
          name: `${i}-${id}`,
          value: d,
        }));
        data = [...data, ...indexed];
        const values = map(data);
        draw(values);
      }
    }
  }

  function keydown({key}) {
    switch (key) {
      case "a":
        players[0].start();
        break;
      case "s":
        players[1].start();
        break;
      case "d":
        players[2].start();
        break;
      case "f":
        players[3].start();
        break;
      case "c": {
        data = [];
        for (let i = 0; i < players.length; i++) {
          players[i].stop();
        }
        const values = map(data);
        draw(values);
        cancel.start();
        break;
      }
    }
  }

  function map(data) {
    const series = d3
      .stack()
      .offset(d3.stackOffsetDiverging)
      .keys(d3.union(data.map((d) => d.name)))
      .value(([, D], key) => D.get(key).value)(
      d3.index(
        data,
        (d) => d.index,
        (d) => d.name
      )
    );

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.index))
      .range([marginLeft, width - marginRight]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(series.flat(2)))
      .rangeRound([height - marginBottom, marginTop]);

    const color = d3
      .scaleOrdinal()
      .domain(series.map((d) => d.key.split("-")[0]))
      .range(colors);

    const area = d3
      .area()
      .x((d) => x(d.data[0]))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));

    return series.map((d) => ({
      d: area(d),
      fill: color(d.key.split("-")[0]),
    }));
  }

  function draw(values) {
    svg
      .selectAll("path")
      .data(values)
      .join("path")
      .attr("d", (d) => d.d)
      .attr("fill", (d) => d.fill);
  }

  return {root: svg, dispose};
}
