import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { mockServices } from '@/lib/data/mock-services';
import { ServiceDetailClient } from './service-detail-client';

interface ServiceDetailPageProps {
  params: {
    providerName: string;
    serviceSlug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { providerName, serviceSlug } = params;
  
  // Find the service by provider name and slug
  const service = mockServices.find(s => 
    s.provider?.name.toLowerCase().replace(/\s+/g, '-') === providerName &&
    s.slug === serviceSlug
  );

  if (!service) {
    return {
      title: 'Service Not Found | AI Marketplace',
      description: 'The requested service could not be found.',
    };
  }

  return {
    title: `${service.name} by ${service.providerName} | AI Marketplace`,
    description: service.description,
    keywords: [
      service.name,
      service.providerName,
      ...service.tags,
      service.category.replace('_', ' '),
      ...service.industries,
    ].join(', '),
    openGraph: {
      title: `${service.name} - ${service.tagline}`,
      description: service.description,
      type: 'website',
      images: service.media?.screenshots ? [
        {
          url: service.media.screenshots[0],
          width: 1200,
          height: 630,
          alt: `${service.name} preview`,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.name} by ${service.providerName}`,
      description: service.tagline || service.description.substring(0, 160),
      images: service.media?.screenshots ? [service.media.screenshots[0]] : [],
    },
  };
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { providerName, serviceSlug } = params;
  
  // Find the service by provider name and slug
  const service = mockServices.find(s => 
    s.provider?.name.toLowerCase().replace(/\s+/g, '-') === providerName &&
    s.slug === serviceSlug
  );

  if (!service) {
    notFound();
  }

  return <ServiceDetailClient service={service} />;
}

// Generate static params for better performance (optional)
export async function generateStaticParams() {
  const params = mockServices.map(service => ({
    providerName: service.provider?.name.toLowerCase().replace(/\s+/g, '-') || 'unknown',
    serviceSlug: service.slug,
  }));
  
  return params;
}