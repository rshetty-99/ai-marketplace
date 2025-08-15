'use client';

import { Button } from '@/components/ui/button';
import { Search } from '@/components/shared/search/global-search';
import { Search as SearchIcon, Home, ArrowLeft, Brain, Users, BarChart3, Cpu } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Track 404 events for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', '404_page_viewed', {
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    }
  }, []);

  const popularPages = [
    {
      name: 'AI Services',
      path: '/catalog',
      icon: Brain,
      description: 'Browse AI solutions'
    },
    {
      name: 'Providers',
      path: '/providers',
      icon: Users,
      description: 'Find AI companies'
    },
    {
      name: 'Analytics',
      path: '/dashboard',
      icon: BarChart3,
      description: 'View dashboard'
    },
    {
      name: 'Categories',
      path: '/catalog?view=categories',
      icon: Cpu,
      description: 'Explore categories'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Page not found
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. 
          It might have been moved, deleted, or the URL was typed incorrectly.
        </p>
        
        {/* Search bar */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-3">Try searching for what you need:</p>
          <Search 
            variant="minimal"
            placeholder="Search AI services, providers, or solutions..."
          />
        </div>
        
        {/* Popular pages */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Popular pages:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularPages.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className="group p-4 bg-white rounded-lg border hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <page.icon className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-gray-900 mb-1">{page.name}</p>
                <p className="text-xs text-gray-500">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="flex items-center gap-2">
            <Link href="/">
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.history.back()} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>
        
        {/* Help section */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-gray-500 mb-2">
            Still can&apos;t find what you&apos;re looking for?
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contact">Contact our support team</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}