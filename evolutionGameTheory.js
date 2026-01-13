// Game Theory Evolution Module
// Implements payoff matrix and strategic interactions

class GameTheoryEvolution {
  constructor() {
    this.enabled = true;
    
    // Payoff matrix [agent1Type][agent2Type]
    this.payoffMatrix = {
      // Honest interactions
      honest_honest: { agent1: 3, agent2: 3 },    // Mutual cooperation
      honest_liar: { agent1: -2, agent2: 5 },     // Honest exploited
      honest_stubborn: { agent1: 1, agent2: 1 },  // Neutral
      
      // Liar interactions
      liar_honest: { agent1: 5, agent2: -2 },     // Liar exploits
      liar_liar: { agent1: -1, agent2: -1 },      // Mutual distrust
      liar_stubborn: { agent1: 0, agent2: 2 },    // Stubborn resists
      
      // Stubborn interactions
      stubborn_honest: { agent1: 1, agent2: 1 },  // Neutral
      stubborn_liar: { agent1: 2, agent2: 0 },    // Stubborn wins
      stubborn_stubborn: { agent1: 0, agent2: 0 } // Stalemate
    };
    
    this.interactionHistory = [];
  }
  
  // Initialize game theory properties for agent
  initializeAgent(agent) {
    agent.fitness = agent.fitness || 0;
    agent.payoffHistory = [];
    agent.strategyScore = 0;
    agent.interactionCount = 0;
  }
  
  // Process interaction between two agents
  processInteraction(agent1, agent2) {
    if (!this.enabled) return;
    
    // Ensure agents have game theory properties
    this.initializeAgent(agent1);
    this.initializeAgent(agent2);
    
    // Determine strategies based on genome or type
    const strategy1 = this.getStrategy(agent1);
    const strategy2 = this.getStrategy(agent2);
    
    // Get payoffs from matrix
    const payoffs = this.getPayoffs(strategy1, strategy2);
    
    // Apply payoffs
    agent1.fitness += payoffs.agent1;
    agent2.fitness += payoffs.agent2;
    
    agent1.strategyScore += payoffs.agent1;
    agent2.strategyScore += payoffs.agent2;
    
    agent1.interactionCount++;
    agent2.interactionCount++;
    
    // Record history
    agent1.payoffHistory.push(payoffs.agent1);
    agent2.payoffHistory.push(payoffs.agent2);
    
    // Keep history manageable
    if (agent1.payoffHistory.length > 50) agent1.payoffHistory.shift();
    if (agent2.payoffHistory.length > 50) agent2.payoffHistory.shift();
    
    // Handle color communication - stubborn agents are 10x more resistant
    let otherColor = agent2.getTransmittedColor();
    let rate;
    
    if (agent1.type === AGENT_TYPE.STUBBORN) {
      rate = 0.01; // Stubborn: highly resistant to belief change
    } else {
      rate = agent1.learningRate || 0.08; // Normal agents
    }
    
    agent1.color = lerpColor(color(agent1.color), color(otherColor), rate);
    
    return payoffs;
  }
  
  // Determine agent strategy
  getStrategy(agent) {
    // If agent has genome, use honesty level
    if (agent.genome) {
      if (agent.genome.honestyLevel < 0.33) return 'liar';
      if (agent.genome.honestyLevel > 0.66 && agent.genome.stubbornness > 0.7) return 'stubborn';
      return 'honest';
    }
    
    // Fall back to type
    switch (agent.type) {
      case AGENT_TYPE.LIAR: return 'liar';
      case AGENT_TYPE.STUBBORN: return 'stubborn';
      default: return 'honest';
    }
  }
  
  // Get payoffs from matrix
  getPayoffs(strategy1, strategy2) {
    const key = `${strategy1}_${strategy2}`;
    return this.payoffMatrix[key] || { agent1: 0, agent2: 0 };
  }
  
  // Calculate average payoff for agent
  getAveragePayoff(agent) {
    if (!agent.payoffHistory || agent.payoffHistory.length === 0) return 0;
    const sum = agent.payoffHistory.reduce((acc, val) => acc + val, 0);
    return sum / agent.payoffHistory.length;
  }
  
  // Get population statistics
  getPopulationStats(agents) {
    const strategies = { honest: 0, liar: 0, stubborn: 0 };
    const avgPayoffs = { honest: [], liar: [], stubborn: [] };
    
    for (let agent of agents) {
      const strategy = this.getStrategy(agent);
      strategies[strategy]++;
      
      const avgPayoff = this.getAveragePayoff(agent);
      if (avgPayoff !== 0) {
        avgPayoffs[strategy].push(avgPayoff);
      }
    }
    
    // Calculate average payoffs per strategy
    const stats = {
      counts: strategies,
      avgPayoffs: {
        honest: avgPayoffs.honest.length > 0 ? avgPayoffs.honest.reduce((a, b) => a + b, 0) / avgPayoffs.honest.length : 0,
        liar: avgPayoffs.liar.length > 0 ? avgPayoffs.liar.reduce((a, b) => a + b, 0) / avgPayoffs.liar.length : 0,
        stubborn: avgPayoffs.stubborn.length > 0 ? avgPayoffs.stubborn.reduce((a, b) => a + b, 0) / avgPayoffs.stubborn.length : 0
      }
    };
    
    return stats;
  }
  
