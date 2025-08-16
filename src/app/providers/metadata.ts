/**
 * Dynamic metadata generation for provider directory pages
 */

import { Metadata } from 'next';

interface GenerateProviderDirectoryMetadataProps {
  searchParams?: {
    search?: string;
    expertise?: string;
    location?: string;
    certification?: string;
    industry?: string;
    companySize?: string;
    rating?: string;
    verified?: string;
    pricing?: string;
    sort?: string;
    page?: string;
  };
  resultCount?: number;
}

export function generateProviderDirectoryMetadata({
  searchParams = {},
  resultCount,
}: GenerateProviderDirectoryMetadataProps): Metadata {
  const {
    search,
    expertise,
    location,
    certification,
    industry,
    page,
  } = searchParams;

  // Build dynamic title
  let title = 'AI Service Providers Directory';
  const titleParts: string[] = [];
  
  if (search) {
    titleParts.push(`"${search}"`);
  }
  
  if (expertise) {
    titleParts.push(formatExpertise(expertise));
  }
  
  if (location) {
    titleParts.push(`in ${formatLocation(location)}`);
  }
  
  if (titleParts.length > 0) {
    title = `${titleParts.join(' ')} AI Providers | AI Marketplace`;
  } else {
    title = 'AI Service Providers Directory | Connect with Expert AI Companies';
  }

  // Build dynamic description
  let description = 'Find and connect with leading AI service providers.';
  const descParts: string[] = [];
  
  if (expertise) {
    descParts.push(`${formatExpertise(expertise)} specialists`);
  }
  
  if (location) {
    descParts.push(`based in ${formatLocation(location)}`);
  }
  
  if (certification) {
    descParts.push(`with ${formatCertification(certification)} certification`);
  }
  
  if (industry) {
    descParts.push(`serving ${formatIndustry(industry)} industry`);
  }
  
  if (descParts.length > 0) {
    description = `Find ${descParts.join(', ')}. Browse profiles, portfolios, and case studies of expert AI companies and consultants.`;
  } else {
    description = 'Find and connect with leading AI service providers. Browse profiles, portfolios, and case studies of expert AI companies and consultants.';
  }
  
  if (resultCount !== undefined) {
    description = `${resultCount} ${description}`;
  }

  // Build canonical URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aimarketplace.com';
  const urlParams = new URLSearchParams();
  
  if (expertise) urlParams.set('expertise', expertise);
  if (location) urlParams.set('location', location);
  if (certification) urlParams.set('certification', certification);
  if (industry) urlParams.set('industry', industry);
  
  const canonical = `${baseUrl}/providers${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;

  // Build keywords
  const keywords = [
    'AI companies',
    'machine learning providers', 
    'AI consultants',
    'artificial intelligence services',
    'AI development companies',
  ];
  
  if (expertise) {
    keywords.push(`${expertise} providers`, `${expertise} experts`);
  }
  
  if (location) {
    keywords.push(`AI companies ${location}`, `${location} AI providers`);
  }

  return {
    title,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'AI Marketplace',
      type: 'website',
      locale: 'en_US',
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}&type=providers`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/api/og?title=${encodeURIComponent(title)}&type=providers`],
    },
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'page-type': page ? `page-${page}` : 'page-1',
    },
  };
}

// Helper functions for formatting
function formatExpertise(expertise: string): string {
  return expertise
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatLocation(location: string): string {
  const locationMap: Record<string, string> = {
    'us': 'United States',
    'uk': 'United Kingdom',
    'ca': 'Canada',
    'au': 'Australia',
    'de': 'Germany',
    'fr': 'France',
    'in': 'India',
    'sg': 'Singapore',
  };
  
  return locationMap[location.toLowerCase()] || location.toUpperCase();
}

function formatCertification(certification: string): string {
  const certMap: Record<string, string> = {
    'soc2': 'SOC 2',
    'iso27001': 'ISO 27001',
    'gdpr': 'GDPR',
    'hipaa': 'HIPAA',
    'pci': 'PCI DSS',
  };
  
  return certMap[certification.toLowerCase()] || certification.toUpperCase();
}

function formatIndustry(industry: string): string {
  return industry
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate metadata for individual provider profile pages
 */
export function generateProviderProfileMetadata(provider: any): Metadata {
  const title = `${provider.name} - AI Service Provider | AI Marketplace`;
  const description = provider.description || `${provider.name} provides expert AI services and solutions. View portfolio, client testimonials, and connect directly for your AI project needs.`;
  
  return {
    title,
    description,
    keywords: [
      provider.name,
      'AI service provider',
      'artificial intelligence',
      ...(provider.expertiseAreas || []),
      ...(provider.industries || []),
    ].join(', '),
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/providers/${provider.slug}`,
      siteName: 'AI Marketplace',
      images: provider.logo ? [
        {
          url: provider.logo,
          width: 1200,
          height: 630,
          alt: `${provider.name} logo`,
        },
      ] : [],
      locale: 'en_US',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: provider.logo ? [provider.logo] : [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/providers/${provider.slug}`,
    },
  };
}