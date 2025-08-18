import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProviderProfileClient } from './provider-profile-client';
import { ProviderProfileSkeleton } from './loading';
import { generateProviderProfileMetadata } from '../metadata';
import { getProviderBySlug } from '@/lib/api/providers';
import { generateProfileStructuredData, ProfileSEOData } from '@/lib/seo/meta-generator';

// Provider data now loaded from API

interface ProviderProfilePageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProviderProfilePageProps): Promise<Metadata> {
  try {
    const provider = await getProviderBySlug(params.slug);
    
    if (!provider) {
      return {
        title: 'Provider Not Found | AI Marketplace',
        description: 'The requested AI service provider could not be found.',
      };
    }

    return generateProviderProfileMetadata(provider);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Provider | AI Marketplace',
      description: 'AI service provider profile',
    };
  }
}

export default async function ProviderProfilePage({ params }: ProviderProfilePageProps) {
  try {
    const provider = await getProviderBySlug(params.slug);

    if (!provider) {
      notFound();
    }

    // Generate structured data for SEO
    const profileData: ProfileSEOData = {
      name: provider.name || provider.companyName || 'Unknown Provider',
      title: provider.title || provider.jobTitle,
      description: provider.description || provider.bio || `${provider.name} provides expert AI services and solutions.`,
      slug: provider.slug,
      userType: 'freelancer',
      email: provider.email,
      website: provider.website,
      location: provider.location,
      skills: provider.skills || provider.expertiseAreas || [],
      services: provider.services || provider.serviceOfferings || [],
      experience: provider.yearsExperience,
      hourlyRate: provider.hourlyRate,
      currency: provider.currency || 'USD',
      avatar: provider.avatar || provider.logo,
      portfolioImages: provider.portfolioImages || [],
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      completedProjects: provider.completedProjects,
      linkedinUrl: provider.socialLinks?.linkedin,
      githubUrl: provider.socialLinks?.github,
      twitterUrl: provider.socialLinks?.twitter,
      companyName: provider.companyName,
      foundedYear: provider.foundedYear,
      teamSize: provider.teamSize,
      joinedDate: provider.joinedDate,
      lastActive: provider.lastActive || provider.updatedAt,
    };

    const structuredData = generateProfileStructuredData(profileData);

    return (
      <>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        
        <Suspense fallback={<ProviderProfileSkeleton />}>
          <ProviderProfileClient provider={provider} />
        </Suspense>
      </>
    );
  } catch (error) {
    console.error('Error loading provider:', error);
    notFound();
  }
}

// Generate static params for known providers (optional, for static generation)
// This could be enhanced to fetch from the database for better performance
export async function generateStaticParams() {
  // For now, return empty array to generate pages on demand
  // In production, you might want to pre-generate popular provider pages
  return [];
}