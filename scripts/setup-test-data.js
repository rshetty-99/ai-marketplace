#!/usr/bin/env node

/**
 * Test Data Setup Script
 * 
 * This script sets up sample data for testing the semantic search functionality.
 * It creates sample services with embeddings for comprehensive testing.
 * 
 * Usage:
 *   node scripts/setup-test-data.js [options]
 *   
 * Options:
 *   --count N         Number of test services to create (default: 20)
 *   --with-embeddings Generate embeddings for test services
 *   --clean           Remove existing test data first
 *   --dry-run         Show what would be created without making changes
 *   --help            Show this help message
 */

// Sample service templates for comprehensive testing
const serviceTemplates = [
  {
    category: 'computer_vision',
    templates: [
      {
        name: 'DocuVision AI Pro',
        description: 'Advanced computer vision service for document processing and analysis. Uses state-of-the-art OCR and machine learning to extract information from invoices, contracts, and forms with 99.5% accuracy.',
        shortDescription: 'AI-powered document processing with OCR and ML',
        tags: ['OCR', 'document processing', 'computer vision', 'machine learning', 'invoice analysis'],
        subcategory: 'document_processing',
        features: ['api_access', 'batch_processing', 'real_time', 'custom_training', 'webhook_support'],
        benefits: ['improved_accuracy', 'cost_reduction', 'faster_processing', 'automated_workflow'],
        industries: ['finance', 'healthcare', 'legal', 'insurance'],
        technologies: ['tensorflow', 'opencv', 'tesseract', 'pytorch'],
        useCases: ['invoice_processing', 'contract_analysis', 'form_extraction', 'receipt_digitization'],
        pricing: { startingPrice: 299, billingCycle: 'monthly', tier: 'professional' },
        rating: 4.7,
        reviewCount: 127,
        compliance: ['soc2', 'gdpr', 'hipaa'],
        locations: ['north_america', 'europe'],
        providerType: 'vendor',
      },
      {
        name: 'ImageSense Analytics',
        description: 'Real-time image recognition and analysis platform for retail and security applications. Detects objects, faces, and activities with advanced deep learning models.',
        shortDescription: 'Real-time image recognition for retail and security',
        tags: ['image recognition', 'object detection', 'facial recognition', 'security', 'retail analytics'],
        subcategory: 'object_detection',
        features: ['real_time', 'api_access', 'edge_deployment', 'custom_models'],
        benefits: ['enhanced_security', 'customer_insights', 'operational_efficiency'],
        industries: ['retail', 'security', 'hospitality'],
        technologies: ['yolo', 'opencv', 'tensorflow', 'nvidia_cuda'],
        useCases: ['security_surveillance', 'customer_analytics', 'inventory_monitoring'],
        pricing: { startingPrice: 199, billingCycle: 'monthly', tier: 'standard' },
        rating: 4.4,
        reviewCount: 89,
        compliance: ['soc2', 'gdpr'],
        locations: ['global'],
        providerType: 'vendor',
      },
    ],
  },
  {
    category: 'natural_language_processing',
    templates: [
      {
        name: 'TextSense Pro Suite',
        description: 'Comprehensive natural language processing platform for sentiment analysis, text classification, and entity extraction. Perfect for social media monitoring, customer feedback analysis, and content moderation.',
        shortDescription: 'Advanced NLP for sentiment analysis and text classification',
        tags: ['NLP', 'sentiment analysis', 'text classification', 'entity extraction', 'social media'],
        subcategory: 'sentiment_analysis',
        features: ['api_access', 'real_time', 'custom_models', 'multi_language', 'batch_processing'],
        benefits: ['customer_insights', 'brand_monitoring', 'content_quality', 'automated_moderation'],
        industries: ['marketing', 'retail', 'media', 'hospitality'],
        technologies: ['transformers', 'spacy', 'pytorch', 'bert'],
        useCases: ['social_media_monitoring', 'customer_feedback', 'content_moderation', 'brand_analysis'],
        pricing: { startingPrice: 149, billingCycle: 'monthly', tier: 'professional' },
        rating: 4.5,
        reviewCount: 156,
        compliance: ['soc2', 'gdpr'],
        locations: ['global'],
        providerType: 'vendor',
      },
      {
        name: 'ChatBot Builder Pro',
        description: 'No-code chatbot development platform with advanced NLP capabilities. Create intelligent conversational AI for customer support, sales, and internal operations.',
        shortDescription: 'No-code chatbot platform with advanced NLP',
        tags: ['chatbot', 'conversational AI', 'no-code', 'customer support', 'automation'],
        subcategory: 'chatbots',
        features: ['no_code', 'drag_drop', 'template_library', 'integration_apis', 'analytics'],
        benefits: ['reduced_support_costs', 'improved_response_time', 'scalable_automation'],
        industries: ['technology', 'ecommerce', 'healthcare', 'finance'],
        technologies: ['openai', 'dialogflow', 'rasa', 'microsoft_bot'],
        useCases: ['customer_support', 'lead_qualification', 'appointment_booking', 'faq_automation'],
        pricing: { startingPrice: 79, billingCycle: 'monthly', tier: 'standard' },
        rating: 4.3,
        reviewCount: 203,
        compliance: ['gdpr'],
        locations: ['global'],
        providerType: 'agency',
      },
    ],
  },
  {
    category: 'predictive_analytics',
    templates: [
      {
        name: 'PredictAI Enterprise Suite',
        description: 'Enterprise-grade machine learning platform for predictive analytics, demand forecasting, and risk assessment. Custom model training with AutoML capabilities for business intelligence.',
        shortDescription: 'Enterprise ML platform for predictive analytics',
        tags: ['predictive analytics', 'demand forecasting', 'risk assessment', 'AutoML', 'enterprise'],
        subcategory: 'demand_forecasting',
        features: ['enterprise_support', 'custom_training', 'automl', 'api_access', 'sla_guarantee'],
        benefits: ['data_driven_decisions', 'risk_mitigation', 'revenue_optimization', 'operational_efficiency'],
        industries: ['finance', 'retail', 'manufacturing', 'logistics'],
        technologies: ['scikit_learn', 'xgboost', 'tensorflow', 'h2o_ai'],
        useCases: ['demand_forecasting', 'risk_assessment', 'price_optimization', 'inventory_planning'],
        pricing: { startingPrice: 1999, billingCycle: 'monthly', tier: 'enterprise' },
        rating: 4.8,
        reviewCount: 89,
        compliance: ['soc2', 'iso27001', 'fedramp'],
        locations: ['north_america', 'europe', 'asia_pacific'],
        providerType: 'vendor',
      },
      {
        name: 'QuickPredict Analytics',
        description: 'Affordable predictive analytics solution for small and medium businesses. Easy-to-use dashboard with pre-built models for common business scenarios.',
        shortDescription: 'Affordable predictive analytics for SMBs',
        tags: ['predictive analytics', 'SMB', 'affordable', 'dashboard', 'pre-built models'],
        subcategory: 'customer_analytics',
        features: ['dashboard_interface', 'pre_built_models', 'easy_setup', 'basic_support'],
        benefits: ['affordable_insights', 'easy_implementation', 'quick_roi'],
        industries: ['retail', 'services', 'ecommerce'],
        technologies: ['scikit_learn', 'pandas', 'plotly'],
        useCases: ['customer_segmentation', 'churn_prediction', 'sales_forecasting'],
        pricing: { startingPrice: 199, billingCycle: 'monthly', tier: 'standard' },
        rating: 4.1,
        reviewCount: 67,
        compliance: ['gdpr'],
        locations: ['global'],
        providerType: 'agency',
      },
    ],
  },
];

