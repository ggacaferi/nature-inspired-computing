/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
const AGENT_TYPE = { HONEST: 0, LIAR: 1, STUBBORN: 2 };

let agents = [];
let params = {
  numAgents: 150,
  liarsPercent: 15,
  stubbornPercent: 10,
  proximityRadius: 45,
  interactionTime: 20,
  maxSpeed: 2.5,
  maxForce: 0.1,
  // Flocking weights (Craig Reynolds rules)
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0
};

let stats = { honest: 0, liars: 0, stubborn: 0 };
let selectedAgent = null;
let isLogging = false;
let simulationLog = [];

// Evolution system (for testing)
let evolutionSystem = null;
let evolutionMode = 'none';
let evolutionTester = null;

// Graph Data
let history = [];
const maxHistory = 200;

// UI Panel References
let panels = {};

function setup() {
  createCanvas(windowWidth, windowHeight);
 
  // Initialize evolution system
  evolutionMode = window.evolutionMode || 'none';
  initializeEvolutionSystem();
  
  // Initialize tester
  if (typeof EvolutionTester !== 'undefined') {
    evolutionTester = new EvolutionTester();
  }
 
  // Create all panels with the Movable/Minimizable Manager
  panels.config = createPanel('SWARM CONFIG', 20, 20, '300px');
  buildConfigUI(panels.config.content);
 
  panels.inspector = createPanel('AGENT INSPECTOR', windowWidth - 280, 20, '240px');
 
  panels.stats = createPanel('LIVE POPULATION STATS', 20, windowHeight - 180, '220px');

  panels.graph = createPanel('OPINION TRENDS', windowWidth / 2 - 175, windowHeight - 200, '350px');
  // Add a canvas inside the graph panel for drawing lines
  let graphCanvas = document.createElement('canvas');
  graphCanvas.id = 'graphCanvas';
  graphCanvas.width = 320;
  graphCanvas.height = 120;
  graphCanvas.style.borderRadius = '8px';
  graphCanvas.style.background = 'rgba(10, 10, 15, 0.5)';
  panels.graph.content.elt.appendChild(graphCanvas);
  
  panels.beliefs = createPanel('BELIEF ANALYSIS', windowWidth - 340, windowHeight - 280, '320px');

  initializeAgents();
}

function draw() {
  background(10);
  updateStats();
  updateHistory();

  let currentFrameData = { frame: frameCount, agents: [], metadata: {} };
  let totalBelief = 0;
  let values = [];

  for (let agent of agents) {
    agent.flock(agents);
    let interactions = agent.interact(agents);
    agent.update();
    agent.display();
    
    // Update evolution system per agent
    if (evolutionSystem && typeof evolutionSystem.update === 'function') {
      evolutionSystem.update(agent, agents);
    }

    if (isLogging) {
      currentFrameData.agents.push({
        id: agent.id,
        x: Number(agent.pos.x.toFixed(2)),
        y: Number(agent.pos.y.toFixed(2)),
        rgb: [red(agent.color), green(agent.color), blue(agent.color)],
        type: agent.type,
        interactions: interactions
      });
      let b = red(agent.color) / 255;
      totalBelief += b;
      values.push(b);
    }

    // Agent selection (Click)
    if (mouseIsPressed && dist(mouseX, mouseY, agent.pos.x, agent.pos.y) < 20) {
      selectedAgent = agent;
    }
  }
  
  // Evolve population periodically
  if (evolutionSystem && typeof evolutionSystem.evolvePopulation === 'function') {
    const evolvedAgents = evolutionSystem.evolvePopulation(agents);
    // Some evolution systems (genetic) return a NEW agents array when generation completes
    if (Array.isArray(evolvedAgents) && evolvedAgents !== agents) {
      agents = evolvedAgents;
      // Keep window references in sync for tester & console debugging
      window.agents = agents;
    }
  }

  if (isLogging) {
    let mean = totalBelief / agents.length;
    let variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / agents.length;
    currentFrameData.metadata = { global_consensus: mean, variance: Math.sqrt(variance) };
    simulationLog.push(currentFrameData);
   
    fill(255, 0, 0); noStroke();
    circle(width - 25, height - 25, 12);
  }

  // Update dynamic UI contents
  updateInspectorUI();
  updateStatsUI();
  updateBeliefsUI();
  drawGraphLines();
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
  } else {
    evolutionSystem = null;
  }
}

