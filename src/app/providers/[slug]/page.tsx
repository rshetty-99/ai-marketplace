import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProviderProfileClient } from './provider-profile-client';
import { ProviderProfileSkeleton } from './loading';
import { generateProviderProfileMetadata } from '../metadata';
import { getProviderBySlug } from '@/lib/api/providers';

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

    return (
      <Suspense fallback={<ProviderProfileSkeleton />}>
        <ProviderProfileClient provider={provider} />
      </Suspense>
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