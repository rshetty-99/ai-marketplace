import { ServiceCategory } from '@/types/service';

// Enhanced category structure with subcategories and domains
export const categoryHierarchy = [
  {
    id: 'computer_vision' as ServiceCategory,
    name: 'Computer Vision',
    icon: '👁️',
    count: 156,
    subcategories: [
      {
        id: 'object_detection',
        name: 'Object Detection',
        count: 45,
        domains: [
          { id: 'retail_analytics', name: 'Retail Analytics', count: 12 },
          { id: 'security_surveillance', name: 'Security & Surveillance', count: 18 },
          { id: 'quality_control', name: 'Quality Control', count: 15 },
        ],
      },
      {
        id: 'facial_recognition',
        name: 'Facial Recognition',
        count: 38,
        domains: [
          { id: 'identity_verification', name: 'Identity Verification', count: 20 },
          { id: 'emotion_detection', name: 'Emotion Detection', count: 10 },
          { id: 'attendance_tracking', name: 'Attendance Tracking', count: 8 },
        ],
      },
      {
        id: 'document_processing',
        name: 'Document Processing',
        count: 52,
        domains: [
          { id: 'invoice_processing', name: 'Invoice Processing', count: 18 },
          { id: 'contract_analysis', name: 'Contract Analysis', count: 15 },
          { id: 'medical_records', name: 'Medical Records', count: 12 },
          { id: 'form_extraction', name: 'Form Extraction', count: 7 },
        ],
      },
      {
        id: 'medical_imaging',
        name: 'Medical Imaging',
        count: 21,
        domains: [
          { id: 'radiology', name: 'Radiology', count: 8 },
          { id: 'pathology', name: 'Pathology', count: 6 },
          { id: 'dental_imaging', name: 'Dental Imaging', count: 4 },
          { id: 'ophthalmology', name: 'Ophthalmology', count: 3 },
        ],
      },
    ],
  },
  {
    id: 'natural_language_processing' as ServiceCategory,
    name: 'Natural Language Processing',
    icon: '💬',
    count: 189,
    subcategories: [
      {
        id: 'sentiment_analysis',
        name: 'Sentiment Analysis',
        count: 42,
        domains: [
          { id: 'social_media', name: 'Social Media Monitoring', count: 15 },
          { id: 'customer_feedback', name: 'Customer Feedback', count: 18 },
          { id: 'brand_monitoring', name: 'Brand Monitoring', count: 9 },
        ],
      },
      {
        id: 'chatbots',
        name: 'Chatbots & Virtual Assistants',
        count: 56,
        domains: [
          { id: 'customer_support', name: 'Customer Support', count: 25 },
          { id: 'sales_assistant', name: 'Sales Assistant', count: 18 },
          { id: 'hr_assistant', name: 'HR Assistant', count: 13 },
        ],
      },
      {
        id: 'text_classification',
        name: 'Text Classification',
        count: 35,
        domains: [
          { id: 'content_moderation', name: 'Content Moderation', count: 12 },
          { id: 'spam_detection', name: 'Spam Detection', count: 10 },
          { id: 'topic_categorization', name: 'Topic Categorization', count: 13 },
        ],
      },
      {
        id: 'translation',
        name: 'Translation & Localization',
        count: 28,
        domains: [
          { id: 'real_time_translation', name: 'Real-time Translation', count: 10 },
          { id: 'document_translation', name: 'Document Translation', count: 12 },
          { id: 'website_localization', name: 'Website Localization', count: 6 },
        ],
      },
      {
        id: 'custom_nlp',
        name: 'Custom NLP Models',
        count: 28,
        domains: [
          { id: 'domain_specific', name: 'Domain-Specific Models', count: 15 },
          { id: 'language_specific', name: 'Language-Specific Models', count: 13 },
        ],
      },
    ],
  },
  {
    id: 'predictive_analytics' as ServiceCategory,
    name: 'Predictive Analytics',
    icon: '📈',
    count: 134,
    subcategories: [
      {
        id: 'demand_forecasting',
        name: 'Demand Forecasting',
        count: 38,
        domains: [
          { id: 'inventory_optimization', name: 'Inventory Optimization', count: 15 },
          { id: 'supply_chain', name: 'Supply Chain Planning', count: 12 },
          { id: 'revenue_forecasting', name: 'Revenue Forecasting', count: 11 },
        ],
      },
      {
        id: 'risk_assessment',
        name: 'Risk Assessment',
        count: 42,
        domains: [
          { id: 'credit_risk', name: 'Credit Risk', count: 18 },
          { id: 'fraud_detection', name: 'Fraud Detection', count: 15 },
          { id: 'insurance_risk', name: 'Insurance Risk', count: 9 },
        ],
      },
      {
        id: 'customer_analytics',
        name: 'Customer Analytics',
        count: 35,
        domains: [
          { id: 'churn_prediction', name: 'Churn Prediction', count: 12 },
          { id: 'lifetime_value', name: 'Lifetime Value', count: 10 },
          { id: 'segmentation', name: 'Customer Segmentation', count: 13 },
        ],
      },
      {
        id: 'financial_modeling',
        name: 'Financial Modeling',
        count: 19,
        domains: [
          { id: 'portfolio_optimization', name: 'Portfolio Optimization', count: 8 },
          { id: 'algorithmic_trading', name: 'Algorithmic Trading', count: 6 },
          { id: 'market_prediction', name: 'Market Prediction', count: 5 },
        ],
      },
    ],
  },
];

