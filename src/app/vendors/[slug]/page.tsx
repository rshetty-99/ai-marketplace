/**
 * Public Vendor Profile Page
 * SEO-optimized public profile for vendor companies
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PublicVendorProfile } from '@/components/profiles/public/PublicVendorProfile';
import { getVendorProfileBySlug } from '@/lib/firebase/public-profile-service';
import { generateSEO } from '@/lib/seo';

interface VendorProfilePageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: VendorProfilePageProps): Promise<Metadata> {
  try {
    const profile = await getVendorProfileBySlug(params.slug);
    
    if (!profile || !profile.publicProfile?.isPublic) {
      return generateSEO({
        title: 'Vendor Not Found | AI Marketplace',
        description: 'The requested vendor company profile could not be found.',
        canonical: `/vendors/${params.slug}`
      });
    }

    const companyName = profile.company?.brandName || profile.company?.legalName || 'Vendor Company';
    const services = profile.services?.primaryServices?.slice(0, 3).map(s => s.name).join(', ') || '';
    
    return generateSEO({
      title: profile.seo?.metaTitle || `${companyName} - Professional Development Services`,
      description: profile.seo?.metaDescription || 
        `Partner with ${companyName}, a trusted development company specializing in ${services}. View case studies, team, and client testimonials.`,
      canonical: `/vendors/${params.slug}`,
      openGraph: {
        title: profile.seo?.metaTitle || `${companyName} - Development Services`,
        description: profile.seo?.metaDescription || profile.company?.description,
        url: `/vendors/${params.slug}`,
        siteName: 'AI Marketplace',
        images: profile.seo?.openGraphImage ? [
          {
            url: profile.seo.openGraphImage,
            width: 1200,
            height: 630,
            alt: `${companyName} - Vendor Profile`
          }
        ] : undefined,
        type: 'website',
      },
      twitter: {
        card: profile.seo?.twitterCard || 'summary_large_image',
        title: profile.seo?.metaTitle || `${companyName} - Development Services`,
        description: profile.seo?.metaDescription || profile.company?.description,
        images: profile.seo?.openGraphImage ? [profile.seo.openGraphImage] : undefined,
      },
      keywords: profile.seo?.keywords?.join(', ') || services,
      other: {
        'business:contact_data:locality': profile.company?.headquarters?.city || '',
        'business:contact_data:region': profile.company?.headquarters?.state || '',
        'business:contact_data:country_name': profile.company?.headquarters?.country || '',
      }
    });
  } catch (error) {
    console.error('Error generating metadata for vendor profile:', error);
    return generateSEO({
      title: 'Vendor Profile | AI Marketplace',
      description: 'Professional vendor company profile on AI Marketplace.',
      canonical: `/vendors/${params.slug}`
    });
  }
}

// Generate static params for ISR
export async function generateStaticParams() {
  // In production, you would fetch active public vendor slugs
  // For now, return empty array to enable ISR
  return [];
}

export default async function VendorProfilePage({ params }: VendorProfilePageProps) {
  try {
    const profile = await getVendorProfileBySlug(params.slug);

    // Check if profile exists and is public
    if (!profile) {
      notFound();
    }

    if (!profile.publicProfile?.isPublic) {
      notFound();
    }

    return (
      <Suspense fallback={<VendorProfileSkeleton />}>
        <PublicVendorProfile profile={profile} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading vendor profile:', error);
    notFound();
  }
}

// Loading skeleton component
function VendorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-64 bg-gradient-to-r from-gray-300 to-gray-400" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-gray-300 rounded-lg" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/3" />
              <div className="h-4 bg-gray-300 rounded w-2/3" />
              <div className="h-4 bg-gray-300 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enable ISR with revalidation
export const revalidate = 300; // 5 minutes