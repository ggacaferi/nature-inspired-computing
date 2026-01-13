const AGENT_TYPE ={ HONEST: 0, LIAR: 1, STUBBORN: 2};
let agents = [];
let params = {
  numAgents: 150,
  liarsPercent: 15,
  stubbornPercent: 10,
  proximityRadius: 40,
  interactionTime: 30,
  maxSpeed: 2,
  maxForce: 0.05
};

let stats = { honest: 0, liars: 0, stubborn: 0 };

// UI elements
let controlPanel;
let sliders= {};
let resetButton;

// Evolution system (for testing)
let evolutionSystem = null;
let evolutionMode = 'none';
let evolutionTester = null;

function setup() {
  createCanvas(1200, 800);
  
  // Initialize evolution system
  evolutionMode = window.evolutionMode || 'none';
  initializeEvolutionSystem();
  
  // Initialize tester
  if (typeof EvolutionTester !== 'undefined') {
    evolutionTester = new EvolutionTester();
  }
  
  // Create control panel
  createControlPanel();
  
  // Initialize agents
  initializeAgents();
  
  // Expose for testing (after agents are created)
  window.agents = agents;
  window.evolutionSystem = evolutionSystem;
  window.evolutionTester = evolutionTester;
}

function initializeEvolutionSystem() {
  if (evolutionMode === 'genetic' && typeof GeneticEvolution !== 'undefined') {
    evolutionSystem = new GeneticEvolution();
  } else if (evolutionMode === 'gametheory' && typeof GameTheoryEvolution !== 'undefined') {
    evolutionSystem = new GameTheoryEvolution();
  } else if (evolutionMode === 'cultural' && typeof CulturalEvolution !== 'undefined') {
    evolutionSystem = new CulturalEvolution();
  } else if (evolutionMode === 'hybrid' && typeof HybridEvolution !== 'undefined') {
    evolutionSystem = new HybridEvolution();
  }
}

function draw() {
  background(20);
  
  // Update and display all agents
  for (let agent of agents) {
    agent.flock(agents);
    agent.interact(agents);
    agent.update();
    agent.display();
    
    // Update evolution system per agent
    if (evolutionSystem && typeof evolutionSystem.update === 'function') {
      evolutionSystem.update(agent, agents);
    }
  }
  
  // Evolve population periodically
  if (evolutionSystem && typeof evolutionSystem.evolvePopulation === 'function') {
    evolutionSystem.evolvePopulation(agents);
  }
  
  // Update stats every frame
  updateStats();
  
  // Draw legend
  drawLegend();
}

function createControlPanel() {
  // Create container for controls
  controlPanel = createDiv();
  controlPanel.position(20, 20);
  controlPanel.style('background', 'rgba(0,0,0,0.8)');
  controlPanel.style('padding', '15px');
  controlPanel.style('border-radius', '8px');
  controlPanel.style('color', 'white');
  controlPanel.style('font-size', '12px');
  controlPanel.style('max-width', '280px');
  
  // Title
  let title = createElement('h3', 'Simulation Controls');
  title.parent(controlPanel);
  title.style('margin', '0 0 10px 0');
  title.style('font-size', '14px');
  
  // Evolution mode selector
  let modeLabel = createP('Evolution Mode:');
  modeLabel.parent(controlPanel);
  modeLabel.style('margin', '10px 0 5px 0');
  
  let modeSelector = createSelect();
  modeSelector.parent(controlPanel);
  modeSelector.option('None (Base)', 'none');
  modeSelector.option('Genetic Evolution', 'genetic');
  modeSelector.option('Game Theory', 'gametheory');
  modeSelector.option('Cultural Evolution', 'cultural');
  modeSelector.option('Hybrid (All 3)', 'hybrid');
  modeSelector.value(evolutionMode);
  modeSelector.style('width', '100%');
  modeSelector.style('padding', '5px');
  modeSelector.style('margin-bottom', '10px');
  modeSelector.changed(() => {
    evolutionMode = modeSelector.value();
    initializeEvolutionSystem();
    initializeAgents();
  });
  
  // Number of agents slider
  createSliderControl('numAgents', 'Total Agents', 50, 300, params.numAgents, controlPanel);
  
  // Liars percentage slider
  createSliderControl('liarsPercent', 'Liars %', 0, 50, params.liarsPercent, controlPanel);
  
  // Stubborn percentage slider
  createSliderControl('stubbornPercent', 'Stubborn %', 0, 50, params.stubbornPercent, controlPanel);
  
  // Proximity radius slider
  createSliderControl('proximityRadius', 'Proximity Radius (px)', 20, 100, params.proximityRadius, controlPanel);
  
  // Interaction time slider
  createSliderControl('interactionTime', 'Interaction Time (frames)', 10, 100, params.interactionTime, controlPanel);
  
  // Reset button
  resetButton = createButton('Reset Simulation');
  resetButton.parent(controlPanel);
  resetButton.style('margin-top', '15px');
  resetButton.style('width', '100%');
  resetButton.style('padding', '8px');
  resetButton.style('background', '#4CAF50');
  resetButton.style('border', 'none');
  resetButton.style('border-radius', '4px');
  resetButton.style('color', 'white');
  resetButton.style('cursor', 'pointer');
  resetButton.mousePressed(() => {
    updateParamsFromSliders();
    initializeAgents();
  });
  
  // Tips
  let tips = createP('<strong>Observation Tips:</strong><br/>• Watch for color clustering and echo chambers<br/>• Liars (triangles) invert information<br/>• Stubborn agents (squares) maintain fixed beliefs<br/>• Proximity circles show interaction range');
  tips.parent(controlPanel);
  tips.style('margin-top', '15px');
  tips.style('font-size', '11px');
  tips.style('line-height', '1.4');
}

