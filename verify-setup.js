// Quick script to verify environment setup
console.log('🔍 Verifying AI Marketplace Setup...\n');

// Check for required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

const envFile = require('fs').existsSync('.env.local');
console.log(`✅ .env.local file exists: ${envFile ? 'Yes' : 'No'}`);

if (!envFile) {
  console.log('\n⚠️  Please create a .env.local file with your Clerk keys:');
  console.log('   cp .env.example .env.local');
  console.log('   Then add your Clerk keys from https://dashboard.clerk.com\n');
}

// Check if key dependencies are installed
const packageJson = require('./package.json');
const dependencies = packageJson.dependencies;

const requiredDeps = [
  '@clerk/nextjs',
  'next',
  'react',
  'react-dom',
  '@radix-ui/react-dialog',
  'tailwindcss'
];

console.log('\n📦 Checking dependencies:');
requiredDeps.forEach(dep => {
  const installed = dependencies[dep] ? '✅' : '❌';
  console.log(`  ${installed} ${dep}: ${dependencies[dep] || 'Not installed'}`);
});

console.log('\n🎯 Next Steps:');
console.log('1. Make sure your .env.local has valid Clerk keys');
console.log('2. Run: npm run dev');
console.log('3. Visit: http://localhost:3000');
console.log('4. You should see "Sign In" and "Get Started" buttons in the header');
console.log('\n📍 Key Files:');
console.log('   - Header: src/components/shared/navigation/header.tsx');
console.log('   - Homepage: src/app/page.tsx');
console.log('   - Middleware: src/middleware.ts');
console.log('   - Sign In: src/app/sign-in/[[...sign-in]]/page.tsx');
console.log('   - Dashboard: src/app/(dashboard)/dashboard/page.tsx');