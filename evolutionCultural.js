// Cultural Evolution Module
// Implements belief dynamics and memetic transmission
// Uses same genome-based logic as base mode for beliefs/types

class CulturalEvolution {
  constructor() {
    this.enabled = true;
    this.beliefDecayRate = 0.002; // Beliefs slowly decay
    this.socialLearningRate = 0.1; // How fast agents learn from successful neighbors
  }
  
  // Initialize genome AND cultural properties for agent
  initializeAgent(agent) {
    // First, initialize genome (same as genetic evolution)
    agent.genome = {
      honestyLevel: random(0, 1),
      stubbornness: random(0, 1),
      influenceStrength: random(0, 1),
      trustThreshold: random(0, 1)
    };
    agent.fitness = 0;
    agent.age = 0;
    
    // Apply genome to determine initial belief color and type
    this.applyGenomeToState(agent);
    
    // Add cultural-specific properties
    agent.beliefStrength = random(0.3, 1.0); // Conviction in current belief
    agent.culturalMemory = []; // Remember recent successful interactions
    agent.conversionCount = 0; // Track belief changes
    agent.originalColor = agent.color; // Remember starting belief
  }
  
  // Apply genome to agent's state (color/type/behavior) - same as genetic evolution
  applyGenomeToState(agent) {
    if (!agent.genome) return;

    // honestyLevel → belief color (truth green, lie red)
    const truthColor = color(60, 220, 60);
    const lieColor = color(220, 60, 60);
    agent.color = lerpColor(lieColor, truthColor, agent.genome.honestyLevel);

    // High stubbornness → born stubborn (locks type)
    if (agent.genome.stubbornness > 0.8) {
      agent.type = AGENT_TYPE.STUBBORN;
      agent.fixedColor = agent.color;
    }

    // Apply genome to behavior
    this.applyGenomeToBehavior(agent);
  }
  
  // Apply genome traits to agent behavior
  applyGenomeToBehavior(agent) {
    if (!agent.genome) return;
    // Stubbornness affects learning rate and belief strength
    agent.learningRate = 0.3 * (1 - agent.genome.stubbornness);
    agent.beliefStrength = agent.genome.stubbornness;
  }
  
  // Update agent beliefs each frame
  update(agent, agents) {
    if (!this.enabled) return;
    
    // Ensure agent has genome and cultural properties
    if (!agent.genome) {
      this.initializeAgent(agent);
    }
    
    agent.age++;
    
    // Apply genome to behavior each frame
    this.applyGenomeToBehavior(agent);
    
    // Natural belief decay over time
    if (agent.beliefStrength !== undefined) {
      agent.beliefStrength *= (1 - this.beliefDecayRate);
      agent.beliefStrength = constrain(agent.beliefStrength, 0.1, 1.0);
    }
    
    // Social learning: observe successful neighbors
    this.socialLearning(agent, agents);
  }
  
  // Process interaction (wrapper for transmit)
  processInteraction(agent1, agent2) {
    if (!this.enabled) return;
    
    // Calculate learning rate based on type and genome (same as genetic evolution)
    let rate = 0.3; // Default for honest and liars
    
    if (agent1.type === AGENT_TYPE.STUBBORN) {
      rate = 0.05; // Stubborn are 6x more resistant, but can still change slowly
    } else if (agent1.learningRate !== undefined) {
      rate = agent1.learningRate; // Use genome-based rate if available
    }
    
    // Agent1 receives what agent2 transmits (same as genetic evolution)
    let transmittedColor = agent2.getTransmittedColor();
    agent1.color = lerpColor(color(agent1.color), color(transmittedColor), rate);
    
    // Cultural-specific: track persuasion success
    const colorChange = this.colorDistance(color(agent1.color), color(transmittedColor));
    if (colorChange < 50) {
      // Successful persuasion - update belief strengths
      if (agent2.beliefStrength !== undefined) {
        agent2.beliefStrength = constrain(agent2.beliefStrength + 0.05, 0, 1);
      }
      if (agent1.beliefStrength !== undefined) {
        agent1.beliefStrength *= 0.8; // Receiver's belief weakened
      }
      
      // Record in cultural memory
      if (agent2.culturalMemory) {
        agent2.culturalMemory.push({
          target: agent1,
          success: true,
          strength: rate
        });
        if (agent2.culturalMemory.length > 20) {
          agent2.culturalMemory.shift();
        }
      }
      
      if (agent1.conversionCount !== undefined) {
        agent1.conversionCount++;
      }
    }
    
    // Add fitness for successful interactions
    agent1.fitness += 0.1;
    agent2.fitness += 0.1;
  }
  
