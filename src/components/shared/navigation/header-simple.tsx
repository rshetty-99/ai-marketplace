'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Services', href: '/catalog' },
  { name: 'Providers', href: '/providers' },
  { name: 'About', href: '/about' },
  { name: 'Pricing', href: '/pricing' },
];

export function SimpleHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Marketplace
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith(item.href) 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons (Simple) */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-3 py-3 rounded-md font-medium transition-colors',
                  pathname.startsWith(item.href) 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}