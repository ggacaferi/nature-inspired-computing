// Hybrid Evolution Module
// Combines Genetic Algorithm, Game Theory, and Cultural Evolution

class HybridEvolution {
  constructor() {
    // Initialize all three evolution systems
    this.genetic = new GeneticEvolution();
    this.gameTheory = new GameTheoryEvolution();
    this.cultural = new CulturalEvolution();
    
    this.enabled = true;
  }
  
  // Initialize agent with all evolution properties
  initializeAgent(agent) {
    // Genetic properties
    this.genetic.initializeGenome(agent);
    
    // Game theory properties
    this.gameTheory.initializeAgent(agent);
    
    // Cultural properties
    this.cultural.initializeAgent(agent);
  }
  
  // Update agent each frame
  update(agent, agents) {
    if (!this.enabled) return;
    
    // Update genetic behavior
    this.genetic.update(agent, agents);
    
    // Update cultural beliefs
    this.cultural.update(agent, agents);
  }
  
  // Process interaction between two agents (combines all three systems)
  processInteraction(agent1, agent2) {
    if (!this.enabled) return;
    
    // 1. Game Theory: Calculate strategic payoffs
    const payoffs = this.gameTheory.processInteraction(agent1, agent2);
    
    // 2. Cultural: Transmit beliefs based on influence
    const culturalImpact = this.cultural.transmit(agent1, agent2);
    
    // 3. Genetic: Add fitness based on outcomes
    // Cultural success contributes to genetic fitness
    if (culturalImpact > 0.5) {
      this.genetic.addFitness(agent1, 1);
      this.genetic.addFitness(agent2, -0.5);
    }
    
    // Game theory payoffs already added fitness in gameTheory.processInteraction
    
    return {
      payoffs: payoffs,
      culturalImpact: culturalImpact
    };
  }
  
  // Evolve population (called each frame)
  evolvePopulation(agents) {
    if (!this.enabled) return agents;
    
    // Update game theory decay
    this.gameTheory.update(agents);
    
    // Genetic evolution (handles reproduction & selection)
    agents = this.genetic.evolvePopulation(agents);
    
    // Re-initialize cultural properties for new agents
    for (let agent of agents) {
      if (agent.beliefStrength === undefined) {
        this.cultural.initializeAgent(agent);
      }
    }
    
    return agents;
  }
  
  // Get combined statistics
  getStats(agents) {
    return {
      genetic: {
        generation: this.genetic.generationNumber,
        avgFitness: this.genetic.getAverageFitness(agents)
      },
      gameTheory: this.gameTheory.getPopulationStats(agents),
      cultural: this.cultural.getPopulationStats(agents)
    };
  }
  
  // Get UI controls
  getControls(parent) {
    let container = createDiv();
    container.parent(parent);
    container.style('margin-top', '15px');
    container.style('border-top', '2px solid rgba(255,255,255,0.3)');
    container.style('padding-top', '10px');
    
    let title = createElement('h4', '🧬 Hybrid Evolution');
    title.parent(container);
    title.style('margin', '0 0 10px 0');
    title.style('font-size', '14px');
    title.style('color', '#E91E63');
    
    // Add individual module controls
    this.genetic.getControls(container);
    this.gameTheory.getControls(container);
    this.cultural.getControls(container);
    
    // Combined stats
    let combinedInfo = createP(`
      <div style="font-size: 10px; line-height: 1.5; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
        <strong>System Integration:</strong><br/>
        Cultural → Fitness<br/>
        Game Theory → Fitness<br/>
        Fitness → Reproduction
      </div>
    `);
    combinedInfo.parent(container);
    
    return container;
  }
  
  // Update all UIs
  updateUI(agents) {
    this.genetic.updateUI(agents);
    this.gameTheory.updateUI(agents);
    this.cultural.updateUI(agents);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HybridEvolution;
}
