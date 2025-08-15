import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { withErrorHandler } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import {
  runFullMigration,
  migrateOrganizationUsers,
  migrateSingleUser,
  checkMigrationStatus,
  previewMigration,
  rollbackUserMigration,
  MigrationReport
} from '@/lib/auth/role-migration';

/**
 * GET /api/v1/admin/migrate-roles
 * Check migration status or preview migration changes
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check here
  // This should only be accessible to system administrators

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'status';
  const organizationId = searchParams.get('organizationId');

  try {
    switch (action) {
      case 'status':
        const status = await checkMigrationStatus();
        return NextResponse.json({
          success: true,
          data: status
        });

      case 'preview':
        const preview = await previewMigration(organizationId || undefined);
        return NextResponse.json({
          success: true,
          data: {
            changes: preview,
            summary: {
              totalUsers: preview.length,
              noChanges: preview.filter(p => p.currentRole === p.proposedRole).length,
              hasChanges: preview.filter(p => p.currentRole !== p.proposedRole).length
            }
          }
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: status, preview' 
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to process migration GET request', error as Error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
});

/**
 * POST /api/v1/admin/migrate-roles
 * Execute migration operations
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check here
  // This should only be accessible to system administrators

  try {
    const body = await req.json();
    const { action, targetUserId, organizationId } = body;

    let result: any = null;

    switch (action) {
      case 'migrate-all':
        logger.info('Starting full system migration', { initiatedBy: userId });
        result = await runFullMigration();
        break;

      case 'migrate-organization':
        if (!organizationId) {
          return NextResponse.json({ 
            error: 'organizationId is required for organization migration' 
          }, { status: 400 });
        }
        
        logger.info('Starting organization migration', { organizationId, initiatedBy: userId });
        const orgResults = await migrateOrganizationUsers(organizationId);
        
        result = {
          organizationId,
          totalUsers: orgResults.length,
          successful: orgResults.filter(r => r.status === 'completed').length,
          failed: orgResults.filter(r => r.status === 'failed').length,
          details: orgResults
        };
        break;

      case 'migrate-user':
        if (!targetUserId) {
          return NextResponse.json({ 
            error: 'targetUserId is required for single user migration' 
          }, { status: 400 });
        }
        
        logger.info('Starting single user migration', { targetUserId, initiatedBy: userId });
        result = await migrateSingleUser(targetUserId, organizationId);
        break;

      case 'rollback-user':
        if (!targetUserId) {
          return NextResponse.json({ 
            error: 'targetUserId is required for rollback' 
          }, { status: 400 });
        }
        
        logger.info('Rolling back user migration', { targetUserId, initiatedBy: userId });
        await rollbackUserMigration(targetUserId);
        result = { success: true, message: 'User migration rolled back successfully' };
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: migrate-all, migrate-organization, migrate-user, rollback-user' 
        }, { status: 400 });
    }

    // Log the migration operation
    logger.logAudit('migration_operation', userId, 'migration', action, {
      action,
      targetUserId,
      organizationId,
      result: result ? 'success' : 'partial'
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to execute migration operation', error as Error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';