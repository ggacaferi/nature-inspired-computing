const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_DURATION = 10000; // 10 seconds per test
const PORT = 8080;

async function runTests() {
  console.log('🚀 Starting Evolution System Tests...\n');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  const modes = [
    { name: 'genetic', file: 'index-genetic.html' },
    { name: 'gametheory', file: 'index-gametheory.html' },
    { name: 'cultural', file: 'index-cultural.html' },
    { name: 'hybrid', file: 'index-hybrid.html' }
  ];
  
  for (const mode of modes) {
    console.log(`\n📊 Testing ${mode.name} mode...`);
    const page = await browser.newPage();
    
    // Capture console logs
    const logs = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    try {
      await page.goto(`http://localhost:${PORT}/${mode.file}`, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for simulation to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run test
      const testResult = await page.evaluate((modeName, duration) => {
        return new Promise((resolve) => {
          // Wait for agents and system to be ready
          let attempts = 0;
          const maxAttempts = 200; // 20 seconds max
          
          const checkReady = setInterval(() => {
            attempts++;
            
            if (window.agents && window.agents.length > 0 && window.evolutionSystem) {
              clearInterval(checkReady);
              
              // Wait a bit for simulation to run
              setTimeout(() => {
                if (window.evolutionTester) {
                  const result = window.evolutionTester.runTest(
                    modeName, 
                    window.agents, 
                    window.evolutionSystem
                  );
                  resolve({ success: true, result });
                } else {
                  resolve({ success: false, error: 'EvolutionTester not found' });
                }
              }, duration);
            } else if (attempts >= maxAttempts) {
              clearInterval(checkReady);
              resolve({ 
                success: false, 
                error: `Timeout: agents=${!!window.agents}, len=${window.agents?.length}, system=${!!window.evolutionSystem}, tester=${!!window.evolutionTester}` 
              });
            }
          }, 100);
        });
      }, mode.name, TEST_DURATION);
      
      if (testResult.success) {
        const passed = validateTestResult(mode.name, testResult.result);
        results.tests.push({
          mode: mode.name,
          passed,
          result: testResult.result,
          logs: logs.filter(log => log.includes('✓') || log.includes('✗'))
        });
        console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      } else {
        results.tests.push({
          mode: mode.name,
          passed: false,
          error: testResult.error,
          logs
        });
        console.log(`   ❌ FAILED: ${testResult.error}`);
      }
    } catch (error) {
      results.tests.push({
        mode: mode.name,
        passed: false,
        error: error.message,
        logs
      });
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    await page.close();
  }
  
  await browser.close();
  
  // Generate report
  generateReport(results);
  
  console.log('\n✨ Tests complete! Report saved to report.md\n');
  
  // Exit with appropriate code
  const allPassed = results.tests.every(test => test.passed);
  process.exit(allPassed ? 0 : 1);
}

function validateTestResult(mode, result) {
  if (!result) return false;
  
  switch (mode) {
    case 'genetic':
      return result.hasGenome && 
             result.generation >= 0 && 
             result.avgFitness >= 0 &&
             result.diversity >= 0;
    
    case 'gametheory':
      return result.avgHonest !== undefined &&
             result.avgLiar !== undefined &&
             result.avgStubborn !== undefined &&
             result.avgInteractions >= 0;
    
    case 'cultural':
      return result.avgBelief !== undefined &&
             result.avgHonestBelief !== undefined &&
             result.avgLiarBelief !== undefined &&
             result.beliefVariance >= 0;
    
    case 'hybrid':
      return result.genetic && 
             result.gameTheory && 
             result.cultural &&
             result.integrated === true;
    
    default:
      return false;
  }
}

function generateReport(results) {
  const allPassed = results.tests.every(test => test.passed);
  
  let markdown = `# Evolution System Test Report\n\n`;
  markdown += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n\n`;
  markdown += `**Overall Status:** ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n\n`;
  markdown += `---\n\n`;
  
  for (const test of results.tests) {
    markdown += `## ${test.mode.toUpperCase()} Evolution\n\n`;
    markdown += `**Status:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    if (test.error) {
      markdown += `**Error:** ${test.error}\n\n`;
    } else if (test.result) {
      markdown += `### Results\n\n`;
      
      if (test.mode === 'genetic') {
        markdown += `- Generation: ${test.result.generation}\n`;
        markdown += `- Average Fitness: ${test.result.avgFitness?.toFixed(2)}\n`;
        markdown += `- Genetic Diversity: ${test.result.diversity?.toFixed(4)}\n`;
        markdown += `- Has Genome: ${test.result.hasGenome ? '✓' : '✗'}\n`;
      } else if (test.mode === 'gametheory') {
        markdown += `- Honest Fitness: ${test.result.avgHonest?.toFixed(2)}\n`;
        markdown += `- Liar Fitness: ${test.result.avgLiar?.toFixed(2)}\n`;
        markdown += `- Stubborn Fitness: ${test.result.avgStubborn?.toFixed(2)}\n`;
        markdown += `- Avg Interactions: ${test.result.avgInteractions?.toFixed(1)}\n`;
      } else if (test.mode === 'cultural') {
        markdown += `- Average Belief: ${test.result.avgBelief?.toFixed(2)}\n`;
        markdown += `- Honest Belief: ${test.result.avgHonestBelief?.toFixed(2)}\n`;
        markdown += `- Liar Belief: ${test.result.avgLiarBelief?.toFixed(2)}\n`;
        markdown += `- Belief Variance: ${test.result.beliefVariance?.toFixed(4)}\n`;
      } else if (test.mode === 'hybrid') {
        markdown += `#### Genetic Component\n`;
        markdown += `- Generation: ${test.result.genetic?.generation}\n`;
        markdown += `- Avg Fitness: ${test.result.genetic?.avgFitness?.toFixed(2)}\n\n`;
        markdown += `#### Game Theory Component\n`;
        markdown += `- Honest: ${test.result.gameTheory?.avgHonest?.toFixed(2)}\n`;
        markdown += `- Liar: ${test.result.gameTheory?.avgLiar?.toFixed(2)}\n\n`;
        markdown += `#### Cultural Component\n`;
        markdown += `- Avg Belief: ${test.result.cultural?.avgBelief?.toFixed(2)}\n\n`;
        markdown += `**Integration Status:** ${test.result.integrated ? '✓' : '✗'}\n`;
      }
      
      markdown += `\n`;
    }
    
    if (test.logs && test.logs.length > 0) {
      markdown += `### Console Output\n\n`;
      markdown += '```\n';
      test.logs.forEach(log => markdown += `${log}\n`);
      markdown += '```\n';
    }
    
    markdown += `\n---\n\n`;
  }
  
  markdown += `## Summary\n\n`;
  markdown += `| Mode | Status |\n`;
  markdown += `|------|--------|\n`;
  results.tests.forEach(test => {
    markdown += `| ${test.mode} | ${test.passed ? '✅ PASSED' : '❌ FAILED'} |\n`;
  });
  
  fs.writeFileSync(path.join(__dirname, 'report.md'), markdown);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
