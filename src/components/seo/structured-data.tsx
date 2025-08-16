/**
 * Structured Data Components
 * Inject JSON-LD structured data for better SEO
 */

import Script from 'next/script';

interface StructuredDataProps {
  data: object | object[];
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];
  
  return (
    <>
      {jsonLd.map((item, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}

/**
 * Service listing structured data
 */
export function ServiceListingStructuredData({ services }: { services: any[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        '@id': `https://ai-marketplace.com/services/${service.id}`,
        name: service.name,
        description: service.description,
        provider: {
          '@type': 'Organization',
          name: service.providerName || 'AI Provider',
        },
        aggregateRating: service.rating ? {
          '@type': 'AggregateRating',
          ratingValue: service.rating,
          reviewCount: service.reviewCount || 0,
          bestRating: 5,
          worstRating: 1,
        } : undefined,
        offers: {
          '@type': 'Offer',
          price: service.startingPrice || 0,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        category: service.category,
        url: `https://ai-marketplace.com/services/${service.id}`,
      },
    })),
  };

  return <StructuredData data={data} />;
}

/**
 * Breadcrumb structured data
 */
export function BreadcrumbStructuredData({ 
  items 
}: { 
  items: Array<{ name: string; url?: string }> 
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url || undefined,
    })),
  };

  return <StructuredData data={data} />;
}

/**
 * Organization structured data (for the marketplace itself)
 */
export function OrganizationStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://ai-marketplace.com/#organization',
    name: 'AI Marketplace',
    url: 'https://ai-marketplace.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://ai-marketplace.com/logo.png',
      width: 600,
      height: 60,
    },
    description: 'Leading AI services marketplace connecting businesses with AI solution providers',
    sameAs: [
      'https://twitter.com/aimarketplace',
      'https://linkedin.com/company/ai-marketplace',
      'https://github.com/ai-marketplace',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-0123',
      contactType: 'customer service',
      availableLanguage: ['en'],
      areaServed: 'US',
    },
  };

  return <StructuredData data={data} />;
}

/**
 * Service detail structured data
 */
export function ServiceDetailStructuredData({ service }: { service: any }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `https://ai-marketplace.com/services/${service.id}`,
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: service.providerName,
      url: `https://ai-marketplace.com/providers/${service.providerId}`,
    },
    serviceType: service.category,
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'AI Service Plans',
      itemListElement: service.pricingPlans?.map((plan: any) => ({
        '@type': 'Offer',
        name: plan.name,
        price: plan.price,
        priceCurrency: 'USD',
        description: plan.description,
      })) || [],
    },
    aggregateRating: service.rating ? {
      '@type': 'AggregateRating',
      ratingValue: service.rating,
      reviewCount: service.reviewCount || 0,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    review: service.reviews?.map((review: any) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.authorName,
      },
      datePublished: review.date,
      reviewBody: review.content,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })) || [],
  };

  return <StructuredData data={data} />;
}

/**
 * FAQ structured data
 */
export function FAQStructuredData({ 
  faqs 
}: { 
  faqs: Array<{ question: string; answer: string }> 
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <StructuredData data={data} />;
}

/**
 * Search action structured data (for site search)
 */
export function SearchActionStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://ai-marketplace.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://ai-marketplace.com/catalog?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <StructuredData data={data} />;
}