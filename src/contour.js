import * as d3 from "npm:d3";
import * as Tone from "npm:tone";
import {html} from "npm:htl";

export async function contour({urls = {}, width = 640, height = width}) {
  const count = 512;
  let player = null;
  let analyzer = null;
  let currentUrl = null;

  await Tone.loaded;

  const data = [];
  let timer = null;

  async function setupPlayer(url) {
    // Clean up existing player
    if (player) {
      player.stop();
      player.dispose();
    }

    // Create new player and analyzer
    player = new Tone.Player(url).toDestination();
    analyzer = new Tone.FFT(count);
    player.connect(analyzer);
    currentUrl = url;

    // Wait for buffer to load
    await new Promise((resolve) => {
      const checkLoaded = () => {
        if (player.loaded) {
          resolve();
        } else {
          setTimeout(checkLoaded, 10);
        }
      };
      checkLoaded();
    });

    // Clear data when switching sounds
    data.length = 0;
  }

  function loop() {
    if (player && player.state === "started") {
      const values = Array.from(analyzer.getValue());
      data.push(values);
      draw(data);
    } else {
      stop();
    }
  }

  function stop() {
    if (player) player.stop();
    if (timer) timer.stop();
  }

  const margin = 60;
  const innerRadius = 0;
  const outerRadius = width / 2 - margin;
  const n = 10;
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

  const isValid = (d) => d !== undefined && d !== null && d !== Infinity && d !== -Infinity && d !== NaN;

  function draw(data) {
    const sliced = data.slice(-n);

    const x = d3.scaleLinear([0, Math.log(count)], [0.1, Math.PI * 2 - 0.1]).clamp(true);
    const y = d3.scaleBand(d3.range(sliced.length), [innerRadius, outerRadius]);
    const area = d3
      .areaRadial()
      .curve(d3.curveCatmullRomClosed)
      .angle((_, i) => {
        const d = i === 0 ? 0 : x(Math.log(i));
        return d;
      });

    svg.html("");

    svg
      .selectAll("path")
      .data(sliced)
      .join("path")
      .attr("fill", (d, i) => d3.interpolateTurbo(i / sliced.length))
      .attr("stroke", "black")
      .attr("d", (d, i, arr) => {
        if (!d.every(isValid)) return null;
        const j = arr.length - i - 1;
        const innerRadius = y(j);
        const outerRadius = y(j) + y.bandwidth() * 3;
        const y1 = d3.scaleLinear().domain([0, d3.max(d)]).range([innerRadius, outerRadius]);
        const path = area.innerRadius(() => innerRadius).outerRadius((v) => y1(v))(d);
        return path;
      });
  }

  async function playSound(url, name) {
    // Stop any currently playing sound
    stop();

    // Setup player for this sound if different
    if (url !== currentUrl) {
      await setupPlayer(url);
    }

    // Start playing
    if (player) {
      player.start();
      timer = d3.interval(loop, 1000 / 60);
    }
  }

  // Initialize with first sound if available
  const firstUrl = Object.values(urls)[0];
  if (firstUrl) {
    await setupPlayer(firstUrl);
  }

  // Create buttons for each sound
  const soundButtons = Object.entries(urls).map(
    ([name, url]) => html`<button onclick=${() => playSound(url, name)}>${name}</button>`
  );

  const node = html`<div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">${soundButtons}</div>
    <div class="card">${svg}</div>
  </div>`;

  return node;
}
