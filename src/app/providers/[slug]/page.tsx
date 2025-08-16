import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProviderProfileClient } from './provider-profile-client';
import { ProviderProfileSkeleton } from './loading';
import { generateProviderProfileMetadata } from '../metadata';

// Mock provider data - replace with actual API call
const MOCK_PROVIDERS = [
  {
    id: '1',
    slug: 'ai-innovations-inc',
    name: 'AI Innovations Inc',
    description: 'Leading provider of enterprise AI solutions with 15+ years of experience in machine learning and data science.',
    longDescription: 'AI Innovations Inc is a pioneering technology company at the forefront of artificial intelligence and machine learning solutions. Founded in 2008, we have helped over 50 enterprise clients transform their businesses through innovative AI implementations. Our team of world-class data scientists, machine learning engineers, and AI researchers brings deep expertise across industries including healthcare, finance, and retail.',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=faces',
    coverImage: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=400&fit=crop',
    location: 'San Francisco, CA',
    country: 'us',
    rating: 4.9,
    reviewCount: 127,
    clientCount: 50,
    projectsCompleted: 200,
    expertiseAreas: ['Machine Learning', 'Computer Vision', 'NLP', 'Deep Learning', 'AI Consulting'],
    industries: ['Healthcare', 'Finance', 'Retail', 'Manufacturing'],
    certifications: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA'],
    companySize: 'medium',
    founded: 2008,
    verified: true,
    featured: true,
    pricingModel: 'project',
    startingPrice: 50000,
    website: 'https://aiinnovations.com',
    email: 'contact@aiinnovations.com',
    phone: '+1 (555) 123-4567',
    teamSize: 150,
    clients: [
      { name: 'Fortune 500 Healthcare', logo: '/logos/healthcare.png' },
      { name: 'Global Bank Corp', logo: '/logos/bank.png' },
      { name: 'Retail Giant Inc', logo: '/logos/retail.png' },
    ],
    portfolio: [
      {
        id: '1',
        title: 'Healthcare AI Diagnostic System',
        description: 'Built AI system for early cancer detection with 95% accuracy, processing over 100,000 medical images daily.',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
        category: 'Healthcare',
        technologies: ['TensorFlow', 'Computer Vision', 'Medical Imaging'],
        outcome: '95% accuracy in early cancer detection',
        timeline: '8 months',
        investment: '$2.5M'
      },
      {
        id: '2',
        title: 'Financial Fraud Detection Platform',
        description: 'Real-time fraud detection system processing millions of transactions with 99.8% accuracy.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
        category: 'Finance',
        technologies: ['Deep Learning', 'Real-time Processing', 'Anomaly Detection'],
        outcome: '99.8% fraud detection accuracy',
        timeline: '6 months',
        investment: '$1.8M'
      },
    ],
    services: [
      {
        id: '1',
        name: 'AI Strategy Consulting',
        description: 'Comprehensive AI strategy development and roadmap planning.',
        pricing: '$15,000 - $50,000',
        duration: '4-12 weeks'
      },
      {
        id: '2',
        name: 'Custom ML Model Development',
        description: 'End-to-end machine learning model development and deployment.',
        pricing: '$75,000 - $300,000',
        duration: '3-9 months'
      },
    ],
    testimonials: [
      {
        id: '1',
        client: 'Sarah Johnson',
        position: 'CTO, HealthTech Solutions',
        company: 'HealthTech Solutions',
        content: 'AI Innovations delivered exceptional results on our medical AI project. Their expertise in computer vision helped us achieve 95% accuracy in diagnostic imaging.',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces'
      },
      {
        id: '2',
        client: 'Michael Chen',
        position: 'VP of Technology, Financial Corp',
        company: 'Financial Corp',
        content: 'Outstanding fraud detection system that exceeded our expectations. The team was professional, responsive, and delivered on time.',
        rating: 5,
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces'
      },
    ],
    awards: [
      { name: 'AI Excellence Award 2023', organization: 'Tech Innovation Council' },
      { name: 'Best AI Implementation', organization: 'Healthcare Technology Awards' },
    ],
  },
];

interface ProviderProfilePageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProviderProfilePageProps): Promise<Metadata> {
  const provider = MOCK_PROVIDERS.find(p => p.slug === params.slug);
  
  if (!provider) {
    return {
      title: 'Provider Not Found | AI Marketplace',
      description: 'The requested AI service provider could not be found.',
    };
  }

  return generateProviderProfileMetadata(provider);
}

export default function ProviderProfilePage({ params }: ProviderProfilePageProps) {
  const provider = MOCK_PROVIDERS.find(p => p.slug === params.slug);

  if (!provider) {
    notFound();
  }

  return (
    <Suspense fallback={<ProviderProfileSkeleton />}>
      <ProviderProfileClient provider={provider} />
    </Suspense>
  );
}

// Generate static params for known providers (optional, for static generation)
export async function generateStaticParams() {
  return MOCK_PROVIDERS.map((provider) => ({
    slug: provider.slug,
  }));
}