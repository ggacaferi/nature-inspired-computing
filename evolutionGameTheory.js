// Game Theory Evolution Module
// Classic Prisoner's Dilemma with spatial structure
//
// Agent Types (Strategies):
// - HONEST = Always Cooperate (C)
// - LIAR = Always Defect (D)
// - STUBBORN = Tit-for-Tat (cooperates first, then mirrors opponent)
//
// Payoff Matrix (T > R > P > S):
// T = Temptation to defect (5)
// R = Reward for mutual cooperation (3)
// P = Punishment for mutual defection (1)
// S = Sucker's payoff (0)

class GameTheoryEvolution {
  constructor() {
    this.enabled = true;
    
    // Classic Prisoner's Dilemma payoffs
    this.T = 5;  // Temptation to defect
    this.R = 3;  // Reward for cooperation
    this.P = 1;  // Punishment for mutual defection
    this.S = 0;  // Sucker's payoff
    
    // Track interactions to avoid double-counting
    this.processedPairs = new Set();
    this.frameCount = 0;
  }
  
  // Initialize game theory properties for agent
  initializeAgent(agent) {
    if (!agent.fitness) agent.fitness = 0;
    if (!agent.payoffHistory) agent.payoffHistory = [];
    if (!agent.interactionCount) agent.interactionCount = 0;
  }
  
  // Process interaction between two agents
  processInteraction(agent1, agent2) {
    if (!this.enabled) return;
    
    // Avoid double-counting interactions
    const pairKey = agent1.id < agent2.id ? \`\${agent1.id}-\${agent2.id}\` : \`\${agent2.id}-\${agent1.id}\`;
    if (this.processedPairs.has(pairKey)) {
      this.handleCommunication(agent1, agent2);
      return;
    }
    this.processedPairs.add(pairKey);
    
    this.initializeAgent(agent1);
    this.initializeAgent(agent2);
    
    // Determine what each agent does (Cooperate or Defect)
    const move1 = this.getMove(agent1, agent2);
    const move2 = this.getMove(agent2, agent1);
    
    // Calculate payoffs based on moves
    const payoff1 = this.getPayoff(move1, move2);
    const payoff2 = this.getPayoff(move2, move1);
    
    // Apply payoffs
    agent1.fitness += payoff1;
    agent2.fitness += payoff2;
    agent1.payoffHistory.push(payoff1);
    agent2.payoffHistory.push(payoff2);
    agent1.interactionCount++;
    agent2.interactionCount++;
    
    // Trim history
    if (agent1.payoffHistory.length > 50) agent1.payoffHistory.shift();
    if (agent2.payoffHistory.length > 50) agent2.payoffHistory.shift();
    
    // Handle belief communication (same as base mode)
    this.handleCommunication(agent1, agent2);
    this.handleCommunication(agent2, agent1);
    
    return { agent1: payoff1, agent2: payoff2 };
  }
  
  // Determine agent's move (Cooperate or Defect)
  getMove(agent, opponent) {
    switch (agent.type) {
      case AGENT_TYPE.HONEST:
        return 'C'; // Always cooperate
        
      case AGENT_TYPE.LIAR:
        return 'D'; // Always defect
        
      case AGENT_TYPE.STUBBORN:
        // Tit-for-Tat: cooperate first time, then copy opponent's last move
        // For simplicity, cooperate with honest/stubborn, defect with liar
        return (opponent.type === AGENT_TYPE.LIAR) ? 'D' : 'C';
        
      default:
        return 'C';
    }
  }
  
  // Get payoff based on moves (Classic PD)
  getPayoff(myMove, theirMove) {
    if (myMove === 'C' && theirMove === 'C') return this.R; // Both cooperate
    if (myMove === 'C' && theirMove === 'D') return this.S; // I cooperate, they defect (sucker)
    if (myMove === 'D' && theirMove === 'C') return this.T; // I defect, they cooperate (temptation)
    if (myMove === 'D' && theirMove === 'D') return this.P; // Both defect
    return 0;
  }
  
  // Handle belief communication (same as base mode)
  handleCommunication(receiver, transmitter) {
    // Get the color that the transmitter is sharing
    const transmittedColor = transmitter.color;
    
    // Base blend rates (same as base mode)
    let blendAmount;
    if (receiver.type === AGENT_TYPE.STUBBORN) {
      blendAmount = 0.05; // Stubborn resist belief change but can still shift slowly
    } else {
      blendAmount = 0.08; // Normal susceptibility
    }
    
    receiver.color = lerpColor(receiver.color, transmittedColor, blendAmount);
  }
  
  // Calculate average payoff for agent
  getAveragePayoff(agent) {
    if (!agent.payoffHistory || agent.payoffHistory.length === 0) return 0;
    return agent.payoffHistory.reduce((sum, p) => sum + p, 0) / agent.payoffHistory.length;
  }
  
  // Update method called once per frame
  update(agents, deltaTime) {
    // Clear interaction tracking for new frame
    this.processedPairs.clear();
    this.frameCount++;
    
    // Decay fitness over time (prevents unlimited accumulation)
    const decayRate = 0.95;
    for (let agent of agents) {
      if (agent.fitness) {
        agent.fitness *= decayRate;
      }
    }
  }
  
  // No strategy switching - agents keep their types like base mode
  // Beliefs (colors) change through communication, types stay fixed
}

// Global instance
const evolutionGameTheory = new GameTheoryEvolution();
