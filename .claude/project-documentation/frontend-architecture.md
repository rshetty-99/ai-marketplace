# Frontend Architecture - AI Marketplace Platform

## Executive Summary

This document defines the comprehensive frontend architecture for the AI Marketplace Platform using Next.js 15.4 with App Router, TypeScript, and modern React patterns. The architecture emphasizes performance, SEO, accessibility, and maintainability while supporting the multi-tenant requirements and complex user workflows.

### Architecture Principles
- **Hybrid Rendering:** Strategic use of Server and Client Components for optimal performance
- **Component-Driven:** Modular, reusable components with clear separation of concerns
- **Type Safety:** Full TypeScript coverage for reliability and developer experience
- **Performance First:** Code splitting, lazy loading, and optimized bundle sizes
- **Accessibility Ready:** WCAG 2.1 AA compliance built into all components

## Technology Stack

### Core Framework
- **Next.js 15.4:** App Router with Server Components and streaming
- **TypeScript 5.3+:** Full type safety across the application
- **React 18.2+:** Latest features including Suspense and concurrent features

### Styling & UI
- **TailwindCSS 3.4+:** Utility-first CSS framework for consistent design
- **ShadCN UI:** High-quality, accessible component library
- **Lucide React:** Consistent icon system
- **CVA (Class Variance Authority):** Type-safe component variants

### State Management
- **Zustand:** Global state management for client-side state
- **React Query (TanStack Query):** Server state management and caching
- **React Hook Form:** Form state management with validation
- **Zod:** Runtime type validation and schema definition

### Development & Build Tools
- **ESLint:** Code linting with Next.js and TypeScript rules
- **Prettier:** Code formatting for consistency
- **Husky:** Git hooks for code quality
- **Commitlint:** Conventional commit messages

## Application Structure

### Directory Organization
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── (marketing)/              # Marketing pages
│   │   ├── page.tsx              # Homepage
│   │   ├── about/
│   │   ├── pricing/
│   │   └── contact/
│   ├── (marketplace)/            # Core marketplace
│   │   ├── catalog/
│   │   ├── services/
│   │   ├── providers/
│   │   └── search/
│   ├── (dashboard)/              # Protected dashboard
│   │   ├── buyer/
│   │   ├── seller/
│   │   └── admin/
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Global loading UI
│   ├── error.tsx                 # Global error boundary
│   └── not-found.tsx             # 404 page
├── components/                   # Reusable components
│   ├── features/                 # Feature-specific components
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── booking/
│   │   └── dashboard/
│   ├── ui/                       # Base UI components (ShadCN)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── shared/                   # Shared components
│       ├── header/
│       ├── footer/
│       └── navigation/
├── lib/                          # Utility libraries
│   ├── auth/                     # Authentication utilities
│   ├── api/                      # API client and utilities
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand stores
│   ├── utils/                    # General utilities
│   └── validations/              # Zod schemas
├── types/                        # TypeScript type definitions
│   ├── api.ts                    # API response types
│   ├── database.ts               # Database entity types
│   └── ui.ts                     # UI component types
└── styles/                       # Additional styling
    └── globals.css               # Global CSS imports
```

## Server vs Client Component Strategy

### Server Components (Default)
Use Server Components for:
- **SEO-critical pages** (homepage, service listings, provider profiles)
- **Data fetching and display** (static content, initial page loads)
- **Layout components** (headers, navigation, footers)
- **Performance-critical rendering** (large lists, complex layouts)

```typescript
// app/(marketplace)/catalog/page.tsx - Server Component
import { Metadata } from 'next';
import { getServices, getCategories } from '@/lib/api/services';
import { ServiceGrid } from '@/components/features/catalog/service-grid';
import { CatalogFilters } from '@/components/features/catalog/catalog-filters';

export const metadata: Metadata = {
  title: 'AI Services Catalog | Find the Perfect AI Solution',
  description: 'Browse our comprehensive catalog of AI services...',
};

