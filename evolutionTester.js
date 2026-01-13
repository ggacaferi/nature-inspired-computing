// Evolution Testing System
// Verifies that each evolution mode is working correctly

class EvolutionTester {
  constructor() {
    this.previousBeliefs = null;
  }

  // Test Genetic Evolution
  testGenetic(agents, evolutionSystem) {
    console.log('\n=== TESTING GENETIC EVOLUTION ===');
    
    let hasGenome = agents.every(a => a.genome !== undefined);
    console.log('✓ All agents have genomes:', hasGenome);
    
    let validGenomes = agents.every(a => 
      a.genome && 
      a.genome.honestyLevel !== undefined &&
      a.genome.stubbornness !== undefined &&
      a.genome.influenceStrength !== undefined &&
      a.genome.trustThreshold !== undefined
    );
    console.log('✓ Genomes have all properties:', validGenomes);
    
    let hasFitness = agents.every(a => a.fitness !== undefined);
    console.log('✓ All agents have fitness:', hasFitness);
    
    let fitnessValues = agents.map(a => a.fitness || 0);
    let avgFitness = fitnessValues.reduce((a, b) => a + b, 0) / fitnessValues.length;
    let minFitness = Math.min(...fitnessValues);
    let maxFitness = Math.max(...fitnessValues);
    console.log(`✓ Fitness range: ${minFitness.toFixed(2)} to ${maxFitness.toFixed(2)}, avg: ${avgFitness.toFixed(2)}`);
    
    console.log(`✓ Current generation: ${evolutionSystem.generationNumber || 0}`);
    
    let honestyValues = agents.map(a => a.genome ? a.genome.honestyLevel : 0.5);
    let honestyVariance = this.calculateVariance(honestyValues);
    console.log(`✓ Honesty diversity (variance): ${honestyVariance.toFixed(4)}`);
    
    return {
      hasGenome,
      validGenomes,
      hasFitness,
      avgFitness,
      generation: evolutionSystem.generationNumber || 0,
      diversity: honestyVariance
    };
  }

  // Test Game Theory Evolution
  testGameTheory(agents, evolutionSystem) {
    console.log('\n=== TESTING GAME THEORY EVOLUTION ===');
    
    let hasFitness = agents.every(a => a.fitness !== undefined);
    console.log('✓ All agents have fitness:', hasFitness);
    
    let fitnessValues = agents.map(a => a.fitness || 0);
    let nonZeroFitness = fitnessValues.filter(f => Math.abs(f) > 0.01).length;
    console.log(`✓ Agents with non-zero fitness: ${nonZeroFitness}/${agents.length}`);
    
    let honestFitness = agents.filter(a => a.type === AGENT_TYPE.HONEST).map(a => a.fitness || 0);
    let liarFitness = agents.filter(a => a.type === AGENT_TYPE.LIAR).map(a => a.fitness || 0);
    let stubbornFitness = agents.filter(a => a.type === AGENT_TYPE.STUBBORN).map(a => a.fitness || 0);
    
    let avgHonest = honestFitness.length > 0 ? honestFitness.reduce((a, b) => a + b, 0) / honestFitness.length : 0;
    let avgLiar = liarFitness.length > 0 ? liarFitness.reduce((a, b) => a + b, 0) / liarFitness.length : 0;
    let avgStubborn = stubbornFitness.length > 0 ? stubbornFitness.reduce((a, b) => a + b, 0) / stubbornFitness.length : 0;
    
    console.log(`✓ Avg fitness - Honest: ${avgHonest.toFixed(2)}, Liar: ${avgLiar.toFixed(2)}, Stubborn: ${avgStubborn.toFixed(2)}`);
    console.log('✓ Payoff matrix defined:', evolutionSystem.payoffMatrix !== undefined);
    
    let interactionCounts = agents.map(a => Object.keys(a.interactionTimer || {}).length);
    let avgInteractions = interactionCounts.reduce((a, b) => a + b, 0) / interactionCounts.length;
    console.log(`✓ Average active interactions per agent: ${avgInteractions.toFixed(2)}`);
    
    return {
      hasFitness,
      nonZeroFitness,
      avgHonest,
      avgLiar,
      avgStubborn,
      avgInteractions
    };
  }