// --- PANEL MANAGER (MOVABLE & MINIMIZABLE) ---
function createPanel(title, x, y, w, h) {
  let panel = createDiv().class('ui-panel').position(x, y).style('width', w);
  if (h) panel.style('height', h);
  let header = createDiv(title).class('panel-header').parent(panel);
  let content = createDiv().class('panel-content').parent(panel);
 
  let dragging = false;
  let offset = { x: 0, y: 0 };

  header.doubleClicked(() => {
    let isHidden = content.style('display') === 'none';
    content.style('display', isHidden ? 'block' : 'none');
  });

  header.elt.onmousedown = (e) => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    dragging = true;
    offset.x = e.clientX - panel.elt.offsetLeft;
    offset.y = e.clientY - panel.elt.offsetTop;
    header.style('cursor', 'grabbing');
  };

  // Per-panel mouse handlers so all menus can be moved independently
  const onMouseMove = (e) => {
    if (dragging) {
      panel.position(e.clientX - offset.x, e.clientY - offset.y);
    }
  };

  const onMouseUp = () => {
    if (dragging) {
      dragging = false;
      header.style('cursor', 'grab');
    }
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  return { panel, header, content };
}

function buildConfigUI(parent) {
  // Evolution mode selector
  let modeLabel = createP('Evolution Mode:').parent(parent).style('margin', '0 0 5px 0').style('font-size', '11px');
  
  let modeSelector = createSelect().parent(parent).class('glass-select');
  modeSelector.option('None (Base)', 'none');
  modeSelector.option('Genetic Evolution', 'genetic');
  modeSelector.option('Game Theory', 'gametheory');
  modeSelector.option('Cultural Evolution', 'cultural');
  modeSelector.option('Hybrid (All 3)', 'hybrid');
  modeSelector.value(evolutionMode);
  modeSelector.changed(() => {
    evolutionMode = modeSelector.value();
    initializeEvolutionSystem();
    history = [];
    initializeAgents();
  });

  createSliderWithInput('numAgents', 'Population', 20, 400, params.numAgents, parent);
  createSliderWithInput('liarsPercent', 'Liars %', 0, 100, params.liarsPercent, parent);
  createSliderWithInput('stubbornPercent', 'Stubborn %', 0, 100, params.stubbornPercent, parent);
  createSliderWithInput('proximityRadius', 'Signal Range', 10, 150, params.proximityRadius, parent);

  // Flocking controls
  createSliderWithInput('separationWeight', 'Separation', 0, 3, params.separationWeight, parent);
  createSliderWithInput('alignmentWeight', 'Alignment', 0, 3, params.alignmentWeight, parent);
  createSliderWithInput('cohesionWeight', 'Cohesion', 0, 3, params.cohesionWeight, parent);

  let resetBtn = createButton('RESET SYSTEM').parent(parent).class('action-btn reset');
  resetBtn.mousePressed(() => { history = []; initializeAgents(); });

  let logBtn = createButton('⏺ RECORD DATA').parent(parent).class('action-btn record');
  logBtn.mousePressed(() => {
    isLogging = !isLogging;
    logBtn.html(isLogging ? '⏹ SAVE JSON' : '⏺ RECORD DATA');
    if (!isLogging && simulationLog.length > 0) {
      saveJSON(simulationLog, 'swarm_export.json');
      simulationLog = [];
    }
  });
}

function updateHistory() {
  if (frameCount % 5 === 0) {
    history.push({ h: stats.honest, l: stats.liars });
    if (history.length > maxHistory) history.shift();
  }
}

