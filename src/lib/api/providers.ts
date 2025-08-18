import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  doc, 
  getDoc,
  getCountFromServer,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase-config';

// Provider interfaces based on database schema
export interface Provider {
  id: string;
  // Basic Information
  name: string;
  slug: string;
  logo?: string;
  description: string;
  longDescription?: string;
  tagline?: string;
  
  // Company Details
  type: 'individual' | 'company' | 'agency' | 'enterprise';
  founded?: number;
  website?: string;
  teamSize?: number;
  headquarters?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: { latitude: number; longitude: number };
  };
  
  // Contact Information
  contactInfo: {
    email: string;
    phone?: string;
    linkedIn?: string;
    twitter?: string;
  };
  
  // Expertise & Capabilities
  expertiseAreas: string[];
  industries: string[];
  technologies: string[];
  frameworks: string[];
  languages: string[];
  
  // Certifications & Compliance
  certifications: string[];
  compliance: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    soc2Compliant: boolean;
    iso27001Compliant: boolean;
  };
  
  // Portfolio & Experience
  portfolio: PortfolioItem[];
  services: ProviderService[];
  testimonials: Testimonial[];
  
  // Ratings & Reviews
  rating: {
    averageRating: number;
    totalReviews: number;
    breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    dimensions: {
      quality: number;
      communication: number;
      delivery: number;
      value: number;
    };
  };
  
  // Business Information
  pricing: {
    model: 'hourly' | 'project' | 'retainer' | 'custom';
    startingPrice?: number;
    currency: string;
    hourlyRate?: { min: number; max: number };
    projectRange?: { min: number; max: number };
  };
  
  // Statistics
  stats: {
    totalProjects: number;
    totalClients: number;
    averageProjectValue: number;
    responseTime: number; // in hours
    onTimeDelivery: number; // percentage
    clientRetention: number; // percentage
    views: number;
    inquiries: number;
    lastActive: Date;
  };
  
  // Status & Verification
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  verified: boolean;
  featured: boolean;
  premium: boolean;
  
  // Availability
  availability: {
    isAvailable: boolean;
    nextAvailable?: Date;
    maxProjects: number;
    currentProjects: number;
    workingHours: {
      timezone: string;
      schedule: {
        [key: string]: { start: string; end: string } | null;
      };
    };
  };
  
  // SEO & Discovery
  searchTerms: string[];
  keywords: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  images: string[];
  outcome: string;
  timeline: string;
  investment?: string;
  clientTestimonial?: string;
  link?: string;
  featured: boolean;
}

export interface ProviderService {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing: string;
  duration: string;
  deliverables: string[];
  featured: boolean;
}

export interface Testimonial {
  id: string;
  client: string;
  position: string;
  company: string;
  content: string;
  rating: number;
  image?: string;
  projectCategory?: string;
  featured: boolean;
  createdAt: Date;
}

export interface ProviderFilters {
  search?: string;
  expertise?: string[];
  industries?: string[];
  location?: string;
  certification?: string[];
  companySize?: 'individual' | 'small' | 'medium' | 'large';
  rating?: number;
  verified?: boolean;
  available?: boolean;
  pricing?: {
    model?: 'hourly' | 'project' | 'retainer' | 'custom';
    min?: number;
    max?: number;
  };
  technologies?: string[];
  languages?: string[];
  projectRange?: { min: number; max: number };
}

export interface ProviderSortOptions {
  field: 'relevance' | 'rating' | 'projects' | 'reviews' | 'price' | 'experience' | 'activity';
  direction: 'asc' | 'desc';
}

export interface FilterCounts {
  expertise: { value: string; count: number; name: string }[];
  industries: { value: string; count: number; name: string }[];
  locations: { value: string; count: number; name: string }[];
  certifications: { value: string; count: number; name: string }[];
  companySizes: { value: string; count: number; name: string }[];
  pricingModels: { value: string; count: number; name: string }[];
  technologies: { value: string; count: number; name: string }[];
  languages: { value: string; count: number; name: string }[];
  ratings: { value: number; count: number; label: string }[];
}

export interface ProvidersResponse {
  providers: Provider[];
  total: number;
  filterCounts: FilterCounts;
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalPages: number;
  };
}