  // Test Cultural Evolution
  testCultural(agents, evolutionSystem) {
    console.log('\n=== TESTING CULTURAL EVOLUTION ===');
    
    let hasBeliefStrength = agents.every(a => a.beliefStrength !== undefined);
    console.log('✓ All agents have belief strength:', hasBeliefStrength);
    
    let beliefValues = agents.map(a => a.beliefStrength || 0.5);
    let avgBelief = beliefValues.reduce((a, b) => a + b, 0) / beliefValues.length;
    let minBelief = Math.min(...beliefValues);
    let maxBelief = Math.max(...beliefValues);
    console.log(`✓ Belief strength range: ${minBelief.toFixed(2)} to ${maxBelief.toFixed(2)}, avg: ${avgBelief.toFixed(2)}`);
    
    let honestBeliefs = agents.filter(a => a.type === AGENT_TYPE.HONEST).map(a => a.beliefStrength || 0.5);
    let liarBeliefs = agents.filter(a => a.type === AGENT_TYPE.LIAR).map(a => a.beliefStrength || 0.5);
    let stubbornBeliefs = agents.filter(a => a.type === AGENT_TYPE.STUBBORN).map(a => a.beliefStrength || 0.5);
    
    let avgHonestBelief = honestBeliefs.length > 0 ? honestBeliefs.reduce((a, b) => a + b, 0) / honestBeliefs.length : 0;
    let avgLiarBelief = liarBeliefs.length > 0 ? liarBeliefs.reduce((a, b) => a + b, 0) / liarBeliefs.length : 0;
    let avgStubbornBelief = stubbornBeliefs.length > 0 ? stubbornBeliefs.reduce((a, b) => a + b, 0) / stubbornBeliefs.length : 0;
    
    console.log(`✓ Avg belief - Honest: ${avgHonestBelief.toFixed(2)}, Liar: ${avgLiarBelief.toFixed(2)}, Stubborn: ${avgStubbornBelief.toFixed(2)}`);
    
    if (!this.previousBeliefs) {
      this.previousBeliefs = beliefValues.slice();
      console.log('✓ Baseline beliefs recorded');
    } else {
      let changes = beliefValues.map((v, i) => Math.abs(v - this.previousBeliefs[i]));
      let avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      console.log(`✓ Average belief change: ${avgChange.toFixed(4)}`);
      this.previousBeliefs = beliefValues.slice();
    }
    
    let beliefVariance = this.calculateVariance(beliefValues);
    console.log(`✓ Belief diversity (variance): ${beliefVariance.toFixed(4)}`);
    
    return {
      hasBeliefStrength,
      avgBelief,
      avgHonestBelief,
      avgLiarBelief,
      avgStubbornBelief,
      beliefVariance
    };
  }

  // Test Hybrid Evolution
  testHybrid(agents, evolutionSystem) {
    console.log('\n=== TESTING HYBRID EVOLUTION ===');
    
    let geneticResults = this.testGenetic(agents, evolutionSystem.genetic);
    let gameTheoryResults = this.testGameTheory(agents, evolutionSystem.gameTheory);
    let culturalResults = this.testCultural(agents, evolutionSystem.cultural);
    
    console.log('\n=== HYBRID INTEGRATION ===');
    let hasAllProperties = agents.every(a => 
      a.genome !== undefined &&
      a.fitness !== undefined &&
      a.beliefStrength !== undefined
    );
    console.log('✓ All systems integrated:', hasAllProperties);
    
    return {
      genetic: geneticResults,
      gameTheory: gameTheoryResults,
      cultural: culturalResults,
      integrated: hasAllProperties
    };
  }

  // Calculate variance
  calculateVariance(values) {
    if (values.length === 0) return 0;
    let mean = values.reduce((a, b) => a + b, 0) / values.length;
    let squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  // Run test based on current mode
  runTest(mode, agents, evolutionSystem) {
    if (!agents || agents.length === 0) {
      console.log('⚠️ No agents to test');
      return null;
    }

    switch(mode) {
      case 'genetic':
        return this.testGenetic(agents, evolutionSystem);
      case 'gametheory':
        return this.testGameTheory(agents, evolutionSystem);
      case 'cultural':
        return this.testCultural(agents, evolutionSystem);
      case 'hybrid':
        return this.testHybrid(agents, evolutionSystem);
      default:
        console.log('⚠️ Base mode - no evolution to test');
        return null;
    }
  }
}
