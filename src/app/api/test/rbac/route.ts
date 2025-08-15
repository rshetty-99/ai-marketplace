import { NextRequest, NextResponse } from 'next/server';
import { 
  MARKETPLACE_ROLES, 
  getRolePermissions,
  hasPermission,
  getDefaultRole,
  getUserTypeRoles,
  getDashboardMenuSections
} from '@/lib/firebase/rbac-schema';

/**
 * GET /api/test/rbac
 * Test RBAC system functionality
 */
export async function GET(req: NextRequest) {
  try {
    const testResults = {
      roleSystem: {
        totalRoles: Object.keys(MARKETPLACE_ROLES).length,
        roles: Object.keys(MARKETPLACE_ROLES),
        freelancerRoles: getUserTypeRoles('freelancer'),
        vendorRoles: getUserTypeRoles('vendor'),
        customerRoles: getUserTypeRoles('customer')
      },
      permissionTests: {
        freelancerPermissions: getRolePermissions('freelancer'),
        vendorAdminPermissions: getRolePermissions('vendor_admin'),
        customerAdminPermissions: getRolePermissions('customer_admin'),
        projectEngineerPermissions: getRolePermissions('project_engineer'),
        financeManagerPermissions: getRolePermissions('finance_manager_vendor')
      },
      roleTests: {
        freelancerCanCreateProjects: hasPermission('freelancer', 'project.create'),
        projectEngineerCanCreateProjects: hasPermission('project_engineer', 'project.create'),
        vendorAdminCanCreateProjects: hasPermission('vendor_admin', 'project.create'),
        financeManagerCanApproveBudgets: hasPermission('finance_manager_vendor', 'budget.approve'),
        customerSuccessCanInteractWithCustomers: hasPermission('customer_success_manager', 'customer.interact')
      },
      defaultRoleTests: {
        freelancerDefault: getDefaultRole('freelancer'),
        vendorDefault: getDefaultRole('vendor', true),
        vendorSecondUser: getDefaultRole('vendor', false),
        customerDefault: getDefaultRole('customer', true),
        customerSecondUser: getDefaultRole('customer', false)
      },
      dashboardMenuTests: {
        freelancerMenuSections: getDashboardMenuSections(getRolePermissions('freelancer')),
        vendorAdminMenuSections: getDashboardMenuSections(getRolePermissions('vendor_admin')),
        projectEngineerMenuSections: getDashboardMenuSections(getRolePermissions('project_engineer')),
        financeManagerMenuSections: getDashboardMenuSections(getRolePermissions('finance_manager_vendor')),
        customerAdminMenuSections: getDashboardMenuSections(getRolePermissions('customer_admin'))
      }
    };

    // Validation tests
    const validationTests = {
      allRolesHavePermissions: Object.keys(MARKETPLACE_ROLES).every(role => 
        getRolePermissions(role as any).length > 0
      ),
      freelancerHasAllPermissions: getRolePermissions('freelancer').length >= 18, // Should have all permissions
      projectEngineerHasLimitedPermissions: getRolePermissions('project_engineer').length < getRolePermissions('vendor_admin').length,
      adminRolesCanManageTeam: ['vendor_admin', 'customer_admin'].every(role => 
        hasPermission(role as any, 'team.manage')
      ),
      financeRolesCanApproveBudgets: ['finance_manager_vendor', 'finance_manager_customer'].every(role =>
        hasPermission(role as any, 'budget.approve')
      )
    };

    return NextResponse.json({
      success: true,
      message: 'RBAC system tests completed',
      data: {
        ...testResults,
        validationTests,
        summary: {
          totalRoles: testResults.roleSystem.totalRoles,
          allValidationsPassed: Object.values(validationTests).every(test => test === true),
          failedValidations: Object.entries(validationTests)
            .filter(([_, passed]) => !passed)
            .map(([testName]) => testName)
        }
      }
    });

  } catch (error) {
    console.error('RBAC test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';