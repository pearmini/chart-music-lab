---
toc: false
---

<div class="hero">
  <h1>Chart Music Lab</h1>
  <h2>What do chats sounds like? How can we draw charts with music?</h2>
</div>

<div class="grid grid-cols-3">
  <div class="card-wrapper">
    <div class="card">
      <a class="link" href="/area"><img src="/img/streamgraph.png" width="100%"/></a>
    </div>
    <div class="card-title">Area: AV Instrument</div>
  </div>
  <div class="card-wrapper">
    <div class="card">
      <a class="link" href="/bar"><img src="/img/eye.png" /></a>
    </div>
    <div class="card-title">Bar: Composition Eye</div>
  </div>
  <div class="card-wrapper">
    <div class="card">
      <a class="link" href="/dot"><img src="/img/dot.png" /></a>
    </div>
    <div class="card-title">Dot: Dodge Drum</div>
  </div>
  <div class="card-wrapper">
    <div class="card">
      <a class="link" href="/grid"><img src="/img/melody.png" /></a>
    </div>
    <div class="card-title">Grid: Github Melody Sequencer</div>
  </div>
  <div class="card-wrapper">
    <div class="card">
      <a class="link" href="/contour"><img src="/img/contour.png" style="width:100%;height:100%;object-fit:cover"/></a>
    </div>
    <div class="card-title">Contour: Timbre</div>
  </div>
  <div class="card-wrapper">
    <div class="card">
      <a class="link" href="/tree"><img src="/img/tree.png" style="width:100%;height:100%;object-fit:cover"/></a>
    </div>
    <div class="card-title">Tree: Chord</div>
  </div>
</div>

<style>

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 6rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

.card a {
  position: relative;
  display: block;
  background: black;
  width: 100%;
  height: 100%;
}

.card img {
  position: absolute;
  max-width: 100%;
  max-height: 100%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-wrapper {
  display: flex;
  flex-direction: column;
}

.card {
  padding: 0;
  margin: 0;
  overflow: hidden;
  transition: border-color 0.2s ease;
  aspect-ratio: 1 / 0.75;
  width: 100%;
}

.card:hover {
  border: 1px solid currentColor;
  cursor: pointer;
}

.card-title {
  padding: 12px 8px 0;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: var(--theme-foreground);
  font-family: var(--sans-serif);
}

</style>