// Price range options with distribution
export const priceRanges = [
  { id: 'free', label: 'Free', min: 0, max: 0, count: 23 },
  { id: 'under_100', label: 'Under $100', min: 0.01, max: 100, count: 45 },
  { id: '100_500', label: '$100 - $500', min: 100, max: 500, count: 89 },
  { id: '500_1000', label: '$500 - $1,000', min: 500, max: 1000, count: 67 },
  { id: '1000_5000', label: '$1,000 - $5,000', min: 1000, max: 5000, count: 52 },
  { id: '5000_plus', label: '$5,000+', min: 5000, max: Infinity, count: 28 },
  { id: 'custom', label: 'Custom Pricing', min: null, max: null, count: 34 },
];

// Billing cycle options
export const billingCycles = [
  { id: 'one_time', label: 'One-time', count: 45 },
  { id: 'monthly', label: 'Monthly', count: 123 },
  { id: 'annual', label: 'Annual', count: 89 },
  { id: 'usage_based', label: 'Usage-based', count: 67 },
  { id: 'project_based', label: 'Project-based', count: 34 },
];

// Provider types with counts
export const providerTypes = [
  { id: 'vendor', label: 'Vendors', icon: '🏢', description: 'Established companies', count: 145 },
  { id: 'freelancer', label: 'Freelancers', icon: '👤', description: 'Individual experts', count: 267 },
  { id: 'agency', label: 'Agencies', icon: '👥', description: 'Small to medium teams', count: 89 },
  { id: 'channel_partner', label: 'Channel Partners', icon: '🤝', description: 'Resellers & integrators', count: 34 },
];

// Rating filters
export const ratingFilters = [
  { id: '4.5', label: '4.5+ stars', value: 4.5, count: 156 },
  { id: '4', label: '4+ stars', value: 4, count: 234 },
  { id: '3.5', label: '3.5+ stars', value: 3.5, count: 289 },
  { id: '3', label: '3+ stars', value: 3, count: 312 },
];

// Industries with service counts
export const industryFilters = [
  { id: 'healthcare', label: 'Healthcare', icon: '🏥', count: 89 },
  { id: 'finance', label: 'Finance', icon: '💰', count: 124 },
  { id: 'retail', label: 'Retail', icon: '🛍️', count: 76 },
  { id: 'manufacturing', label: 'Manufacturing', icon: '🏭', count: 58 },
  { id: 'technology', label: 'Technology', icon: '💻', count: 189 },
  { id: 'education', label: 'Education', icon: '🎓', count: 45 },
  { id: 'legal', label: 'Legal', icon: '⚖️', count: 32 },
  { id: 'media', label: 'Media & Entertainment', icon: '🎬', count: 67 },
  { id: 'real_estate', label: 'Real Estate', icon: '🏠', count: 38 },
  { id: 'logistics', label: 'Logistics', icon: '📦', count: 52 },
];

