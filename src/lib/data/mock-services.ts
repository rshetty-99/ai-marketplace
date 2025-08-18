import { Service, ProviderInfo, ServiceCategory, ProviderType, ProviderSize } from '@/types/service';
import { Timestamp } from 'firebase/firestore';

// Mock timestamp helper
const mockTimestamp = (daysAgo: number = 0): Timestamp => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 } as Timestamp;
};

// Mock Providers
export const mockProviders: ProviderInfo[] = [
  {
    id: 'provider-1',
    name: 'TechSamurai AI',
    type: 'vendor' as ProviderType,
    size: 'medium' as ProviderSize,
    logo: '/images/providers/techsamurai-logo.png',
    description: 'Leading enterprise AI solutions provider specializing in computer vision and NLP.',
    website: 'https://techsamurai.ai',
    founded: 2019,
    employeeCount: '50-200',
    headquarters: {
      street: '123 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
    },
    verification: {
      verified: true,
      certifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR Compliant'],
      verifiedAt: mockTimestamp(30),
    },
    rating: {
      averageRating: 4.8,
      totalReviews: 127,
      breakdown: { 5: 89, 4: 28, 3: 7, 2: 2, 1: 1 },
      lastUpdated: mockTimestamp(1),
    },
  },
  {
    id: 'provider-2',
    name: 'Sarah Chen',
    type: 'freelancer' as ProviderType,
    size: 'individual' as ProviderSize,
    logo: '/images/providers/sarah-chen.jpg',
    description: 'Independent AI consultant with 8+ years experience in machine learning and data science.',
    website: 'https://sarahchen.ai',
    founded: 2020,
    employeeCount: '1',
    verification: {
      verified: true,
      certifications: ['AWS ML Specialty', 'Google Cloud ML Engineer'],
      verifiedAt: mockTimestamp(45),
    },
    rating: {
      averageRating: 4.9,
      totalReviews: 43,
      breakdown: { 5: 38, 4: 4, 3: 1, 2: 0, 1: 0 },
      lastUpdated: mockTimestamp(3),
    },
  },
  {
    id: 'provider-3',
    name: 'DataFlow Solutions',
    type: 'agency' as ProviderType,
    size: 'small' as ProviderSize,
    logo: '/images/providers/dataflow-logo.png',
    description: 'Boutique AI agency focused on predictive analytics and business intelligence.',
    website: 'https://dataflowsolutions.com',
    founded: 2021,
    employeeCount: '10-25',
    verification: {
      verified: true,
      certifications: ['Microsoft Partner', 'Snowflake Partner'],
      verifiedAt: mockTimestamp(60),
    },
    rating: {
      averageRating: 4.6,
      totalReviews: 89,
      breakdown: { 5: 51, 4: 29, 3: 7, 2: 1, 1: 1 },
      lastUpdated: mockTimestamp(2),
    },
  },
];