// Convert Firestore timestamp to JavaScript Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
};

// Build Firestore query from filters
const buildQuery = (filters: ProviderFilters, sortOptions: ProviderSortOptions) => {
  let q = collection(db, 'providers');
  const constraints: any[] = [];

  // Add where clauses
  if (filters.expertise && filters.expertise.length > 0) {
    constraints.push(where('expertiseAreas', 'array-contains-any', filters.expertise));
  }
  
  if (filters.industries && filters.industries.length > 0) {
    constraints.push(where('industries', 'array-contains-any', filters.industries));
  }
  
  if (filters.location) {
    constraints.push(where('headquarters.country', '==', filters.location));
  }
  
  if (filters.certification && filters.certification.length > 0) {
    constraints.push(where('certifications', 'array-contains-any', filters.certification));
  }
  
  if (filters.companySize) {
    if (filters.companySize === 'individual') {
      constraints.push(where('type', '==', 'individual'));
    } else if (filters.companySize === 'small') {
      constraints.push(where('teamSize', '<=', 10));
    } else if (filters.companySize === 'medium') {
      constraints.push(where('teamSize', '>', 10));
      constraints.push(where('teamSize', '<=', 50));
    } else if (filters.companySize === 'large') {
      constraints.push(where('teamSize', '>', 50));
    }
  }
  
  if (filters.verified) {
    constraints.push(where('verified', '==', true));
  }
  
  if (filters.available) {
    constraints.push(where('availability.isAvailable', '==', true));
  }
  
  if (filters.pricing?.model) {
    constraints.push(where('pricing.model', '==', filters.pricing.model));
  }
  
  if (filters.pricing?.min !== undefined) {
    constraints.push(where('pricing.startingPrice', '>=', filters.pricing.min));
  }
  
  if (filters.pricing?.max !== undefined) {
    constraints.push(where('pricing.startingPrice', '<=', filters.pricing.max));
  }
  
  if (filters.technologies && filters.technologies.length > 0) {
    constraints.push(where('technologies', 'array-contains-any', filters.technologies));
  }
  
  if (filters.rating) {
    constraints.push(where('rating.averageRating', '>=', filters.rating));
  }

  // Add status filter (only active providers)
  constraints.push(where('status', '==', 'active'));

  // Add sorting
  let sortField = 'featured'; // Default relevance sort (featured first)
  let sortDirection: 'asc' | 'desc' = 'desc';

  switch (sortOptions.field) {
    case 'rating':
      sortField = 'rating.averageRating';
      break;
    case 'projects':
      sortField = 'stats.totalProjects';
      break;
    case 'reviews':
      sortField = 'rating.totalReviews';
      break;
    case 'price':
      sortField = 'pricing.startingPrice';
      break;
    case 'experience':
      sortField = 'founded';
      sortDirection = 'asc'; // Earlier founded = more experience
      break;
    case 'activity':
      sortField = 'stats.lastActive';
      break;
    default:
      sortField = 'featured';
  }

  sortDirection = sortOptions.direction;
  constraints.push(orderBy(sortField, sortDirection));

  return query(q, ...constraints);
};

