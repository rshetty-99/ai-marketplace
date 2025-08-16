export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Marketplace',
    url: 'https://aimarketplace.com',
    logo: 'https://aimarketplace.com/logo.svg',
    description: 'Enterprise AI Marketplace connecting businesses with leading AI service providers',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-0100',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://twitter.com/aimarketplace',
      'https://linkedin.com/company/aimarketplace',
      'https://github.com/aimarketplace',
    ],
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI Marketplace',
    url: 'https://aimarketplace.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://aimarketplace.com/catalog?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateProviderDirectorySchema(data: {
  providers: any[];
  totalCount: number;
  filters: any;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Service Providers Directory',
    description: 'Comprehensive directory of verified AI service providers and consulting companies',
    numberOfItems: data.totalCount,
    url: 'https://aimarketplace.com/providers',
    itemListElement: data.providers.slice(0, 10).map((provider, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Organization',
        '@id': `https://aimarketplace.com/providers/${provider.slug}`,
        name: provider.name,
        description: provider.description,
        url: `https://aimarketplace.com/providers/${provider.slug}`,
        logo: provider.logo,
        address: {
          '@type': 'PostalAddress',
          addressLocality: provider.location,
          addressCountry: provider.country.toUpperCase(),
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: provider.rating,
          reviewCount: provider.reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
        foundingDate: provider.founded.toString(),
        numberOfEmployees: {
          '@type': 'QuantitativeValue',
          value: provider.companySize === 'small' ? 25 : provider.companySize === 'medium' ? 125 : 500,
        },
        knowsAbout: provider.expertiseAreas,
        serviceArea: provider.industries,
        hasCredential: provider.certifications.map((cert: string) => ({
          '@type': 'EducationalOccupationalCredential',
          name: cert,
        })),
      },
    })),
  };
}

export function generateProviderProfileSchema(provider: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `https://aimarketplace.com/providers/${provider.slug}`,
    name: provider.name,
    description: provider.description,
    url: `https://aimarketplace.com/providers/${provider.slug}`,
    logo: provider.logo,
    image: provider.logo,
    address: {
      '@type': 'PostalAddress',
      addressLocality: provider.location,
      addressCountry: provider.country.toUpperCase(),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: provider.rating,
      reviewCount: provider.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    foundingDate: provider.founded.toString(),
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: provider.companySize === 'small' ? 25 : provider.companySize === 'medium' ? 125 : 500,
    },
    knowsAbout: provider.expertiseAreas,
    serviceArea: provider.industries,
    hasCredential: provider.certifications.map((cert: string) => ({
      '@type': 'EducationalOccupationalCredential',
      name: cert,
    })),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
    sameAs: provider.socialLinks || [],
    makesOffer: provider.services?.map((service: any) => ({
      '@type': 'Offer',
      name: service.name,
      description: service.description,
      category: service.category,
    })) || [],
  };
}

export function generateServiceSchema(service: {
  name: string;
  description: string;
  provider: string;
  price?: {
    starting: number;
    currency: string;
    model: string;
  };
  rating?: number;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: service.provider,
    },
    offers: service.price ? {
      '@type': 'Offer',
      price: service.price.starting,
      priceCurrency: service.price.currency,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: service.price.starting,
        priceCurrency: service.price.currency,
        unitText: service.price.model,
      },
    } : undefined,
    aggregateRating: service.rating ? {
      '@type': 'AggregateRating',
      ratingValue: service.rating,
      reviewCount: service.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'AI Marketplace HQ',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 AI Street',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94105',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.7749,
      longitude: -122.4194,
    },
    telephone: '+1-555-0100',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  image?: string;
  brand: string;
  rating?: number;
  reviewCount?: number;
  price?: {
    amount: number;
    currency: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: product.price ? {
      '@type': 'Offer',
      price: product.price.amount,
      priceCurrency: product.price.currency,
      availability: 'https://schema.org/InStock',
    } : undefined,
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    } : undefined,
  };
}