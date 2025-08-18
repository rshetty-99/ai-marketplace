/**
 * Public Organization Profile Page
 * SEO-optimized public profile for customer organizations
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PublicOrganizationProfile } from '@/components/profiles/public/PublicOrganizationProfile';
import { getOrganizationProfileBySlug } from '@/lib/firebase/public-profile-service';
import { generateSEO } from '@/lib/seo';

interface OrganizationProfilePageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: OrganizationProfilePageProps): Promise<Metadata> {
  try {
    const profile = await getOrganizationProfileBySlug(params.slug);
    
    if (!profile || !profile.publicProfile?.isPublic) {
      return generateSEO({
        title: 'Organization Not Found | AI Marketplace',
        description: 'The requested organization profile could not be found.',
        canonical: `/organizations/${params.slug}`
      });
    }

    const orgName = profile.organization?.displayName || profile.organization?.legalName || 'Organization';
    const projectTypes = profile.requirements?.projectTypes?.slice(0, 3).join(', ') || 'various projects';
    
    return generateSEO({
      title: profile.seo?.metaTitle || `${orgName} - Partnership Opportunities`,
      description: profile.seo?.metaDescription || 
        `Partner with ${orgName}, seeking development partners for ${projectTypes}. View requirements, budgets, and partnership opportunities.`,
      canonical: `/organizations/${params.slug}`,
      openGraph: {
        title: profile.seo?.metaTitle || `${orgName} - Partnership Opportunities`,
        description: profile.seo?.metaDescription || profile.organization?.description,
        url: `/organizations/${params.slug}`,
        siteName: 'AI Marketplace',
        images: profile.seo?.openGraphImage ? [
          {
            url: profile.seo.openGraphImage,
            width: 1200,
            height: 630,
            alt: `${orgName} - Organization Profile`
          }
        ] : undefined,
        type: 'website',
      },
      twitter: {
        card: profile.seo?.twitterCard || 'summary_large_image',
        title: profile.seo?.metaTitle || `${orgName} - Partnership Opportunities`,
        description: profile.seo?.metaDescription || profile.organization?.description,
        images: profile.seo?.openGraphImage ? [profile.seo.openGraphImage] : undefined,
      },
      keywords: profile.seo?.keywords?.join(', ') || projectTypes,
      other: {
        'business:contact_data:locality': profile.organization?.headquarters?.city || '',
        'business:contact_data:region': profile.organization?.headquarters?.state || '',
        'business:contact_data:country_name': profile.organization?.headquarters?.country || '',
      }
    });
  } catch (error) {
    console.error('Error generating metadata for organization profile:', error);
    return generateSEO({
      title: 'Organization Profile | AI Marketplace',
      description: 'Professional organization profile on AI Marketplace.',
      canonical: `/organizations/${params.slug}`
    });
  }
}

// Generate static params for ISR
export async function generateStaticParams() {
  // In production, you would fetch active public organization slugs
  // For now, return empty array to enable ISR
  return [];
}

export default async function OrganizationProfilePage({ params }: OrganizationProfilePageProps) {
  try {
    const profile = await getOrganizationProfileBySlug(params.slug);

    // Check if profile exists and is public
    if (!profile) {
      notFound();
    }

    if (!profile.publicProfile?.isPublic) {
      notFound();
    }

    return (
      <Suspense fallback={<OrganizationProfileSkeleton />}>
        <PublicOrganizationProfile profile={profile} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading organization profile:', error);
    notFound();
  }
}

// Loading skeleton component
function OrganizationProfileSkeleton() {
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