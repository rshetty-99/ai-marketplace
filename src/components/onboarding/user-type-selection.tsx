'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building, 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  Users,
  Briefcase,
  Shield,
  Zap
} from 'lucide-react';
import { UserType } from '@/lib/firebase/onboarding-schema';

interface UserTypeSelectionProps {
  onUserTypeSelected: (userType: UserType) => void;
}

interface UserTypeOption {
  type: UserType;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Complex';
  popular: boolean;
}

const userTypeOptions: UserTypeOption[] = [
  {
    type: UserType.FREELANCER,
    title: 'Freelancer',
    description: 'Individual professional offering AI services',
    icon: <User className="w-8 h-8" />,
    features: [
      'Personal profile & portfolio',
      'Skills verification & testing',
      'Identity & background checks',
      'Pricing strategy setup',
      'Payment & tax configuration'
    ],
    estimatedTime: '45-60 minutes',
    difficulty: 'Medium',
    popular: true,
  },
  {
    type: UserType.VENDOR_COMPANY,
    title: 'AI Service Company',
    description: 'Company providing AI solutions and services',
    icon: <Building className="w-8 h-8" />,
    features: [
      'Company verification & licensing',
      'Multi-user team setup (RBAC)',
      'Service catalog definition',
      'Compliance documentation',
      'White-label capabilities',
      'API access configuration'
    ],
    estimatedTime: '60-90 minutes',
    difficulty: 'Complex',
    popular: false,
  },
  {
    type: UserType.CUSTOMER_ORGANIZATION,
    title: 'Customer Organization',
    description: 'Business seeking AI services and solutions',
    icon: <ShoppingCart className="w-8 h-8" />,
    features: [
      'Organization profile setup',
      'Team roles & permissions',
      'Payment & escrow setup',
      'Contract templates',
      'Compliance requirements',
      'Preferred vendor management'
    ],
    estimatedTime: '30-45 minutes',
    difficulty: 'Easy',
    popular: true,
  },
];

export function UserTypeSelection({ onUserTypeSelected }: UserTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);

  const handleSelection = (userType: UserType) => {
    setSelectedType(userType);
  };

  const handleContinue = () => {
    if (selectedType) {
      onUserTypeSelected(selectedType);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Complex': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome to AI Marketplace</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Let's set up your account based on how you'll use our platform
            </p>
            <p className="text-muted-foreground">
              Choose the option that best describes your role
            </p>
          </div>

          {/* User Type Options */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {userTypeOptions.map((option) => (
              <Card
                key={option.type}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedType === option.type
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleSelection(option.type)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-3">
                    <div className={`p-3 rounded-full ${
                      selectedType === option.type 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {option.icon}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    {option.popular && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  
                  <CardDescription className="text-center">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Time and Difficulty */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {option.estimatedTime}
                    </div>
                    <Badge variant="outline" className={getDifficultyColor(option.difficulty)}>
                      {option.difficulty}
                    </Badge>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      What you'll set up:
                    </h4>
                    <ul className="space-y-1">
                      {option.features.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Selection Indicator */}
                  {selectedType === option.type && (
                    <div className="flex items-center justify-center pt-2">
                      <div className="flex items-center gap-2 text-primary font-medium text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Selected
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Info */}
          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-full">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-medium">Secure & Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade security with GDPR, HIPAA, and SOC 2 compliance
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-green-500/10 text-green-600 rounded-full">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-medium">Multi-Tenant Support</h3>
                <p className="text-sm text-muted-foreground">
                  Role-based access control for teams and organizations
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-full">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-medium">AI-Powered Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Smart project matching and automated workflow management
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleContinue}
              disabled={!selectedType}
              className="px-8 py-6 text-lg"
            >
              {selectedType ? 'Start Setup' : 'Select an option to continue'}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>
              Not sure which option to choose? You can always{' '}
              <a href="/contact" className="text-primary hover:underline">
                contact our support team
              </a>
              {' '}for guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}