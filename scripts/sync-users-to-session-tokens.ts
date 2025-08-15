#!/usr/bin/env tsx

/**
 * Sync Users to Session Tokens Script
 * 
 * This script syncs existing user data from Firestore to Clerk session token claims.
 * Use this for initial migration or to fix inconsistent session token data.
 * 
 * Usage:
 *   npx tsx scripts/sync-users-to-session-tokens.ts [options]
 * 
 * Options:
 *   --dry-run          Show what would be synced without making changes
 *   --user-id <id>     Sync specific user only
 *   --batch-size <n>   Number of users to process per batch (default: 10)
 *   --verbose          Show detailed output
 *   --force            Force sync even if user seems up to date
 */

import { Command } from 'commander';
import { bulkSyncUsersToSessionClaims, syncUserToSessionClaims } from '../src/lib/auth/session-management';
import { getAdminDb } from '../src/lib/firebase';
import { logger } from '../src/lib/utils/logger';

interface ScriptOptions {
  dryRun?: boolean;
  userId?: string;
  batchSize?: number;
  verbose?: boolean;
  force?: boolean;
}

const program = new Command();

program
  .name('sync-users-to-session-tokens')
  .description('Sync user data from Firestore to Clerk session token claims')
  .option('--dry-run', 'Show what would be synced without making changes')
  .option('--user-id <id>', 'Sync specific user only')
  .option('--batch-size <n>', 'Number of users to process per batch', '10')
  .option('--verbose', 'Show detailed output')
  .option('--force', 'Force sync even if user seems up to date')
  .parse();

const options: ScriptOptions = program.opts();

async function syncSpecificUser(userId: string, options: ScriptOptions): Promise<void> {
  console.log(`\n🔄 Syncing user: ${userId}`);
  
  if (options.dryRun) {
    console.log('✅ [DRY RUN] Would sync user session claims');
    return;
  }

  try {
    await syncUserToSessionClaims(userId);
    console.log('✅ User synced successfully');
  } catch (error) {
    console.error('❌ Failed to sync user:', (error as Error).message);
    throw error;
  }
}

async function syncAllUsers(options: ScriptOptions): Promise<void> {
  console.log('\n🔍 Fetching all users from Firestore...');
  
  const adminDb = await getAdminDb();
  const usersSnapshot = await adminDb.collection('users').get();
  const allUsers = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));

  console.log(`📊 Found ${allUsers.length} users to process`);

  if (options.dryRun) {
    console.log('\n📋 [DRY RUN] Users that would be synced:');
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.id} (${user.data.email || 'no email'}) - ${user.data.userType || 'no type'}`);
    });
    console.log(`\n✅ [DRY RUN] Would sync ${allUsers.length} users in batches of ${options.batchSize}`);
    return;
  }

  // Filter users if not forcing sync
  let usersToSync = allUsers;
  if (!options.force) {
    // Add logic here to filter users that might not need syncing
    // For now, sync all users
    console.log('ℹ️  Use --force to sync all users regardless of current state');
  }

  const userIds = usersToSync.map(user => user.id);
  console.log(`\n🚀 Starting bulk sync for ${userIds.length} users...`);
  console.log(`📦 Batch size: ${options.batchSize}`);

  const startTime = Date.now();
  
  try {
    const result = await bulkSyncUsersToSessionClaims(userIds, parseInt(options.batchSize || '10'));
    
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log(`\n📈 Sync Results (${minutes}m ${seconds}s):`);
    console.log(`  ✅ Succeeded: ${result.succeeded.length}`);
    console.log(`  ❌ Failed: ${result.failed.length}`);
    console.log(`  📊 Success Rate: ${((result.succeeded.length / userIds.length) * 100).toFixed(1)}%`);

    if (result.failed.length > 0) {
      console.log('\n❌ Failed Users:');
      result.failed.forEach((failure, index) => {
        console.log(`  ${index + 1}. ${failure.userId}: ${failure.error}`);
      });
    }

    if (options.verbose && result.succeeded.length > 0) {
      console.log('\n✅ Successfully Synced Users:');
      result.succeeded.forEach((userId, index) => {
        console.log(`  ${index + 1}. ${userId}`);
      });
    }

  } catch (error) {
    console.error('\n💥 Bulk sync failed:', (error as Error).message);
    throw error;
  }
}

async function validateEnvironment(): Promise<void> {
  console.log('🔍 Validating environment...');

  // Check required environment variables
  const requiredEnvVars = [
    'CLERK_SECRET_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    throw new Error('Environment validation failed');
  }

  // Test Firebase connection
  try {
    const adminDb = await getAdminDb();
    const testQuery = await adminDb.collection('users').limit(1).get();
    console.log('✅ Firebase connection verified');
  } catch (error) {
    console.error('❌ Firebase connection failed:', (error as Error).message);
    throw error;
  }

  console.log('✅ Environment validation passed\n');
}

async function main(): Promise<void> {
  console.log('🚀 AI Marketplace - User Session Token Sync');
  console.log('============================================');

  try {
    await validateEnvironment();

    if (options.userId) {
      await syncSpecificUser(options.userId, options);
    } else {
      await syncAllUsers(options);
    }

    console.log('\n🎉 Sync completed successfully!');
    
    if (!options.dryRun) {
      console.log('\n📝 Next Steps:');
      console.log('  1. Test session tokens in your application');
      console.log('  2. Verify user permissions are working correctly');
      console.log('  3. Check onboarding redirects for new users');
      console.log('  4. Monitor webhook logs for ongoing sync');
    }

  } catch (error) {
    console.error('\n💥 Script failed:', (error as Error).message);
    
    if (options.verbose) {
      console.error('\nStack trace:', (error as Error).stack);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Verify environment variables are set correctly');
    console.log('  2. Check Firebase and Clerk permissions');
    console.log('  3. Ensure session token template is configured in Clerk');
    console.log('  4. Review user data structure in Firestore');
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled promise rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

export { main as syncUsersToSessionTokens };