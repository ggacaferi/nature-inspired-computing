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

// Simulation Control
let speedMultiplier = 1;
let isSimulationRunning = true;
let frameCounter = 0;

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
 
  panels.controls = createPanel('SIMULATION CONTROL', windowWidth - 320, 20, '280px');
  buildControlsUI(panels.controls.content);
 
  panels.inspector = createPanel('AGENT INSPECTOR', windowWidth - 280, 320, '240px');
 
  panels.stats = createPanel('LIVE POPULATION STATS', 20, windowHeight - 180, '220px');

  panels.chart = createPanel('POPULATION DYNAMICS', windowWidth - 450, windowHeight - 480, '430px', '460px');
  buildChartUI(panels.chart.content);

  initializeAgents();
}

function draw() {
  background(10);
  
  // Handle simulation pausing
  if (!isSimulationRunning) {
    // Display last frame without updating
    for (let agent of agents) {
      agent.display();
    }
    
    // Allow agent selection even when paused
    handleAgentSelection();
    
    // Display paused indicator
    fill(255, 0, 0); 
    textSize(16);
    textAlign(CENTER);
    text('⏸ PAUSED', width / 2, 40);
    updateInspectorUI();
    updateStatsUI();
    return;
  }
  
  // Handle speed control
  if (speedMultiplier < 1) {
    // For slowdown: only update on certain frames
    frameCounter++;
    const skipFrames = Math.ceil(1 / speedMultiplier);
    if (frameCounter % skipFrames === 0) {
      // Update simulation only on selected frames
      updateSimulation();
    } else {
      // On skipped frames, just display current state
      for (let agent of agents) {
        agent.display();
      }
      handleAgentSelection();
    }
  } else if (speedMultiplier > 1) {
    // For speedup: process simulation multiple times per frame
    const iterations = Math.floor(speedMultiplier);
    for (let i = 0; i < iterations; i++) {
      updateSimulation();
    }
    // Handle fractional speedup (e.g., 1.5x)
    if (speedMultiplier % 1 !== 0) {
      frameCounter++;
      if (frameCounter % 2 === 0) {
        updateSimulation();
      }
    }
  } else {
    // Normal speed (1x)
    updateSimulation();
  }

  // Update dynamic UI contents
  updateInspectorUI();
  updateStatsUI();
  updateChartUI();
}

function handleAgentSelection() {
  // Allow agent selection by clicking on them
  if (mouseIsPressed) {
    for (let agent of agents) {
      if (dist(mouseX, mouseY, agent.pos.x, agent.pos.y) < 20) {
        selectedAgent = agent;
        break;
      }
    }
  }
}

