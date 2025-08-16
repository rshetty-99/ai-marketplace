import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Home, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Provider Not Found
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
              We couldn't find the AI provider you're looking for. 
              It may have been moved or doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild className="h-12">
                <Link href="/providers" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  All Providers
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12">
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  Homepage
                </Link>
              </Button>
            </div>
            
            {/* Search Box */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Try searching for AI providers:
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search AI providers..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const query = (e.target as HTMLInputElement).value;
                      window.location.href = `/providers?search=${encodeURIComponent(query)}`;
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Popular Categories */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Browse by expertise:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/providers?expertise=machine-learning">
                    Machine Learning
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/providers?expertise=natural-language-processing">
                    NLP
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/providers?expertise=computer-vision">
                    Computer Vision
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/providers?expertise=ai-consulting">
                    AI Consulting
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Help */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Can't find what you're looking for?{' '}
                <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Contact support
                </Link>{' '}
                for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}