function drawGraphLines() {
  if (panels.graph.content.style('display') === 'none') return;
  
  let canvas = document.getElementById('graphCanvas');
  if (!canvas) return;
  
  let ctx = canvas.getContext('2d');
  let w = canvas.width;
  let h = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, w, h);
  
  // Draw background
  ctx.fillStyle = 'rgba(10, 10, 15, 0.5)';
  ctx.fillRect(0, 0, w, h);
  
  if (history.length < 2) return;
  
  // Draw Honest line (Green)
  ctx.strokeStyle = 'rgb(50, 255, 100)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < history.length; i++) {
    let px = (i / maxHistory) * w;
    let py = h - (history[i].h / params.numAgents) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  
  // Draw Liars line (Red)
  ctx.strokeStyle = 'rgb(255, 50, 50)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < history.length; i++) {
    let px = (i / maxHistory) * w;
    let py = h - (history[i].l / params.numAgents) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function updateInspectorUI() {
  if (panels.inspector.content.style('display') === 'none') return;
  let content = panels.inspector.content;
  if (!selectedAgent) { content.html('<p style="opacity:0.5">Click an agent</p>'); return; }
  let typeStr = ["Honest", "Liar", "Stubborn"][selectedAgent.type];
  let genomeInfo = '';
  if (selectedAgent.genome) {
    genomeInfo = `<p style="font-size:10px; margin-top:8px; opacity:0.7">Genome: H:${selectedAgent.genome.honestyLevel.toFixed(2)} S:${selectedAgent.genome.stubbornness.toFixed(2)}</p>`;
  }
  content.html(`
    <p>ID: <b>${selectedAgent.id}</b></p>
    <p>State: <b style="color:${selectedAgent.type === 1 ? '#ff3232' : selectedAgent.type === 0 ? '#32ff64' : '#cccccc'}">${typeStr}</b></p>
    <div style="display:flex; align-items:center; margin-top:5px;">
      <span>Belief: </span>
      <div style="width:60px; height:15px; background:rgb(${red(selectedAgent.color)},${green(selectedAgent.color)},${blue(selectedAgent.color)}); margin-left:10px; border:1px solid #444;"></div>
    </div>
    ${genomeInfo}
  `);
}

function updateStatsUI() {
  if (panels.stats.content.style('display') === 'none') return;
  panels.stats.content.html(`
    <p style="color:#32ff64; font-weight:bold;">HONEST: ${stats.honest}</p>
    <p style="color:#ff3232; font-weight:bold;">LIARS: ${stats.liars}</p>
    <p style="color:#cccccc">STUBBORN: ${stats.stubborn}</p>
  `);
}

