#!/usr/bin/env node

/**
 * Embedding Generation Script
 * 
 * This script generates embeddings for services in the AI Marketplace.
 * It can process all services, specific services, or only outdated embeddings.
 * 
 * Usage:
 *   node scripts/generate-embeddings.js all                    # Process all services
 *   node scripts/generate-embeddings.js outdated              # Process only outdated
 *   node scripts/generate-embeddings.js specific service1,service2  # Process specific services
 *   
 * Options:
 *   --dry-run         Simulate without making changes
 *   --batch-size N    Process N services at a time (default: 10)
 *   --max-concurrent N Maximum concurrent batches (default: 2)
 *   --help            Show this help message
 */

const { runEmbeddingPipeline } = require('../dist/lib/ai/semantic-search/embedding-pipeline');

// Firebase configuration from environment variables
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Validate required environment variables
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these in your .env.local file');
  process.exit(1);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    showHelp();
    process.exit(0);
  }
  
  const mode = args[0];
  if (!['all', 'outdated', 'specific'].includes(mode)) {
    console.error(`❌ Invalid mode: ${mode}`);
    showHelp();
    process.exit(1);
  }
  
  const config = {
    dryRun: args.includes('--dry-run'),
    batchSize: 10,
    maxConcurrentBatches: 2,
    enableProgressTracking: true,
  };
  
  // Parse batch size
  const batchSizeIndex = args.indexOf('--batch-size');
  if (batchSizeIndex !== -1 && args[batchSizeIndex + 1]) {
    config.batchSize = parseInt(args[batchSizeIndex + 1]);
    if (isNaN(config.batchSize) || config.batchSize < 1) {
      console.error('❌ Invalid batch size');
      process.exit(1);
    }
  }
  
  // Parse max concurrent
  const maxConcurrentIndex = args.indexOf('--max-concurrent');
  if (maxConcurrentIndex !== -1 && args[maxConcurrentIndex + 1]) {
    config.maxConcurrentBatches = parseInt(args[maxConcurrentIndex + 1]);
    if (isNaN(config.maxConcurrentBatches) || config.maxConcurrentBatches < 1) {
      console.error('❌ Invalid max concurrent value');
      process.exit(1);
    }
  }
  
  // Parse service IDs for specific mode
  let serviceIds = [];
  if (mode === 'specific') {
    const serviceIdArg = args[1];
    if (!serviceIdArg) {
      console.error('❌ Service IDs required for specific mode');
      console.error('   Usage: node scripts/generate-embeddings.js specific service1,service2,service3');
      process.exit(1);
    }
    serviceIds = serviceIdArg.split(',').map(id => id.trim()).filter(id => id.length > 0);
    if (serviceIds.length === 0) {
      console.error('❌ No valid service IDs provided');
      process.exit(1);
    }
  }
  
  return { mode, config, serviceIds };
}

function showHelp() {
  console.log(`
🚀 AI Marketplace Embedding Generation Script

USAGE:
  node scripts/generate-embeddings.js <mode> [options]

MODES:
  all         Process all services in the database
  outdated    Process only services with outdated embeddings
  specific    Process specific services by ID

OPTIONS:
  --dry-run           Simulate without making changes
  --batch-size N      Process N services at a time (default: 10)
  --max-concurrent N  Maximum concurrent batches (default: 2)
  --help              Show this help message

EXAMPLES:
  # Process all services
  node scripts/generate-embeddings.js all

  # Process only outdated embeddings
  node scripts/generate-embeddings.js outdated

  # Process specific services
  node scripts/generate-embeddings.js specific service1,service2,service3

  # Dry run with custom batch size
  node scripts/generate-embeddings.js all --dry-run --batch-size 20

ENVIRONMENT VARIABLES:
  FIREBASE_PROJECT_ID    Firebase project ID
  OPENAI_API_KEY        OpenAI API key for embeddings
  FIREBASE_API_KEY      Firebase API key (optional)
  FIREBASE_AUTH_DOMAIN  Firebase auth domain (optional)

COST ESTIMATION:
  - Uses text-embedding-3-small model ($0.00002 per 1K tokens)
  - Average service: ~500 tokens = $0.00001 per service
  - 1000 services: ~$0.01
  - 10000 services: ~$0.10
`);
}

function logConfig(mode, config, serviceIds) {
  console.log('🔧 Configuration:');
  console.log(`├── Mode: ${mode}`);
  console.log(`├── Dry Run: ${config.dryRun ? 'Yes' : 'No'}`);
  console.log(`├── Batch Size: ${config.batchSize}`);
  console.log(`├── Max Concurrent: ${config.maxConcurrentBatches}`);
  console.log(`├── Progress Tracking: ${config.enableProgressTracking ? 'Enabled' : 'Disabled'}`);
  
  if (mode === 'specific') {
    console.log(`└── Service IDs: ${serviceIds.length} services`);
    if (serviceIds.length <= 10) {
      serviceIds.forEach((id, index) => {
        const prefix = index === serviceIds.length - 1 ? '    └──' : '    ├──';
        console.log(`${prefix} ${id}`);
      });
    } else {
      console.log(`    ├── ${serviceIds.slice(0, 5).join(', ')}`);
      console.log(`    └── ... and ${serviceIds.length - 5} more`);
    }
  } else {
    console.log('└── Target: All applicable services');
  }
  console.log('');
}

async function main() {
  try {
    const { mode, config, serviceIds } = parseArgs();
    
    console.log('🚀 Starting AI Marketplace Embedding Generation\n');
    
    logConfig(mode, config, serviceIds);
    
    if (config.dryRun) {
      console.log('🧪 DRY RUN MODE - No changes will be made\n');
    }
    
    // Show cost warning for large batches
    if (mode === 'all' && !config.dryRun) {
      console.log('💰 Cost Warning: This will process all services in your database.');
      console.log('   Estimated cost depends on the number and size of services.');
      console.log('   Consider running with --dry-run first to estimate costs.\n');
      
      // Simple confirmation prompt
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        rl.question('Do you want to continue? (y/N): ', (answer) => {
          rl.close();
          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled');
            process.exit(0);
          }
          resolve();
        });
      });
    }
    
    // Start pipeline
    const startTime = Date.now();
    
    const result = await runEmbeddingPipeline(firebaseConfig, {
      mode,
      serviceIds: mode === 'specific' ? serviceIds : undefined,
      config,
    });
    
    const duration = Date.now() - startTime;
    
    // Log final results
    console.log('\n🎉 Embedding generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`├── Duration: ${Math.round(duration / 1000)}s`);
    console.log(`├── Total Services: ${result.totalServices}`);
    console.log(`├── Processed: ${result.processedServices}`);
    console.log(`├── Successful: ${result.successfulEmbeddings}`);
    console.log(`├── Failed: ${result.failedEmbeddings}`);
    console.log(`└── Skipped: ${result.skippedServices}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.slice(0, 5).forEach(error => {
        console.log(`   └── ${error.serviceId}: ${error.error}`);
      });
      if (result.errors.length > 5) {
        console.log(`   └── ... and ${result.errors.length - 5} more errors`);
      }
    }
    
    console.log('\n✅ All done!');
    
  } catch (error) {
    console.error('\n❌ Embedding generation failed:');
    console.error(`   ${error.message}`);
    
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error('\n🔍 Stack trace:');
      console.error(error.stack);
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('   - Check your environment variables');
    console.error('   - Verify Firebase project access');
    console.error('   - Ensure OpenAI API key is valid');
    console.error('   - Try running with --dry-run first');
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}