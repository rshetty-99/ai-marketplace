const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🚀 Global test setup starting...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key';
  process.env.CLERK_SECRET_KEY = 'sk_test_mock_key';
  process.env.FIREBASE_PROJECT_ID = 'ai-marketplace-test';
  process.env.FIREBASE_USE_EMULATOR = 'true';
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_stripe_key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_stripe_key';
  process.env.WEBHOOK_SECRET = 'test_webhook_secret';
  process.env.ENCRYPTION_KEY = 'a'.repeat(64); // Mock 64-char hex key
  
  try {
    // Start Firebase emulators for integration tests
    if (process.env.FIREBASE_EMULATOR !== 'false') {
      console.log('📦 Starting Firebase emulators...');
      
      // Check if firebase CLI is available
      try {
        execSync('firebase --version', { stdio: 'ignore' });
      } catch (error) {
        console.warn('⚠️  Firebase CLI not found. Skipping emulator setup.');
        console.warn('⚠️  Install with: npm install -g firebase-tools');
        return;
      }
      
      // Start emulators in background
      const emulatorProcess = execSync(
        'firebase emulators:start --only firestore,auth,storage --project ai-marketplace-test',
        {
          stdio: 'ignore',
          detached: true,
        }
      );
      
      // Store process ID for cleanup
      global.__FIREBASE_EMULATOR_PID__ = emulatorProcess.pid;
      
      // Wait for emulators to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('✅ Firebase emulators started');
    }
    
    // Initialize test database with seed data
    console.log('🌱 Seeding test database...');
    await seedTestDatabase();
    
    console.log('✅ Global test setup completed');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
};

async function seedTestDatabase() {
  // TODO: Implement test database seeding
  // This would typically involve:
  // 1. Clearing existing test data
  // 2. Creating test organizations
  // 3. Creating test users with various roles
  // 4. Creating test services and providers
  // 5. Setting up test relationships
  
  console.log('📝 Test database seeding completed');
}