// Genetic Algorithm Evolution Module
// Can be used independently or combined with other evolution modules

class GeneticEvolution {
  constructor() {
    this.generationLength = 300; // frames per generation
    this.frameCount = 0;
    this.generationNumber = 0;
    this.mutationRate = 0.1; // 10% chance
    this.mutationAmount = 0.1; // how much genes mutate
    this.survivalRate = 0.5; // top 50% survive
    this.enabled = true;
  }
  
  // Initialize genome for new agent
  initializeGenome(agent) {
    agent.genome = {
      honestyLevel: random(0, 1),
      stubbornness: random(0, 1),
      influenceStrength: random(0, 1),
      trustThreshold: random(0, 1)
    };
    agent.fitness = 0;
    agent.age = 0;
    
    // Apply genome to set initial behavior
    this.applyGenomeToBehavior(agent);
  }
  
  // Alias for consistency with other evolution modules
  initializeAgent(agent) {
    this.initializeGenome(agent);
  }
  
  // Update agent each frame
  update(agent, agents) {
    if (!this.enabled) return;
    
    agent.age++;
    
    // Apply genome to behavior
    this.applyGenomeToBehavior(agent);
  }
  
  // Apply genome traits to agent behavior
  applyGenomeToBehavior(agent) {
    // Genome determines type - types are MUTABLE based on genes
    if (agent.genome.honestyLevel < 0.33) {
      agent.type = AGENT_TYPE.LIAR;
    } else if (agent.genome.honestyLevel > 0.66 && agent.genome.stubbornness > 0.7) {
      agent.type = AGENT_TYPE.STUBBORN;
    } else {
      agent.type = AGENT_TYPE.HONEST;
    }
    
    // Stubbornness affects learning rate and belief strength
    agent.learningRate = 0.3 * (1 - agent.genome.stubbornness);
    agent.beliefStrength = agent.genome.stubbornness;
    
    // Update fixed color for stubborn agents
    if (agent.type === AGENT_TYPE.STUBBORN) {
      agent.fixedColor = agent.color;
    }
  }
  
  // Process interaction between agents (handles color communication)
  processInteraction(agent1, agent2) {
    if (!this.enabled) return;
    
    // Calculate learning rate based on type and genome
    let rate = 0.3; // Default for honest and liars
    
    if (agent1.type === AGENT_TYPE.STUBBORN) {
      rate = 0.01; // Stubborn are 30x more resistant
    } else if (agent1.learningRate !== undefined) {
      rate = agent1.learningRate; // Use genome-based rate if available
    }
    
    // Agent1 receives what agent2 transmits
    let transmittedColor = agent2.getTransmittedColor();
    agent1.color = lerpColor(color(agent1.color), color(transmittedColor), rate);
    
    // Add fitness for successful interactions
    agent1.fitness += 0.1;
    agent2.fitness += 0.1;
  }
  
  // Called each frame for population management
  evolvePopulation(agents) {
    if (!this.enabled) return agents;
    
    this.frameCount++;
    
    // Fitness-based type conversion (social learning of successful strategies)
    if (this.frameCount % 100 === 0) {
      for (let agent of agents) {
        // Low fitness agents observe and copy successful neighbors
        if (agent.fitness < 5) {
          let neighbors = agents.filter(a => {
            let d = Math.sqrt(Math.pow(a.pos.x - agent.pos.x, 2) + Math.pow(a.pos.y - agent.pos.y, 2));
            return d < 100 && a !== agent;
          });
          
          if (neighbors.length > 0) {
            // Find most successful neighbor
            let best = neighbors.reduce((max, n) => n.fitness > max.fitness ? n : max, neighbors[0]);
            if (best.fitness > agent.fitness + 3) {
              // Copy successful neighbor's genome traits
              agent.genome.honestyLevel = best.genome.honestyLevel + random(-0.1, 0.1);
              agent.genome.stubbornness = best.genome.stubbornness + random(-0.1, 0.1);
              agent.genome.honestyLevel = constrain(agent.genome.honestyLevel, 0, 1);
              agent.genome.stubbornness = constrain(agent.genome.stubbornness, 0, 1);
              this.applyGenomeToBehavior(agent);
            }
          }
        }
      }
    }
    
    // Check if generation is complete
    if (this.frameCount >= this.generationLength) {
      this.frameCount = 0;
      this.generationNumber++;
      return this.newGeneration(agents);
    }
    
    return agents;
  }
  