// Compliance and certifications
export const complianceFilters = [
  { id: 'soc2', label: 'SOC 2 Type II', icon: '🛡️', count: 178 },
  { id: 'iso27001', label: 'ISO 27001', icon: '📜', count: 145 },
  { id: 'hipaa', label: 'HIPAA', icon: '🏥', count: 67 },
  { id: 'gdpr', label: 'GDPR', icon: '🇪🇺', count: 234 },
  { id: 'pci_dss', label: 'PCI DSS', icon: '💳', count: 89 },
  { id: 'fedramp', label: 'FedRAMP', icon: '🏛️', count: 34 },
];

// Deployment options
export const deploymentOptions = [
  { id: 'cloud', label: 'Cloud (SaaS)', icon: '☁️', count: 289 },
  { id: 'on_premise', label: 'On-premise', icon: '🏢', count: 124 },
  { id: 'hybrid', label: 'Hybrid', icon: '🔄', count: 167 },
  { id: 'api_only', label: 'API-only', icon: '🔌', count: 198 },
  { id: 'mobile', label: 'Mobile', icon: '📱', count: 76 },
  { id: 'edge', label: 'Edge Computing', icon: '⚡', count: 45 },
];

// Implementation timeline
export const implementationTimelines = [
  { id: 'immediate', label: 'Immediate (< 1 week)', icon: '🚀', count: 89 },
  { id: 'quick', label: 'Quick (1-4 weeks)', icon: '⚡', count: 156 },
  { id: 'standard', label: 'Standard (1-3 months)', icon: '📅', count: 178 },
  { id: 'extended', label: 'Extended (3+ months)', icon: '📆', count: 67 },
];

// Service features
export const serviceFeatures = [
  { id: 'free_trial', label: 'Free Trial', icon: '🆓', count: 234 },
  { id: 'free_tier', label: 'Free Tier', icon: '💸', count: 89 },
  { id: 'demo_available', label: 'Demo Available', icon: '🎬', count: 312 },
  { id: '24_7_support', label: '24/7 Support', icon: '🔔', count: 178 },
  { id: 'custom_training', label: 'Custom Training', icon: '🎯', count: 145 },
  { id: 'white_label', label: 'White Label Option', icon: '🏷️', count: 67 },
  { id: 'api_access', label: 'API Access', icon: '🔑', count: 267 },
  { id: 'sla_guarantee', label: 'SLA Guarantee', icon: '✅', count: 189 },
];

// Technologies
export const technologyFilters = [
  { id: 'tensorflow', label: 'TensorFlow', category: 'Framework', count: 156 },
  { id: 'pytorch', label: 'PyTorch', category: 'Framework', count: 134 },
  { id: 'scikit_learn', label: 'Scikit-learn', category: 'Library', count: 189 },
  { id: 'opencv', label: 'OpenCV', category: 'Computer Vision', count: 89 },
  { id: 'transformers', label: 'Transformers', category: 'NLP', count: 112 },
  { id: 'spacy', label: 'spaCy', category: 'NLP', count: 76 },
  { id: 'keras', label: 'Keras', category: 'Framework', count: 98 },
  { id: 'nltk', label: 'NLTK', category: 'NLP', count: 65 },
];

// Location/Region filters
export const locationFilters = [
  { id: 'north_america', label: 'North America', icon: '🌎', count: 145 },
  { id: 'europe', label: 'Europe', icon: '🌍', count: 132 },
  { id: 'asia_pacific', label: 'Asia Pacific', icon: '🌏', count: 98 },
  { id: 'latin_america', label: 'Latin America', icon: '🌎', count: 45 },
  { id: 'middle_east', label: 'Middle East', icon: '🌍', count: 38 },
  { id: 'africa', label: 'Africa', icon: '🌍', count: 22 },
  { id: 'global', label: 'Global/Remote', icon: '🌐', count: 256 },
];