  // Social learning: copy strategies of successful neighbors (cultural mechanism)
  socialLearning(agent, agents) {
    if (!agent.genome) return; // Only works with genome
    
    // Find nearby successful agents
    const neighbors = agents.filter(other => {
      if (other === agent) return false;
      const d = p5.Vector.dist(agent.pos, other.pos);
      return d < agent.proximityRadius * 2;
    });
    
    if (neighbors.length === 0) return;
    
    // Find most successful neighbor (highest fitness)
    let bestNeighbor = null;
    let bestFitness = agent.fitness;
    
    for (let neighbor of neighbors) {
      if (neighbor.fitness > bestFitness) {
        bestFitness = neighbor.fitness;
        bestNeighbor = neighbor;
      }
    }
    
    // Learn from best neighbor (cultural transmission of successful traits)
    if (bestNeighbor && bestNeighbor.genome) {
      // Slightly adjust genome towards successful neighbor
      for (let key in agent.genome) {
        agent.genome[key] = lerp(
          agent.genome[key],
          bestNeighbor.genome[key],
          this.socialLearningRate * 0.01 // Very gradual learning
        );
      }
      
      // Update behavior based on new genome values
      this.applyGenomeToBehavior(agent);
    }
  }
  
  // Calculate color distance
  colorDistance(c1, c2) {
    const col1 = color(c1);
    const col2 = color(c2);
    
    const dr = red(col1) - red(col2);
    const dg = green(col1) - green(col2);
    const db = blue(col1) - blue(col2);
    
    return sqrt(dr * dr + dg * dg + db * db);
  }
  
  // Get population statistics
  getPopulationStats(agents) {
    let totalStrength = 0;
    let totalConversions = 0;
    let strongBeliefs = 0;
    
    for (let agent of agents) {
      if (agent.beliefStrength !== undefined) {
        totalStrength += agent.beliefStrength;
        if (agent.beliefStrength > 0.7) strongBeliefs++;
      }
      if (agent.conversionCount !== undefined) {
        totalConversions += agent.conversionCount;
      }
    }
    
    return {
      avgBeliefStrength: totalStrength / agents.length,
      totalConversions: totalConversions,
      strongBeliefs: strongBeliefs,
      beliefDiversity: this.calculateBeliefDiversity(agents)
    };
  }
  
  // Calculate belief diversity (color variance)
  calculateBeliefDiversity(agents) {
    if (agents.length < 2) return 0;
    
    // Sample color differences
    let totalDistance = 0;
    let samples = 0;
    
    for (let i = 0; i < min(50, agents.length); i++) {
      const a1 = random(agents);
      const a2 = random(agents);
      totalDistance += this.colorDistance(a1.color, a2.color);
      samples++;
    }
    
    return samples > 0 ? totalDistance / samples : 0;
  }
  
  // Get UI controls
  getControls(parent) {
    let container = createDiv();
    container.parent(parent);
    container.style('margin-top', '15px');
    container.style('border-top', '1px solid rgba(255,255,255,0.2)');
    container.style('padding-top', '10px');
    
    let title = createElement('h4', 'Cultural Evolution');
    title.parent(container);
    title.style('margin', '0 0 8px 0');
    title.style('font-size', '13px');
    title.style('color', '#FF9800');
    
    let info = createP(`
      <div style="font-size: 10px; line-height: 1.5;">
        <div>Avg Belief: <span id="avgBelief">0</span></div>
        <div>Strong Beliefs: <span id="strongBelief">0</span></div>
        <div>Conversions: <span id="conversions">0</span></div>
        <div>Diversity: <span id="diversity">0</span></div>
      </div>
    `);
    info.parent(container);
    info.style('margin', '5px 0');
    
    return container;
  }
  
  // Update UI
  updateUI(agents) {
    const stats = this.getPopulationStats(agents);
    
    const avgElem = select('#avgBelief');
    const strongElem = select('#strongBelief');
    const convElem = select('#conversions');
    const divElem = select('#diversity');
    
    if (avgElem) avgElem.html(stats.avgBeliefStrength.toFixed(2));
    if (strongElem) strongElem.html(stats.strongBeliefs);
    if (convElem) convElem.html(stats.totalConversions);
    if (divElem) divElem.html(stats.beliefDiversity.toFixed(1));
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CulturalEvolution;
}
