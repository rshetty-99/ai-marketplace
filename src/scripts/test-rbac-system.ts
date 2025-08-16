#!/usr/bin/env tsx
/**
 * RBAC System Testing Script
 * 
 * Comprehensive testing of the enhanced RBAC system including:
 * - Firestore collection data integrity
 * - Role hierarchy validation
 * - Permission mapping verification
 * - User assignment simulation
 * - Performance testing
 */

import { RBACCollectionManager } from '../lib/firebase/rbac-collections';
import { ENHANCED_ROLES, getDefaultRole, ROLE_HIERARCHY } from '../lib/firebase/rbac-roles';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

class RBACSystemTester {
  private results: TestResult[] = [];

  private addResult(testName: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
    this.results.push({ testName, status, message, details });
  }

  private logResult(result: TestResult) {
    const statusIcon = {
      'PASS': '✅',
      'FAIL': '❌', 
      'WARN': '⚠️'
    }[result.status];
    
    console.log(`${statusIcon} ${result.testName}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  }

  async runAllTests() {
    console.log('🧪 Starting RBAC System Tests...\n');

    await this.testCollectionIntegrity();
    await this.testRoleHierarchy();
    await this.testPermissionMapping();
    await this.testRequiredRoles();
    await this.testDefaultRoleAssignment();
    await this.testUserTypeSegmentation();
    await this.testPerformance();

    this.printSummary();
  }

  async testCollectionIntegrity() {
    console.log('📊 Testing Collection Integrity...');

    try {
      const [permissions, roles, groups, categories] = await Promise.all([
        RBACCollectionManager.getPermissions(),
        RBACCollectionManager.getRoles(),
        RBACCollectionManager.getPermissionGroups(),
        RBACCollectionManager.getRoleCategories()
      ]);

      // Test permissions count
      if (permissions.length >= 50) {
        this.addResult('Permission Count', 'PASS', `Found ${permissions.length} permissions`);
      } else {
        this.addResult('Permission Count', 'FAIL', `Expected ≥50 permissions, found ${permissions.length}`);
      }

      // Test roles count 
      const expectedRoleCount = Object.keys(ENHANCED_ROLES).length;
      if (roles.length === expectedRoleCount) {
        this.addResult('Role Count', 'PASS', `Found ${roles.length} roles as expected`);
      } else {
        this.addResult('Role Count', 'FAIL', `Expected ${expectedRoleCount} roles, found ${roles.length}`);
      }

      // Test permission groups
      if (groups.length >= 20) {
        this.addResult('Permission Groups', 'PASS', `Found ${groups.length} permission groups`);
      } else {
        this.addResult('Permission Groups', 'WARN', `Found ${groups.length} permission groups, expected ≥20`);
      }

      // Test role categories
      if (categories.length >= 9) {
        this.addResult('Role Categories', 'PASS', `Found ${categories.length} role categories`);
      } else {
        this.addResult('Role Categories', 'WARN', `Found ${categories.length} role categories, expected ≥9`);
      }

    } catch (error) {
      this.addResult('Collection Access', 'FAIL', `Failed to access collections: ${error}`);
    }
  }

  async testRoleHierarchy() {
    console.log('🏗️ Testing Role Hierarchy...');

    try {
      const roles = await RBACCollectionManager.getRoles();
      
      // Test hierarchy structure
      let hierarchyErrors = 0;
      
      for (const role of roles) {
        // Test parent-child relationships
        if (role.parentRoles && role.parentRoles.length > 0) {
          for (const parentId of role.parentRoles) {
            const parent = roles.find(r => r.id === parentId);
            if (!parent) {
              hierarchyErrors++;
              this.addResult('Hierarchy Integrity', 'FAIL', 
                `Role ${role.id} references non-existent parent ${parentId}`);
            } else if (!parent.childRoles?.includes(role.id)) {
              hierarchyErrors++;
              this.addResult('Hierarchy Integrity', 'FAIL', 
                `Parent ${parentId} doesn't list ${role.id} as child`);
            }
          }
        }

        // Test child relationships
        if (role.childRoles && role.childRoles.length > 0) {
          for (const childId of role.childRoles) {
            const child = roles.find(r => r.id === childId);
            if (!child) {
              hierarchyErrors++;
              this.addResult('Hierarchy Integrity', 'FAIL', 
                `Role ${role.id} references non-existent child ${childId}`);
            } else if (!child.parentRoles?.includes(role.id)) {
              hierarchyErrors++;
              this.addResult('Hierarchy Integrity', 'FAIL', 
                `Child ${childId} doesn't list ${role.id} as parent`);
            }
          }
        }
      }

      if (hierarchyErrors === 0) {
        this.addResult('Role Hierarchy', 'PASS', 'All role hierarchies are properly linked');
      } else {
        this.addResult('Role Hierarchy', 'FAIL', `Found ${hierarchyErrors} hierarchy errors`);
      }

    } catch (error) {
      this.addResult('Role Hierarchy', 'FAIL', `Error testing hierarchy: ${error}`);
    }
  }

  async testPermissionMapping() {
    console.log('🔑 Testing Permission Mapping...');

    try {
      const [permissions, roles] = await Promise.all([
        RBACCollectionManager.getPermissions(),
        RBACCollectionManager.getRoles()
      ]);

      const validPermissionIds = new Set(permissions.map(p => p.id));
      let invalidPermissions = 0;

      for (const role of roles) {
        for (const permissionId of role.permissions) {
          if (!validPermissionIds.has(permissionId)) {
            invalidPermissions++;
            this.addResult('Permission Mapping', 'FAIL', 
              `Role ${role.id} references invalid permission ${permissionId}`);
          }
        }
      }

      if (invalidPermissions === 0) {
        this.addResult('Permission Mapping', 'PASS', 'All role permissions are valid');
      } else {
        this.addResult('Permission Mapping', 'FAIL', `Found ${invalidPermissions} invalid permission references`);
      }

    } catch (error) {
      this.addResult('Permission Mapping', 'FAIL', `Error testing permissions: ${error}`);
    }
  }

  async testRequiredRoles() {
    console.log('👥 Testing Required Roles...');

    try {
      const roles = await RBACCollectionManager.getRoles();
      const roleIds = new Set(roles.map(r => r.id));

      // Test for specifically requested platform roles
      const requiredPlatformRoles = [
        'platform_finance_manager',
        'platform_technology_analyst', 
        'platform_mediator'
      ];

      let missingRoles = 0;
      for (const requiredRole of requiredPlatformRoles) {
        if (roleIds.has(requiredRole)) {
          this.addResult('Required Role', 'PASS', `Found required role: ${requiredRole}`);
        } else {
          missingRoles++;
          this.addResult('Required Role', 'FAIL', `Missing required role: ${requiredRole}`);
        }
      }

      // Test user type coverage
      const userTypes = ['platform', 'vendor', 'customer', 'freelancer'];
      for (const userType of userTypes) {
        const userTypeRoles = roles.filter(r => r.userType === userType);
        if (userTypeRoles.length > 0) {
          this.addResult('User Type Coverage', 'PASS', 
            `${userType} has ${userTypeRoles.length} roles`);
        } else {
          this.addResult('User Type Coverage', 'FAIL', 
            `No roles found for user type: ${userType}`);
        }
      }

    } catch (error) {
      this.addResult('Required Roles', 'FAIL', `Error testing required roles: ${error}`);
    }
  }

  async testDefaultRoleAssignment() {
    console.log('⚙️ Testing Default Role Assignment...');

    try {
      const roles = await RBACCollectionManager.getRoles();
      const roleIds = new Set(roles.map(r => r.id));

      // Test default role logic
      const testCases = [
        { userType: 'freelancer' as const, isFirst: true, expected: 'freelancer' },
        { userType: 'vendor' as const, isFirst: true, expected: 'vendor_admin' },
        { userType: 'vendor' as const, isFirst: false, expected: 'vendor_project_engineer' },
        { userType: 'customer' as const, isFirst: true, expected: 'customer_admin' },
        { userType: 'customer' as const, isFirst: false, expected: 'customer_project_lead' }
      ];

      for (const testCase of testCases) {
        const defaultRole = getDefaultRole(testCase.userType, testCase.isFirst);
        
        if (defaultRole === testCase.expected) {
          if (roleIds.has(defaultRole)) {
            this.addResult('Default Role Logic', 'PASS', 
              `${testCase.userType} (first=${testCase.isFirst}) → ${defaultRole}`);
          } else {
            this.addResult('Default Role Logic', 'FAIL', 
              `Default role ${defaultRole} doesn't exist in database`);
          }
        } else {
          this.addResult('Default Role Logic', 'FAIL', 
            `Expected ${testCase.expected}, got ${defaultRole} for ${testCase.userType}`);
        }
      }

    } catch (error) {
      this.addResult('Default Role Assignment', 'FAIL', `Error testing defaults: ${error}`);
    }
  }

  async testUserTypeSegmentation() {
    console.log('🏢 Testing User Type Segmentation...');

    try {
      const roles = await RBACCollectionManager.getRoles();
      
      // Group roles by user type
      const rolesByType = roles.reduce((acc, role) => {
        if (!acc[role.userType]) acc[role.userType] = [];
        acc[role.userType].push(role);
        return acc;
      }, {} as Record<string, typeof roles>);

      // Validate each user type has appropriate roles
      const expectations = {
        platform: { min: 5, adminRoles: ['platform_super_admin'] },
        vendor: { min: 8, adminRoles: ['vendor_admin'] },
        customer: { min: 4, adminRoles: ['customer_admin'] },
        freelancer: { min: 1, adminRoles: ['freelancer'] }
      };

      for (const [userType, expectation] of Object.entries(expectations)) {
        const typeRoles = rolesByType[userType] || [];
        
        if (typeRoles.length >= expectation.min) {
          this.addResult('User Type Roles', 'PASS', 
            `${userType} has ${typeRoles.length} roles (min: ${expectation.min})`);
        } else {
          this.addResult('User Type Roles', 'FAIL', 
            `${userType} has ${typeRoles.length} roles, expected ≥${expectation.min}`);
        }

        // Check for admin roles
        const hasAdminRole = expectation.adminRoles.some(adminRole => 
          typeRoles.some(role => role.id === adminRole)
        );
        
        if (hasAdminRole) {
          this.addResult('Admin Role Coverage', 'PASS', 
            `${userType} has required admin roles`);
        } else {
          this.addResult('Admin Role Coverage', 'FAIL', 
            `${userType} missing admin roles: ${expectation.adminRoles.join(', ')}`);
        }
      }

    } catch (error) {
      this.addResult('User Type Segmentation', 'FAIL', `Error testing segmentation: ${error}`);
    }
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');

    try {
      // Test query performance
      const startTime = performance.now();
      
      await Promise.all([
        RBACCollectionManager.getRoles(),
        RBACCollectionManager.getPermissions(),
        RBACCollectionManager.getPermissionGroups(),
        RBACCollectionManager.getRoleCategories()
      ]);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration < 2000) { // 2 seconds
        this.addResult('Query Performance', 'PASS', 
          `All collections loaded in ${duration.toFixed(2)}ms`);
      } else if (duration < 5000) { // 5 seconds
        this.addResult('Query Performance', 'WARN', 
          `Collections loaded in ${duration.toFixed(2)}ms (consider optimization)`);
      } else {
        this.addResult('Query Performance', 'FAIL', 
          `Collections loaded in ${duration.toFixed(2)}ms (too slow)`);
      }

      // Test filtered queries
      const filterStartTime = performance.now();
      await RBACCollectionManager.getRoles('vendor');
      const filterEndTime = performance.now();
      const filterDuration = filterEndTime - filterStartTime;
      
      if (filterDuration < 1000) {
        this.addResult('Filtered Query Performance', 'PASS', 
          `Filtered query completed in ${filterDuration.toFixed(2)}ms`);
      } else {
        this.addResult('Filtered Query Performance', 'WARN', 
          `Filtered query took ${filterDuration.toFixed(2)}ms`);
      }

    } catch (error) {
      this.addResult('Performance', 'FAIL', `Error testing performance: ${error}`);
    }
  }

  printSummary() {
    console.log('\n📋 Test Summary:');
    console.log('================');
    
    // Print all results
    this.results.forEach(result => this.logResult(result));
    
    // Calculate summary stats
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    
    console.log('\n📊 Overall Results:');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);
    console.log(`⚠️ Warnings: ${warnings} (${((warnings/total)*100).toFixed(1)}%)`);
    
    if (failed === 0) {
      console.log('\n🎉 All critical tests passed! RBAC system is ready for production.');
    } else {
      console.log('\n🚨 Some tests failed. Please review and fix issues before deployment.');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. Run `npm run init-rbac:dev init` to initialize collections');
    console.log('2. Test role assignment in your UI components');
    console.log('3. Verify permission checks work correctly');
    console.log('4. Test role hierarchy inheritance');
  }
}

async function main() {
  const tester = new RBACSystemTester();
  await tester.runAllTests();
}

main().catch(console.error);