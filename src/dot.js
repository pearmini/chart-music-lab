import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import * as Tone from "npm:tone";
import {Markov} from "./markov.js";

function uid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function extend(node) {
  const circles = d3.select(node).selectAll("circle");
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  circles.each(function () {
    const cx = this.getAttribute("cx");
    const cy = this.getAttribute("cy");
    const r = this.getAttribute("r");
    minX = Math.min(minX, cx - r);
    minY = Math.min(minY, cy - r);
    maxX = Math.max(maxX, cx + r);
    maxY = Math.max(maxY, cy + r);
  });
  return [minX, minY, maxX, maxY];
}

function computeHeight(options) {
  const node = Plot.plot(options);
  const [, minY, , maxY] = extend(node);
  const actualHeight = maxY - minY;
  return actualHeight;
}

export async function dot(raw, {width, drums} = {}) {
  await Tone.loaded;

  const chain = new Markov({
    kick: [
      {
        value: "kick",
        probability: 0.5,
      },
      {
        value: "snare",
        probability: 0.5,
      },
    ],
    snare: [
      {
        value: "hh",
        probability: 0.7,
      },
      {
        value: "hho",
        probability: 0.3,
      },
    ],
    hh: [
      {
        value: "kick",
        probability: 0.5,
      },
      {
        value: "snare",
        probability: 0.5,
      },
    ],
    hho: "kick",
  });

  chain.value = "kick";

  const data = raw.map((d) => {
    const drum = chain.next();
    return {...d, drum, id: uid()};
  });

  // Create Tone.Player instances for each drum
  const players = {};
  for (const [drumName, url] of Object.entries(drums)) {
    players[drumName] = new Tone.Player(url).toDestination();
  }

  const options = {
    width,
    color: {
      legend: true,
      scheme: "Dark2",
    },
    x: {
      grid: true,
    },
    marks: [
      Plot.dotX(
        data,
        Plot.dodgeY({
          x: "weight (lb)",
          title: "drum",
          fill: "drum",
          anchor: "middle",
          stroke: "black",
          r: 8,
        })
      ),
    ],
  };
  const height = computeHeight(options);
  const node = Plot.plot({...options, height: height + 100});

  const svg = d3.select(node);

  const sortedData = d3.sort(data, (a, b) => a["weight (lb)"] - b["weight (lb)"]);

  const dots = svg.selectAll("circle").each(function () {
    const fill = this.getAttribute("fill");
    const r = this.getAttribute("r");
    this.__fill__ = fill;
    this.__r__ = r;
    this.setAttribute("fill", "#ccc");
  });

  svg.style("cursor", "pointer").on("click", async () => {
    // Animate all dots: scale up then back down
    dots
      .transition()
      .duration(100)
      .attr("r", (d, i, nodes) => {
        const originalR = nodes[i].__r__ || 8;
        return originalR * 1.2;
      })
      .transition()
      .duration(100)
      .attr("r", (d, i, nodes) => {
        const originalR = nodes[i].__r__ || 8;
        return originalR;
      });

    if (sortedData.length <= 0) return;
    const d = sortedData.shift();
    if (d && players[d.drum]) {
      players[d.drum].start();
      dots
        .filter((index) => {
          const item = data[index];
          return item.id === d.id;
        })
        .each(function () {
          this.setAttribute("fill", this.__fill__);
        });
    }
  });

  // Cleanup function
  node.dispose = () => {
    for (const player of Object.values(players)) {
      player.stop();
    }
  };

  return node;
}