  // Update agents each frame
  update(agent, agents) {
    if (!this.enabled) return;
    
    // This is called per-agent in the main loop
    // Fitness decay is applied to individual agents periodically
    if (frameCount % 60 === 0) {
      if (agent.fitness) {
        agent.fitness *= 0.99; // 1% decay per second
      }
    }
    
    // Strategic type switching based on payoffs (every 200 frames)
    if (frameCount % 200 === 0) {
      this.strategicAdaptation(agent, agents);
    }
  }
  
  // Strategic type switching based on fitness comparison
  strategicAdaptation(agent, agents) {
    if (!this.enabled || !agent.payoffHistory || agent.payoffHistory.length < 5) return;
    
    // Calculate average payoff for this agent
    let avgPayoff = agent.payoffHistory.reduce((sum, p) => sum + p, 0) / agent.payoffHistory.length;
    
    // Find nearby agents with better fitness
    let betterNeighbors = agents.filter(other => {
      if (other === agent || !other.payoffHistory || other.payoffHistory.length < 5) return false;
      let d = Math.sqrt(Math.pow(other.pos.x - agent.pos.x, 2) + Math.pow(other.pos.y - agent.pos.y, 2));
      if (d > 100) return false;
      
      let otherAvg = other.payoffHistory.reduce((sum, p) => sum + p, 0) / other.payoffHistory.length;
      return otherAvg > avgPayoff + 2;
    });
    
    if (betterNeighbors.length === 0) return;
    
    // Count which type is most successful nearby
    let typePayoffs = { [AGENT_TYPE.HONEST]: [], [AGENT_TYPE.LIAR]: [], [AGENT_TYPE.STUBBORN]: [] };
    
    for (let neighbor of betterNeighbors) {
      let avg = neighbor.payoffHistory.reduce((sum, p) => sum + p, 0) / neighbor.payoffHistory.length;
      typePayoffs[neighbor.type].push(avg);
    }
    
    // Find best performing type
    let bestType = agent.type;
    let bestAvg = avgPayoff;
    
    for (let type in typePayoffs) {
      if (typePayoffs[type].length > 0) {
        let typeAvg = typePayoffs[type].reduce((sum, p) => sum + p, 0) / typePayoffs[type].length;
        if (typeAvg > bestAvg + 1) {
          bestType = parseInt(type);
          bestAvg = typeAvg;
        }
      }
    }
    
    // Switch to better performing strategy
    if (bestType !== agent.type) {
      agent.type = bestType;
      agent.strategyScore = 0; // Reset score after switch
      
      // Update fixed color for stubborn
      if (agent.type === AGENT_TYPE.STUBBORN) {
        agent.fixedColor = agent.color;
      }
    }
  }
  
  // Get UI controls
  getControls(parent) {
    let container = createDiv();
    container.parent(parent);
    container.style('margin-top', '15px');
    container.style('border-top', '1px solid rgba(255,255,255,0.2)');
    container.style('padding-top', '10px');
    
    let title = createElement('h4', 'Game Theory');
    title.parent(container);
    title.style('margin', '0 0 8px 0');
    title.style('font-size', '13px');
    title.style('color', '#2196F3');
    
    // Strategy payoffs
    let info = createP(`
      <div style="font-size: 10px; line-height: 1.4;">
        <div>H-H: +3/+3 | H-L: -2/+5</div>
        <div>L-L: -1/-1 | S-S: 0/0</div>
        <div id="stratStats" style="margin-top: 5px;"></div>
      </div>
    `);
    info.parent(container);
    info.style('margin', '5px 0');
    
    return container;
  }
  
  // Update UI
  updateUI(agents) {
    const statsElem = select('#stratStats');
    if (statsElem) {
      const stats = this.getPopulationStats(agents);
      const html = `
        H: ${stats.counts.honest} (${stats.avgPayoffs.honest.toFixed(1)}) | 
        L: ${stats.counts.liar} (${stats.avgPayoffs.liar.toFixed(1)}) | 
        S: ${stats.counts.stubborn} (${stats.avgPayoffs.stubborn.toFixed(1)})
      `;
      statsElem.html(html);
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameTheoryEvolution;
}