interface CatalogPageProps {
  searchParams: {
    category?: string;
    industry?: string;
    page?: string;
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  // Server-side data fetching
  const [services, categories] = await Promise.all([
    getServices(searchParams),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Server Component - SEO friendly */}
        <aside className="lg:w-1/4">
          <CatalogFilters 
            categories={categories} 
            initialFilters={searchParams} 
          />
        </aside>
        
        {/* Server Component - Initial render */}
        <main className="lg:w-3/4">
          <ServiceGrid 
            initialServices={services}
            initialFilters={searchParams}
          />
        </main>
      </div>
    </div>
  );
}
```

### Client Components
Use Client Components for:
- **Interactive features** (forms, filters, modals)
- **State management** (user inputs, UI state)
- **Real-time updates** (notifications, live data)
- **Browser APIs** (localStorage, geolocation, etc.)

```typescript
// components/features/catalog/catalog-filters.tsx - Client Component
'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCatalogStore } from '@/lib/stores/catalog-store';

interface CatalogFiltersProps {
  categories: Category[];
  initialFilters: Record<string, string>;
}

export function CatalogFilters({ categories, initialFilters }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const { filters, setFilters, clearFilters } = useCatalogStore();
  
  const [localFilters, setLocalFilters] = useState(initialFilters);

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/catalog?${params.toString()}`);
    });
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: Array.isArray(value) ? value.join(',') : value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLocalFilters({});
            clearFilters();
            router.push('/catalog');
          }}
        >
          Clear All
        </Button>
      </div>

      {/* Category filters */}
      <div className="space-y-3">
        <h3 className="font-medium">Category</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-2">
              <Checkbox
                checked={localFilters.category?.split(',').includes(category.slug)}
                onCheckedChange={(checked) => {
                  const current = localFilters.category?.split(',') || [];
                  const updated = checked
                    ? [...current, category.slug]
                    : current.filter(c => c !== category.slug);
                  handleFilterChange('category', updated);
                }}
              />
              <span className="text-sm">{category.name}</span>
              <span className="text-xs text-muted-foreground">
                ({category.serviceCount})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply filters button */}
      <Button
        onClick={applyFilters}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? 'Applying...' : 'Apply Filters'}
      </Button>
    </div>
  );
}
```

## State Management Architecture

### Global State with Zustand
```typescript
// lib/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization } from '@/types/database';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setOrganization: (org: Organization) => void;
  setPermissions: (permissions: string[]) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => 
        set({ user, isAuthenticated: !!user, isLoading: false }),
      
      setOrganization: (organization) => 
        set({ organization }),
      
      setPermissions: (permissions) => 
        set({ permissions }),
      
      logout: () => 
        set({
          user: null,
          organization: null,
          permissions: [],
          isAuthenticated: false,
          isLoading: false,
        }),
      
      hasPermission: (permission) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// lib/stores/catalog-store.ts
import { create } from 'zustand';
import type { Service, ServiceFilters } from '@/types/database';

interface CatalogState {
  services: Service[];
  filters: ServiceFilters;
  selectedServices: Service[];
  comparisonMode: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setServices: (services: Service[]) => void;
  setFilters: (filters: ServiceFilters) => void;
  clearFilters: () => void;
  toggleServiceSelection: (service: Service) => void;
  toggleComparisonMode: () => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  services: [],
  filters: {},
  selectedServices: [],
  comparisonMode: false,
  sortBy: 'rating',
  sortOrder: 'desc',

  setServices: (services) => set({ services }),
  
  setFilters: (filters) => set({ filters }),
  
  clearFilters: () => set({ filters: {} }),
  
  toggleServiceSelection: (service) => {
    const { selectedServices } = get();
    const isSelected = selectedServices.some(s => s.id === service.id);
    
    set({
      selectedServices: isSelected
        ? selectedServices.filter(s => s.id !== service.id)
        : [...selectedServices, service].slice(-3), // Max 3 services
    });
  },
  
  toggleComparisonMode: () => {
    const { comparisonMode } = get();
    set({ comparisonMode: !comparisonMode });
  },
  
  setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
}));
```

### Server State with React Query
```typescript
// lib/hooks/use-services.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, getService, createService } from '@/lib/api/services';
import type { Service, ServiceFilters, CreateServiceRequest } from '@/types/api';

export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: () => getServices(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

export function useService(serviceId: string) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => getService(serviceId),
    enabled: !!serviceId,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateServiceRequest) => createService(data),
    onSuccess: () => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

// lib/hooks/use-bookings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings, createBooking, updateBooking } from '@/lib/api/bookings';
import type { Booking, BookingsQuery, CreateBookingRequest } from '@/types/api';

export function useBookings(query?: BookingsQuery) {
  return useQuery({
    queryKey: ['bookings', query],
    queryFn: () => getBookings(query),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBookingRequest) => createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
```

## Form Management with React Hook Form + Zod

### Form Validation Schemas
```typescript
// lib/validations/service-schema.ts
import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string()
    .min(3, 'Service name must be at least 3 characters')
    .max(100, 'Service name must not exceed 100 characters'),
  
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  
  category: z.enum([
    'computer_vision',
    'natural_language_processing',
    'predictive_analytics',
    'machine_learning_ops',
    'custom_development',
  ]),
  
  industries: z.array(z.string())
    .min(1, 'At least one industry is required')
    .max(5, 'Maximum 5 industries allowed'),
  
  technologies: z.array(z.string())
    .min(1, 'At least one technology is required'),
  
  pricing: z.object({
    type: z.enum(['subscription', 'usage_based', 'project_based', 'custom']),
    startingPrice: z.number().min(0).optional(),
    currency: z.string().default('USD'),
  }),
  
  features: z.array(z.object({
    name: z.string().min(1, 'Feature name is required'),
    description: z.string().min(10, 'Feature description is required'),
    included: z.boolean().default(true),
  })).min(1, 'At least one feature is required'),
  
  compliance: z.object({
    certifications: z.array(z.string()),
    regulations: z.array(z.string()),
  }),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

// lib/validations/booking-schema.ts
export const bookingSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  serviceId: z.string().optional(),
  
  type: z.enum(['consultation', 'demo', 'workshop', 'project_kickoff']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  
  scheduledAt: z.string()
    .datetime('Invalid date format')
    .refine(
      (date) => new Date(date) > new Date(),
      'Booking must be scheduled in the future'
    ),
  
  duration: z.number()
    .min(15, 'Minimum duration is 15 minutes')
    .max(480, 'Maximum duration is 8 hours'),
  
  meetingDetails: z.object({
    platform: z.enum(['zoom', 'teams', 'meet', 'in_person', 'phone']),
    location: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
    }).optional(),
  }),
  
  requirements: z.string().max(1000, 'Requirements must not exceed 1000 characters').optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
```

### Form Components
```typescript
// components/features/services/service-form.tsx
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { serviceSchema, type ServiceFormData } from '@/lib/validations/service-schema';
import { useCreateService } from '@/lib/hooks/use-services';

interface ServiceFormProps {
  onSuccess?: (service: Service) => void;
  onCancel?: () => void;
}

export function ServiceForm({ onSuccess, onCancel }: ServiceFormProps) {
  const createService = useCreateService();
  
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'custom_development',
      industries: [],
      technologies: [],
      pricing: {
        type: 'custom',
        currency: 'USD',
      },
      features: [{ name: '', description: '', included: true }],
      compliance: {
        certifications: [],
        regulations: [],
      },
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = form;

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const service = await createService.mutateAsync(data);
      onSuccess?.(service);
    } catch (error) {
      console.error('Failed to create service:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Service Name *</label>
          <Input
            {...register('name')}
            placeholder="Enter service name"
            error={errors.name?.message}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description *</label>
          <Textarea
            {...register('description')}
            placeholder="Describe your AI service in detail..."
            rows={6}
            error={errors.description?.message}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category *</label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="computer_vision">Computer Vision</SelectItem>
                  <SelectItem value="natural_language_processing">NLP</SelectItem>
                  <SelectItem value="predictive_analytics">Predictive Analytics</SelectItem>
                  <SelectItem value="machine_learning_ops">MLOps</SelectItem>
                  <SelectItem value="custom_development">Custom Development</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>
      </div>

      {/* Industries */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Target Industries</h3>
        <Controller
          name="industries"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INDUSTRIES.map((industry) => (
                <label key={industry.value} className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value?.includes(industry.value)}
                    onCheckedChange={(checked) => {
                      const current = field.value || [];
                      const updated = checked
                        ? [...current, industry.value]
                        : current.filter(i => i !== industry.value);
                      field.onChange(updated);
                    }}
                  />
                  <span className="text-sm">{industry.label}</span>
                </label>
              ))}
            </div>
          )}
        />
        {errors.industries && (
          <p className="text-sm text-destructive">{errors.industries.message}</p>
        )}
      </div>

      {/* Features */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Features</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const currentFeatures = watch('features') || [];
              setValue('features', [
                ...currentFeatures,
                { name: '', description: '', included: true },
              ]);
            }}
          >
            Add Feature
          </Button>
        </div>
        
        {watch('features')?.map((_, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Feature {index + 1}</h4>
              {watch('features')?.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const currentFeatures = watch('features') || [];
                    setValue('features', currentFeatures.filter((_, i) => i !== index));
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            
            <Input
              {...register(`features.${index}.name`)}
              placeholder="Feature name"
              error={errors.features?.[index]?.name?.message}
            />
            
            <Textarea
              {...register(`features.${index}.description`)}
              placeholder="Feature description"
              rows={2}
              error={errors.features?.[index]?.description?.message}
            />
          </div>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex items-center space-x-4 pt-6 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Service'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

const INDUSTRIES = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'education', label: 'Education' },
];
```

## Component Architecture

### Base UI Components (ShadCN)
```typescript
// components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Feature Components
```typescript
// components/features/catalog/service-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock } from 'lucide-react';
import type { Service } from '@/types/database';

interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
  onCompare?: (service: Service) => void;
  isSelected?: boolean;
  showCompareButton?: boolean;
}

export function ServiceCard({
  service,
  onSelect,
  onCompare,
  isSelected = false,
  showCompareButton = false,
}: ServiceCardProps) {
  return (
    <Card className={cn(
      'h-full transition-all duration-200 hover:shadow-md',
      isSelected && 'ring-2 ring-primary'
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {service.name}
            </CardTitle>
            <CardDescription className="flex items-center text-sm text-muted-foreground mt-1">
              {service.providerName}
              {service.provider?.verification?.verified && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Verified
                </Badge>
              )}
            </CardDescription>
          </div>
          {service.media?.logo && (
            <img
              src={service.media.logo}
              alt={`${service.providerName} logo`}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium ml-1">
              {service.reviews.averageRating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({service.reviews.totalReviews} reviews)
          </span>
        </div>

        {/* Categories and Tags */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {service.category.replace('_', ' ')}
          </Badge>
          {service.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {service.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{service.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {service.description}
        </p>

        {/* Key Features */}
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium">Key Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {service.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{feature.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Metadata */}
        <div className="flex items-center text-xs text-muted-foreground space-x-4 mb-4">
          <div className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {service.availability.regions[0] || 'Global'}
          </div>
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {service.implementation.timeline.total}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              {service.pricing.startingPrice ? (
                <div className="flex items-baseline">
                  <span className="text-lg font-bold">
                    ${service.pricing.startingPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    /{service.pricing.billingCycle || 'month'}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  Custom Pricing
                </span>
              )}
              <p className="text-xs text-muted-foreground">
                {service.pricing.type.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => onSelect?.(service)}
            className="flex-1"
          >
            Learn More
          </Button>
          {showCompareButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCompare?.(service)}
            >
              Compare
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Performance Optimization

### Code Splitting and Lazy Loading
```typescript
// app/(dashboard)/analytics/page.tsx
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const AnalyticsDashboard = lazy(() => 
  import('@/components/features/analytics/analytics-dashboard')
);

const ChartComponents = {
  LineChart: lazy(() => import('@/components/charts/line-chart')),
  BarChart: lazy(() => import('@/components/charts/bar-chart')),
  PieChart: lazy(() => import('@/components/charts/pie-chart')),
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartComponents.LineChart />
        </Suspense>
        
        <Suspense fallback={<ChartSkeleton />}>
          <ChartComponents.BarChart />
        </Suspense>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" />;
}
```

### Image Optimization
```typescript
// components/shared/optimized-image.tsx
import NextImage from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!error ? (
        <NextImage
          src={src}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          priority={priority}
          sizes={sizes}
          quality={85}
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
          {...props}
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Image unavailable</span>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
}
```

## Accessibility Implementation

### Keyboard Navigation
```typescript
// components/features/catalog/service-comparison.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useCatalogStore } from '@/lib/stores/catalog-store';

export function ServiceComparison() {
  const { selectedServices, comparisonMode, toggleComparisonMode } = useCatalogStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (comparisonMode) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [comparisonMode]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      toggleComparisonMode();
    }
    
    // Trap focus within modal
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  useEffect(() => {
    if (comparisonMode) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [comparisonMode]);

  if (!comparisonMode) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto"
        tabIndex={-1}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="comparison-title" className="text-2xl font-bold">
              Service Comparison ({selectedServices.length})
            </h2>
            <button
              onClick={toggleComparisonMode}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b font-semibold">
                    Feature
                  </th>
                  {selectedServices.map((service) => (
                    <th key={service.id} className="text-center p-4 border-b border-l">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {service.providerName}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Comparison rows */}
                <ComparisonRow 
                  label="Rating"
                  values={selectedServices.map(s => (
                    <div className="flex items-center justify-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      {s.reviews.averageRating.toFixed(1)}
                    </div>
                  ))}
                />
                {/* More rows... */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComparisonRowProps {
  label: string;
  values: React.ReactNode[];
}

function ComparisonRow({ label, values }: ComparisonRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="p-4 border-b font-medium">
        {label}
      </td>
      {values.map((value, index) => (
        <td key={index} className="p-4 border-b border-l text-center">
          {value}
        </td>
      ))}
    </tr>
  );
}
```

This comprehensive frontend architecture provides a solid foundation for building a scalable, performant, and accessible AI marketplace platform with modern React patterns and Next.js 15.4 best practices.