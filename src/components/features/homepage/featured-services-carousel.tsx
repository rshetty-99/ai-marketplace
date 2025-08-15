'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Users, 
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedService {
  id: string;
  name: string;
  description: string;
  provider: {
    id: string;
    name: string;
    logo?: string;
    verified: boolean;
  };
  rating: number;
  reviewCount: number;
  price: {
    model: 'subscription' | 'usage' | 'project' | 'custom';
    starting: number;
    currency: string;
  };
  category: string;
  tags: string[];
  deployments: number;
  trending?: boolean;
  featured?: boolean;
  image?: string;
}

interface FeaturedServicesCarouselProps {
  services?: FeaturedService[];
  isLoading?: boolean;
  onServiceClick?: (service: FeaturedService) => void;
}

export function FeaturedServicesCarousel({
  services = mockFeaturedServices,
  isLoading = false,
  onServiceClick
}: FeaturedServicesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Adjust items per view based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1536) { // 2xl breakpoint
        setItemsPerView(4);
      } else if (width >= 1280) { // xl breakpoint
        setItemsPerView(3);
      } else if (width >= 768) { // md breakpoint
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, services.length - itemsPerView);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < maxIndex) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrevious();
    }
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || isLoading || services.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= maxIndex) return 0;
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isLoading, services.length, itemsPerView, maxIndex]);

  const handleServiceClick = (service: FeaturedService) => {
    setIsAutoPlaying(false);
    onServiceClick?.(service);
  };

  const formatPrice = (price: FeaturedService['price']) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
      minimumFractionDigits: 0,
    });

    switch (price.model) {
      case 'subscription':
        return `${formatter.format(price.starting)}/mo`;
      case 'usage':
        return `From ${formatter.format(price.starting)}`;
      case 'project':
        return `${formatter.format(price.starting)}/project`;
      case 'custom':
        return 'Custom pricing';
      default:
        return formatter.format(price.starting);
    }
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex gap-6 overflow-hidden">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3">
              <Card className="h-full">
                <CardHeader>
                  <Skeleton className="h-40 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="h-10 w-10 rounded-full shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          className="h-10 w-10 rounded-full shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Carousel Container */}
      <div 
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div 
          className="flex gap-6 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView + 2)}%)` }}
        >
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.provider.id}/${service.id}`}
              className={`flex-shrink-0 group ${
                itemsPerView === 1 ? 'w-full' :
                itemsPerView === 2 ? 'w-[48%]' :
                itemsPerView === 3 ? 'w-[31%]' :
                'w-[23.5%]'
              }`}
              onClick={() => handleServiceClick(service)}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg group-hover:scale-[1.02] dark:bg-gray-800">
                <CardHeader className="pb-4">
                  {/* Badges */}
                  <div className="flex gap-2 mb-3">
                    {service.trending && (
                      <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    {service.featured && (
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        <Award className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {service.provider.verified && (
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Service Image */}
                  {service.image && (
                    <div className="relative h-40 w-full mb-4 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={service.image}
                        alt={service.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  {/* Title and Provider */}
                  <CardTitle className="text-xl mb-2 line-clamp-1 dark:text-white">
                    {service.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
                    by {service.provider.name}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                    {service.description}
                  </p>

                  {/* Rating and Reviews */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">{service.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({service.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{service.deployments}+ deployments</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatPrice(service.price)}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-500">
                        {service.category}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: Math.ceil(services.length / itemsPerView) }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index * itemsPerView)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              currentIndex === index * itemsPerView
                ? "w-8 bg-blue-600 dark:bg-blue-400"
                : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// Mock data for development
const mockFeaturedServices: FeaturedService[] = [
  {
    id: '1',
    name: 'GPT-4 Enterprise API',
    description: 'Advanced language model API with enterprise features, custom fine-tuning, and dedicated support.',
    provider: {
      id: 'openai',
      name: 'OpenAI Solutions',
      verified: true,
    },
    rating: 4.8,
    reviewCount: 245,
    price: {
      model: 'usage',
      starting: 0.03,
      currency: 'USD',
    },
    category: 'Natural Language Processing',
    tags: ['LLM', 'API', 'Enterprise'],
    deployments: 1200,
    trending: true,
    featured: true,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Computer Vision Suite',
    description: 'Complete computer vision toolkit for object detection, facial recognition, and image analysis.',
    provider: {
      id: 'visiontech',
      name: 'VisionTech AI',
      verified: true,
    },
    rating: 4.6,
    reviewCount: 189,
    price: {
      model: 'subscription',
      starting: 499,
      currency: 'USD',
    },
    category: 'Computer Vision',
    tags: ['Vision', 'Detection', 'Analysis'],
    deployments: 850,
    featured: true,
    image: 'https://images.unsplash.com/photo-1527430253228-e93688616381?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'Predictive Analytics Platform',
    description: 'ML-powered predictive analytics for business forecasting and decision making.',
    provider: {
      id: 'datainsights',
      name: 'DataInsights Pro',
      verified: true,
    },
    rating: 4.7,
    reviewCount: 167,
    price: {
      model: 'subscription',
      starting: 899,
      currency: 'USD',
    },
    category: 'Machine Learning',
    tags: ['Analytics', 'Forecasting', 'ML'],
    deployments: 620,
    trending: true,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'AI Chatbot Framework',
    description: 'Build and deploy intelligent chatbots with natural language understanding.',
    provider: {
      id: 'chatgenius',
      name: 'ChatGenius AI',
      verified: false,
    },
    rating: 4.5,
    reviewCount: 203,
    price: {
      model: 'subscription',
      starting: 299,
      currency: 'USD',
    },
    category: 'Conversational AI',
    tags: ['Chatbot', 'NLU', 'Customer Service'],
    deployments: 920,
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'Document Intelligence API',
    description: 'Extract insights from documents using advanced OCR and NLP techniques.',
    provider: {
      id: 'docai',
      name: 'DocAI Solutions',
      verified: true,
    },
    rating: 4.6,
    reviewCount: 145,
    price: {
      model: 'usage',
      starting: 0.01,
      currency: 'USD',
    },
    category: 'Document Processing',
    tags: ['OCR', 'NLP', 'Extraction'],
    deployments: 480,
    featured: true,
    image: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&h=300&fit=crop',
  },
];