// Provider templates
const providerTemplates = [
  {
    type: 'vendor',
    names: ['TechVision AI', 'DataSense Corp', 'AI Solutions Inc', 'IntelliSystems', 'NextGen Analytics'],
    descriptions: [
      'Leading provider of enterprise AI solutions with 10+ years of experience',
      'Innovative AI company specializing in computer vision and NLP technologies',
      'Full-service AI consultancy helping businesses transform with intelligent automation',
    ],
  },
  {
    type: 'agency',
    names: ['AI Experts Studio', 'Smart Solutions Agency', 'Digital Intelligence Partners', 'ML Consultants', 'AI Boutique'],
    descriptions: [
      'Boutique AI agency focused on custom solutions for mid-market companies',
      'Specialized AI development agency with expertise in machine learning and automation',
      'Creative AI agency combining technical expertise with business strategy',
    ],
  },
  {
    type: 'freelancer',
    names: ['Alex Chen (AI Specialist)', 'Sarah Johnson (ML Engineer)', 'David Rodriguez (Data Scientist)', 'Emily Zhang (AI Consultant)'],
    descriptions: [
      'Independent AI specialist with 8+ years of experience in enterprise deployments',
      'Freelance machine learning engineer specializing in computer vision and NLP',
      'Senior data scientist offering custom AI solutions and consulting services',
    ],
  },
];

