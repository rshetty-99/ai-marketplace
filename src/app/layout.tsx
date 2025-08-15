import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { GoogleAnalytics } from '@next/third-parties/google';
import { generateSEO } from '@/lib/seo';
import { Providers } from '@/components/providers/providers';
import { Toaster } from '@/components/ui/sonner';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: 'Enterprise AI Marketplace | Connect with Leading AI Service Providers',
  description: 'Discover and connect with top AI service providers. Find machine learning solutions, AI consulting, and custom AI development services for your enterprise.',
  keywords: 'AI marketplace, AI services, machine learning solutions, enterprise AI, AI consulting',
  authors: [{ name: 'AI Marketplace' }],
  creator: 'AI Marketplace Platform',
  publisher: 'AI Marketplace',
  robots: 'index, follow',
  openGraph: {
    title: 'Enterprise AI Marketplace',
    description: 'Connect with leading AI service providers and accelerate your AI transformation',
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Marketplace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise AI Marketplace',
    description: 'Connect with leading AI service providers and accelerate your AI transformation',
    creator: '@aimarketplace',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
          card: 'shadow-lg',
          headerTitle: 'text-zinc-900',
          headerSubtitle: 'text-zinc-600',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="manifest" href="/site.webmanifest" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          <Providers>
            <div id="root" className="min-h-screen bg-background">
              {children}
            </div>
            <Toaster position="top-right" richColors />
          </Providers>
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
