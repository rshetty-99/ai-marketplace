import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';
import { getDashboardConfig } from '@/lib/dashboard/dashboard-config';

/**
 * GET /api/test/user-comparison
 * Compare all three user types and their dashboard configurations
 */
export async function GET(req: NextRequest) {
  try {
    const adminDb = await getAdminDb();
    
    // Get all three test users
    const freelancerSnapshot = await adminDb
      .collection('users')
      .where('email', 'in', ['rshetty99@gmail.com', 'rshetty99@hotmail.com'])
      .get();
    
    const vendorSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'rshetty@techsamur.ai')
      .get();
    
    const customerSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'alsmith141520@gmail.com')
      .get();

    // Collect user data
    const freelancers = freelancerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const vendor = vendorSnapshot.empty ? null : {
      id: vendorSnapshot.docs[0].id,
      ...vendorSnapshot.docs[0].data()
    };
    
    const customer = customerSnapshot.empty ? null : {
      id: customerSnapshot.docs[0].id,
      ...customerSnapshot.docs[0].data()
    };

    // Get dashboard configurations
    const freelancerDashboard = getDashboardConfig('freelancer');
    const vendorDashboard = getDashboardConfig('vendor');
    const customerDashboard = getDashboardConfig('customer');

    // Dashboard comparison
    const dashboardComparison = {
      freelancer: {
        sectionCount: freelancerDashboard.length,
        sections: freelancerDashboard.map(s => s.title),
        uniqueFeatures: [
          'Personal Profile Management',
          'Individual Availability Calendar',
          'Personal Earnings Tracking',
          'Skill Development (Learning)',
          'Direct Client Reviews',
          'Time Tracking'
        ],
        focusArea: 'Individual work and professional growth'
      },
      vendor: {
        sectionCount: vendorDashboard.length,
        sections: vendorDashboard.map(s => s.title),
        uniqueFeatures: [
          'Organization Management',
          'Team Management & Roles',
          'Multi-Project Resource Allocation',
          'Client Relationship Management (CRM)',
          'Business Analytics & Intelligence',
          'Financial Management (Payroll, Expenses)',
          'Service Catalog Management',
          'Market Position Analytics'
        ],
        focusArea: 'Business operations and team coordination'
      },
      customer: {
        sectionCount: customerDashboard.length,
        sections: customerDashboard.map(s => s.title),
        uniqueFeatures: [
          'Project Creation & Posting',
          'Provider Discovery & Browsing',
          'Proposal Management',
          'Contract Management',
          'Saved Providers List',
          'Project-focused Analytics'
        ],
        focusArea: 'Finding providers and managing outsourced projects'
      }
    };

    // Data structure comparison
    const dataStructureComparison = {
      freelancer: {
        collections: ['users', 'freelancers', 'onboarding'],
        hasOrganization: false,
        apiAccessLevel: 'basic',
        roleCount: 1,
        permissions: 21,
        billingModel: 'Personal invoicing',
        profileFields: ['skills', 'hourlyRate', 'availability', 'portfolio', 'certifications']
      },
      vendor: {
        collections: ['users', 'organizations', 'organizationMemberships', 'vendors', 'onboarding'],
        hasOrganization: true,
        apiAccessLevel: 'premium',
        roleCount: 5,
        permissions: 20,
        billingModel: 'Company invoicing with team payroll',
        profileFields: ['services', 'specialties', 'team', 'certifications', 'businessMetrics', 'clientRetention']
      },
      customer: {
        collections: ['users', 'organizations', 'organizationMemberships', 'onboarding'],
        hasOrganization: true,
        apiAccessLevel: 'standard',
        roleCount: 3,
        permissions: 15,
        billingModel: 'Project-based payments',
        profileFields: ['industry', 'projectNeeds', 'budget', 'teamSize']
      }
    };

    // Sample users comparison
    const sampleUsers = {
      freelancers: freelancers.map(f => ({
        email: f.email,
        name: f.name,
        role: f.primaryRole,
        hasOrganization: !!f.organizationId,
        apiAccess: f.api_access_level,
        status: f.user_status
      })),
      vendor: vendor ? {
        email: vendor.email,
        name: vendor.name,
        role: vendor.primaryRole,
        organization: vendor.organizationName,
        hasOrganization: !!vendor.organizationId,
        apiAccess: vendor.api_access_level,
        status: vendor.user_status
      } : null,
      customer: customer ? {
        email: customer.email,
        name: customer.name,
        role: customer.primaryRole,
        organization: customer.organizationName,
        hasOrganization: !!customer.organizationId,
        apiAccess: customer.api_access_level,
        status: customer.user_status
      } : null
    };

    return NextResponse.json({
      success: true,
      message: 'User type comparison analysis',
      data: {
        dashboardComparison,
        dataStructureComparison,
        sampleUsers,
        recommendations: {
          freelancer: 'Keep dashboard simple and focused on personal productivity. Emphasize portfolio, skills, and availability.',
          vendor: 'Provide comprehensive business management tools. Focus on team coordination, client management, and business analytics.',
          customer: 'Streamline provider discovery and project management. Make it easy to find, vet, and hire the right talent.'
        },
        keyInsights: {
          '1': 'Freelancers need personal tools, vendors need business tools, customers need procurement tools',
          '2': 'Complexity increases: Freelancer (simple) → Customer (moderate) → Vendor (complex)',
          '3': 'Each user type has distinct workflows that should not be mixed',
          '4': 'Navigation depth: Freelancers (1-2 levels), Customers (2 levels), Vendors (2-3 levels)',
          '5': 'Feature overlap exists but context differs (e.g., "Projects" means different things to each)'
        }
      }
    });

  } catch (error) {
    console.error('User comparison failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';