// Mock Services
export const mockServices: Service[] = [
  {
    id: 'service-1',
    providerId: 'provider-1',
    providerName: 'TechSamurai AI',
    providerLogo: '/images/providers/techsamurai-logo.png',
    provider: mockProviders[0],
    
    name: 'Advanced Document Intelligence Platform',
    slug: 'advanced-document-intelligence',
    tagline: 'Extract insights from any document with 99.5% accuracy',
    description: 'Transform your document processing with our state-of-the-art AI platform that combines OCR, NLP, and machine learning to extract, classify, and analyze information from any document type. Perfect for legal, financial, and healthcare organizations.',
    
    category: 'computer_vision' as ServiceCategory,
    subcategory: 'document_processing',
    tags: ['OCR', 'Document Analysis', 'Text Extraction', 'Classification'],
    industries: ['Legal', 'Healthcare', 'Finance', 'Insurance'],
    useCases: ['Contract Analysis', 'Medical Records Processing', 'Invoice Processing', 'Compliance Checking'],
    
    technical: {
      technologies: ['TensorFlow', 'PyTorch', 'OpenCV', 'Tesseract'],
      frameworks: ['FastAPI', 'Django', 'React'],
      languages: ['Python', 'TypeScript', 'Go'],
      platforms: ['AWS', 'Azure', 'GCP'],
      apis: [
        {
          name: 'Document Processing API',
          version: 'v2.1',
          documentation: 'https://docs.techsamurai.ai/document-api',
          restEndpoint: 'https://api.techsamurai.ai/v2/documents',
        },
      ],
      integrations: [
        {
          name: 'Salesforce',
          type: 'api',
          difficulty: 'easy',
          documentation: 'https://docs.techsamurai.ai/integrations/salesforce',
        },
        {
          name: 'Microsoft Office 365',
          type: 'plugin',
          difficulty: 'medium',
        },
      ],
    },
    
    features: [
      {
        name: 'Multi-format Support',
        description: 'Process PDFs, images, scanned documents, and more',
        included: true,
        category: 'Core',
      },
      {
        name: 'Real-time Processing',
        description: 'Get results in under 5 seconds for most documents',
        included: true,
        category: 'Performance',
      },
      {
        name: 'Custom Model Training',
        description: 'Train on your specific document types for better accuracy',
        included: true,
        category: 'Advanced',
      },
      {
        name: 'Batch Processing',
        description: 'Process thousands of documents simultaneously',
        included: true,
        category: 'Enterprise',
      },
    ],
    
    pricing: {
      type: 'usage_based',
      startingPrice: 0.05,
      currency: 'USD',
      customPricing: false,
      tiers: [
        {
          name: 'Starter',
          price: 0.05,
          features: ['Up to 1,000 pages/month', 'Standard accuracy', 'Email support'],
        },
        {
          name: 'Professional',
          price: 0.03,
          features: ['Up to 10,000 pages/month', 'High accuracy', 'Priority support', 'Custom models'],
          popular: true,
        },
        {
          name: 'Enterprise',
          price: 0.02,
          features: ['Unlimited pages', 'Highest accuracy', '24/7 support', 'On-premise deployment'],
        },
      ],
    },
    
    implementation: {
      timeline: {
        discovery: '1-2 weeks',
        development: '2-4 weeks',
        deployment: '1 week',
        total: '4-7 weeks',
      },
      complexity: 'medium',
      requirements: {
        technical: ['REST API integration', 'Cloud storage', 'Authentication system'],
        business: ['Document workflow mapping', 'Quality criteria definition'],
        data: ['Sample documents for training', 'Expected volume estimates'],
        infrastructure: ['Cloud hosting', 'Backup systems'],
      },
      support: {
        channels: ['email', 'chat', 'phone'],
        hours: '24/7',
        responseTime: '< 4 hours',
        languages: ['English', 'Spanish', 'French'],
        dedicatedManager: true,
      },
    },
    
    availability: {
      regions: ['North America', 'Europe', 'Asia-Pacific'],
      deploymentOptions: ['cloud', 'on_premise', 'hybrid'],
      scalability: 'Auto-scaling up to 1M pages/day',
      uptime: '99.9%',
    },
    
    compliance: {
      certifications: ['SOC 2 Type II', 'ISO 27001', 'HIPAA', 'GDPR'],
      regulations: ['CCPA', 'PIPEDA', 'LGPD'],
      dataHandling: {
        dataRetention: '30 days (configurable)',
        dataLocation: ['US', 'EU', 'Asia'],
        encryption: true,
        backups: true,
      },
      security: {
        authentication: ['OAuth 2.0', 'SAML', 'API Keys'],
        encryption: {
          atRest: true,
          inTransit: true,
          keyManagement: 'AWS KMS',
        },
        accessControl: ['RBAC', 'IP Whitelisting', 'VPN'],
        monitoring: true,
        penetrationTesting: true,
        vulnerabilityScanning: true,
      },
    },
    
    media: {
      logo: '/images/services/document-intelligence-logo.png',
      screenshots: [
        '/images/services/document-intelligence-1.png',
        '/images/services/document-intelligence-2.png',
      ],
      videos: ['https://youtube.com/watch?v=example1'],
      demos: ['https://demo.techsamurai.ai/document-intelligence'],
      whitepapers: ['https://techsamurai.ai/whitepapers/document-ai'],
      caseStudies: ['https://techsamurai.ai/case-studies/law-firm-automation'],
    },
    
    reviews: {
      averageRating: 4.8,
      totalReviews: 127,
      breakdown: { 5: 89, 4: 28, 3: 7, 2: 2, 1: 1 },
      lastUpdated: mockTimestamp(1),
      dimensions: {
        quality: {
          averageRating: 4.9,
          totalReviews: 127,
          breakdown: { 5: 95, 4: 22, 3: 7, 2: 2, 1: 1 },
          lastUpdated: mockTimestamp(1),
        },
        support: {
          averageRating: 4.7,
          totalReviews: 127,
          breakdown: { 5: 82, 4: 31, 3: 10, 2: 3, 1: 1 },
          lastUpdated: mockTimestamp(1),
        },
        implementation: {
          averageRating: 4.6,
          totalReviews: 127,
          breakdown: { 5: 75, 4: 38, 3: 11, 2: 2, 1: 1 },
          lastUpdated: mockTimestamp(1),
        },
        value: {
          averageRating: 4.8,
          totalReviews: 127,
          breakdown: { 5: 87, 4: 29, 3: 8, 2: 2, 1: 1 },
          lastUpdated: mockTimestamp(1),
        },
      },
    },
    
    status: 'published',
    visibility: 'public',
    featured: true,
    priority: 100,
    
    stats: {
      views: 12847,
      inquiries: 234,
      demos: 89,
      conversions: 23,
      lastViewed: mockTimestamp(0),
      averageResponseTime: 2.3,
    },
    
    createdAt: mockTimestamp(90),
    updatedAt: mockTimestamp(5),
    id: 'service-1',
  },
  
  // Add Sarah Chen's NLP Consulting Service
  {
    id: 'service-2',
    providerId: 'provider-2',
    providerName: 'Sarah Chen',
    providerLogo: '/images/providers/sarah-chen.jpg',
    provider: mockProviders[1],
    
    name: 'Custom NLP Model Development',
    slug: 'custom-nlp-model-development',
    tagline: 'Tailored natural language processing solutions for your business',
    description: 'Get custom-built NLP models designed specifically for your use case. From sentiment analysis to named entity recognition, I create production-ready models that understand your domain and deliver results.',
    
    category: 'natural_language_processing' as ServiceCategory,
    subcategory: 'custom_models',
    tags: ['NLP', 'Custom Models', 'Text Analysis', 'Machine Learning'],
    industries: ['E-commerce', 'Media', 'Customer Service', 'Social Media'],
    useCases: ['Sentiment Analysis', 'Content Classification', 'Entity Extraction', 'Chatbot Training'],
    
    technical: {
      technologies: ['Transformers', 'BERT', 'spaCy', 'NLTK'],
      frameworks: ['Hugging Face', 'PyTorch', 'TensorFlow'],
      languages: ['Python', 'R'],
      platforms: ['AWS', 'GCP', 'Jupyter'],
      apis: [
        {
          name: 'NLP Model API',
          version: 'v1.0',
          documentation: 'https://sarahchen.ai/api-docs',
          restEndpoint: 'https://api.sarahchen.ai/v1/nlp',
        },
      ],
      integrations: [
        {
          name: 'Slack',
          type: 'webhook',
          difficulty: 'easy',
        },
        {
          name: 'Zapier',
          type: 'api',
          difficulty: 'easy',
        },
      ],
    },
    
    features: [
      {
        name: 'Domain-Specific Training',
        description: 'Models trained on your specific industry and use case',
        included: true,
        category: 'Core',
      },
      {
        name: 'Multi-Language Support',
        description: 'Support for 15+ languages including English, Spanish, French',
        included: true,
        category: 'Core',
      },
      {
        name: 'Real-time Inference',
        description: 'Low-latency API for real-time text processing',
        included: true,
        category: 'Performance',
      },
      {
        name: 'Model Fine-tuning',
        description: 'Continuous improvement based on your feedback',
        included: true,
        category: 'Advanced',
      },
    ],
    
    pricing: {
      type: 'project_based',
      startingPrice: 5000,
      currency: 'USD',
      customPricing: true,
      tiers: [
        {
          name: 'Basic Model',
          price: 5000,
          features: ['Simple classification', '2 weeks delivery', 'Basic documentation'],
        },
        {
          name: 'Advanced Model',
          price: 12000,
          features: ['Complex NLP tasks', '4 weeks delivery', 'API integration', 'Training'],
          popular: true,
        },
        {
          name: 'Enterprise Solution',
          price: 25000,
          features: ['Multiple models', 'On-premise deployment', 'Ongoing support', 'Custom features'],
        },
      ],
    },
    
    implementation: {
      timeline: {
        discovery: '1 week',
        development: '2-6 weeks',
        deployment: '1 week',
        total: '4-8 weeks',
      },
      complexity: 'medium',
      requirements: {
        technical: ['Training data', 'API integration requirements'],
        business: ['Clear success metrics', 'Use case definition'],
        data: ['Labeled training data', 'Quality guidelines'],
        infrastructure: ['Hosting environment', 'API endpoints'],
      },
      support: {
        channels: ['email', 'video_call'],
        hours: 'Business hours (PST)',
        responseTime: '< 24 hours',
        languages: ['English'],
        dedicatedManager: false,
      },
    },
    
    availability: {
      regions: ['Global'],
      deploymentOptions: ['cloud', 'on_premise'],
      scalability: 'Up to 10K requests/hour',
      uptime: '99.5%',
    },
    
    compliance: {
      certifications: ['AWS Certified', 'Google Cloud Certified'],
      regulations: ['GDPR Compliant'],
      dataHandling: {
        dataRetention: 'As specified by client',
        dataLocation: ['US', 'EU'],
        encryption: true,
        backups: true,
      },
      security: {
        authentication: ['API Keys', 'OAuth 2.0'],
        encryption: {
          atRest: true,
          inTransit: true,
          keyManagement: 'Cloud Provider',
        },
        accessControl: ['IP Whitelisting'],
        monitoring: true,
        penetrationTesting: false,
        vulnerabilityScanning: false,
      },
    },
    
    media: {
      screenshots: [
        '/images/services/nlp-model-1.png',
        '/images/services/nlp-model-2.png',
      ],
      videos: [],
      demos: ['https://sarahchen.ai/demo'],
      whitepapers: [],
      caseStudies: ['https://sarahchen.ai/case-studies/sentiment-analysis'],
    },
    
    reviews: {
      averageRating: 4.9,
      totalReviews: 43,
      breakdown: { 5: 38, 4: 4, 3: 1, 2: 0, 1: 0 },
      lastUpdated: mockTimestamp(3),
      dimensions: {
        quality: {
          averageRating: 5.0,
          totalReviews: 43,
          breakdown: { 5: 40, 4: 3, 3: 0, 2: 0, 1: 0 },
          lastUpdated: mockTimestamp(3),
        },
        support: {
          averageRating: 4.8,
          totalReviews: 43,
          breakdown: { 5: 35, 4: 6, 3: 2, 2: 0, 1: 0 },
          lastUpdated: mockTimestamp(3),
        },
        implementation: {
          averageRating: 4.9,
          totalReviews: 43,
          breakdown: { 5: 37, 4: 5, 3: 1, 2: 0, 1: 0 },
          lastUpdated: mockTimestamp(3),
        },
        value: {
          averageRating: 4.8,
          totalReviews: 43,
          breakdown: { 5: 34, 4: 7, 3: 2, 2: 0, 1: 0 },
          lastUpdated: mockTimestamp(3),
        },
      },
    },
    
    status: 'published',
    visibility: 'public',
    featured: false,
    priority: 85,
    
    stats: {
      views: 4521,
      inquiries: 67,
      demos: 23,
      conversions: 8,
      lastViewed: mockTimestamp(0),
      averageResponseTime: 18.5,
    },
    
    createdAt: mockTimestamp(120),
    updatedAt: mockTimestamp(10),
    id: 'service-2',
  },
];

