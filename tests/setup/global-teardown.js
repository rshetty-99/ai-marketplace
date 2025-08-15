const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🧹 Global test teardown starting...');
  
  try {
    // Stop Firebase emulators if they were started
    if (global.__FIREBASE_EMULATOR_PID__) {
      console.log('🛑 Stopping Firebase emulators...');
      
      try {
        // Kill emulator processes
        execSync(`firebase emulators:stop --project ai-marketplace-test`, {
          stdio: 'ignore',
          timeout: 10000,
        });
        
        // Force kill if still running
        if (global.__FIREBASE_EMULATOR_PID__) {
          process.kill(global.__FIREBASE_EMULATOR_PID__, 'SIGTERM');
        }
        
        console.log('✅ Firebase emulators stopped');
      } catch (error) {
        console.warn('⚠️  Failed to stop Firebase emulators gracefully');
        
        // Force kill emulator processes
        try {
          execSync('pkill -f "firebase emulators"', { stdio: 'ignore' });
        } catch (killError) {
          console.warn('⚠️  Could not force kill emulator processes');
        }
      }
    }
    
    // Clean up test artifacts
    console.log('🗑️  Cleaning up test artifacts...');
    await cleanupTestArtifacts();
    
    // Generate test summary
    console.log('📊 Generating test summary...');
    await generateTestSummary();
    
    console.log('✅ Global test teardown completed');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
};

async function cleanupTestArtifacts() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Clean up temporary files
    const tempDirs = [
      path.join(process.cwd(), 'temp'),
      path.join(process.cwd(), '.tmp'),
      path.join(process.cwd(), 'test-results/temp'),
    ];
    
    for (const dir of tempDirs) {
      try {
        await fs.rmdir(dir, { recursive: true });
      } catch (error) {
        // Directory might not exist, that's OK
      }
    }
    
    // Clean up test screenshots on success
    if (process.env.CLEAN_SCREENSHOTS_ON_SUCCESS === 'true') {
      const screenshotDir = path.join(process.cwd(), 'test-results/screenshots');
      try {
        await fs.rmdir(screenshotDir, { recursive: true });
      } catch (error) {
        // Directory might not exist, that's OK
      }
    }
    
    console.log('✅ Test artifacts cleaned up');
  } catch (error) {
    console.warn('⚠️  Failed to clean up some test artifacts:', error.message);
  }
}

async function generateTestSummary() {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const summary = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI,
      },
      performance: {
        duration: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    };
    
    const summaryPath = path.join(process.cwd(), 'test-results/summary.json');
    await fs.mkdir(path.dirname(summaryPath), { recursive: true });
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('✅ Test summary generated');
  } catch (error) {
    console.warn('⚠️  Failed to generate test summary:', error.message);
  }
}