# Evolution System Test Report

**Generated:** 1/13/2026, 4:21:46 PM

**Overall Status:** ✅ ALL TESTS PASSED

---

## GENETIC Evolution

**Status:** ✅ PASSED

### Results

- Generation: 0
- Average Fitness: 0.00
- Genetic Diversity: 0.0852
- Has Genome: ✓

### Console Output

```
✓ All agents have genomes: true
✓ Genomes have all properties: true
✓ All agents have fitness: true
✓ Fitness range: 0.00 to 0.00, avg: 0.00
✓ Current generation: 0
✓ Honesty diversity (variance): 0.0852
```

---

## GAMETHEORY Evolution

**Status:** ✅ PASSED

### Results

- Honest Fitness: 0.00
- Liar Fitness: 0.00
- Stubborn Fitness: 0.00
- Avg Interactions: 5.3

### Console Output

```
✓ All agents have fitness: true
✓ Agents with non-zero fitness: 0/150
✓ Avg fitness - Honest: 0.00, Liar: 0.00, Stubborn: 0.00
✓ Payoff matrix defined: true
✓ Average active interactions per agent: 5.33
```

---

## CULTURAL Evolution

**Status:** ✅ PASSED

### Results

- Average Belief: 0.66
- Honest Belief: 0.65
- Liar Belief: 0.65
- Belief Variance: 0.0433

### Console Output

```
✓ All agents have belief strength: true
✓ Belief strength range: 0.30 to 0.99, avg: 0.66
✓ Avg belief - Honest: 0.65, Liar: 0.65, Stubborn: 0.69
✓ Baseline beliefs recorded
✓ Belief diversity (variance): 0.0433
```

---

## HYBRID Evolution

**Status:** ✅ PASSED

### Results

#### Genetic Component
- Generation: 0
- Avg Fitness: 0.00

#### Game Theory Component
- Honest: 0.00
- Liar: 0.00

#### Cultural Component
- Avg Belief: 0.67

**Integration Status:** ✓

### Console Output

```
✓ All agents have genomes: true
✓ Genomes have all properties: true
✓ All agents have fitness: true
✓ Fitness range: 0.00 to 0.00, avg: 0.00
✓ Current generation: 0
✓ Honesty diversity (variance): 0.0814
✓ All agents have fitness: true
✓ Agents with non-zero fitness: 0/150
✓ Avg fitness - Honest: 0.00, Liar: 0.00, Stubborn: 0.00
✓ Payoff matrix defined: true
✓ Average active interactions per agent: 4.75
✓ All agents have belief strength: true
✓ Belief strength range: 0.31 to 0.99, avg: 0.67
✓ Avg belief - Honest: 0.67, Liar: 0.67, Stubborn: 0.62
✓ Baseline beliefs recorded
✓ Belief diversity (variance): 0.0458
✓ All systems integrated: true
```

---

## Summary

| Mode | Status |
|------|--------|
| genetic | ✅ PASSED |
| gametheory | ✅ PASSED |
| cultural | ✅ PASSED |
| hybrid | ✅ PASSED |