function updateBeliefsUI() {
  if (panels.beliefs.content.style('display') === 'none') return;
  
  // Categorize agents by truth vs lies
  let truthBelievers = [];
  let lieBelievers = [];
  
  for (let agent of agents) {
    let r = red(agent.color);
    let g = green(agent.color);
    let b = blue(agent.color);
    
    // Calculate if color is closer to truth (green) or lies (red)
    let truthScore = g; // Green channel = truth
    let lieScore = r;   // Red channel = lies
    
    // Saturation indicates extremism
    let max_c = Math.max(r, g, b);
    let min_c = Math.min(r, g, b);
    let saturation = max_c > 0 ? (max_c - min_c) / max_c : 0;
    
    let belief = {
      agent: agent,
      color: agent.color,
      truthScore: truthScore,
      lieScore: lieScore,
      saturation: saturation
    };
    
    // Classify purely as truth vs lies (no extremist category)
    if (truthScore > lieScore) {
      truthBelievers.push(belief);
    } else {
      lieBelievers.push(belief);
    }
  }
  
  // Build HTML
  let html = '<div style="font-size:10px; line-height:1.6;">';
  html += '<p style="opacity:0.7; margin-bottom:10px; font-size:11px;">BELIEF DISTRIBUTION:</p>';
  
  // Truth believers
  if (truthBelievers.length > 0) {
    let sample = truthBelievers[floor(truthBelievers.length / 2)];
    html += `<div style="margin-bottom:10px;">
      <div style="display:flex; align-items:center; margin-bottom:4px;">
        <div style="width:22px; height:22px; background:rgb(${red(sample.color)},${green(sample.color)},${blue(sample.color)}); border:1px solid #444; margin-right:8px;"></div>
        <span style="font-weight:bold; color:#4CAF50;">TRUTH (${truthBelievers.length})</span>
      </div>
      <div style="padding-left:30px; opacity:0.85; font-size:9px;">
        Honest agents believing accurate information. Green tint indicates truthful beliefs.
      </div>
    </div>`;
  }
  
  // Lie believers  
  if (lieBelievers.length > 0) {
    let sample = lieBelievers[floor(lieBelievers.length / 2)];
    html += `<div style="margin-bottom:10px;">
      <div style="display:flex; align-items:center; margin-bottom:4px;">
        <div style="width:22px; height:22px; background:rgb(${red(sample.color)},${green(sample.color)},${blue(sample.color)}); border:1px solid #444; margin-right:8px;"></div>
        <span style="font-weight:bold; color:#F44336;">LIES (${lieBelievers.length})</span>
      </div>
      <div style="padding-left:30px; opacity:0.85; font-size:9px;">
        Agents deceived by liars. Red tint shows inverted/false beliefs spread by dishonest agents.
      </div>
    </div>`;
  }
  
  // Analysis metrics
  let totalNormal = truthBelievers.length + lieBelievers.length;
  let truthRatio = totalNormal > 0 ? (truthBelievers.length / totalNormal * 100).toFixed(0) : 50;
  let lieRatio = totalNormal > 0 ? (lieBelievers.length / totalNormal * 100).toFixed(0) : 50;
  
  html += `<div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.15);">
    <p style="opacity:0.8; margin-bottom:5px;">Truth vs Lies Balance:</p>
    <div style="display:flex; gap:4px; height:18px; margin-bottom:5px;">
      <div style="flex:${truthRatio}; background:#4CAF50; border-radius:2px;"></div>
      <div style="flex:${lieRatio}; background:#F44336; border-radius:2px;"></div>
    </div>
    <p style="font-size:9px; opacity:0.6;">
      ${truthRatio}% truth / ${lieRatio}% lies
    </p>
  </div>`;
  
  html += '</div>';
  panels.beliefs.content.html(html);
}

function createSliderWithInput(key, label, min, max, value, parent) {
  let container = createDiv().parent(parent).style('margin-bottom', '12px');
  let row = createDiv().parent(container).style('display','flex').style('justify-content','space-between');
  createSpan(label).parent(row).style('font-size','11px');
  let valInput = createInput(value.toString()).parent(row).class('manual-input');
  let s = createSlider(min, max, value).parent(container).style('width','100%');
 
  s.input(() => {
    valInput.value(s.value());
    params[key] = s.value();
  });
 
  valInput.input(() => {
    let v = constrain(parseFloat(valInput.value()) || 0, min, max);
    s.value(v);
    params[key] = v;
  });
}

function initializeAgents() {
  agents = [];
  // Reset agent id counter so ids are stable across resets
  Agent._nextId = 0;
  let id = 0;
  let nL = floor(params.numAgents * params.liarsPercent / 100);
  let nS = floor(params.numAgents * params.stubbornPercent / 100);
  let nH = max(0, params.numAgents - nL - nS);
  
  for (let i = 0; i < nH; i++) agents.push(new Agent(id++, random(width), random(height), AGENT_TYPE.HONEST));
  for (let i = 0; i < nL; i++) agents.push(new Agent(id++, random(width), random(height), AGENT_TYPE.LIAR));
  for (let i = 0; i < nS; i++) agents.push(new Agent(id++, random(width), random(height), AGENT_TYPE.STUBBORN));
  
  // Initialize evolution properties for each agent
  if (evolutionSystem && typeof evolutionSystem.initializeAgent === 'function') {
    for (let agent of agents) {
      evolutionSystem.initializeAgent(agent);
    }
  }
  
  // Update window reference for testing
  window.agents = agents;
  window.evolutionSystem = evolutionSystem;
  window.evolutionTester = evolutionTester;
}