function updateSimulation() {
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
  }
  

  if (evolutionSystem && typeof evolutionSystem.evolvePopulation === 'function') {
    const evolvedAgents = evolutionSystem.evolvePopulation(agents);
    if (Array.isArray(evolvedAgents) && evolvedAgents !== agents) {
      agents = evolvedAgents;
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
  
  // Handle agent selection
  handleAgentSelection();
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
  // The selector for evoultion modes 
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

  // Flocking Settings 
  createSliderWithInput('separationWeight', 'Separation', 0, 3, params.separationWeight, parent);
  createSliderWithInput('alignmentWeight', 'Alignment', 0, 3, params.alignmentWeight, parent);
  createSliderWithInput('cohesionWeight', 'Cohesion', 0, 3, params.cohesionWeight, parent);

  let resetBtn = createButton('RESET SYSTEM').parent(parent).class('action-btn reset');
  resetBtn.mousePressed(() => { 
    history = []; 
    if (evolutionSystem && typeof evolutionSystem.reset === 'function') {
      evolutionSystem.reset();
    }
    initializeAgents(); 
  });

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

function buildControlsUI(parent) {
  // Stop/Resume Button
  let stopBtn = createButton('⏸ STOP SIM').parent(parent).class('action-btn stop').style('margin-top', '0px');
  stopBtn.mousePressed(() => {
    isSimulationRunning = !isSimulationRunning;
    stopBtn.html(isSimulationRunning ? '⏸ STOP SIM' : '▶ RESUME SIM');
    stopBtn.elt.classList.toggle('paused', !isSimulationRunning);
  });

  // Speed control menu
  let speedLabel = createP('PLAYBACK SPEED:').parent(parent).style('margin', '15px 0 10px 0').style('font-size', '11px').style('opacity', '0.9').style('font-weight', 'bold').style('color', '#4CAF50');
  
  let speedContainer = createDiv().parent(parent).style('display', 'grid').style('grid-template-columns', '1fr 1fr').style('gap', '6px');
  
  const speedOptions = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
    { label: '5x', value: 5 }
  ];
  
  speedOptions.forEach(opt => {
    let btn = createButton(opt.label).parent(speedContainer).class('speed-btn').style('width', '100%');
    if (opt.value === 1) btn.class('speed-btn active');
    
    btn.mousePressed(() => {
      speedMultiplier = opt.value;
      let allSpeedBtns = speedContainer.elt.querySelectorAll('.speed-btn');
      allSpeedBtns.forEach(b => b.classList.remove('active'));
      btn.elt.classList.add('active');
    });
  });
}

function updateHistory() {
  if (frameCount % 5 === 0) {
    history.push({ h: stats.honest, l: stats.liars, s: stats.stubborn });
    if (history.length > maxHistory) history.shift();
  }
}

function updateInspectorUI() {
  if (panels.inspector.content.style('display') === 'none') return;
  let content = panels.inspector.content;
  if (!selectedAgent) { content.html('<p style="opacity:0.5">Click an agent</p>'); return; }
  let typeStr = ["Honest", "Liar", "Stubborn"][selectedAgent.type];
  let genomeInfo = '';
  let fitnessInfo = '';
  let conversionInfo = '';
  
  // Genome info (Genetic mode)
  if (selectedAgent.genome) {
    genomeInfo = `<p style="font-size:10px; margin-top:8px; opacity:0.7">Genome: H:${selectedAgent.genome.honestyLevel.toFixed(2)} S:${selectedAgent.genome.stubbornness.toFixed(2)}</p>`;
  }
  
  // Fitness info (Game Theory & Genetic modes)
  if (selectedAgent.fitness !== undefined) {
    fitnessInfo = `<p style="font-size:10px; margin-top:6px; opacity:0.8">Fitness: <b style="color:#FFD700">${selectedAgent.fitness.toFixed(2)}</b></p>`;
  }
  
  // Conversions info (Cultural mode)
  if (selectedAgent.conversionCount !== undefined) {
    conversionInfo = `<p style="font-size:10px; margin-top:6px; opacity:0.8">Mind Changes: <b style="color:#FF9800">${selectedAgent.conversionCount}</b></p>`;
  }
  
  content.html(`
    <p>ID: <b>${selectedAgent.id}</b></p>
    <p>State: <b style="color:${selectedAgent.type === 1 ? '#ff3232' : selectedAgent.type === 0 ? '#32ff64' : '#cccccc'}">${typeStr}</b></p>
    <div style="display:flex; align-items:center; margin-top:5px;">
      <span>Belief: </span>
      <div style="width:60px; height:15px; background:rgb(${red(selectedAgent.color)},${green(selectedAgent.color)},${blue(selectedAgent.color)}); margin-left:10px; border:1px solid #444;"></div>
    </div>
    ${fitnessInfo}
    ${conversionInfo}
    ${genomeInfo}
  `);
}

function buildChartUI(parent) {
  // Create canvas for the chart (increased size with margins for labels)
  let chartCanvas = createGraphics(390, 400);
  parent.elt.appendChild(chartCanvas.elt);
  chartCanvas.elt.id = 'populationChart';
  chartCanvas.elt.style.borderRadius = '8px';
  chartCanvas.elt.style.marginTop = '4px';
  chartCanvas.elt.style.display = 'block';
  chartCanvas.elt.style.width = '100%';
  chartCanvas.elt.style.height = 'auto';
  
  // Store canvas reference
  panels.chart.canvas = chartCanvas;
  
  // Initial draw
  chartCanvas.background(15, 15, 20);
  chartCanvas.fill(255, 255, 255, 100);
  chartCanvas.textAlign(CENTER, CENTER);
  chartCanvas.textSize(12);
  chartCanvas.text('Collecting data...', chartCanvas.width/2, chartCanvas.height/2);
}

function updateChartUI() {
  if (!panels.chart || panels.chart.content.style('display') === 'none') return;
  if (!panels.chart.canvas) return;
  
  let canvas = panels.chart.canvas;
  let w = canvas.width;
  let h = canvas.height;
  
  // Dark background
  canvas.background(15, 15, 20);
  
  // If not enough data yet, show message
  if (history.length < 1) {
    canvas.fill(255, 255, 255, 100);
    canvas.textAlign(CENTER, CENTER);
    canvas.textSize(12);
    canvas.text('Collecting data...', w/2, h/2);
    return;
  }
  
  // Define margins for labels
  let leftMargin = 35;
  let topMargin = 35;
  let rightMargin = 10;
  let bottomMargin = 20;
  
  // Calculate chart area
  let chartX = leftMargin;
  let chartY = topMargin;
  let chartW = w - leftMargin - rightMargin;
  let chartH = h - topMargin - bottomMargin;
  
  // Calculate max value for scaling
  let maxVal = params.numAgents;
  
  // Enable clipping to chart area only
  canvas.push();
  canvas.drawingContext.save();
  canvas.drawingContext.beginPath();
  canvas.drawingContext.rect(chartX, chartY, chartW, chartH);
  canvas.drawingContext.clip();
  
  // Draw stacked area chart
  canvas.noStroke();
  
  // Draw from back to front: stubborn -> honest -> liars
  // Each layer stacks on top of previous ones
  
  let xScale = chartW / (maxHistory - 1);
  let yScale = chartH / maxVal;
  
  // Layer 1: Stubborn (gray background)
  canvas.fill(120, 120, 130, 220);
  canvas.beginShape();
  canvas.vertex(chartX, chartY + chartH);
  
  // Add first point twice for smooth curve start
  if (history.length > 0) {
    let x0 = chartX;
    let stubbornHeight0 = history[0].s * yScale;
    let honestHeight0 = history[0].h * yScale;
    let liarsHeight0 = history[0].l * yScale;
    let y0 = chartY + chartH - stubbornHeight0 - honestHeight0 - liarsHeight0;
    canvas.curveVertex(x0, y0);
  }
  
  for (let i = 0; i < history.length; i++) {
    let x = chartX + i * xScale;
    let stubbornHeight = history[i].s * yScale;
    let honestHeight = history[i].h * yScale;
    let liarsHeight = history[i].l * yScale;
    let y = chartY + chartH - stubbornHeight - honestHeight - liarsHeight;
    canvas.curveVertex(x, y);
  }
  
  // Add last point twice for smooth curve end
  if (history.length > 0) {
    let lastIdx = history.length - 1;
    let xLast = chartX + lastIdx * xScale;
    let stubbornHeightLast = history[lastIdx].s * yScale;
    let honestHeightLast = history[lastIdx].h * yScale;
    let liarsHeightLast = history[lastIdx].l * yScale;
    let yLast = chartY + chartH - stubbornHeightLast - honestHeightLast - liarsHeightLast;
    canvas.curveVertex(xLast, yLast);
  }
  
  canvas.vertex(chartX + (history.length - 1) * xScale, chartY + chartH);
  canvas.endShape(CLOSE);
  
  // Layer 2: Honest (green area)
  canvas.fill(50, 255, 100, 220);
  canvas.beginShape();
  canvas.vertex(chartX, chartY + chartH);
  
  // Add first point twice for smooth curve start
  if (history.length > 0) {
    let x0 = chartX;
    let honestHeight0 = history[0].h * yScale;
    let liarsHeight0 = history[0].l * yScale;
    let y0 = chartY + chartH - honestHeight0 - liarsHeight0;
    canvas.curveVertex(x0, y0);
  }
  
  for (let i = 0; i < history.length; i++) {
    let x = chartX + i * xScale;
    let honestHeight = history[i].h * yScale;
    let liarsHeight = history[i].l * yScale;
    let y = chartY + chartH - honestHeight - liarsHeight;
    canvas.curveVertex(x, y);
  }
  
  // Add last point twice for smooth curve end
  if (history.length > 0) {
    let lastIdx = history.length - 1;
    let xLast = chartX + lastIdx * xScale;
    let honestHeightLast = history[lastIdx].h * yScale;
    let liarsHeightLast = history[lastIdx].l * yScale;
    let yLast = chartY + chartH - honestHeightLast - liarsHeightLast;
    canvas.curveVertex(xLast, yLast);
  }
  
  canvas.vertex(chartX + (history.length - 1) * xScale, chartY + chartH);
  canvas.endShape(CLOSE);
  
  // Layer 3: Liars (red foreground)
  canvas.fill(255, 50, 50, 220);
  canvas.beginShape();
  canvas.vertex(chartX, chartY + chartH);
  
  // Add first point twice for smooth curve start
  if (history.length > 0) {
    let x0 = chartX;
    let liarsHeight0 = history[0].l * yScale;
    let y0 = chartY + chartH - liarsHeight0;
    canvas.curveVertex(x0, y0);
  }
  
  for (let i = 0; i < history.length; i++) {
    let x = chartX + i * xScale;
    let liarsHeight = history[i].l * yScale;
    let y = chartY + chartH - liarsHeight;
    canvas.curveVertex(x, y);
  }
  
  // Add last point twice for smooth curve end
  if (history.length > 0) {
    let lastIdx = history.length - 1;
    let xLast = chartX + lastIdx * xScale;
    let liarsHeightLast = history[lastIdx].l * yScale;
    let yLast = chartY + chartH - liarsHeightLast;
    canvas.curveVertex(xLast, yLast);
  }
  
  canvas.vertex(chartX + (history.length - 1) * xScale, chartY + chartH);
  canvas.endShape(CLOSE);
  
  // Restore clipping
  canvas.drawingContext.restore();
  canvas.pop();
  
  // Draw border around chart
  canvas.noFill();
  canvas.stroke(255, 255, 255, 40);
  canvas.strokeWeight(1);
  canvas.rect(chartX, chartY, chartW, chartH);
  
  // Draw horizontal grid lines (more lines for taller chart)
  canvas.stroke(255, 255, 255, 30);
  canvas.strokeWeight(1);
  for (let i = 0; i <= 8; i++) {
    let y = chartY + (chartH / 8) * i;
    canvas.line(chartX, y, chartX + chartW, y);
  }
  
  // Draw axis labels on left (whole numbers)
  canvas.noStroke();
  canvas.fill(255, 255, 255, 200);
  canvas.textAlign(RIGHT, CENTER);
  canvas.textSize(11);
  for (let i = 0; i <= 8; i++) {
    let val = Math.round(maxVal - (maxVal / 8) * i);
    let y = chartY + (chartH / 8) * i;
    canvas.text(val, chartX - 8, y);
  }
  
  // Draw legend at the top
  let legendX = chartX + 10;
  let legendY = 10;
  let legendSpacing = 90;
  
  // Stubborn
  canvas.noStroke();
  canvas.fill(120, 120, 130);
  canvas.rect(legendX, legendY, 14, 14, 2);
  canvas.fill(255, 255, 255, 220);
  canvas.textAlign(LEFT, CENTER);
  canvas.textSize(10);
  canvas.text('Stubborn', legendX + 18, legendY + 7);
  
  // Honest
  legendX += legendSpacing;
  canvas.fill(50, 255, 100);
  canvas.rect(legendX, legendY, 14, 14, 2);
  canvas.fill(255, 255, 255, 220);
  canvas.text('Honest', legendX + 18, legendY + 7);
  
  // Liars
  legendX += legendSpacing;
  canvas.fill(255, 50, 50);
  canvas.rect(legendX, legendY, 14, 14, 2);
  canvas.fill(255, 255, 255, 220);
  canvas.text('Liars', legendX + 18, legendY + 7);
}

function updateStatsUI() {
  if (panels.stats.content.style('display') === 'none') return;
  
  // Calculate Truth vs Lies balance
  let truthCount = 0;
  let lieCount = 0;
  for (let agent of agents) {
    if (green(agent.color) > red(agent.color)) truthCount++;
    else lieCount++;
  }
  let total = truthCount + lieCount;
  let truthRatio = total > 0 ? (truthCount / total * 100).toFixed(0) : 50;
  let lieRatio = total > 0 ? (lieCount / total * 100).toFixed(0) : 50;

  panels.stats.content.html(`
    <p style="display:flex; align-items:center; gap:10px; color:#32ff64; font-weight:bold; margin:6px 0;">
      <svg width="16" height="16" viewBox="0 0 16 16" style="flex-shrink: 0;">
        <circle cx="8" cy="8" r="6" fill="#32ff64" stroke="#ffffff" stroke-width="1"/>
        <circle cx="8" cy="8" r="3.6" fill="white"/>
      </svg>
      HONEST: ${stats.honest}
    </p>
    <p style="display:flex; align-items:center; gap:10px; color:#ff3232; font-weight:bold; margin:6px 0;">
      <svg width="16" height="16" viewBox="0 0 16 16" style="flex-shrink: 0;">
        <polygon points="8,0 10,6 16,6 11,10 13,16 8,12 3,16 5,10 0,6 6,6" fill="#ff3232" stroke="#ffffff" stroke-width="0.5"/>
      </svg>
      LIARS: ${stats.liars}
    </p>
    <p style="display:flex; align-items:center; gap:10px; color:#cccccc; font-weight:bold; margin:6px 0;">
      <svg width="16" height="16" viewBox="0 0 16 16" style="flex-shrink: 0;">
        <rect x="3" y="3" width="10" height="10" fill="#cccccc" stroke="#ffffff" stroke-width="1.5"/>
      </svg>
      STUBBORN: ${stats.stubborn}
    </p>

    <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.15);">
      <p style="opacity:0.8; margin-bottom:5px; font-size:11px;">Truth vs Lies Balance:</p>
      <div style="display:flex; gap:4px; height:12px; margin-bottom:5px;">
        <div style="flex:${truthRatio}; background:#4CAF50; border-radius:2px;"></div>
        <div style="flex:${lieRatio}; background:#F44336; border-radius:2px;"></div>
      </div>
      <p style="font-size:9px; opacity:0.6;">
        ${truthRatio}% truth / ${lieRatio}% lies
      </p>
    </div>
  `);
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
    strokeWeight(1.5);
    
    if (this.type === AGENT_TYPE.HONEST) {
      // Honest: Perfect circle with centered dot (peace, balance, trustworthiness)
      ellipse(0, 0, this.r*2, this.r*2);
      fill(255);
      noStroke();
      ellipse(0, 0, this.r*0.6, this.r*0.6);
    } else if (this.type === AGENT_TYPE.LIAR) {
      // Liars: Jagged star (chaotic, unpredictable, deceptive)
      this.drawJaggedStar(this.r);
    } else if (this.type === AGENT_TYPE.STUBBORN) {
      // Stubborn: Thick rectangle with emphasized corners (rigid, immovable)
      rectMode(CENTER);
      stroke(255, 150);
      strokeWeight(2.5);
      rect(0, 0, this.r*2.2, this.r*2.2);
      // Add corner emphasis
      noFill();
      stroke(255, 80);
      strokeWeight(1);
      for (let i = -1; i <= 1; i += 2) {
        for (let j = -1; j <= 1; j += 2) {
          point(i * this.r*1.2, j * this.r*1.2);
        }
      }
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

  drawJaggedStar(r) {
    // Draw jagged star with irregular points for liars
    let points = 7; // Odd number for asymmetry
    let innerRadius = r * 0.4;
    let outerRadius = r * 1.3;
    
    beginShape();
    for (let i = 0; i < points * 2; i++) {
      let angle = TWO_PI / (points * 2) * i;
      let radius = i % 2 === 0 ? outerRadius : innerRadius;
      // Add slight randomness to outer points for "jagged" effect
      let randomOffset = i % 2 === 0 ? random(-r*0.15, r*0.15) : 0;
      let x = cos(angle) * (radius + randomOffset);
      let y = sin(angle) * (radius + randomOffset);
      vertex(x, y);
    }
    endShape(CLOSE);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