  // Create new generation
  newGeneration(agents) {
    // Sort by fitness
    agents.sort((a, b) => b.fitness - a.fitness);
    
    const survivalCount = floor(agents.length * this.survivalRate);
    const survivors = agents.slice(0, survivalCount);
    
    // Create offspring to fill population
    const newAgents = [...survivors];
    
    while (newAgents.length < params.numAgents) {
      // Select two random parents from survivors
      const parent1 = random(survivors);
      const parent2 = random(survivors);
      
      // Create offspring
      const child = this.reproduce(parent1, parent2);
      newAgents.push(child);
    }
    
    // Reset fitness for new generation
    for (let agent of newAgents) {
      agent.fitness = 0;
      agent.age = 0;
    }
    
    console.log(`Generation ${this.generationNumber}: Avg fitness = ${this.getAverageFitness(survivors).toFixed(2)}`);
    
    return newAgents;
  }
  
  // Reproduce two agents
  reproduce(parent1, parent2) {
    const x = random(width);
    const y = random(height);
    const col = lerpColor(color(parent1.color), color(parent2.color), 0.5);
    
    // Create child with inherited genome
    const child = new Agent(x, y, parent1.type, col);
    
    // Crossover: randomly pick genes from each parent
    child.genome = {
      honestyLevel: random() < 0.5 ? parent1.genome.honestyLevel : parent2.genome.honestyLevel,
      stubbornness: random() < 0.5 ? parent1.genome.stubbornness : parent2.genome.stubbornness,
      influenceStrength: random() < 0.5 ? parent1.genome.influenceStrength : parent2.genome.influenceStrength,
      trustThreshold: random() < 0.5 ? parent1.genome.trustThreshold : parent2.genome.trustThreshold
    };
    
    // Mutation
    this.mutate(child.genome);
    
    child.fitness = 0;
    child.age = 0;
    
    return child;
  }
  
  // Mutate genome
  mutate(genome) {
    for (let key in genome) {
      if (random() < this.mutationRate) {
        // Add random noise
        genome[key] += random(-this.mutationAmount, this.mutationAmount);
        // Keep in bounds
        genome[key] = constrain(genome[key], 0, 1);
      }
    }
  }
  
  // Calculate average fitness
  getAverageFitness(agents) {
    if (agents.length === 0) return 0;
    const sum = agents.reduce((acc, agent) => acc + agent.fitness, 0);
    return sum / agents.length;
  }
  
  // Add fitness to agent (called by other modules)
  addFitness(agent, amount) {
    agent.fitness += amount;
  }
  
  // Get UI controls
  getControls(parent) {
    let container = createDiv();
    container.parent(parent);
    container.style('margin-top', '15px');
    container.style('border-top', '1px solid rgba(255,255,255,0.2)');
    container.style('padding-top', '10px');
    
    let title = createElement('h4', 'Genetic Evolution');
    title.parent(container);
    title.style('margin', '0 0 8px 0');
    title.style('font-size', '13px');
    title.style('color', '#4CAF50');
    
    // Generation info
    let info = createP(`Gen: <span id="genNum">0</span> | Avg Fit: <span id="avgFit">0</span>`);
    info.parent(container);
    info.style('margin', '5px 0');
    info.style('font-size', '11px');
    
    return container;
  }
  
  // Update UI
  updateUI(agents) {
    const genElem = select('#genNum');
    const fitElem = select('#avgFit');
    
    if (genElem) genElem.html(this.generationNumber);
    if (fitElem) fitElem.html(this.getAverageFitness(agents).toFixed(2));
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeneticEvolution;
}
