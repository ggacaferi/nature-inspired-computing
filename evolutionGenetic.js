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
    // Initialize genome traits based on agent's initial type
    let honestyLevel;
    let stubbornness;
    
    if (agent.type === AGENT_TYPE.HONEST) {
      // Honest agents start with high honesty (0.6-1.0)
      honestyLevel = random(0.6, 1.0);
      stubbornness = random(0, 0.3);
    } else if (agent.type === AGENT_TYPE.LIAR) {
      // Liars start with low honesty (0.0-0.4)
      honestyLevel = random(0, 0.4);
      stubbornness = random(0, 0.5);
    } else if (agent.type === AGENT_TYPE.STUBBORN) {
      // Stubborn agents start with high stubbornness (0.8-1.0)
      honestyLevel = random(0, 1);
      stubbornness = random(0.8, 1.0);
    }
    
    agent.genome = {
      honestyLevel: honestyLevel,
      stubbornness: stubbornness,
      influenceStrength: random(0, 1),
      trustThreshold: random(0, 1)
    };
    agent.fitness = 0;
    agent.age = 0;
    this.applyGenomeToState(agent);
  }
  
  // Apply an EXISTING genome to the agent's state (color/type/behavior).
  // This is used both for initial random genomes and inherited child genomes.
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

    // Non-visual behavioral traits (learning rate, belief strength)
    this.applyGenomeToBehavior(agent);
  }

  // Alias for consistency with other evolution modules
  initializeAgent(agent) {
    this.initializeGenome(agent);
  }
  
  // Reset generation counter (called on system reset)
  reset() {
    this.frameCount = 0;
    this.generationNumber = 0;
  }
  
  // Update agent each frame
  update(agent, agents) {
    if (!this.enabled) return;
    
    agent.age++;
    
    // Stubborn agents get a fitness bonus for their resilience
    if (agent.type === AGENT_TYPE.STUBBORN) {
      agent.fitness += 0.022; // Small survival advantage
    }
    
    // Dynamic generation-based fitness decay: aggressive exponential aging
    // Each new generation causes previous generations to lose fitness much faster
    // Formula: base decay (0.5%) * 2.5^(generations_since_agent_was_born)
    if (frameCount % 60 === 0 && agent.fitness > 0) {
      let generationGap = (this.generationNumber || 0) - (agent.generation || 0);
      let decayPercentage = 0.005 * Math.pow(2.5, generationGap); // Aggressive exponential decay
      let decayRate = 1 - decayPercentage;
      agent.fitness *= decayRate;
    }
    
    // Apply genome to behavior
    this.applyGenomeToBehavior(agent);
  }
  
  // Apply genome traits to agent behavior
  applyGenomeToBehavior(agent) {
    // Stubbornness affects learning rate and belief strength.
    // Higher stubbornness → slower learning but stronger conviction.
    agent.learningRate = 0.3 * (1 - agent.genome.stubbornness);
    agent.beliefStrength = agent.genome.stubbornness;
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
              // Gradually adopt successful neighbor's genome traits (30% blend per learning event)
              let blendRate = 0.3;
              agent.genome.honestyLevel += (best.genome.honestyLevel - agent.genome.honestyLevel) * blendRate;
              agent.genome.stubbornness += (best.genome.stubbornness - agent.genome.stubbornness) * blendRate;
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
    
    // Preserve fitness across generations
    // Survivors keep their fitness; offspring already inherited from parents
    for (let agent of newAgents) {
      agent.age = 0;
    }
    
    console.log(`Generation ${this.generationNumber}: Avg fitness = ${this.getAverageFitness(survivors).toFixed(2)}`);
    
    return newAgents;
  }
  
  // Reproduce two agents
  reproduce(parent1, parent2, evolutionSystem = null) {
    const x = random(width);
    const y = random(height);
    // Create child - start as HONEST by default, genome will determine actual type/color below
    const child = new Agent(x, y, AGENT_TYPE.HONEST);
    
    // Crossover: randomly pick genes from each parent
    child.genome = {
      honestyLevel: random() < 0.5 ? parent1.genome.honestyLevel : parent2.genome.honestyLevel,
      stubbornness: random() < 0.5 ? parent1.genome.stubbornness : parent2.genome.stubbornness,
      influenceStrength: random() < 0.5 ? parent1.genome.influenceStrength : parent2.genome.influenceStrength,
      trustThreshold: random() < 0.5 ? parent1.genome.trustThreshold : parent2.genome.trustThreshold
    };
    
    // If parent(s) are stubborn, boost offspring stubbornness to preserve trait
    if (parent1.type === AGENT_TYPE.STUBBORN || parent2.type === AGENT_TYPE.STUBBORN) {
      // Both parents stubborn: larger bonus
      if (parent1.type === AGENT_TYPE.STUBBORN && parent2.type === AGENT_TYPE.STUBBORN) {
        child.genome.stubbornness = Math.min(1, child.genome.stubbornness + 0.35);
      } else {
        // Only one parent stubborn: smaller bonus
        child.genome.stubbornness = Math.min(1, child.genome.stubbornness + 0.2);
      }
    }
    
    // Mutation
    this.mutate(child.genome);

    // Apply the inherited genome to set initial behavior & belief color
    // (do NOT re-randomize the genome here)
    this.applyGenomeToState(child);
    
    // Set generation number for this child
    child.generation = this.generationNumber;
    
    // Offspring inherit 50% of average parent fitness (reduced inheritance to prevent dominance)
    child.fitness = (parent1.fitness + parent2.fitness) / 4;
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
