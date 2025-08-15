import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center space-y-6">
        <div className="relative">
          <LoadingSpinner size={60} className="text-blue-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">Loading AI Marketplace</p>
          <p className="text-sm text-muted-foreground">Connecting you with enterprise AI solutions</p>
        </div>
      </div>
    </div>
  );
}