import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Playwright global teardown starting...');
  
  try {
    // Clean up authentication state files
    const authStatePath = 'tests/fixtures/auth-state.json';
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath);
      console.log('🗑️  Cleaned up authentication state');
    }
    
    // Clean up test artifacts on success
    if (process.env.CLEAN_ARTIFACTS_ON_SUCCESS === 'true') {
      await cleanupArtifacts();
    }
    
    // Generate test report summary
    await generateReportSummary();
    
    // Archive test results if in CI
    if (process.env.CI) {
      await archiveTestResults();
    }
    
    console.log('✅ Playwright global teardown completed');
  } catch (error) {
    console.error('❌ Playwright global teardown failed:', error);
    // Don't throw to avoid masking test failures
  }
}

async function cleanupArtifacts() {
  try {
    console.log('🧹 Cleaning up test artifacts...');
    
    const artifactDirs = [
      'test-results/playwright-artifacts',
      'test-results/screenshots',
      'test-results/videos',
      'test-results/traces',
    ];
    
    for (const dir of artifactDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    
    console.log('✅ Test artifacts cleaned up');
  } catch (error) {
    console.warn('⚠️  Failed to clean up some artifacts:', error);
  }
}

async function generateReportSummary() {
  try {
    console.log('📊 Generating test report summary...');
    
    const resultsPath = 'test-results/playwright-results.json';
    if (!fs.existsSync(resultsPath)) {
      console.log('⚠️  No test results found, skipping summary generation');
      return;
    }
    
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    
    const summary = {
      timestamp: new Date().toISOString(),
      config: {
        projects: results.config?.projects?.map((p: any) => p.name) || [],
        timeout: results.config?.timeout || 0,
        workers: results.config?.workers || 0,
      },
      stats: {
        total: results.suites?.reduce((acc: number, suite: any) => 
          acc + (suite.specs?.length || 0), 0) || 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
      },
      duration: results.stats?.duration || 0,
      environment: {
        node: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
      },
    };
    
    // Calculate test statistics
    results.suites?.forEach((suite: any) => {
      suite.specs?.forEach((spec: any) => {
        spec.tests?.forEach((test: any) => {
          const results = test.results || [];
          if (results.length === 0) {
            summary.stats.skipped++;
          } else if (results.every((r: any) => r.status === 'passed')) {
            summary.stats.passed++;
          } else if (results.some((r: any) => r.status === 'passed')) {
            summary.stats.flaky++;
          } else {
            summary.stats.failed++;
          }
        });
      });
    });
    
    const summaryPath = 'test-results/e2e-summary.json';
    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Generate human-readable summary
    const readableSummary = `
# E2E Test Summary

**Test Run:** ${summary.timestamp}

## Results
- ✅ Passed: ${summary.stats.passed}
- ❌ Failed: ${summary.stats.failed}
- ⚠️ Flaky: ${summary.stats.flaky}
- ⏭️ Skipped: ${summary.stats.skipped}
- 📊 Total: ${summary.stats.total}

## Performance
- Duration: ${Math.round(summary.duration / 1000)}s
- Projects: ${summary.config.projects.join(', ')}
- Workers: ${summary.config.workers}

## Environment
- Node: ${summary.environment.node}
- Platform: ${summary.environment.platform}
- CI: ${summary.environment.ci ? 'Yes' : 'No'}
`;
    
    fs.writeFileSync('test-results/e2e-summary.md', readableSummary);
    
    console.log('✅ Test report summary generated');
    console.log(`📈 Results: ${summary.stats.passed} passed, ${summary.stats.failed} failed, ${summary.stats.flaky} flaky`);
  } catch (error) {
    console.warn('⚠️  Failed to generate test report summary:', error);
  }
}

async function archiveTestResults() {
  try {
    console.log('📦 Archiving test results for CI...');
    
    const archiveName = `e2e-results-${Date.now()}.tar.gz`;
    const { execSync } = require('child_process');
    
    // Create archive of test results
    execSync(`tar -czf ${archiveName} test-results/`, {
      stdio: 'ignore',
      cwd: process.cwd(),
    });
    
    console.log(`✅ Test results archived as ${archiveName}`);
    
    // In a real CI environment, you might upload this to an artifact store
    // For now, we'll just create the archive locally
  } catch (error) {
    console.warn('⚠️  Failed to archive test results:', error);
  }
}

export default globalTeardown;