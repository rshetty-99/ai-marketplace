/**
 * Vendor Profile Loading Page
 */

export default function VendorProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-white border-b border-gray-200" />
      
      {/* Hero section skeleton */}
      <div className="h-64 bg-gradient-to-r from-gray-300 to-gray-400" />
      
      {/* Profile card skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-gray-300 rounded-lg" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/3" />
              <div className="h-4 bg-gray-300 rounded w-2/3" />
              <div className="h-4 bg-gray-300 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-300 rounded w-16" />
                <div className="h-6 bg-gray-300 rounded w-20" />
                <div className="h-6 bg-gray-300 rounded w-18" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-12 bg-gray-300 rounded w-32" />
              <div className="h-12 bg-gray-300 rounded w-32" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs skeleton */}
            <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
              <div className="h-10 bg-gray-300 rounded w-24" />
              <div className="h-10 bg-gray-300 rounded w-24" />
              <div className="h-10 bg-gray-300 rounded w-24" />
              <div className="h-10 bg-gray-300 rounded w-24" />
            </div>
            
            {/* Content cards skeleton */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-300 rounded w-1/4 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded" />
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                  <div className="h-4 bg-gray-300 rounded w-1/2" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-gray-300 rounded" />
                  <div className="h-32 bg-gray-300 rounded" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-300 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-300 rounded" />
                <div className="h-12 bg-gray-300 rounded" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded" />
                <div className="h-4 bg-gray-300 rounded" />
                <div className="h-4 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}