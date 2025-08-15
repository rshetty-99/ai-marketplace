'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Quote, Building2, TrendingUp, Users, Award, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SuccessStory {
  id: string;
  company: {
    name: string;
    logo?: string;
    industry: string;
    size: string;
  };
  testimonial: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  metrics: {
    label: string;
    value: string;
    improvement?: string;
  }[];
  service: {
    name: string;
    provider: string;
    category: string;
  };
  featured?: boolean;
}

const successStories: SuccessStory[] = [
  {
    id: '1',
    company: {
      name: 'TechCorp Global',
      industry: 'Technology',
      size: 'Enterprise (5000+ employees)',
    },
    testimonial: 'The AI-powered predictive analytics platform transformed our sales forecasting. We\'ve seen a 40% improvement in forecast accuracy and reduced planning time by 60%.',
    author: {
      name: 'Sarah Johnson',
      role: 'Chief Technology Officer',
    },
    metrics: [
      { label: 'Forecast Accuracy', value: '+40%', improvement: 'increase' },
      { label: 'Planning Time', value: '-60%', improvement: 'decrease' },
      { label: 'ROI', value: '320%', improvement: 'increase' },
    ],
    service: {
      name: 'Predictive Analytics Platform',
      provider: 'DataInsights Pro',
      category: 'Machine Learning',
    },
    featured: true,
  },
  {
    id: '2',
    company: {
      name: 'HealthCare Plus',
      industry: 'Healthcare',
      size: 'Large (1000-5000 employees)',
    },
    testimonial: 'Computer vision for medical imaging has revolutionized our diagnostic process. Patient wait times decreased by 70% while maintaining 99.2% accuracy.',
    author: {
      name: 'Dr. Michael Chen',
      role: 'Head of Radiology',
    },
    metrics: [
      { label: 'Wait Time', value: '-70%', improvement: 'decrease' },
      { label: 'Accuracy', value: '99.2%', improvement: 'maintain' },
      { label: 'Patients Served', value: '+150%', improvement: 'increase' },
    ],
    service: {
      name: 'Medical Imaging AI',
      provider: 'VisionTech AI',
      category: 'Computer Vision',
    },
  },
  {
    id: '3',
    company: {
      name: 'RetailMax',
      industry: 'Retail',
      size: 'Medium (100-1000 employees)',
    },
    testimonial: 'NLP-powered customer service automation handles 80% of inquiries automatically. Customer satisfaction increased while reducing support costs by 50%.',
    author: {
      name: 'Emily Rodriguez',
      role: 'VP of Customer Experience',
    },
    metrics: [
      { label: 'Automation Rate', value: '80%', improvement: 'increase' },
      { label: 'Support Costs', value: '-50%', improvement: 'decrease' },
      { label: 'CSAT Score', value: '+25%', improvement: 'increase' },
    ],
    service: {
      name: 'AI Customer Service Suite',
      provider: 'ChatGenius AI',
      category: 'Natural Language Processing',
    },
  },
];

export function SuccessStories() {
  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mb-4">
            <Award className="w-3 h-3 mr-1" />
            Success Stories
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold dark:text-white">
            Real Results from Real Companies
          </h2>
          <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
            See how leading organizations are transforming their business with AI solutions from our marketplace
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
          {successStories.map((story) => (
            <Card key={story.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-700">
              <CardHeader className="pb-4">
                {/* Company Info */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg dark:text-white">{story.company.name}</h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">{story.company.industry}</p>
                  </div>
                  {story.featured && (
                    <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Testimonial */}
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-gray-200 dark:text-gray-600" />
                  <p className="text-sm text-gray-700 dark:text-gray-200 italic leading-relaxed pl-6">
                    "{story.testimonial}"
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t dark:border-gray-600">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm dark:text-white">{story.author.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{story.author.role}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {story.metrics.map((metric, index) => (
                    <div key={index} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`text-lg font-bold ${
                        metric.improvement === 'increase' ? 'text-green-600 dark:text-green-400' :
                        metric.improvement === 'decrease' ? 'text-blue-600 dark:text-blue-400' :
                        'text-gray-900 dark:text-gray-100'
                      }`}>
                        {metric.value}
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-gray-400 line-clamp-1">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Service Info */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Solution Used:</p>
                  <p className="font-medium text-sm text-blue-900 dark:text-blue-300">{story.service.name}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    by {story.service.provider} • {story.service.category}
                  </p>
                </div>

                {/* CTA */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group"
                  asChild
                >
                  <Link href={`/case-studies/${story.id}`}>
                    Read Full Case Study
                    <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" asChild>
            <Link href="/case-studies">
              View All Success Stories
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Trust Metrics */}
        <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">$50M+</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">Total Project Value</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">98%</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">3.2x</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">Average ROI</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400">24hrs</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400 mt-1">Avg. Response Time</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}