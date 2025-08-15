'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface OnboardingSEOProps {
  userType: 'freelancer' | 'vendor' | 'customer';
  currentStep?: number;
  stepName?: string;
  totalSteps?: number;
  progress?: number;
}

const SEO_CONFIG = {
  freelancer: {
    title: 'Join as a Freelancer - AI Marketplace',
    description: 'Join thousands of AI/ML experts and data scientists. Complete your freelancer profile and start earning with premium projects.',
    keywords: 'AI freelancer, machine learning jobs, data science work, remote AI work, freelancer registration',
    canonical: '/onboarding/freelancer'
  },
  vendor: {
    title: 'Partner with Us - Vendor Onboarding - AI Marketplace',
    description: 'Partner with AI Marketplace to offer your AI/ML services. Complete vendor setup and access enterprise clients.',
    keywords: 'AI vendor, machine learning services, enterprise AI partner, vendor registration, B2B AI',
    canonical: '/onboarding/vendor'
  },
  customer: {
    title: 'Get Started - Customer Onboarding - AI Marketplace',
    description: 'Find and hire top AI/ML talent for your projects. Complete setup to access verified experts and premium services.',
    keywords: 'hire AI experts, machine learning consultants, data science projects, AI talent, customer onboarding',
    canonical: '/onboarding/customer'
  }
};

const STEP_SEO = {
  freelancer: [
    { title: 'Personal Information - Freelancer Setup', description: 'Add your personal details to create your freelancer profile' },
    { title: 'Professional Information - Freelancer Setup', description: 'Showcase your AI/ML skills and experience' },
    { title: 'Portfolio & Projects - Freelancer Setup', description: 'Display your best work and achievements' },
    { title: 'Rate & Availability - Freelancer Setup', description: 'Set your rates and work availability' },
    { title: 'Verification - Freelancer Setup', description: 'Complete identity and skills verification' }
  ],
  vendor: [
    { title: 'Company Information - Vendor Setup', description: 'Register your company details and legal information' },
    { title: 'RBAC Setup - Vendor Setup', description: 'Configure roles and permissions for your team' },
    { title: 'Employee Roster - Vendor Setup', description: 'Add your team members and their roles' },
    { title: 'Service Catalog - Vendor Setup', description: 'Define your AI/ML services and offerings' },
    { title: 'Compliance & Certification - Vendor Setup', description: 'Upload required certifications and compliance documents' },
    { title: 'Pricing Models - Vendor Setup', description: 'Set up your pricing structure and billing models' },
    { title: 'White Label Setup - Vendor Setup', description: 'Customize your brand presence' },
    { title: 'API Access - Vendor Setup', description: 'Configure API access and integrations' }
  ],
  customer: [
    { title: 'Organization Information - Customer Setup', description: 'Add your organization details and requirements' },
    { title: 'Project Requirements - Customer Setup', description: 'Define your AI/ML project needs' },
    { title: 'Budget & Timeline - Customer Setup', description: 'Set project budget and timeline expectations' },
    { title: 'Team Structure - Customer Setup', description: 'Define your team structure and collaboration needs' },
    { title: 'Security & Compliance - Customer Setup', description: 'Configure security requirements and compliance needs' },
    { title: 'Integration Requirements - Customer Setup', description: 'Set up system integrations and technical requirements' }
  ]
};

export function OnboardingSEO({ 
  userType, 
  currentStep = 0, 
  stepName, 
  totalSteps = 0,
  progress = 0 
}: OnboardingSEOProps) {
  const pathname = usePathname();
  const config = SEO_CONFIG[userType];
  const stepConfig = STEP_SEO[userType]?.[currentStep - 1];
  
  const title = stepConfig?.title || config.title;
  const description = stepConfig?.description || config.description;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${pathname}`;
  
  // Generate structured data for onboarding process
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AI Marketplace Onboarding',
    description: config.description,
    url: canonicalUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    provider: {
      '@type': 'Organization',
      name: 'AI Marketplace',
      url: process.env.NEXT_PUBLIC_BASE_URL
    }
  };

  // Progress-based structured data for better understanding
  const progressStructuredData = totalSteps > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Complete ${userType} onboarding on AI Marketplace`,
    description: `Step-by-step guide to complete your ${userType} registration`,
    totalTime: `PT${totalSteps * 5}M`, // Estimated 5 minutes per step
    supply: [
      {
        '@type': 'HowToSupply',
        name: 'Valid email address'
      },
      {
        '@type': 'HowToSupply', 
        name: userType === 'freelancer' ? 'Portfolio examples' : 'Business information'
      }
    ],
    step: STEP_SEO[userType].map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description
    }))
  } : null;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={config.keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="AI Marketplace" />
      <meta property="og:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}/images/og-${userType}-onboarding.png`} />
      <meta property="og:image:alt" content={`${userType} onboarding on AI Marketplace`} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}/images/og-${userType}-onboarding.png`} />
      <meta name="twitter:site" content="@aimarketplace" />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="AI Marketplace" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Progress indicator for search engines */}
      {totalSteps > 0 && (
        <>
          <meta name="progress" content={`${currentStep}/${totalSteps}`} />
          <meta name="completion" content={`${progress}%`} />
        </>
      )}
      
      {/* Preload critical resources */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
      <link rel="preload" href="/images/onboarding-hero.jpg" as="image" />
      
      {/* DNS Prefetch for external resources */}
      <link rel="dns-prefetch" href="https://api.clerk.dev" />
      <link rel="dns-prefetch" href="https://clerk.aimarketplace.com" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {progressStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(progressStructuredData) }}
        />
      )}
      
      {/* Hreflang for international versions */}
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Additional Tags for specific user types */}
      {userType === 'freelancer' && (
        <>
          <meta property="article:section" content="Freelancer" />
          <meta property="article:tag" content="AI Jobs" />
          <meta property="article:tag" content="Machine Learning" />
          <meta property="article:tag" content="Remote Work" />
        </>
      )}
      
      {userType === 'vendor' && (
        <>
          <meta property="article:section" content="Business" />
          <meta property="article:tag" content="B2B Services" />
          <meta property="article:tag" content="Enterprise AI" />
          <meta property="article:tag" content="Partnership" />
        </>
      )}
      
      {userType === 'customer' && (
        <>
          <meta property="article:section" content="Services" />
          <meta property="article:tag" content="Hire Experts" />
          <meta property="article:tag" content="AI Consulting" />
          <meta property="article:tag" content="Project Management" />
        </>
      )}
    </Head>
  );
}

// Enhanced SEO component for step-specific optimization
export function StepSEO({ 
  userType, 
  stepNumber, 
  stepTitle, 
  stepDescription,
  isLastStep = false 
}: {
  userType: 'freelancer' | 'vendor' | 'customer';
  stepNumber: number;
  stepTitle: string;
  stepDescription: string;
  isLastStep?: boolean;
}) {
  const nextAction = isLastStep ? 'complete onboarding' : 'continue to next step';
  
  return (
    <Head>
      <meta name="step-number" content={stepNumber.toString()} />
      <meta name="step-title" content={stepTitle} />
      <meta name="next-action" content={nextAction} />
      
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: process.env.NEXT_PUBLIC_BASE_URL
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Onboarding',
                item: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding`
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `${userType} Setup`,
                item: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/${userType}`
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: stepTitle,
                item: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/${userType}?step=${stepNumber}`
              }
            ]
          })
        }}
      />
    </Head>
  );
}