// Generate filter counts from Firestore aggregations
export const generateProviderFilterCounts = async (baseFilters: Partial<ProviderFilters> = {}): Promise<FilterCounts> => {
  try {
    const baseQuery = collection(db, 'providers');
    const activeQuery = query(
      baseQuery,
      where('status', '==', 'active'),
      limit(1000) // Limit for performance
    );
    
    const snapshot = await getDocs(activeQuery);
    const providers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Provider[];

    // Initialize count maps
    const expertiseCounts = new Map<string, { count: number; name: string }>();
    const industryCounts = new Map<string, { count: number; name: string }>();
    const locationCounts = new Map<string, { count: number; name: string }>();
    const certificationCounts = new Map<string, { count: number; name: string }>();
    const companySizeCounts = new Map<string, { count: number; name: string }>();
    const pricingModelCounts = new Map<string, { count: number; name: string }>();
    const technologyCounts = new Map<string, { count: number; name: string }>();
    const languageCounts = new Map<string, { count: number; name: string }>();
    const ratingCounts = new Map<number, { count: number; label: string }>();

    // Initialize rating buckets
    [4.5, 4, 3.5, 3, 2.5].forEach(rating => {
      ratingCounts.set(rating, { count: 0, label: `${rating}+ stars` });
    });

    // Count occurrences
    providers.forEach(provider => {
      // Expertise counts
      provider.expertiseAreas?.forEach(expertise => {
        const current = expertiseCounts.get(expertise) || { count: 0, name: expertise };
        expertiseCounts.set(expertise, { ...current, count: current.count + 1 });
      });

      // Industry counts
      provider.industries?.forEach(industry => {
        const current = industryCounts.get(industry) || { count: 0, name: industry };
        industryCounts.set(industry, { ...current, count: current.count + 1 });
      });

      // Location counts
      if (provider.headquarters?.country) {
        const country = provider.headquarters.country;
        const current = locationCounts.get(country) || { count: 0, name: country };
        locationCounts.set(country, { ...current, count: current.count + 1 });
      }

      // Certification counts
      provider.certifications?.forEach(cert => {
        const current = certificationCounts.get(cert) || { count: 0, name: cert };
        certificationCounts.set(cert, { ...current, count: current.count + 1 });
      });

      // Company size counts
      let sizeCategory = 'individual';
      if (provider.type === 'individual') {
        sizeCategory = 'individual';
      } else if (provider.teamSize <= 10) {
        sizeCategory = 'small';
      } else if (provider.teamSize <= 50) {
        sizeCategory = 'medium';
      } else {
        sizeCategory = 'large';
      }
      
      const current = companySizeCounts.get(sizeCategory) || { count: 0, name: sizeCategory };
      companySizeCounts.set(sizeCategory, { ...current, count: current.count + 1 });

      // Pricing model counts
      if (provider.pricing?.model) {
        const model = provider.pricing.model;
        const current = pricingModelCounts.get(model) || { count: 0, name: model };
        pricingModelCounts.set(model, { ...current, count: current.count + 1 });
      }

      // Technology counts
      provider.technologies?.forEach(tech => {
        const current = technologyCounts.get(tech) || { count: 0, name: tech };
        technologyCounts.set(tech, { ...current, count: current.count + 1 });
      });

      // Language counts
      provider.languages?.forEach(lang => {
        const current = languageCounts.get(lang) || { count: 0, name: lang };
        languageCounts.set(lang, { ...current, count: current.count + 1 });
      });

      // Rating counts
      const rating = provider.rating?.averageRating;
      if (rating) {
        [4.5, 4, 3.5, 3, 2.5].forEach(threshold => {
          if (rating >= threshold) {
            const current = ratingCounts.get(threshold)!;
            ratingCounts.set(threshold, { ...current, count: current.count + 1 });
          }
        });
      }
    });

    // Convert maps to arrays and sort by count
    return {
      expertise: Array.from(expertiseCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      industries: Array.from(industryCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      locations: Array.from(locationCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      certifications: Array.from(certificationCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      companySizes: Array.from(companySizeCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      pricingModels: Array.from(pricingModelCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      technologies: Array.from(technologyCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      languages: Array.from(languageCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      ratings: Array.from(ratingCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, label: data.label }))
        .sort((a, b) => b.value - a.value),
    };
  } catch (error) {
    console.error('Error generating provider filter counts:', error);
    throw new Error('Failed to generate provider filter counts');
  }
};

// Search providers with filters and pagination
export const searchProviders = async (
  filters: ProviderFilters = {},
  sortOptions: ProviderSortOptions = { field: 'relevance', direction: 'desc' },
  page: number = 1,
  pageSize: number = 24,
  lastDoc?: DocumentSnapshot
): Promise<ProvidersResponse> => {
  try {
    // Build query
    let q = buildQuery(filters, sortOptions);
    
    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(q, limit(pageSize));
    }

    // Execute query
    const [snapshot, filterCounts] = await Promise.all([
      getDocs(q),
      generateProviderFilterCounts(filters)
    ]);

    // Convert documents to providers
    const providers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        stats: {
          ...data.stats,
          lastActive: convertTimestamp(data.stats?.lastActive),
        },
        portfolio: data.portfolio?.map((item: any) => ({
          ...item,
          createdAt: convertTimestamp(item.createdAt),
        })) || [],
        testimonials: data.testimonials?.map((testimonial: any) => ({
          ...testimonial,
          createdAt: convertTimestamp(testimonial.createdAt),
        })) || [],
      } as Provider;
    });

    // Get total count
    const totalQuery = buildQuery(filters, sortOptions);
    const totalSnapshot = await getCountFromServer(totalQuery);
    const total = totalSnapshot.data().count;

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = snapshot.docs.length === pageSize;
    const hasPrevPage = page > 1;

    return {
      providers,
      total,
      filterCounts,
      pagination: {
        page,
        limit: pageSize,
        hasNextPage,
        hasPrevPage,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error searching providers:', error);
    throw new Error('Failed to search providers');
  }
};

// Get provider by ID
export const getProviderById = async (providerId: string): Promise<Provider | null> => {
  try {
    const docRef = doc(db, 'providers', providerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        stats: {
          ...data.stats,
          lastActive: convertTimestamp(data.stats?.lastActive),
        },
        portfolio: data.portfolio?.map((item: any) => ({
          ...item,
          createdAt: convertTimestamp(item.createdAt),
        })) || [],
        testimonials: data.testimonials?.map((testimonial: any) => ({
          ...testimonial,
          createdAt: convertTimestamp(testimonial.createdAt),
        })) || [],
      } as Provider;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting provider:', error);
    throw new Error('Failed to get provider');
  }
};

// Get provider by slug
export const getProviderBySlug = async (slug: string): Promise<Provider | null> => {
  try {
    const q = query(
      collection(db, 'providers'),
      where('slug', '==', slug),
      where('status', '==', 'active'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        stats: {
          ...data.stats,
          lastActive: convertTimestamp(data.stats?.lastActive),
        },
        portfolio: data.portfolio?.map((item: any) => ({
          ...item,
          createdAt: convertTimestamp(item.createdAt),
        })) || [],
        testimonials: data.testimonials?.map((testimonial: any) => ({
          ...testimonial,
          createdAt: convertTimestamp(testimonial.createdAt),
        })) || [],
      } as Provider;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting provider by slug:', error);
    throw new Error('Failed to get provider');
  }
};

// Search autocomplete suggestions for providers
export const getProviderSearchSuggestions = async (query: string, limit: number = 10): Promise<{
  providers: { id: string; name: string; expertise: string[]; slug: string }[];
  expertise: { value: string; count: number }[];
  industries: { value: string; count: number }[];
}> => {
  try {
    if (query.length < 2) {
      return { providers: [], expertise: [], industries: [] };
    }

    const searchQuery = query.toLowerCase();
    
    // Search providers by name and search terms
    const providersQuery = query(
      collection(db, 'providers'),
      where('status', '==', 'active'),
      where('searchTerms', 'array-contains-any', [searchQuery]),
      orderBy('rating.averageRating', 'desc'),
      limit(limit)
    );

    const providersSnapshot = await getDocs(providersQuery);
    const providers = providersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        expertise: data.expertiseAreas || [],
        slug: data.slug,
      };
    });

    // Get matching expertise areas and industries
    const expertise: { value: string; count: number }[] = [];
    const industries: { value: string; count: number }[] = [];
    
    // This would need more sophisticated implementation for real-time suggestions

    return { providers, expertise, industries };
  } catch (error) {
    console.error('Error getting provider search suggestions:', error);
    return { providers: [], expertise: [], industries: [] };
  }
};

// Get featured providers
export const getFeaturedProviders = async (limit: number = 6): Promise<Provider[]> => {
  try {
    const q = query(
      collection(db, 'providers'),
      where('status', '==', 'active'),
      where('featured', '==', true),
      orderBy('rating.averageRating', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        stats: {
          ...data.stats,
          lastActive: convertTimestamp(data.stats?.lastActive),
        },
      } as Provider;
    });
  } catch (error) {
    console.error('Error getting featured providers:', error);
    throw new Error('Failed to get featured providers');
  }
};