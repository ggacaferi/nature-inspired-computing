# 🦠 Swarm Evolution Simulations

A modular agent-based simulation system that demonstrates different evolutionary mechanisms in swarm dynamics. Each evolution type can run independently or be combined for complex emergent behavior.

## 🎯 Quick Start

Open `index-menu.html` in your browser to see all available simulations, or run a specific one directly:

- **Base Simulation**: `index.html` - Original swarm dynamics without evolution
- **Genetic Evolution**: `index-genetic.html` - Natural selection and reproduction
- **Game Theory**: `index-gametheory.html` - Strategic interactions with payoffs
- **Cultural Evolution**: `index-cultural.html` - Belief transmission and social learning
- **Hybrid Evolution**: `index-hybrid.html` - All three systems combined

## 📁 Project Structure

```
p5js/
├── index-menu.html              # Landing page with all simulations
├── index.html                   # Base simulation (no evolution)
├── index-genetic.html           # Genetic evolution only
├── index-gametheory.html        # Game theory only
├── index-cultural.html          # Cultural evolution only
├── index-hybrid.html            # All systems combined
├── sketch.js                    # Main simulation code
├── evolutionGenetic.js          # Genetic algorithm module
├── evolutionGameTheory.js       # Game theory module
├── evolutionCultural.js         # Cultural evolution module
├── evolutionHybrid.js           # Hybrid system combining all three
├── style.css                    # Styling
└── README.md                    # This file
```

## 🧬 Evolution Systems

### 1. Genetic Evolution (`evolutionGenetic.js`)

**Standalone**: ✅ Yes

Implements natural selection through reproduction and mutation:

- **Genome**: Each agent has traits (honesty, stubbornness, influence, trust)
- **Fitness**: Accumulated through interactions
- **Reproduction**: Top 50% survive and create offspring
- **Mutation**: Random genetic changes (10% chance)
- **Generation**: Population refreshes every 300 frames

**Key Features**:
- Crossover genetics from two parents
- Trait-based behavior (genome → agent type)
- Evolutionary stable strategies emerge

### 2. Game Theory Evolution (`evolutionGameTheory.js`)

**Standalone**: ✅ Yes

Strategic interactions with payoff matrices:

- **Payoff Matrix**: Different outcomes for each agent type pairing
  - Honest-Honest: +3/+3 (cooperation)
  - Honest-Liar: -2/+5 (exploitation)
  - Liar-Liar: -1/-1 (mutual distrust)
  - Stubborn interactions: defensive payoffs
- **Fitness Tracking**: Accumulated from all interactions
- **Strategy Analysis**: Population-level statistics

**Key Features**:
- Nash equilibrium emergence
- Strategy frequency tracking
- Fitness decay to prevent unbounded growth

### 3. Cultural Evolution (`evolutionCultural.js`)

**Standalone**: ✅ Yes

Belief dynamics and memetic transmission:

- **Belief Strength**: Conviction in current opinion (0-1)
- **Persuasion**: Based on influence vs. stubbornness
- **Social Learning**: Copy successful neighbors
- **Memetic Spread**: Ideas change faster than genes

**Key Features**:
- Belief decay over time
- Cultural memory of interactions
- Trust-based receptiveness
- Diversity tracking

### 4. Hybrid Evolution (`evolutionHybrid.js`)

**Standalone**: ❌ No (requires all modules)

Combines all three systems with emergent interactions:

- **Multi-timescale**: Cultural (fast) → Game Theory (medium) → Genetic (slow)
- **Feedback Loops**: 
  - Cultural success → Genetic fitness
  - Game theory payoffs → Genetic fitness
  - Genetic traits → Cultural persuasion
  - Genetic traits → Game theory strategies
- **Baldwin Effect**: Learned behaviors guide evolution

**Key Features**:
- Co-evolution of genes and culture
- Complex emergent dynamics
- Rich interaction patterns
- All three UIs integrated

## 🎮 How to Use

