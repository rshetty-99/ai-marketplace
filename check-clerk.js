// Script to check Clerk configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Clerk Configuration...\n');

// Check if .env.local exists and read it
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  console.log('📋 Clerk Environment Variables:\n');
  
  lines.forEach(line => {
    if (line.includes('CLERK')) {
      const [key, value] = line.split('=');
      if (key && value) {
        // Mask the actual key value for security
        const maskedValue = value.substring(0, 10) + '...' + (value.length > 10 ? ' (' + value.length + ' chars)' : '');
        console.log(`  ${key.trim()} = ${maskedValue}`);
      }
    }
  });
  
  console.log('\n✅ Validation Checks:\n');
  
  // Check for required Clerk variables
  const hasPublishableKey = envContent.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=');
  const hasSecretKey = envContent.includes('CLERK_SECRET_KEY=');
  
  console.log(`  Public Key Present: ${hasPublishableKey ? '✅' : '❌'}`);
  console.log(`  Secret Key Present: ${hasSecretKey ? '✅' : '❌'}`);
  
  // Check key format
  const publishableKeyMatch = envContent.match(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=([^\n\r]*)/);
  const secretKeyMatch = envContent.match(/CLERK_SECRET_KEY=([^\n\r]*)/);
  
  if (publishableKeyMatch && publishableKeyMatch[1]) {
    const pubKey = publishableKeyMatch[1].trim();
    const isPubKeyValid = pubKey.startsWith('pk_test_') || pubKey.startsWith('pk_live_');
    console.log(`  Public Key Format: ${isPubKeyValid ? '✅ Valid' : '❌ Invalid (should start with pk_test_ or pk_live_)'}`);
  }
  
  if (secretKeyMatch && secretKeyMatch[1]) {
    const secKey = secretKeyMatch[1].trim();
    const isSecKeyValid = secKey.startsWith('sk_test_') || secKey.startsWith('sk_live_');
    console.log(`  Secret Key Format: ${isSecKeyValid ? '✅ Valid' : '❌ Invalid (should start with sk_test_ or sk_live_)'}`);
  }
  
  console.log('\n💡 Common Issues:\n');
  console.log('  1. Make sure keys are from an active Clerk application');
  console.log('  2. Check that there are no extra spaces or quotes around the keys');
  console.log('  3. Ensure you\'re using the correct environment (test vs live)');
  console.log('  4. Verify your Clerk application is not paused/deleted');
  
} else {
  console.log('❌ .env.local file not found!');
  console.log('   Please create it and add your Clerk keys.');
}

console.log('\n🔗 Get your keys from: https://dashboard.clerk.com');
console.log('\n📝 Example .env.local format:');
console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123...');
console.log('CLERK_SECRET_KEY=sk_test_xyz789...');