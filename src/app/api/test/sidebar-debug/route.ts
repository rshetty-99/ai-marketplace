import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/test/sidebar-debug
 * Debug what the sidebar should be displaying
 */
export async function GET(req: NextRequest) {
  try {
    // Simulate what getUserRole() function should return for test accounts
    const testAccounts = [
      {
        email: 'rshetty99@hotmail.com',
        expectedRole: 'Freelancer',
        logic: 'Email-based mapping'
      },
      {
        email: 'rshetty99@gmail.com', 
        expectedRole: 'Freelancer',
        logic: 'Email-based mapping'
      },
      {
        email: 'rshetty@techsamur.ai',
        expectedRole: 'Vendor Admin',
        logic: 'Email-based mapping'
      },
      {
        email: 'alsmith141520@gmail.com',
        expectedRole: 'Customer Admin',
        logic: 'Email-based mapping'
      }
    ];

    // Debug the getUserRole function logic
    const debugInfo = {
      functionLogic: {
        step1: 'Check if user exists -> return "User" if not',
        step2: 'Check email against known test accounts',
        step3: 'Try user.publicMetadata.primary_role or user.publicMetadata.role',
        step4: 'Try user.publicMetadata.user_type',
        step5: 'Default to "User"'
      },
      testAccounts,
      troubleshooting: {
        issue: 'If showing "User" instead of expected role',
        possibleCauses: [
          '1. User not logged in (user object is null)',
          '2. Email not matching test account mappings',
          '3. Clerk metadata not populated',
          '4. Component not re-rendering after user loads'
        ],
        solutions: [
          '1. Verify user is logged in to Clerk',
          '2. Check exact email match (case sensitive)',
          '3. Populate Clerk metadata with role data',
          '4. Add loading state checks'
        ]
      },
      testInstructions: {
        '1': 'Log in with rshetty99@hotmail.com',
        '2': 'Check sidebar footer dropdown',
        '3': 'Should show "Freelancer" under the user name',
        '4': 'If showing "User", check browser console for errors'
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Sidebar role display debug information',
      data: debugInfo
    });

  } catch (error) {
    console.error('Sidebar debug failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';