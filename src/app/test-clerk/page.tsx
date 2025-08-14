'use client'

import { useAuth, useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export default function TestClerkPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { isLoaded: userLoaded, user } = useUser()

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Clerk Authentication Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${authLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span>Auth Status: {authLoaded ? 'Loaded' : 'Loading...'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${userLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span>User Status: {userLoaded ? 'Loaded' : 'Loading...'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isSignedIn ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Signed In: {isSignedIn ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Authentication Actions</h2>
          
          {!isSignedIn ? (
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <Button variant="outline">Sign In</Button>
              </SignInButton>
              
              <SignUpButton mode="modal">
                <Button>Sign Up</Button>
              </SignUpButton>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-green-600 font-medium">✅ Successfully authenticated!</p>
              {user && (
                <div className="bg-gray-50 rounded p-4">
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                  <p><strong>Name:</strong> {user.fullName || 'Not set'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Environment Check</h2>
          <div className="font-mono text-sm space-y-1">
            <p>Node Env: {process.env.NODE_ENV}</p>
            <p>Public Key: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set'}</p>
            <p>Key Preview: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 15)}...</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Troubleshooting Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>If loading indefinitely, check your Clerk dashboard for the application status</li>
            <li>Ensure your Clerk application domain settings allow localhost:3000</li>
            <li>Try clearing browser cache and cookies</li>
            <li>Check browser console for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  )
}