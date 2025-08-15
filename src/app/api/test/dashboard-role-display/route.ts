import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';

/**
 * GET /api/test/dashboard-role-display
 * Test what role should be displayed in dashboard for each user type
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get all test users
    const testUsers = [
      'rshetty99@gmail.com',     // Google freelancer
      'rshetty99@hotmail.com',   // Email freelancer  
      'rshetty@techsamur.ai',    // Vendor admin
      'alsmith141520@gmail.com'  // Customer admin
    ];

    const userDisplayData = [];

    for (const email of testUsers) {
      const userSnapshot = await adminDb
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!userSnapshot.empty) {
        const userData = {
          id: userSnapshot.docs[0].id,
          ...userSnapshot.docs[0].data()
        };

        // Calculate what should be displayed
        const roleDisplay = formatRoleForDisplay(userData.primaryRole || userData.userType);
        
        userDisplayData.push({
          email: userData.email,
          name: userData.name,
          userType: userData.userType,
          primaryRole: userData.primaryRole,
          displayRole: roleDisplay,
          currentIssue: !userData.primaryRole ? 'Missing primaryRole' : null,
          expectedDisplay: getExpectedRoleDisplay(userData.userType, userData.primaryRole),
          organizationName: userData.organizationName || null,
          hasOrganization: !!userData.organizationId
        });
      } else {
        userDisplayData.push({
          email,
          status: 'not_found',
          issue: 'User not found in Firebase'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard role display analysis',
      data: {
        users: userDisplayData,
        explanation: {
          currentProblem: 'Dashboard shows "User" instead of actual role because Clerk metadata is not synced with Firebase data',
          solution: 'Updated AppSidebar to use useAuth hook which reads from Firebase via JWT claims',
          expectedBehavior: {
            freelancer: 'Should show "Freelancer"',
            vendor_admin: 'Should show "Vendor Admin"', 
            customer_admin: 'Should show "Customer Admin"',
            project_engineer: 'Should show "Project Engineer"'
          }
        },
        fixes: {
          '1': 'Updated AppSidebar to import useAuth from @/hooks/useAuth',
          '2': 'Changed getUserRole() to use primaryRole and userType from Firebase',
          '3': 'Added proper role formatting with space replacement and capitalization',
          '4': 'Added fallback to userType if primaryRole is missing'
        }
      }
    });

  } catch (error) {
    console.error('Dashboard role display test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Format role name for display in UI
 */
function formatRoleForDisplay(role: string): string {
  if (!role) return 'User';
  
  return role
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get expected role display based on user type and role
 */
function getExpectedRoleDisplay(userType: string, primaryRole?: string): string {
  if (primaryRole) {
    return formatRoleForDisplay(primaryRole);
  }
  
  // Fallback to user type
  return formatRoleForDisplay(userType);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';