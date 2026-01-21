// Cultural Evolution Module


class CulturalEvolution {
  constructor() {
    this.enabled = true;
    this.beliefDecayRate = 0.002; // Beliefs slowly decay
    this.socialLearningRate = 0.1; // How fast agents learn from successful neighbors
  }
  
  // Initialize cultural properties for agent
  initializeAgent(agent) {
    agent.beliefStrength = random(0.3, 1.0); // Conviction in current belief
    agent.culturalMemory = []; // Remember recent successful interactions
    agent.conversionCount = 0; // Track belief changes
    agent.originalColor = agent.color; // Remember starting belief
  }
  
  // Update agent beliefs each frame
  update(agent, agents) {
    if (!this.enabled) return;
    
    // Ensure agent has cultural properties
    if (agent.beliefStrength === undefined) {
      this.initializeAgent(agent);
    }
    
    // Natural belief decay over time
    agent.beliefStrength *= (1 - this.beliefDecayRate);
    agent.beliefStrength = constrain(agent.beliefStrength, 0.1, 1.0);
    
    // observe successful neighbors
    this.socialLearning(agent, agents);
    
    // Learn behaviors from peers
    if (frameCount % 120 === 0) {
      this.culturalConversion(agent, agents);
    }
  }
  
  // Process interaction (wrapper for transmit)
  processInteraction(agent1, agent2) {
    return this.transmit(agent1, agent2);
  }
  
  // Process cultural transmission between agents
  transmit(sender, receiver) {
    if (!this.enabled) return;
    
    // Ensure both have cultural properties
    if (sender.beliefStrength === undefined) this.initializeAgent(sender);
    if (receiver.beliefStrength === undefined) this.initializeAgent(receiver);
    
    // Calculate persuasion strength
    let persuasion = sender.beliefStrength;
    let resistance = receiver.beliefStrength;
    
    // Stubborn agents are 10x more resistant
    if (receiver.type === AGENT_TYPE.STUBBORN) {
      resistance *= 10;
    }
    
    // Apply genome traits if available
    if (sender.genome) {
      persuasion *= sender.genome.influenceStrength;
    }
    if (receiver.genome) {
      resistance *= receiver.genome.stubbornness;
      // Trust threshold affects receptiveness
      if (sender.genome && sender.genome.honestyLevel < receiver.genome.trustThreshold) {
        resistance *= 1.5; 
      }
    }
    
    // Calculate belief transfer - stubborn will have much lower transferStrength
    const transferStrength = persuasion / (persuasion + resistance);
    
    // Transfer belief (color) - receiver gets what sender transmits
    const oldColor = receiver.color;
    const transmittedColor = sender.getTransmittedColor();
    
    receiver.color = lerpColor(
      color(receiver.color),
      color(transmittedColor),
      transferStrength * 0.3
    );
    
    // Update belief strengths
    if (transferStrength > 0.5) {
      // Successful persuasion
      sender.beliefStrength = constrain(sender.beliefStrength + 0.05, 0, 1);
      receiver.beliefStrength *= 0.8; // Receiver's belief weakened
      
      
      sender.culturalMemory.push({
        target: receiver,
        success: true,
        strength: transferStrength
      });
    } else {
      
      receiver.beliefStrength = constrain(receiver.beliefStrength + 0.02, 0, 1);
    }
    
    // Manage memory size
    if (sender.culturalMemory.length > 20) {
      sender.culturalMemory.shift();
    }
    
  
    if (this.colorDistance(oldColor, receiver.color) > 50) {
      receiver.conversionCount++;
    }
    
    return transferStrength;
  }
  
  // Social learning: copy strategies of successful neighbors
  socialLearning(agent, agents) {
    if (!agent.genome) return; // Only works with genome
    
    // Find nearby successful agents
    const neighbors = agents.filter(other => {
      if (other === agent) return false;
      const d = p5.Vector.dist(agent.pos, other.pos);
      return d < agent.proximityRadius * 2;
    });
    
    if (neighbors.length === 0) return;
    
    // Find most successful neighbor (highest belief strength)
    let bestNeighbor = null;
    let bestStrength = agent.beliefStrength;
    
    for (let neighbor of neighbors) {
      if (neighbor.beliefStrength && neighbor.beliefStrength > bestStrength) {
        bestStrength = neighbor.beliefStrength;
        bestNeighbor = neighbor;
      }
    }
    
    // Learn from best neighbor
    if (bestNeighbor && bestNeighbor.genome) {
      // Slightly adjust genome towards successful neighbor
      for (let key in agent.genome) {
        agent.genome[key] = lerp(
          agent.genome[key],
          bestNeighbor.genome[key],
          this.socialLearningRate * 0.01 // Very gradual learning
        );
      }
    }
  }
  
  // Cultural type conversion through peer influence
  culturalConversion(agent, agents) {
    if (!this.enabled || !agent || !agent.pos) return;
    
    // Don't convert stubborn agents easily
    if (agent.type === AGENT_TYPE.STUBBORN && agent.beliefStrength > 0.7) return;
    
    // Count nearby agent types
    let nearby = { honest: 0, liar: 0, stubborn: 0, total: 0 };
    
    for (let other of agents) {
      if (!other || other === agent || !other.pos) continue;
      
      let dx = other.pos.x - agent.pos.x;
      let dy = other.pos.y - agent.pos.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      
      if (d < 80) {
        if (other.type === AGENT_TYPE.HONEST) nearby.honest++;
        else if (other.type === AGENT_TYPE.LIAR) nearby.liar++;
        else if (other.type === AGENT_TYPE.STUBBORN) nearby.stubborn++;
        nearby.total++;
      }
    }
    
    if (nearby.total < 3) return;
    
    // If strongly surrounded by one type, consider conversion
    let dominantType = null;
    let dominantCount = 0;
    
    if (nearby.honest > dominantCount) { dominantType = AGENT_TYPE.HONEST; dominantCount = nearby.honest; }
    if (nearby.liar > dominantCount) { dominantType = AGENT_TYPE.LIAR; dominantCount = nearby.liar; }
    if (nearby.stubborn > dominantCount) { dominantType = AGENT_TYPE.STUBBORN; dominantCount = nearby.stubborn; }
    
    // Convert if surrounded by 60%+ of one type and agent has low belief strength
    if (dominantCount / nearby.total > 0.6 && agent.beliefStrength < 0.4 && agent.type !== dominantType) {
      agent.type = dominantType;
      agent.conversionCount++;
      
      // Update belief strength
      agent.beliefStrength = random(0.3, 0.6);
      
      // Update fixed color for stubborn
      if (agent.type === AGENT_TYPE.STUBBORN && agent.color) {
        agent.fixedColor = agent.color;
      }
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