function createSliderControl(key, label, min, max, value, parent) {
  let container = createDiv();
  container.parent(parent);
  container.style('margin-top', '10px');
  
  let labelElem = createP(label + ': ' + value);
  labelElem.parent(container);
  labelElem.style('margin', '0 0 5px 0');
  labelElem.id(key + '_label');
  
  let slider = createSlider(min, max, value);
  slider.parent(container);
  slider.style('width', '100%');
  slider.input(() => {
    select('#' + key + '_label').html(label + ': ' + slider.value());
  });
  
  sliders[key] = slider;
}

function updateParamsFromSliders() {
  params.numAgents = sliders.numAgents.value();
  params.liarsPercent = sliders.liarsPercent.value();
  params.stubbornPercent = sliders.stubbornPercent.value();
  params.proximityRadius = sliders.proximityRadius.value();
  params.interactionTime = sliders.interactionTime.value();
}

function initializeAgents() {
  agents = [];
  const numLiars = floor(params.numAgents * params.liarsPercent / 100);
  const numStubborn = floor(params.numAgents * params.stubbornPercent / 100);
  const numHonest = params.numAgents - numLiars - numStubborn;
  
  // Create honest agents
  for (let i = 0; i < numHonest; i++) {
    let x = random(width);
    let y = random(height);
    let col = color(random(255), random(255), random(255));
    agents.push(new Agent(x, y, AGENT_TYPE.HONEST, col));
  }
  
  // Create liar agents
  for (let i = 0; i < numLiars; i++) {
    let x = random(width);
    let y = random(height);
    let col = color(random(255), random(255), random(255));
    agents.push(new Agent(x, y, AGENT_TYPE.LIAR, col));
  }
  
  // Create stubborn agents
  for (let i = 0; i < numStubborn; i++) {
    let x = random(width);
    let y = random(height);
    let col = color(random(255), random(255), random(255));
    agents.push(new Agent(x, y, AGENT_TYPE.STUBBORN, col));
  }
  
  // Initialize evolution properties for each agent
  if (evolutionSystem && typeof evolutionSystem.initializeAgent === 'function') {
    for (let agent of agents) {
      evolutionSystem.initializeAgent(agent);
    }
  }
  
  // Update window reference for testing
  window.agents = agents;
  
  updateStats();
}

function updateStats() {
  stats = { honest: 0, liars: 0, stubborn: 0 };
  for (let agent of agents) {
    if (agent.type === AGENT_TYPE.HONEST) stats.honest++;
    else if (agent.type === AGENT_TYPE.LIAR) stats.liars++;
    else if (agent.type === AGENT_TYPE.STUBBORN) stats.stubborn++;
  }
}

function drawLegend() {
  fill(255);
  noStroke();
  textSize(12);
  textAlign(LEFT);
  
  let legendX = width - 250;
  let legendY = 20;
  
  text('Legend:', legendX, legendY);
  
  // Honest
  fill(150, 150, 255);
  stroke(255, 255, 255, 100);
  strokeWeight(1.5);
  circle(legendX + 10, legendY + 20, 12);
  noStroke();
  fill(255);
  text('Honest Agents: ' + stats.honest, legendX + 25, legendY + 25);
  
  // Liar
  fill(255, 150, 150);
  stroke(255, 0, 0);
  strokeWeight(1.5);
  push();
  translate(legendX + 10, legendY + 40);
  triangle(0, -9, -6, 6, 6, 6);
  pop();
  noStroke();
  fill(255);
  text('Liar Agents (Inverters): ' + stats.liars, legendX + 25, legendY + 45);
  
  // Stubborn
  fill(200, 255, 150);
  stroke(0);
  strokeWeight(1.5);
  rectMode(CENTER);
  rect(legendX + 10, legendY + 60, 12, 12);
  noStroke();
  fill(255);
  text('Stubborn Agents (Anchors): ' + stats.stubborn, legendX + 25, legendY + 65);
}

