import { UserProfile } from '@clerk/nextjs'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
        <UserProfile 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              footerActionLink: 'text-blue-600 hover:text-blue-700',
              card: 'shadow-lg',
              navbar: 'hidden',
              pageScrollBox: 'max-w-4xl',
            },
          }}
          routing="path"
          path="/profile"
        />
      </div>
    </div>
  )
}