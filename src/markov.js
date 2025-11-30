// Derived from Lusia's p5 sketch: https://editor.p5js.org/luisa/sketches/ufHimtq6q

/*
 This class (based on the deprecated CtrlMarkov) represents a Markov Chain where each call to Markov.next will move to the next state. If the next state choice is an array, the next state is chosen randomly with even probability for all of the choices. For a weighted probability of the next choices, pass in an object with "state" and "probability" attributes. The probabilities will be normalized and then chosen. If no next options are given for the current state, the state will stay there. 
 
Example 1
 let chain = new Tone.CtrlMarkov({
   "beginning" : ["end", "middle"],
   "middle" : "end"
 });
 chain.value = "beginning";
 chain.next(); //returns "end" or "middle" with 50% probability
 
Example 2
let chain = new Tone.CtrlMarkov({
  "beginning" : [{"value" : "end", "probability" : 0.8}, 
                {"value" : "middle", "probability" : 0.2}],
  "middle" : "end"
});
chain.next(); //returns "end" with 80% probability or "middle" with 20%.

*/
export class Markov {
  constructor(values) {
    // An object with the state names as the keys and the next state(s) as the values.
    this.values = values;

    // The current state
    this.value;
  }

  // Returns the next state of the Markov values.
  next() {
    let next = this.values[this.value];
    if (isArray(next)) {
      let distribution = this.getProbDistribution(next);
      let rand = Math.random();
      let total = 0;
      for (var i = 0; i < distribution.length; i++) {
        var dist = distribution[i];
        if (rand > total && rand < total + dist) {
          let chosen = next[i];
          if (isObject(chosen)) {
            this.value = chosen.value;
          } else {
            this.value = chosen;
          }
        }
        total += dist;
      }
    } else {
      this.value = next;
    }
    return this.value;
  }

  // Choose randomly from an array weighted options in the form
  // {"state" : string, "probability" : number} or an array of values
  // Returns the randomly selected choice
  getProbDistribution(options) {
    let distribution = [];
    let total = 0;
    let needsNormalizing = false;
    for (let i = 0; i < options.length; i++) {
      let option = options[i];
      if (isObject(option)) {
        needsNormalizing = true;
        distribution[i] = option.probability;
      } else {
        distribution[i] = 1 / options.length;
      }
      total += distribution[i];
    }
    if (needsNormalizing) {
      //normalize the values
      for (let j = 0; j < distribution.length; j++) {
        distribution[j] = distribution[j] / total;
      }
    }
    return distribution;
  }
}


function isObject(value) {
  return typeof value === "object" && value !== null;
}

function isArray(value) {
  return Array.isArray(value);
}