// Category definitions
export const serviceCategories = [
  {
    id: 'computer_vision' as ServiceCategory,
    name: 'Computer Vision',
    description: 'Image and video analysis, object detection, facial recognition',
    icon: '👁️',
    subcategories: [
      { id: 'object_detection', name: 'Object Detection', description: 'Identify and locate objects in images' },
      { id: 'facial_recognition', name: 'Facial Recognition', description: 'Identify and verify faces' },
      { id: 'document_processing', name: 'Document Processing', description: 'OCR and document analysis' },
      { id: 'medical_imaging', name: 'Medical Imaging', description: 'Medical image analysis and diagnosis' },
    ],
  },
  {
    id: 'natural_language_processing' as ServiceCategory,
    name: 'Natural Language Processing',
    description: 'Text analysis, language understanding, chatbots',
    icon: '💬',
    subcategories: [
      { id: 'sentiment_analysis', name: 'Sentiment Analysis', description: 'Understand emotions in text' },
      { id: 'text_classification', name: 'Text Classification', description: 'Categorize and organize text' },
      { id: 'named_entity_recognition', name: 'Named Entity Recognition', description: 'Extract entities from text' },
      { id: 'custom_models', name: 'Custom Models', description: 'Tailored NLP solutions' },
    ],
  },
  {
    id: 'predictive_analytics' as ServiceCategory,
    name: 'Predictive Analytics',
    description: 'Forecasting, trend analysis, business intelligence',
    icon: '📈',
    subcategories: [
      { id: 'demand_forecasting', name: 'Demand Forecasting', description: 'Predict future demand patterns' },
      { id: 'risk_assessment', name: 'Risk Assessment', description: 'Evaluate and predict risks' },
      { id: 'customer_analytics', name: 'Customer Analytics', description: 'Customer behavior prediction' },
      { id: 'financial_modeling', name: 'Financial Modeling', description: 'Financial predictions and modeling' },
    ],
  },
];

// Industries
export const industries = [
  { id: 'healthcare', name: 'Healthcare', serviceCount: 45 },
  { id: 'finance', name: 'Finance', serviceCount: 67 },
  { id: 'retail', name: 'Retail', serviceCount: 34 },
  { id: 'manufacturing', name: 'Manufacturing', serviceCount: 28 },
  { id: 'technology', name: 'Technology', serviceCount: 89 },
  { id: 'education', name: 'Education', serviceCount: 23 },
  { id: 'legal', name: 'Legal', serviceCount: 19 },
  { id: 'media', name: 'Media & Entertainment', serviceCount: 31 },
];

// Technologies
export const technologies = [
  { id: 'tensorflow', name: 'TensorFlow', category: 'Framework', popularity: 95 },
  { id: 'pytorch', name: 'PyTorch', category: 'Framework', popularity: 88 },
  { id: 'scikit-learn', name: 'Scikit-learn', category: 'Library', popularity: 92 },
  { id: 'opencv', name: 'OpenCV', category: 'Computer Vision', popularity: 76 },
  { id: 'transformers', name: 'Transformers', category: 'NLP', popularity: 84 },
  { id: 'spacy', name: 'spaCy', category: 'NLP', popularity: 71 },
];