/**
 * Generate test services based on templates
 */
function generateTestServices(count = 20) {
  const services = [];
  let serviceCounter = 1;
  
  for (let i = 0; i < count; i++) {
    // Select random category and template
    const categoryTemplate = serviceTemplates[i % serviceTemplates.length];
    const serviceTemplate = categoryTemplate.templates[i % categoryTemplate.templates.length];
    
    // Select random provider
    const providerTypeTemplates = providerTemplates[i % providerTemplates.length];
    const providerName = providerTypeTemplates.names[i % providerTypeTemplates.names.length];
    const providerDescription = providerTypeTemplates.descriptions[i % providerTypeTemplates.descriptions.length];
    
    // Add some variation to the service
    const variations = [
      { suffix: 'Basic', priceMultiplier: 0.5, ratingAdjust: -0.2 },
      { suffix: 'Pro', priceMultiplier: 1.0, ratingAdjust: 0.0 },
      { suffix: 'Enterprise', priceMultiplier: 2.0, ratingAdjust: 0.3 },
      { suffix: 'Starter', priceMultiplier: 0.3, ratingAdjust: -0.3 },
    ];
    
    const variation = variations[i % variations.length];
    
    const service = {
      id: `test-service-${serviceCounter++}`,
      name: `${serviceTemplate.name} ${variation.suffix}`,
      description: serviceTemplate.description,
      shortDescription: serviceTemplate.shortDescription,
      tags: [...serviceTemplate.tags],
      category: categoryTemplate.category,
      subcategory: serviceTemplate.subcategory,
      features: [...serviceTemplate.features],
      benefits: [...serviceTemplate.benefits],
      industries: [...serviceTemplate.industries],
      technologies: [...serviceTemplate.technologies],
      useCases: [...serviceTemplate.useCases],
      
      // Provider information
      providerId: `test-provider-${Math.ceil(serviceCounter / 3)}`,
      providerName: providerName,
      providerDescription: providerDescription,
      providerType: providerTypeTemplates.type,
      
      // Pricing with variation
      pricing: {
        ...serviceTemplate.pricing,
        startingPrice: Math.round(serviceTemplate.pricing.startingPrice * variation.priceMultiplier),
      },
      
      // Rating with variation
      rating: Math.max(3.0, Math.min(5.0, serviceTemplate.rating + variation.ratingAdjust + (Math.random() - 0.5) * 0.4)),
      reviewCount: Math.round(serviceTemplate.reviewCount * (0.5 + Math.random())),
      
      // Compliance and location
      compliance: [...serviceTemplate.compliance],
      locations: [...serviceTemplate.locations],
      
      // Metadata
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last month
      verified: Math.random() > 0.3, // 70% verified
      featured: Math.random() > 0.8, // 20% featured
      status: 'active',
    };
    
    services.push(service);
  }
  
  return services;
}

/**
 * Setup test data in Firestore
 */
async function setupTestData(services, options = {}) {
  console.log(`🔧 Setting up ${services.length} test services...`);
  
  if (options.dryRun) {
    console.log('🧪 DRY RUN - Showing sample data structure:');
    console.log(JSON.stringify(services[0], null, 2));
    return;
  }
  
  try {
    // Import Firebase modules
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');
    
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };
    
    if (!firebaseConfig.projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Process services in batches (Firestore batch limit is 500)
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchServices = services.slice(i, i + batchSize);
      
      for (const service of batchServices) {
        const serviceRef = doc(collection(db, 'services'), service.id);
        batch.set(serviceRef, service);
      }
      
      batches.push(batch);
    }
    
    // Execute all batches
    console.log(`📤 Writing ${batches.length} batches to Firestore...`);
    
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`✅ Batch ${i + 1}/${batches.length} completed`);
    }
    
    console.log(`🎉 Successfully created ${services.length} test services`);
    
    // Generate embeddings if requested
    if (options.withEmbeddings) {
      console.log('🧠 Generating embeddings for test services...');
      
      // Use the embedding generation script
      const { spawn } = require('child_process');
      const serviceIds = services.map(s => s.id).join(',');
      
      const embeddingProcess = spawn('node', [
        'scripts/generate-embeddings.js',
        'specific',
        serviceIds,
        '--batch-size', '10',
      ], {
        stdio: 'inherit',
        shell: true,
      });
      
      await new Promise((resolve, reject) => {
        embeddingProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Embeddings generated successfully');
            resolve();
          } else {
            reject(new Error(`Embedding generation failed with code ${code}`));
          }
        });
      });
    }
    
  } catch (error) {
    throw new Error(`Failed to setup test data: ${error.message}`);
  }
}