// Quick filter combinations for popular searches
export const quickFilterCombos = [
  {
    id: 'enterprise_ml',
    label: 'Enterprise ML Solutions',
    icon: '🏢',
    description: 'Machine learning for large organizations',
    filters: {
      category: 'machine_learning',
      providerType: 'vendor',
      priceRange: { min: 5000, max: null },
      features: ['enterprise_support', 'sla', 'custom_training'],
    },
  },
  {
    id: 'healthcare_compliant',
    label: 'Healthcare Compliance Ready',
    icon: '🏥',
    description: 'HIPAA compliant AI solutions',
    filters: {
      industries: ['healthcare'],
      compliance: ['hipaa', 'gdpr'],
      features: ['data_encryption', 'audit_logs'],
    },
  },
  {
    id: 'startup_friendly',
    label: 'Startup Friendly Pricing',
    icon: '🚀',
    description: 'Affordable AI for startups',
    filters: {
      priceRange: { min: 0, max: 500 },
      billingCycle: 'monthly',
      features: ['free_trial', 'pay_as_you_go'],
    },
  },
  {
    id: 'no_code_solutions',
    label: 'No-Code AI Tools',
    icon: '🎨',
    description: 'AI without programming',
    filters: {
      features: ['no_code', 'drag_drop', 'visual_interface'],
      complexity: 'low',
    },
  },
  {
    id: 'finance_ready',
    label: 'Financial Services',
    icon: '💳',
    description: 'AI for banking and finance',
    filters: {
      industries: ['finance', 'banking'],
      compliance: ['pci_dss', 'sox'],
      features: ['fraud_detection', 'risk_analysis'],
    },
  },
  {
    id: 'real_time_ai',
    label: 'Real-Time Processing',
    icon: '⚡',
    description: 'Low-latency AI services',
    filters: {
      features: ['real_time', 'streaming', 'low_latency'],
      deploymentOptions: ['edge', 'on_premise'],
    },
  },
];

// Languages
export const languageFilters = [
  { id: 'python', label: 'Python', icon: '🐍', count: 289 },
  { id: 'javascript', label: 'JavaScript', icon: '📜', count: 156 },
  { id: 'java', label: 'Java', icon: '☕', count: 124 },
  { id: 'r', label: 'R', icon: '📊', count: 89 },
  { id: 'cpp', label: 'C++', icon: '⚙️', count: 67 },
  { id: 'go', label: 'Go', icon: '🐹', count: 45 },
];

// Cloud platforms
export const platformFilters = [
  { id: 'aws', label: 'AWS', icon: '☁️', count: 234 },
  { id: 'azure', label: 'Azure', icon: '☁️', count: 189 },
  { id: 'gcp', label: 'Google Cloud', icon: '☁️', count: 167 },
  { id: 'ibm_cloud', label: 'IBM Cloud', icon: '☁️', count: 78 },
  { id: 'oracle_cloud', label: 'Oracle Cloud', icon: '☁️', count: 45 },
  { id: 'alibaba_cloud', label: 'Alibaba Cloud', icon: '☁️', count: 34 },
];

// Integration methods
export const integrationMethods = [
  { id: 'rest_api', label: 'REST API', count: 289 },
  { id: 'graphql', label: 'GraphQL', count: 89 },
  { id: 'sdk', label: 'SDK', count: 178 },
  { id: 'webhook', label: 'Webhook', count: 145 },
  { id: 'plugin', label: 'Plugin', count: 67 },
  { id: 'iframe', label: 'iFrame', count: 34 },
];

// Support levels
export const supportLevels = [
  { id: 'community', label: 'Community', icon: '👥', count: 89 },
  { id: 'email', label: 'Email', icon: '📧', count: 234 },
  { id: 'chat', label: 'Chat', icon: '💬', count: 189 },
  { id: 'phone', label: 'Phone', icon: '📞', count: 145 },
  { id: 'dedicated', label: 'Dedicated Manager', icon: '👤', count: 67 },
];