function updateStats() {
  stats = { honest: 0, liars: 0, stubborn: 0 };
  for (let a of agents) {
    if (a.type === AGENT_TYPE.HONEST) stats.honest++;
    else if (a.type === AGENT_TYPE.LIAR) stats.liars++;
    else stats.stubborn++;
  }
}

class Agent {
  constructor(id, x, y, type) {
    // Support both call styles:
    // - new Agent(id, x, y, type)  (used by base initializeAgents)
    // - new Agent(x, y, type)      (used by evolution modules creating children)
    if (type === undefined) {
      // called as (x, y, type)
      type = y;
      y = x;
      x = id;
      if (Agent._nextId === undefined) Agent._nextId = 0;
      id = Agent._nextId++;
    } else {
      if (Agent._nextId === undefined) Agent._nextId = 0;
      Agent._nextId = Math.max(Agent._nextId, id + 1);
    }

    this.id = id;
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 2));
    this.acc = createVector(0, 0);
    this.type = type;
    this.r = 6;
    this.maxSpeed = params.maxSpeed;
    this.maxForce = params.maxForce;
    this.proximityRadius = params.proximityRadius;
    this.interactionTimer = {};
    
    // Initialize colors based on type and truth/lie framework
    if (type === AGENT_TYPE.HONEST) {
      // Honest agents start with truthful beliefs (greenish)
      this.color = color(random(50, 100), random(150, 255), random(50, 100));
    } else if (type === AGENT_TYPE.LIAR) {
      // Liars start with lie beliefs (reddish) 
      this.color = color(random(150, 255), random(50, 100), random(50, 100));
    } else if (type === AGENT_TYPE.STUBBORN) {
      // Stubborn are extremists - either extreme truth or extreme lies
      let isExtremeTruth = random() > 0.5;
      if (isExtremeTruth) {
        this.color = color(30, 255, 30); // Extreme truth (bright green)
      } else {
        this.color = color(255, 30, 30); // Extreme lies (bright red)
      }
      this.fixedColor = this.color;
    }
    
    this.fitness = 0;
    this.beliefStrength = random(0.5, 1.0);
    this.generation = 0; // Track which generation this agent belongs to
  }

  update() {
    this.vel.add(this.acc).limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Wrap around edges
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;

    // Update agent type based on current belief:
    // - Truth (more green) → HONEST
    // - Lie (more red) → LIAR
    // Stubborn agents keep their special type.
    if (this.type !== AGENT_TYPE.STUBBORN) {
      const r = red(this.color);
      const g = green(this.color);
      const epsilon = 5; // small buffer to avoid rapid flipping on noise

      if (g > r + epsilon) {
        this.type = AGENT_TYPE.HONEST;
      } else if (r > g + epsilon) {
        this.type = AGENT_TYPE.LIAR;
      }
    }
  }

  flock(agents) {
    // Craig Reynolds style flocking:
    // - separation: avoid crowding neighbors
    // - alignment: steer toward average heading
    // - cohesion: move toward local center of mass
    //
    // Strength of each behavior is controlled by sliders in the SWARM CONFIG panel.

    const sep = this.separate(agents).mult(params.separationWeight);
    const ali = this.alignment(agents).mult(params.alignmentWeight);
    const coh = this.cohesion(agents).mult(params.cohesionWeight);

    this.acc.add(sep);
    this.acc.add(ali);
    this.acc.add(coh);
  }

  separate(agents) {
    const desiredSeparation = 25;
    let steer = createVector(0, 0);
    let count = 0;
    
    for (let o of agents) {
      let d = p5.Vector.dist(this.pos, o.pos);
      if (d > 0 && d < desiredSeparation) {
        steer.add(p5.Vector.sub(this.pos, o.pos).normalize().div(d));
        count++;
      }
    }
    
    if (count > 0) {
      steer.div(count).normalize().mult(this.maxSpeed).sub(this.vel).limit(this.maxForce);
    }
    return steer;
  }

  // Steer toward the average heading of local neighbors
  alignment(agents) {
    const neighborDist = this.proximityRadius;
    let sum = createVector(0, 0);
    let count = 0;

    for (let other of agents) {
      const d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.vel);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count).setMag(this.maxSpeed);
      const steer = p5.Vector.sub(sum, this.vel).limit(this.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }

  // Steer toward the center of mass of local neighbors
  cohesion(agents) {
    const neighborDist = this.proximityRadius;
    let sum = createVector(0, 0);
    let count = 0;

    for (let other of agents) {
      const d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.pos);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      // Seek towards this point
      let desired = p5.Vector.sub(sum, this.pos);
      desired.setMag(this.maxSpeed);
      const steer = p5.Vector.sub(desired, this.vel).limit(this.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }

  interact(agents) {
    let ids = [];
    if (this.type === AGENT_TYPE.STUBBORN) return ids;
    
    for (let o of agents) {
      if (o === this) continue;
      let d = p5.Vector.dist(this.pos, o.pos);
      
      if (d < params.proximityRadius) {
        ids.push(o.id);
        stroke(this.color); strokeWeight(0.5);
        line(this.pos.x, this.pos.y, o.pos.x, o.pos.y);
        
        let idx = agents.indexOf(o);
        this.interactionTimer[idx] = (this.interactionTimer[idx] || 0) + 1;
        
        if (this.interactionTimer[idx] > params.interactionTime) {
          this.communicate(o);
          this.interactionTimer[idx] = 0;
        }
      }
    }
    return ids;
  }
  
  communicate(other) {
    // Calculate resistance based on type
    let blendAmount = 0.08; // Base learning rate
    
    if (this.type === AGENT_TYPE.STUBBORN) {
      blendAmount = 0.01; // 8x more resistant to change
    } else if (this.type === AGENT_TYPE.HONEST || this.type === AGENT_TYPE.LIAR) {
      blendAmount = 0.08; // Normal learning rate
    }
    
    // Evolution system interaction handling
    if (evolutionSystem && typeof evolutionSystem.processInteraction === 'function') {
      evolutionSystem.processInteraction(this, other);
    } else {
      // Default behavior: receive what other transmits and blend it into your belief
      let transmittedColor = other.getTransmittedColor();
      
      // If other is a liar, you receive the LIE (inverted color)
      // You believe it and it changes your color
      // Then you will transmit based on YOUR type:
      // - If you're honest: you transmit your new (lie-infected) color honestly
      // - If you're a liar: you transmit your belief inverted (lie about your lie)
      this.color = lerpColor(this.color, transmittedColor, blendAmount);
    }
  }
  
  getTransmittedColor() {
    // All agents transmit the belief they currently hold:
    // - Truth believers: green-ish colors
    // - Lie believers: red-ish colors
    return this.color;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading() + PI/2);
    fill(this.color);
    stroke(255, 100);
    
    if (this.type === AGENT_TYPE.LIAR) {
      triangle(0, -this.r*1.5, -this.r, this.r, this.r, this.r);
    } else if (this.type === AGENT_TYPE.STUBBORN) {
      rectMode(CENTER);
      rect(0, 0, this.r*2, this.r*2);
    } else {
      ellipse(0, 0, this.r*2, this.r*2);
    }
    pop();
    
    // Display generation number above agent (only in genetic or hybrid modes)
    if ((evolutionMode === 'genetic' || evolutionMode === 'hybrid') && 
        this.generation !== undefined && this.generation !== null) {
      push();
      // Draw background circle for better visibility
      fill(0, 150);
      noStroke();
      ellipse(this.pos.x, this.pos.y - this.r - 10, 16, 16);
      // Draw generation number
      fill(255, 255);
      textAlign(CENTER, CENTER);
      textSize(12);
      textStyle(BOLD);
      text(this.generation, this.pos.x, this.pos.y - this.r - 10);
      pop();
    }
    
    if (selectedAgent === this) {
      noFill(); stroke(255, 255, 0); strokeWeight(2);
      ellipse(this.pos.x, this.pos.y, 30, 30);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

