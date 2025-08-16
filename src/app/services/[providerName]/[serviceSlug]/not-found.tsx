import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Home, ArrowLeft, Compass } from 'lucide-react';
import Link from 'next/link';

export default function ServiceNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Compass className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle className="text-xl">Service Not Found</CardTitle>
          <CardDescription>
            The service you're looking for doesn't exist or may have been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/catalog">
                <Search className="w-4 h-4 mr-2" />
                Browse All Services
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
            
            <Button variant="ghost" asChild className="w-full">
              <Link href="javascript:history.back()">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Popular categories:
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <Link 
                href="/catalog?category=computer_vision" 
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                Computer Vision
              </Link>
              <Link 
                href="/catalog?category=natural_language_processing" 
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
              >
                NLP
              </Link>
              <Link 
                href="/catalog?category=predictive_analytics" 
                className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
              >
                Analytics
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}