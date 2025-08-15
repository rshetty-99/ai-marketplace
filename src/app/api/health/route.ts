import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * GET /api/health
 * Health check endpoint to verify Firebase and Clerk connections
 */
export async function GET(req: NextRequest) {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      firebase: 'unknown',
      clerk: 'unknown'
    },
    errors: [] as string[]
  };

  try {
    // Test Firebase Admin connection
    try {
      const adminDb = await getAdminDb();
      // Try to read from a collection (won't create anything)
      await adminDb.collection('_health_check').limit(1).get();
      healthStatus.services.firebase = 'connected';
    } catch (error) {
      healthStatus.services.firebase = 'error';
      healthStatus.errors.push(`Firebase: ${(error as Error).message}`);
    }

    // Test Clerk connection
    try {
      // Check if Clerk environment variables are present
      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error('CLERK_SECRET_KEY environment variable is missing');
      }
      
      // Try to get organizations (this will validate Clerk connection)
      const client = clerkClient();
      await client.organizations.getOrganizationList({ limit: 1 });
      healthStatus.services.clerk = 'connected';
    } catch (error) {
      healthStatus.services.clerk = 'error';
      healthStatus.errors.push(`Clerk: ${(error as Error).message}`);
    }

    // Determine overall status
    if (healthStatus.errors.length > 0) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';