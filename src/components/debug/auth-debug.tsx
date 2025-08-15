'use client';

import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@clerk/nextjs';

/**
 * Debug component to show what auth data is being loaded
 * Add this temporarily to dashboard to see what's happening
 */
export function AuthDebugInfo() {
  const { user } = useUser();
  const authData = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      
      <div className="mb-2">
        <strong>Clerk User:</strong>
        <div>ID: {user?.id || 'Not loaded'}</div>
        <div>Email: {user?.primaryEmailAddress?.emailAddress || 'No email'}</div>
        <div>Has Metadata: {user?.publicMetadata ? Object.keys(user.publicMetadata).length : 0} keys</div>
      </div>
      
      <div className="mb-2">
        <strong>useAuth Hook:</strong>
        <div>Loaded: {authData.isLoaded ? 'Yes' : 'No'}</div>
        <div>Signed In: {authData.isSignedIn ? 'Yes' : 'No'}</div>
        <div>User Type: {authData.userType || 'None'}</div>
        <div>Primary Role: {authData.primaryRole || 'None'}</div>
        <div>Roles: {authData.roles?.length || 0}</div>
        <div>Permissions: {authData.permissions?.length || 0}</div>
      </div>

      <div>
        <strong>Clerk Metadata:</strong>
        <pre className="text-xs overflow-auto max-h-32">
          {JSON.stringify(user?.publicMetadata || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}