// Agent class
class Agent {
  constructor(x, y, type, initialColor) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 2));
    this.acc = createVector(0, 0);
    this.type = type;
    
    if (type === AGENT_TYPE.STUBBORN) {
      this.color = initialColor;
      this.fixedColor = initialColor;
    } else {
      this.color = initialColor;
    }
    
    this.r = 6;
    this.maxSpeed = params.maxSpeed;
    this.maxForce = params.maxForce;
    this.proximityRadius = params.proximityRadius;
    this.interactionTimer = {};
  }
  
  // Reynolds Rules: Separation
  separate(agents) {
    const desiredSeparation = 25;
    let steer = createVector(0, 0);
    let count = 0;
    
    for (let other of agents) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }
    
    if (count > 0) {
      steer.div(count);
    }
    
    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
    }
    
    return steer;
  }
  
  // Reynolds Rules: Alignment
  align(agents) {
    const neighborDist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let other of agents) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.vel);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }
    
    return createVector(0, 0);
  }
  
  // Reynolds Rules: Cohesion
  cohesion(agents) {
    const neighborDist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let other of agents) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.pos);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }
    
    return createVector(0, 0);
  }
  
  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.normalize();
    desired.mult(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }
  
  flock(agents) {
    let sep = this.separate(agents);
    let ali = this.align(agents);
    let coh = this.cohesion(agents);
    
    // Weight the forces
    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.0);
    
    this.acc.add(sep);
    this.acc.add(ali);
    this.acc.add(coh);
  }
  
  interact(agents) {
    if (this.type === AGENT_TYPE.STUBBORN) return;
    
    for (let other of agents) {
      if (other === this) continue;
      
      let d = p5.Vector.dist(this.pos, other.pos);
      
      if (d < this.proximityRadius) {
        const key = agents.indexOf(other);
        
        if (!this.interactionTimer[key]) {
          this.interactionTimer[key] = 0;
        }
        
        this.interactionTimer[key]++;
        
        if (this.interactionTimer[key] >= params.interactionTime) {
          this.communicate(other);
          this.interactionTimer[key] = 0;
        }
      } else {
        delete this.interactionTimer[agents.indexOf(other)];
      }
    }
  }
  
  communicate(other) {
    if (this.type === AGENT_TYPE.STUBBORN) return;
    
    // Evolution system interaction handling
    if (evolutionSystem && typeof evolutionSystem.processInteraction === 'function') {
      evolutionSystem.processInteraction(this, other);
    }
    
    let otherColor = other.getTransmittedColor();
    
    // Average the colors
    this.color = lerpColor(
      color(this.color),
      color(otherColor),
      0.3
    );
  }
  
  getTransmittedColor() {
    if (this.type === AGENT_TYPE.LIAR) {
      // Transmit inverted/complementary color
      let c = color(this.color);
      return color(
        255 - red(c),
        255 - green(c),
        255 - blue(c)
      );
    }
    return this.color;
  }
  
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Wrap around edges
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }
  
  display() {
    // Draw proximity radius (subtle)
    noFill();
    stroke(this.color);
    strokeWeight(0.5);
    circle(this.pos.x, this.pos.y, this.proximityRadius * 2);
    
    // Draw agent
    fill(this.color);
    noStroke();
    
    if (this.type === AGENT_TYPE.LIAR) {
      // Triangle for liars
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading() + PI / 2);
      triangle(0, -this.r * 1.5, -this.r, this.r, this.r, this.r);
      pop();
    } else if (this.type === AGENT_TYPE.STUBBORN) {
      // Square for stubborn
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading() + PI / 4);
      rectMode(CENTER);
      rect(0, 0, this.r * 2, this.r * 2);
      pop();
    } else {
      // Circle for honest
      circle(this.pos.x, this.pos.y, this.r * 2);
    }
    
    // Add border to distinguish agent types
    noFill();
    strokeWeight(1.5);
    if (this.type === AGENT_TYPE.LIAR) {
      stroke(255, 0, 0);
    } else if (this.type === AGENT_TYPE.STUBBORN) {
      stroke(0);
    } else {
      stroke(255, 255, 255, 100);
    }
    
    if (this.type === AGENT_TYPE.LIAR) {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading() + PI / 2);
      triangle(0, -this.r * 1.5, -this.r, this.r, this.r, this.r);
      pop();
    } else if (this.type === AGENT_TYPE.STUBBORN) {
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading() + PI / 4);
      rectMode(CENTER);
      rect(0, 0, this.r * 2, this.r * 2);
      pop();
    } else {
      circle(this.pos.x, this.pos.y, this.r * 2);
    }
  }
}
