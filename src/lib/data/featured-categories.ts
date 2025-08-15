import { Brain, Eye, MessageSquare, Bot, BarChart3, Cog, Lightbulb, Zap } from 'lucide-react';

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  emoji: string;
  serviceCount: number;
  useCases: string[];
  popularProviders?: string[];
  trending?: boolean;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'computer_vision',
    name: 'Computer Vision',
    description: 'Image recognition, object detection, and visual AI solutions',
    icon: Eye,
    emoji: '👁️',
    serviceCount: 150,
    useCases: [
      'Quality inspection in manufacturing',
      'Medical image analysis',
      'Security and surveillance',
      'Autonomous vehicle perception',
    ],
    popularProviders: ['VisionTech AI', 'SightLabs', 'OpticAI'],
    trending: true,
  },
  {
    id: 'nlp',
    name: 'Natural Language Processing',
    description: 'Text analysis, chatbots, and language understanding services',
    icon: MessageSquare,
    emoji: '💬',
    serviceCount: 200,
    useCases: [
      'Customer service automation',
      'Sentiment analysis for brand monitoring',
      'Document summarization',
      'Multi-language translation',
    ],
    popularProviders: ['OpenAI Solutions', 'LangTech', 'TextAI Pro'],
    trending: true,
  },
  {
    id: 'machine_learning',
    name: 'Machine Learning',
    description: 'Predictive analytics, classification, and ML model development',
    icon: Bot,
    emoji: '🤖',
    serviceCount: 180,
    useCases: [
      'Sales forecasting',
      'Credit risk assessment',
      'Personalized recommendations',
      'Predictive maintenance',
    ],
    popularProviders: ['DataInsights Pro', 'MLOps Solutions', 'PredictAI'],
  },
  {
    id: 'deep_learning',
    name: 'Deep Learning',
    description: 'Neural networks, deep learning architectures, and advanced AI',
    icon: Brain,
    emoji: '🧠',
    serviceCount: 120,
    useCases: [
      'Complex pattern recognition',
      'Voice synthesis and recognition',
      'Generative AI applications',
      'Advanced robotics control',
    ],
    popularProviders: ['DeepMind Partners', 'NeuralNet Pro', 'DL Solutions'],
  },
  {
    id: 'data_science',
    name: 'Data Science',
    description: 'Data analysis, visualization, and business intelligence',
    icon: BarChart3,
    emoji: '📊',
    serviceCount: 160,
    useCases: [
      'Business intelligence dashboards',
      'Market analysis and insights',
      'Customer behavior analytics',
      'Operations optimization',
    ],
    popularProviders: ['DataViz Pro', 'Analytics Plus', 'InsightMaker'],
  },
  {
    id: 'robotics',
    name: 'Robotics & Automation',
    description: 'Robotic solutions, automation, and intelligent systems',
    icon: Cog,
    emoji: '⚙️',
    serviceCount: 85,
    useCases: [
      'Warehouse automation',
      'Surgical robotics',
      'Agricultural automation',
      'Service robot deployment',
    ],
    popularProviders: ['RoboTech Solutions', 'AutomateAI', 'SmartBots'],
  },
  {
    id: 'ai_consulting',
    name: 'AI Strategy & Consulting',
    description: 'AI transformation, strategy development, and implementation guidance',
    icon: Lightbulb,
    emoji: '💡',
    serviceCount: 95,
    useCases: [
      'AI roadmap development',
      'Digital transformation planning',
      'AI ethics and governance',
      'Team training and upskilling',
    ],
    popularProviders: ['AI Advisors', 'Strategic AI', 'TransformTech'],
  },
  {
    id: 'custom_ai',
    name: 'Custom AI Development',
    description: 'Bespoke AI solutions tailored to specific business requirements',
    icon: Zap,
    emoji: '⚡',
    serviceCount: 110,
    useCases: [
      'Industry-specific AI solutions',
      'Legacy system AI integration',
      'Proprietary algorithm development',
      'Custom model training',
    ],
    popularProviders: ['CustomAI Labs', 'Bespoke Intelligence', 'TailorAI'],
  },
];