### Running Locally

1. Open `index-menu.html` in a web browser
2. Click on any simulation card
3. Adjust parameters with sliders in the control panel
4. Watch the population evolve!

### With a Local Server

```bash
cd p5js
python3 -m http.server 8000
# Visit http://localhost:8000/index-menu.html
```

## 🔧 Customization

### Creating Custom Evolution Systems

Each evolution module follows this interface:

```javascript
class CustomEvolution {
  constructor() { /* Initialize */ }
  
  initializeAgent(agent) { 
    // Add properties to new agents
  }
  
  update(agent, agents) { 
    // Update each frame
  }
  
  evolvePopulation(agents) { 
    // Population-level evolution
    return agents; // Return modified population
  }
  
  processInteraction(agent1, agent2) { 
    // Handle agent interactions
  }
  
  getControls(parent) { 
    // Return UI elements
  }
  
  updateUI(agents) { 
    // Update UI each frame
  }
}
```

### Adding a New HTML Configuration

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
    <link rel="stylesheet" href="style.css">
    
    <!-- Your evolution module -->
    <script src="evolutionCustom.js"></script>
    
    <script src="sketch.js"></script>
    <script>
        window.evolutionMode = 'custom';
    </script>
</head>
<body>
    <!-- Your content -->
</body>
</html>
```

Then update `sketch.js` to recognize your new mode in `initializeEvolutionSystem()`.

## 📊 Parameters

### Base Parameters (All Simulations)
- **Total Agents**: 50-300
- **Liars %**: 0-50%
- **Stubborn %**: 0-50%
- **Proximity Radius**: 20-100 pixels
- **Interaction Time**: 10-100 frames

### Evolution-Specific Parameters

Check each module's source code for additional configuration options:
- `GeneticEvolution`: generation length, mutation rate, survival rate
- `GameTheoryEvolution`: payoff matrix values
- `CulturalEvolution`: belief decay rate, social learning rate

## 🧪 Research Questions

This simulation can explore:

1. **Which strategies survive?** Does honesty or deception win under different conditions?
2. **Echo chambers**: How do belief clusters form and persist?
3. **Gene-culture coevolution**: How do cultural and genetic evolution interact?
4. **Evolutionary stable strategies**: What equilibria emerge in the hybrid system?
5. **Social learning**: How does copying successful neighbors affect evolution?

## 🔬 Technical Details

### Agent Properties

```javascript
// Base properties
agent.pos, agent.vel, agent.acc  // Physics
agent.type                        // HONEST, LIAR, STUBBORN
agent.color                       // Current belief/opinion

// Genetic properties (if genetic evolution enabled)
agent.genome = {
  honestyLevel,        // 0-1
  stubbornness,        // 0-1
  influenceStrength,   // 0-1
  trustThreshold       // 0-1
}
agent.fitness          // Accumulated fitness

// Game theory properties
agent.strategyScore    // Cumulative payoffs
agent.payoffHistory    // Recent interaction outcomes

// Cultural properties
agent.beliefStrength   // 0-1 conviction
agent.culturalMemory   // Interaction history
agent.conversionCount  // Belief changes
```

### Flocking Behavior

All simulations use Reynolds' boids rules:
- **Separation**: Avoid crowding
- **Alignment**: Steer toward average heading
- **Cohesion**: Move toward center of mass

## 🎨 Visualization

- **Circles**: Honest agents
- **Triangles**: Liar agents (point toward velocity)
- **Squares**: Stubborn agents
- **Colors**: Current beliefs/opinions
- **Proximity circles**: Interaction range (subtle)
- **Borders**: Type-specific (white/red/black)

## 📝 License

Open source - feel free to modify and experiment!

## 🙏 Acknowledgments

- p5.js library for graphics and interaction
- Reynolds' boids algorithm for flocking
- Evolutionary game theory concepts
- Cultural evolution and memetics research

---

**Have fun evolving! 🧬🎮🧠**
