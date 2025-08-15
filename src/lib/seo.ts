import { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'AI Marketplace - Connect with AI-Powered Freelancers';
const DEFAULT_DESCRIPTION = 'Enterprise SaaS marketplace connecting businesses with AI-powered freelancers and service providers. Find the perfect match for your projects with our intelligent matching system.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-marketplace.com';

export function generateSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  path = '',
  image,
  noIndex = false,
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} | AI Marketplace` : DEFAULT_TITLE;
  const canonicalUrl = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/og-image.jpg`;

  return {
    title: fullTitle,
    description,
    keywords,
    robots: noIndex ? 'noindex,nofollow' : 'index,follow',
    canonical: canonicalUrl,
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: 'AI Marketplace',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title || 'AI Marketplace',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: '@ai_marketplace',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
    },
  };
}

export function generateStructuredData(type: string, data: Record<string, any>) {
  const baseStructure = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(baseStructure);
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  });
}