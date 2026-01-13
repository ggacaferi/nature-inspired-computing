# Evolution Systems Comparison Guide

## Quick Reference Table

| Feature | Base | Genetic | Game Theory | Cultural | Hybrid |
|---------|------|---------|-------------|----------|--------|
| **Standalone** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Agent Types Change** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Fitness Tracking** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Reproduction** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Payoff Matrix** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Belief Dynamics** | Basic | Basic | Basic | ✅ | ✅ |
| **Social Learning** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Genome** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Complexity** | Low | Medium | Low | Medium | High |

## What Each System Does

### 🟢 Base Simulation
**Best for**: Understanding basic swarm dynamics

- Agents flock using Reynolds rules
- Simple color transfer between agents
- Three fixed agent types
- No evolution or adaptation

**Use when**: You want to see basic opinion dynamics without evolutionary pressure

---

### 🧬 Genetic Evolution
**Best for**: Long-term adaptation and natural selection

- Agents have genomes (honesty, stubbornness, influence, trust)
- Fitness-based survival
- Sexual reproduction with crossover
- Random mutations
- Generational replacement (every 300 frames)

**Use when**: You want to see which strategies survive over many generations

**Emergent behaviors**:
- Optimal honesty levels evolve
- Population adapts to initial conditions
- Traits drift and stabilize

---

### 🎮 Game Theory
**Best for**: Strategic interactions and equilibria

- Payoff matrix for all interaction types
- Fitness accumulates from interactions
- Strategy frequency tracking
- No reproduction (population stays constant)

**Use when**: You want to understand strategic outcomes without reproduction

**Emergent behaviors**:
- Nash equilibria emerge
- Strategy frequencies stabilize
- Exploitation vs cooperation dynamics

---

### 🧠 Cultural Evolution
**Best for**: Belief transmission and social dynamics

- Belief strength (conviction level)
- Persuasion based on influence vs stubbornness
- Social learning from successful neighbors
- Cultural memory of interactions
- Fast belief changes (within generation)

**Use when**: You want to see how ideas spread and beliefs change

**Emergent behaviors**:
- Echo chambers form
- Influencers emerge
- Belief clustering
- Memetic epidemics

---

### 🌟 Hybrid System
**Best for**: Realistic complex dynamics

Combines all three systems:
- **Cultural**: Fast belief changes (frames)
- **Game Theory**: Medium-term fitness accumulation (seconds)
- **Genetic**: Slow evolution (generations)

**Multi-scale feedback loops**:
```
Cultural success → Genetic fitness
Game payoffs → Genetic fitness
Genetic traits → Cultural persuasion
Genetic traits → Game strategies
```

**Use when**: You want maximum realism and complexity

**Emergent behaviors**:
- Gene-culture coevolution
- Baldwin effect (learning guides evolution)
- Complex strategy emergence
- Multi-level selection
- Rich population dynamics

## Performance Comparison

### FPS Impact (150 agents)
- Base: 60 FPS
- Genetic: 58-60 FPS (drops during reproduction)
- Game Theory: 55-58 FPS
- Cultural: 56-59 FPS
- Hybrid: 50-55 FPS

### Computational Complexity
```
Base:        O(n²) interactions
Genetic:     O(n²) + O(n log n) sorting + O(n) reproduction
Game Theory: O(n²) + O(n) fitness updates
Cultural:    O(n²) + O(n²) social learning
Hybrid:      O(n²) all combined + O(n log n) sorting
```

## Which One Should You Use?

### For Teaching/Learning
1. **Start with Base** - understand flocking and opinions
2. **Try Cultural** - see how beliefs spread
3. **Try Game Theory** - understand strategic interactions
4. **Try Genetic** - see adaptation over generations
5. **Try Hybrid** - see everything together

### For Research

**Question: Do honest strategies evolve?**
→ Use **Genetic** or **Hybrid**

**Question: What's the Nash equilibrium?**
→ Use **Game Theory**

**Question: How do echo chambers form?**
→ Use **Cultural** or **Hybrid**

**Question: Can lying be evolutionarily stable?**
→ Use **Hybrid** (needs both game theory and genetics)

**Question: Do learned behaviors affect evolution?**
→ Use **Hybrid** (Baldwin effect)

### For Demonstrations

**Visual Impact**: Cultural > Hybrid > Base > Genetic > Game Theory
**Ease of Explanation**: Base > Game Theory > Cultural > Genetic > Hybrid
**Wow Factor**: Hybrid > Cultural > Genetic > Game Theory > Base

## Parameter Recommendations

### Base
- Agents: 150
- Liars: 15%
- Stubborn: 10%
- Interaction time: 30 frames

### Genetic
- Agents: 100-150 (reproduction is expensive)
- Generation length: 300 frames (adjust for faster/slower evolution)
- Mutation rate: 0.1 (10%)
- Survival rate: 0.5 (50%)

### Game Theory
- Agents: 150-200 (can handle more)
- Focus on strategy distributions
- Watch for equilibrium convergence

### Cultural
- Agents: 150-200
- Belief decay: 0.002 (slow natural decay)
- Social learning: 0.1 (gradual copying)

### Hybrid
- Agents: 100-120 (most expensive)
- Generation length: 400-500 (let cultural dynamics play out)
- Mutation rate: 0.08 (slightly lower)
- All other defaults

## Observation Tips

### What to Watch For

**Base Simulation**:
- Color clustering
- Agent type clustering
- Opinion convergence

**Genetic Evolution**:
- Generation counter
- Average fitness trend
- Population composition changes

**Game Theory**:
- Strategy payoffs
- Frequency-dependent selection
- Stable proportions

**Cultural Evolution**:
- Belief strength distribution
- Conversion events
- Diversity score

**Hybrid System**:
- All of the above
- Gene-culture feedback
- Multi-timescale dynamics

## Debugging Tips

### No evolution happening?
- Check console for mode activation message
- Verify HTML file loads correct .js files
- Check `window.evolutionMode` is set

### Performance issues?
- Reduce agent count
- Increase generation length (genetic)
- Reduce proximity radius

### Unexpected behavior?
- Hybrid mode requires ALL modules loaded
- Check browser console for errors
- Verify p5.js version (1.9.0)

---

**Happy experimenting! 🧪🔬**