/**
 * Clean existing test data
 */
async function cleanTestData() {
  console.log('🧹 Cleaning existing test data...');
  
  try {
    // Import Firebase modules
    const { initializeApp } = require('firebase/app');
    const { getFirestore, collection, query, where, getDocs, writeBatch, doc } = require('firebase/firestore');
    
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Find all test services (those with IDs starting with 'test-')
    const q = query(
      collection(db, 'services'),
      where('id', '>=', 'test-'),
      where('id', '<', 'test-' + '\uf8ff')
    );
    
    const snapshot = await getDocs(q);
    const testServices = snapshot.docs;
    
    if (testServices.length === 0) {
      console.log('✅ No test data found to clean');
      return;
    }
    
    // Delete in batches
    const batchSize = 500;
    const deleteBatches = [];
    
    for (let i = 0; i < testServices.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = testServices.slice(i, i + batchSize);
      
      for (const serviceDoc of batchDocs) {
        batch.delete(serviceDoc.ref);
      }
      
      deleteBatches.push(batch);
    }
    
    // Execute delete batches
    for (let i = 0; i < deleteBatches.length; i++) {
      await deleteBatches[i].commit();
      console.log(`✅ Deleted batch ${i + 1}/${deleteBatches.length}`);
    }
    
    console.log(`🗑️  Successfully cleaned ${testServices.length} test services`);
    
  } catch (error) {
    throw new Error(`Failed to clean test data: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    return;
  }
  
  const options = {
    count: parseInt(args.find(arg => args[args.indexOf(arg) - 1] === '--count')) || 20,
    withEmbeddings: args.includes('--with-embeddings'),
    clean: args.includes('--clean'),
    dryRun: args.includes('--dry-run'),
  };
  
  console.log('🚀 Test Data Setup');
  console.log('==================');
  console.log(`Services to create: ${options.count}`);
  console.log(`Generate embeddings: ${options.withEmbeddings ? 'Yes' : 'No'}`);
  console.log(`Clean existing data: ${options.clean ? 'Yes' : 'No'}`);
  console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log('');
  
  try {
    // Clean existing test data if requested
    if (options.clean && !options.dryRun) {
      await cleanTestData();
    }
    
    // Generate test services
    const services = generateTestServices(options.count);
    
    // Setup test data
    await setupTestData(services, options);
    
    console.log('\n✅ Test data setup completed successfully!');
    
    if (!options.dryRun) {
      console.log('\n💡 Next steps:');
      console.log('   1. Run semantic search tests: npm run test:semantic');
      console.log('   2. Test API endpoints: npm run test:semantic:api');
      console.log('   3. Performance testing: npm run test:semantic:performance');
      
      if (!options.withEmbeddings) {
        console.log('   4. Generate embeddings: npm run embeddings:all');
      }
    }
    
  } catch (error) {
    console.error('❌ Test data setup failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
🚀 Test Data Setup Script

USAGE:
  node scripts/setup-test-data.js [options]

OPTIONS:
  --count N         Number of test services to create (default: 20)
  --with-embeddings Generate embeddings for test services
  --clean           Remove existing test data first
  --dry-run         Show what would be created without making changes
  --help            Show this help message

ENVIRONMENT VARIABLES:
  FIREBASE_PROJECT_ID    Firebase project ID (required)
  OPENAI_API_KEY        OpenAI API key (required for --with-embeddings)

EXAMPLES:
  # Create 20 test services
  node scripts/setup-test-data.js

  # Create 50 test services with embeddings
  node scripts/setup-test-data.js --count 50 --with-embeddings

  # Clean existing test data and create fresh set
  node scripts/setup-test-data.js --clean --count 30

  # Preview what would be created (dry run)
  node scripts/setup-test-data.js --dry-run
`);
}

// Run if called directly
if (require.main === module) {
  main();
}