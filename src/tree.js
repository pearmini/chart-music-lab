import * as d3 from "npm:d3";
import * as apack from "npm:apackjs";

function toTree(codes) {
  const data = {
    children: [],
  };

  const visited = [data];
  let currentIndex = 0;

  while (currentIndex < codes.length && visited.length > 0) {
    const code = +codes[currentIndex];
    const current = visited.shift();
    const children = d3.range(code).map((i) => ({children: []}));
    current.children = children;
    visited.push(...children);
    currentIndex++;
  }

  return data;
}

function ellipsis(text, maxLength) {
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return chars.slice(0, maxLength).join("") + "...";
}

function trimDegenerateSegments(code) {
  const codes = [];
  let current = null;
  let i = 0;

  const isValid = (current) => {
    const isStartWith1 = current.startsWith("1");
    const enoughZeros = +current[0] <= current.slice(1).length;
    return isStartWith1 || enoughZeros;
  };

  for (i = 0; i < code.length; i++) {
    const digit = +code[i];
    const next = +code[i + 1];

    // A degenerate segment is a segment starting with 1 or
    // with trailing 0 which 0 count is getter than or equal to the first digit.
    const isDegenerateSegment = digit === 1 || next === 0;

    if (!current && !isDegenerateSegment) break;
    else if (!current && isDegenerateSegment) current = "" + digit;
    else if (digit === 0) current += "" + digit;
    else {
      if (isValid(current)) {
        codes.push(current);
        current = isDegenerateSegment ? "" + digit : null;
        if (!current) break;
      } else {
        i = i - current.length;
        current = null;
        break;
      }
    }
  }

  if (current) {
    if (isValid(current)) codes.push(current);
    else i = i - current.length;
  }

  return [codes, code.slice(i)];
}

function toASCII(name) {
  return name
    .split("")
    .map((code) => code.charCodeAt(0))
    .join("");
}

export function tree(name, {width = 480, height = 480} = {}) {
  name = name.trim();
  const ascii = toASCII(name);
  const [flowers, tree] = trimDegenerateSegments(ascii);
  const data = toTree(tree);
  const root = d3.hierarchy(data);

  // Create tree layout
  const treeLayout = d3.tree().size([width - 40, height - 40]);

  // Compute the tree layout
  treeLayout(root);

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;");

  // Draw stamp
  try {
    const wordLength = name.split(" ").length;
    if (wordLength > 4) {
      throw new Error("Too many words");
    }

    let cellSize = 80;
    const padding = 20;
    const baselineY = height;
    let totalLength = wordLength * cellSize + padding * 2;
    if (totalLength > width / 2) {
      cellSize = (width / 2 - padding * 2) / wordLength;
      totalLength = wordLength * cellSize + padding;
    } else {
      totalLength -= padding;
    }

    const start = width - totalLength;
    svg
      .append("g")
      .attr("transform", `translate(${start}, ${baselineY - cellSize - 5})`)
      .append(() => {
        return apack.text(name, {cellSize, word: {strokeWidth: 1.5, stroke: "#999"}}).render();
      });
  } catch (e) {
    svg
      .append("g")
      .append("text")
      .attr("x", "100%")
      .attr("y", "100%")
      .attr("text-anchor", "end")
      .attr("fill", "#999")
      .attr("font-size", 16)
      .attr("font-family", "monospace")
      .text(ellipsis(name, 18));
  }

  // Create a group for the tree - flip vertically to have root at bottom
  const g = svg.append("g").attr("transform", `translate(20, 20) scale(1, -1) translate(0, -${height - 40})`);

  // Draw links (edges)
  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr(
      "d",
      d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => d.y)
    );

  g.append("g")
    .selectAll("circle")
    .data(root.descendants().filter((d) => d.parent))
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 3)
    .attr("fill", "#999");

  // Draw flowers
  const len = 80;
  const spacing = 30;
  const flowersX = (d, i) => width / 2 - 50 - (i + 1) * spacing;
  svg
    .append("g")
    .selectAll("circle")
    .data(flowers)
    .join("circle")
    .attr("cx", flowersX)
    .attr("cy", (_) => height - len)
    .attr("r", 3)
    .attr("fill", "#999");

  svg
    .append("g")
    .selectAll("line")
    .data(flowers)
    .join("line")
    .attr("x1", flowersX)
    .attr("x2", flowersX)
    .attr("y1", (_) => height - len)
    .attr("y2", (_) => height - 20)
    .attr("stroke", "#555")
    .attr("stroke-width", 1);

  return svg.node();
}
