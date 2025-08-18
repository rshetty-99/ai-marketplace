#!/usr/bin/env tsx
/**
 * RBAC Initialization Script using Firebase Admin SDK
 * 
 * This script uses the Firebase Admin SDK to bypass security rules
 * and initialize RBAC collections directly.
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ENHANCED_ROLES } from '../lib/firebase/rbac-roles';
import { ENHANCED_PERMISSIONS } from '../lib/firebase/rbac-collections';

// Initialize Firebase Admin
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!privateKey) {
  throw new Error('FIREBASE_PRIVATE_KEY environment variable is required');
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

// Initialize admin app
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

async function initializeRBACWithAdmin() {
  console.log('🚀 Initializing RBAC collections with Firebase Admin SDK...\n');

  try {
    // Initialize Permissions
    console.log('⏳ Creating permissions...');
    const permissionsRef = db.collection('rbac_permissions');
    
    let permissionCount = 0;
    for (const [id, permission] of Object.entries(ENHANCED_PERMISSIONS)) {
      const docData = {
        id,
        name: id,
        displayName: permission.displayName,
        description: permission.description,
        category: permission.category,
        group: permission.group,
        resource: permission.resource,
        action: permission.action,
        isCore: permission.isCore,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: permission.metadata
      };
      
      await permissionsRef.doc(id).set(docData);
      permissionCount++;
    }
    console.log(`✅ Created ${permissionCount} permissions`);

    // Initialize Permission Groups
    console.log('⏳ Creating permission groups...');
    const groupsRef = db.collection('rbac_permission_groups');
    
    const groups = [
      { id: 'profile', displayName: 'Personal & Profile', description: 'Profile and personal settings management', order: 1, icon: 'User', color: '#3B82F6' },
      { id: 'projects', displayName: 'Project Management', description: 'Project lifecycle and task management', order: 2, icon: 'Briefcase', color: '#10B981' },
      { id: 'milestones', displayName: 'Milestones', description: 'Project milestone tracking', order: 3, icon: 'Flag', color: '#F59E0B' },
      { id: 'resources', displayName: 'Resource Management', description: 'Resource allocation and optimization', order: 4, icon: 'Zap', color: '#8B5CF6' },
      { id: 'billing', displayName: 'Billing & Payments', description: 'Financial transactions and billing', order: 5, icon: 'DollarSign', color: '#EF4444' },
      { id: 'budget', displayName: 'Budget Management', description: 'Budget planning and approval', order: 6, icon: 'PieChart', color: '#F97316' },
      { id: 'invoicing', displayName: 'Invoicing', description: 'Invoice creation and management', order: 7, icon: 'FileText', color: '#06B6D4' },
      { id: 'expenses', displayName: 'Expense Management', description: 'Business expense tracking', order: 8, icon: 'Receipt', color: '#84CC16' },
      { id: 'payroll', displayName: 'Payroll', description: 'Employee payroll processing', order: 9, icon: 'Users', color: '#EC4899' },
      { id: 'relations', displayName: 'Customer Relations', description: 'Customer relationship management', order: 10, icon: 'HeartHandshake', color: '#14B8A6' },
      { id: 'support', displayName: 'Customer Support', description: 'Customer success and support', order: 11, icon: 'HelpCircle', color: '#6366F1' },
      { id: 'members', displayName: 'Team Members', description: 'Team member management', order: 12, icon: 'Users', color: '#8B5CF6' },
      { id: 'performance', displayName: 'Performance', description: 'Performance tracking and analytics', order: 13, icon: 'TrendingUp', color: '#10B981' },
      { id: 'settings', displayName: 'Organization Settings', description: 'Organization configuration', order: 14, icon: 'Settings', color: '#6B7280' },
      { id: 'admin', displayName: 'Administration', description: 'Administrative functions', order: 15, icon: 'Shield', color: '#DC2626' },
      { id: 'analytics', displayName: 'Analytics', description: 'Data analytics and reporting', order: 16, icon: 'BarChart3', color: '#0891B2' },
      { id: 'audit', displayName: 'Security & Compliance', description: 'Security and compliance management', order: 17, icon: 'Lock', color: '#DC2626' },
      { id: 'leads', displayName: 'Sales Management', description: 'Sales pipeline and lead management', order: 18, icon: 'Target', color: '#059669' },
      { id: 'campaigns', displayName: 'Marketing', description: 'Marketing campaigns and promotion', order: 19, icon: 'Megaphone', color: '#7C3AED' },
      { id: 'services', displayName: 'Service Catalog', description: 'Service catalog management', order: 20, icon: 'Package', color: '#2563EB' },
      { id: 'platform', displayName: 'Platform Management', description: 'Platform-level administration', order: 21, icon: 'Crown', color: '#DC2626' }
    ];

    for (const group of groups) {
      const docData = { ...group, isActive: true };
      await groupsRef.doc(group.id).set(docData);
    }
    console.log(`✅ Created ${groups.length} permission groups`);

    // Initialize Role Categories
    console.log('⏳ Creating role categories...');
    const categoriesRef = db.collection('rbac_role_categories');
    
    const categories = [
      { id: 'platform_admin', displayName: 'Platform Administration', description: 'Platform-level administrative roles', userTypes: ['platform'], order: 1 },
      { id: 'platform_ops', displayName: 'Platform Operations', description: 'Platform operational roles', userTypes: ['platform'], order: 2 },
      { id: 'platform_support', displayName: 'Platform Support', description: 'Platform support and mediation roles', userTypes: ['platform'], order: 3 },
      { id: 'freelancer', displayName: 'Independent Providers', description: 'Freelancer and independent contractor roles', userTypes: ['freelancer'], order: 4 },
      { id: 'vendor_admin', displayName: 'Vendor Administration', description: 'Vendor organization administrative roles', userTypes: ['vendor'], order: 5 },
      { id: 'vendor_ops', displayName: 'Vendor Operations', description: 'Vendor operational and execution roles', userTypes: ['vendor'], order: 6 },
      { id: 'vendor_specialist', displayName: 'Vendor Specialists', description: 'Specialized vendor roles', userTypes: ['vendor'], order: 7 },
      { id: 'customer_admin', displayName: 'Customer Administration', description: 'Customer organization administrative roles', userTypes: ['customer'], order: 8 },
      { id: 'customer_ops', displayName: 'Customer Operations', description: 'Customer operational roles', userTypes: ['customer'], order: 9 }
    ];

    for (const category of categories) {
      const docData = { ...category, isActive: true };
      await categoriesRef.doc(category.id).set(docData);
    }
    console.log(`✅ Created ${categories.length} role categories`);

    // Initialize Roles
    console.log('⏳ Creating roles...');
    const rolesRef = db.collection('rbac_roles');
    
    let roleCount = 0;
    for (const [roleId, roleData] of Object.entries(ENHANCED_ROLES)) {
      const docData = {
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system-admin-init'
      };
      
      await rolesRef.doc(roleId).set(docData);
      roleCount++;
    }
    console.log(`✅ Created ${roleCount} roles`);

    console.log('\n🎉 RBAC initialization completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Permissions: ${permissionCount}`);
    console.log(`  - Permission Groups: ${groups.length}`);
    console.log(`  - Role Categories: ${categories.length}`);
    console.log(`  - Roles: ${roleCount}`);
    
    console.log('\n🎯 Specifically Created Platform Roles:');
    console.log('  ✅ Finance Manager (platform_finance_manager)');
    console.log('  ✅ Technology Analyst (platform_technology_analyst)');
    console.log('  ✅ Mediator (platform_mediator)');
    
    console.log('\n✨ All Firestore collections are now ready for use!');
    
  } catch (error) {
    console.error('❌ Failed to initialize RBAC collections:', error);
    throw error;
  }
}

async function verifyCollections() {
  console.log('\n🔍 Verifying collections...');
  
  try {
    const [permissionsSnapshot, rolesSnapshot, groupsSnapshot, categoriesSnapshot] = await Promise.all([
      db.collection('rbac_permissions').get(),
      db.collection('rbac_roles').get(),
      db.collection('rbac_permission_groups').get(),
      db.collection('rbac_role_categories').get()
    ]);
    
    console.log(`✅ Permissions: ${permissionsSnapshot.size} documents`);
    console.log(`✅ Roles: ${rolesSnapshot.size} documents`);
    console.log(`✅ Permission Groups: ${groupsSnapshot.size} documents`);
    console.log(`✅ Role Categories: ${categoriesSnapshot.size} documents`);
    
    // Verify specific roles
    const roles = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const platformRoles = roles.filter((r: any) => r.userType === 'platform');
    const vendorRoles = roles.filter((r: any) => r.userType === 'vendor');
    const customerRoles = roles.filter((r: any) => r.userType === 'customer');
    const freelancerRoles = roles.filter((r: any) => r.userType === 'freelancer');
    
    console.log('\n📋 Role Distribution:');
    console.log(`  - Platform: ${platformRoles.length} roles`);
    console.log(`  - Vendor: ${vendorRoles.length} roles`);
    console.log(`  - Customer: ${customerRoles.length} roles`);
    console.log(`  - Freelancer: ${freelancerRoles.length} roles`);
    
    // Check for requested roles
    const financeManager = roles.find((r: any) => r.id === 'platform_finance_manager');
    const techAnalyst = roles.find((r: any) => r.id === 'platform_technology_analyst');
    const mediator = roles.find((r: any) => r.id === 'platform_mediator');
    
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
  const command = args[0] || 'init';
  
  switch (command) {
    case 'init':
      await initializeRBACWithAdmin();
      await verifyCollections();
      break;
    case 'verify':
      await verifyCollections();
      break;
    default:
      console.log('Usage: npm run rbac:admin [init|verify]');
      console.log('  init   - Initialize all RBAC collections using Admin SDK');
      console.log('  verify - Verify existing collections');
      process.exit(1);
  }
}

main().catch(console.error);