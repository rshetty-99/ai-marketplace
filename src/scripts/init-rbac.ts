#!/usr/bin/env tsx
/**
 * RBAC Initialization Script
 * 
 * This script initializes all RBAC collections in Firestore with:
 * - Enhanced permissions (50+ granular permissions)
 * - Enhanced roles (20+ roles including Platform Finance Manager, Technology Analyst, Mediator)
 * - Permission groups for UI organization
 * - Role categories for dropdown organization
 * 
 * Usage:
 * - Development: npm run init-rbac:dev
 * - Production: npm run init-rbac:prod
 */

import { RBACCollectionManager } from '../lib/firebase/rbac-collections';
import { ENHANCED_ROLES } from '../lib/firebase/rbac-roles';

const COLLECTIONS_INFO = {
  'rbac_permissions': '50+ granular permissions across all categories',
  'rbac_permission_groups': '21 UI groups for organizing permissions',
  'rbac_role_categories': '9 role categories for organization',
  'rbac_roles': `${Object.keys(ENHANCED_ROLES).length} comprehensive roles including platform roles`
};

async function initializeRBAC() {
  console.log('🚀 Starting RBAC initialization...\n');
  
  console.log('📋 Collections to be created/updated:');
  Object.entries(COLLECTIONS_INFO).forEach(([collection, description]) => {
    console.log(`  - ${collection}: ${description}`);
  });
  console.log('');

  try {
    console.log('⏳ Initializing RBAC collections...');
    await RBACCollectionManager.initializeCollections();
    
    console.log('\n✅ RBAC initialization completed successfully!');
    console.log('\n📊 Summary of initialized data:');
    console.log(`  - Platform Roles: Super Admin, Operations Manager, Finance Manager, Technology Analyst, Mediator, Support Specialist`);
    console.log(`  - Vendor Roles: Admin, Project Manager, Finance Manager, Sales Manager, Quality Manager, Customer Success Manager, Project Lead, Project Engineer, Data Analyst`);
    console.log(`  - Customer Roles: Admin, Project Manager, Finance Manager, Procurement Manager, Project Lead`);
    console.log(`  - Freelancer Role: Comprehensive individual service provider role`);
    console.log(`  - Total Permissions: 50+ granular permissions across 21 categories`);
    
    console.log('\n🎯 Next Steps:');
    console.log('  1. Update your UI components to fetch roles from Firestore collections');
    console.log('  2. Replace hard-coded role lists with dynamic queries');
    console.log('  3. Test role assignment workflows');
    console.log('  4. Verify permission checks work with new structure');
    
  } catch (error) {
    console.error('❌ RBAC initialization failed:', error);
    process.exit(1);
  }
}

async function verifyCollections() {
  console.log('\n🔍 Verifying initialized collections...');
  
  try {
    const [permissions, roles, groups, categories] = await Promise.all([
      RBACCollectionManager.getPermissions(),
      RBACCollectionManager.getRoles(),
      RBACCollectionManager.getPermissionGroups(),
      RBACCollectionManager.getRoleCategories()
    ]);
    
    console.log(`✅ Permissions: ${permissions.length} documents`);
    console.log(`✅ Roles: ${roles.length} documents`);
    console.log(`✅ Permission Groups: ${groups.length} documents`);
    console.log(`✅ Role Categories: ${categories.length} documents`);
    
    // Verify specific roles exist
    const platformRoles = roles.filter(r => r.userType === 'platform');
    const vendorRoles = roles.filter(r => r.userType === 'vendor');
    const customerRoles = roles.filter(r => r.userType === 'customer');
    const freelancerRoles = roles.filter(r => r.userType === 'freelancer');
    
    console.log('\n📋 Role Distribution:');
    console.log(`  - Platform: ${platformRoles.length} roles`);
    console.log(`  - Vendor: ${vendorRoles.length} roles`);
    console.log(`  - Customer: ${customerRoles.length} roles`);
    console.log(`  - Freelancer: ${freelancerRoles.length} roles`);
    
    // Verify new platform roles
    const financeManager = roles.find(r => r.id === 'platform_finance_manager');
    const techAnalyst = roles.find(r => r.id === 'platform_technology_analyst');
    const mediator = roles.find(r => r.id === 'platform_mediator');
    
    console.log('\n🎯 Requested Platform Roles:');
    console.log(`  - Finance Manager: ${financeManager ? '✅ Created' : '❌ Missing'}`);
    console.log(`  - Technology Analyst: ${techAnalyst ? '✅ Created' : '❌ Missing'}`);
    console.log(`  - Mediator: ${mediator ? '✅ Created' : '❌ Missing'}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'init':
      await initializeRBAC();
      await verifyCollections();
      break;
    case 'verify':
      await verifyCollections();
      break;
    default:
      console.log('Usage: npm run init-rbac:dev [init|verify]');
      console.log('  init   - Initialize all RBAC collections');
      console.log('  verify - Verify existing collections');
      process.exit(1);
  }
}

main().catch(console.error);