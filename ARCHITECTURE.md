# System Architecture Overview

## Modular Evolution System

```
┌─────────────────────────────────────────────────────────┐
│                    HTML Entry Points                     │
├──────────────┬──────────────┬──────────────┬────────────┤
│ index.html   │ index-       │ index-       │ index-     │
│ (base)       │ genetic.html │ gametheory   │ cultural   │
│              │              │ .html        │ .html      │
└──────┬───────┴──────┬───────┴──────┬───────┴─────┬──────┘
       │              │              │             │
       └──────────────┴──────────────┴─────────────┘
                      │
                      ▼
       ┌──────────────────────────────────┐
       │       sketch.js (Core)            │
       │  - Agent class                    │
       │  - Flocking behavior              │
       │  - Interaction system             │
       │  - Evolution system loader        │
       └──────────────┬───────────────────┘
                      │
          ┌───────────┴────────────┐
          ▼                        ▼
    ┌─────────────┐         ┌─────────────┐
    │ No Evolution│         │ Evolution   │
    │ Mode        │         │ Systems     │
    └─────────────┘         └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌───────────┐  ┌───────────┐  ┌───────────┐
            │ Genetic   │  │ Game      │  │ Cultural  │
            │ Evolution │  │ Theory    │  │ Evolution │
            └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
                  │              │              │
                  └──────────────┼──────────────┘
                                 ▼
                         ┌───────────────┐
                         │ Hybrid        │
                         │ Evolution     │
                         │ (All Combined)│
                         └───────────────┘
```

## Component Independence

### ✅ Standalone Modules

Each evolution module is **fully independent**:

```
evolutionGenetic.js      → Works alone
evolutionGameTheory.js   → Works alone
evolutionCultural.js     → Works alone
```

### 🔗 Combined System

```
evolutionHybrid.js → Requires all three modules
```

## Data Flow

### Base Simulation (No Evolution)
```
Agent Interaction → Color Transfer → No Fitness → No Evolution
```

### With Genetic Evolution
```
Agent Interaction → Fitness Accumulation → Selection → Reproduction → Mutation
```

### With Game Theory
```
Agent Interaction → Payoff Matrix → Fitness Update → Strategy Tracking
```

### With Cultural Evolution
```
Agent Interaction → Belief Transfer → Persuasion → Social Learning
```

### Hybrid System
```
Agent Interaction
    ├→ Game Theory (payoffs) ────────┐
    ├→ Cultural (beliefs) ───────────┼→ Fitness
    └→ Genetic (traits) ─────────────┘
                │
                ▼
         Reproduction & Selection
                │
                ▼
         Next Generation
```

## Interaction Timeline (Hybrid Mode)

```
Frame N:
  1. Agent updates position (flocking)
  2. Agent checks proximity to others
  3. If close enough:
     a. Game Theory calculates payoffs → fitness
     b. Cultural transmits beliefs → colors
     c. Genetic applies genome to behavior
  4. Display agent

Frame N+300 (Generation End):
  1. Sort agents by fitness
  2. Kill bottom 50%
  3. Reproduce top 50%
  4. Apply mutations to offspring
  5. Reset fitness counters
  6. Continue simulation
```

## File Responsibilities

| File | Purpose | Dependencies |
|------|---------|--------------|
| `sketch.js` | Core simulation, agent class, flocking | p5.js |
| `evolutionGenetic.js` | Genome, reproduction, mutation | None (standalone) |
| `evolutionGameTheory.js` | Payoff matrix, strategy tracking | None (standalone) |
| `evolutionCultural.js` | Belief dynamics, social learning | None (standalone) |
| `evolutionHybrid.js` | Combines all three systems | All three evolution modules |
| `index-*.html` | HTML entry points | Corresponding evolution modules |

## Extension Points

### Adding a New Evolution System

1. **Create module**: `evolutionCustom.js`
   ```javascript
   class CustomEvolution {
     initializeAgent(agent) { }
     update(agent, agents) { }
     evolvePopulation(agents) { return agents; }
     processInteraction(agent1, agent2) { }
     getControls(parent) { }
     updateUI(agents) { }
   }
   ```

2. **Create HTML**: `index-custom.html`
   ```html
   <script src="evolutionCustom.js"></script>
   <script>window.evolutionMode = 'custom';</script>
   ```

3. **Update sketch.js**: Add case to `initializeEvolutionSystem()`
   ```javascript
   case 'custom':
     evolutionSystem = new CustomEvolution();
     break;
   ```

## Performance Considerations

- **Agent count**: Scales O(n²) for interactions
- **Evolution overhead**:
  - Genetic: Minimal (only on generation boundaries)
  - Game Theory: Low (simple math per interaction)
  - Cultural: Low (color math per interaction)
  - Hybrid: Moderate (all three combined)

- **Optimization tips**:
  - Reduce agent count for smoother performance
  - Increase generation length for less frequent reproduction
  - Adjust proximity radius to reduce interaction checks

---

**Built for experimentation and research! 🧪**
