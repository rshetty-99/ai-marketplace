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
import type { Service, ServiceFilters, ServiceSortOptions } from '@/types/service';

export interface FilterCounts {
  categories: { value: string; count: number; name: string }[];
  subcategories: { value: string; count: number; name: string; categoryId: string }[];
  domains: { value: string; count: number; name: string; subcategoryId: string }[];
  providerTypes: { value: string; count: number; name: string }[];
  industries: { value: string; count: number; name: string }[];
  priceRanges: { value: string; count: number; label: string; min: number | null; max: number | null }[];
  billingCycles: { value: string; count: number; name: string }[];
  compliances: { value: string; count: number; name: string }[];
  features: { value: string; count: number; name: string }[];
  technologies: { value: string; count: number; name: string }[];
  platforms: { value: string; count: number; name: string }[];
  deploymentOptions: { value: string; count: number; name: string }[];
  timelines: { value: string; count: number; name: string }[];
  ratings: { value: number; count: number; label: string }[];
}

export interface ServicesResponse {
  services: Service[];
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

export interface PriceHistogram {
  buckets: {
    min: number;
    max: number;
    count: number;
    percentage: number;
  }[];
  total: number;
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
const buildQuery = (filters: ServiceFilters, sortOptions: ServiceSortOptions) => {
  let q = collection(db, 'services');
  const constraints: any[] = [];

  // Add where clauses
  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }
  
  if (filters.subcategory) {
    constraints.push(where('subcategory', '==', filters.subcategory));
  }
  
  if (filters.industries && filters.industries.length > 0) {
    constraints.push(where('industries', 'array-contains-any', filters.industries));
  }
  
  if (filters.providerType) {
    constraints.push(where('provider.type', '==', filters.providerType));
  }
  
  if (filters.verified) {
    constraints.push(where('provider.verification.verified', '==', true));
  }
  
  if (filters.featured) {
    constraints.push(where('featured', '==', true));
  }
  
  if (filters.priceRange?.min !== undefined) {
    constraints.push(where('pricing.startingPrice', '>=', filters.priceRange.min));
  }
  
  if (filters.priceRange?.max !== undefined) {
    constraints.push(where('pricing.startingPrice', '<=', filters.priceRange.max));
  }
  
  if (filters.technologies && filters.technologies.length > 0) {
    constraints.push(where('technical.technologies', 'array-contains-any', filters.technologies));
  }

  // Add status filter (only published services)
  constraints.push(where('status', '==', 'published'));
  constraints.push(where('visibility', '==', 'public'));

  // Add sorting
  let sortField = 'priority'; // Default relevance sort
  let sortDirection: 'asc' | 'desc' = 'desc';

  switch (sortOptions.field) {
    case 'rating':
      sortField = 'reviews.averageRating';
      break;
    case 'price':
      sortField = 'pricing.startingPrice';
      break;
    case 'name':
      sortField = 'name';
      break;
    case 'created':
      sortField = 'createdAt';
      break;
    case 'popularity':
      sortField = 'stats.views';
      break;
    default:
      sortField = 'priority';
  }

  sortDirection = sortOptions.direction;
  constraints.push(orderBy(sortField, sortDirection));

  return query(q, ...constraints);
};

// Generate filter counts from Firestore aggregations
export const generateFilterCounts = async (baseFilters: Partial<ServiceFilters> = {}): Promise<FilterCounts> => {
  try {
    // For performance, we'll generate counts from a subset of data
    const baseQuery = collection(db, 'services');
    const publishedQuery = query(
      baseQuery,
      where('status', '==', 'published'),
      where('visibility', '==', 'public'),
      limit(1000) // Limit for performance
    );
    
    const snapshot = await getDocs(publishedQuery);
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];

    // Generate counts for each filter type
    const categoryCounts = new Map<string, { count: number; name: string }>();
    const subcategoryCounts = new Map<string, { count: number; name: string; categoryId: string }>();
    const domainCounts = new Map<string, { count: number; name: string; subcategoryId: string }>();
    const providerTypeCounts = new Map<string, { count: number; name: string }>();
    const industryCounts = new Map<string, { count: number; name: string }>();
    const priceBuckets = new Map<string, { count: number; label: string; min: number | null; max: number | null }>();
    const billingCycleCounts = new Map<string, { count: number; name: string }>();
    const complianceCounts = new Map<string, { count: number; name: string }>();
    const featureCounts = new Map<string, { count: number; name: string }>();
    const technologyCounts = new Map<string, { count: number; name: string }>();
    const platformCounts = new Map<string, { count: number; name: string }>();
    const deploymentCounts = new Map<string, { count: number; name: string }>();
    const timelineCounts = new Map<string, { count: number; name: string }>();
    const ratingCounts = new Map<number, { count: number; label: string }>();

    // Initialize price buckets
    const priceRanges = [
      { id: 'free', label: 'Free', min: 0, max: 0 },
      { id: 'under_100', label: 'Under $100', min: 0.01, max: 100 },
      { id: '100_500', label: '$100 - $500', min: 100, max: 500 },
      { id: '500_1000', label: '$500 - $1,000', min: 500, max: 1000 },
      { id: '1000_5000', label: '$1,000 - $5,000', min: 1000, max: 5000 },
      { id: '5000_plus', label: '$5,000+', min: 5000, max: null },
      { id: 'custom', label: 'Custom Pricing', min: null, max: null },
    ];

    priceRanges.forEach(range => {
      priceBuckets.set(range.id, { count: 0, label: range.label, min: range.min, max: range.max });
    });

    // Initialize rating buckets
    [4.5, 4, 3.5, 3].forEach(rating => {
      ratingCounts.set(rating, { count: 0, label: `${rating}+ stars` });
    });

    // Count occurrences
    services.forEach(service => {
      // Category counts
      if (service.category) {
        const current = categoryCounts.get(service.category) || { count: 0, name: service.category.replace('_', ' ') };
        categoryCounts.set(service.category, { ...current, count: current.count + 1 });
      }

      // Subcategory counts
      if (service.subcategory) {
        const current = subcategoryCounts.get(service.subcategory) || { 
          count: 0, 
          name: service.subcategory.replace('_', ' '),
          categoryId: service.category
        };
        subcategoryCounts.set(service.subcategory, { ...current, count: current.count + 1 });
      }

      // Provider type counts
      if (service.provider?.type) {
        const current = providerTypeCounts.get(service.provider.type) || { count: 0, name: service.provider.type };
        providerTypeCounts.set(service.provider.type, { ...current, count: current.count + 1 });
      }

      // Industry counts
      service.industries?.forEach(industry => {
        const current = industryCounts.get(industry) || { count: 0, name: industry };
        industryCounts.set(industry, { ...current, count: current.count + 1 });
      });

      // Price bucket counts
      const price = service.pricing?.startingPrice;
      if (price === 0) {
        const bucket = priceBuckets.get('free')!;
        priceBuckets.set('free', { ...bucket, count: bucket.count + 1 });
      } else if (price === null || price === undefined) {
        const bucket = priceBuckets.get('custom')!;
        priceBuckets.set('custom', { ...bucket, count: bucket.count + 1 });
      } else {
        for (const [id, bucket] of priceBuckets.entries()) {
          if (bucket.min !== null && bucket.max !== null) {
            if (price >= bucket.min && price <= bucket.max) {
              priceBuckets.set(id, { ...bucket, count: bucket.count + 1 });
              break;
            }
          } else if (bucket.min !== null && bucket.max === null && price >= bucket.min) {
            priceBuckets.set(id, { ...bucket, count: bucket.count + 1 });
            break;
          }
        }
      }

      // Billing cycle counts
      if (service.pricing?.billingCycle) {
        const cycle = service.pricing.billingCycle;
        const current = billingCycleCounts.get(cycle) || { count: 0, name: cycle };
        billingCycleCounts.set(cycle, { ...current, count: current.count + 1 });
      }

      // Compliance counts
      service.compliance?.certifications?.forEach(cert => {
        const current = complianceCounts.get(cert) || { count: 0, name: cert };
        complianceCounts.set(cert, { ...current, count: current.count + 1 });
      });

      // Feature counts
      service.features?.forEach(feature => {
        const current = featureCounts.get(feature.name) || { count: 0, name: feature.name };
        featureCounts.set(feature.name, { ...current, count: current.count + 1 });
      });

      // Technology counts
      service.technical?.technologies?.forEach(tech => {
        const current = technologyCounts.get(tech) || { count: 0, name: tech };
        technologyCounts.set(tech, { ...current, count: current.count + 1 });
      });

      // Platform counts
      service.technical?.platforms?.forEach(platform => {
        const current = platformCounts.get(platform) || { count: 0, name: platform };
        platformCounts.set(platform, { ...current, count: current.count + 1 });
      });

      // Deployment counts
      service.availability?.deploymentOptions?.forEach(option => {
        const current = deploymentCounts.get(option) || { count: 0, name: option };
        deploymentCounts.set(option, { ...current, count: current.count + 1 });
      });

      // Timeline counts
      const timeline = service.implementation?.timeline?.total;
      if (timeline) {
        const current = timelineCounts.get(timeline) || { count: 0, name: timeline };
        timelineCounts.set(timeline, { ...current, count: current.count + 1 });
      }

      // Rating counts
      const rating = service.reviews?.averageRating;
      if (rating) {
        [4.5, 4, 3.5, 3].forEach(threshold => {
          if (rating >= threshold) {
            const current = ratingCounts.get(threshold)!;
            ratingCounts.set(threshold, { ...current, count: current.count + 1 });
          }
        });
      }
    });

    // Convert maps to arrays and sort by count
    return {
      categories: Array.from(categoryCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      subcategories: Array.from(subcategoryCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name, categoryId: data.categoryId }))
        .sort((a, b) => b.count - a.count),
      
      domains: [], // Will be populated when domain data is available
      
      providerTypes: Array.from(providerTypeCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      industries: Array.from(industryCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      priceRanges: priceRanges.map(range => ({
        value: range.id,
        count: priceBuckets.get(range.id)?.count || 0,
        label: range.label,
        min: range.min,
        max: range.max
      })),
      
      billingCycles: Array.from(billingCycleCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      compliances: Array.from(complianceCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      features: Array.from(featureCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      technologies: Array.from(technologyCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      platforms: Array.from(platformCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      deploymentOptions: Array.from(deploymentCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      timelines: Array.from(timelineCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, name: data.name }))
        .sort((a, b) => b.count - a.count),
      
      ratings: Array.from(ratingCounts.entries())
        .map(([value, data]) => ({ value, count: data.count, label: data.label }))
        .sort((a, b) => b.value - a.value),
    };
  } catch (error) {
    console.error('Error generating filter counts:', error);
    throw new Error('Failed to generate filter counts');
  }
};

// Generate price histogram
export const generatePriceHistogram = async (filters: Partial<ServiceFilters> = {}): Promise<PriceHistogram> => {
  try {
    const baseQuery = collection(db, 'services');
    const publishedQuery = query(
      baseQuery,
      where('status', '==', 'published'),
      where('visibility', '==', 'public'),
      limit(1000)
    );
    
    const snapshot = await getDocs(publishedQuery);
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];

    // Define price buckets
    const buckets = [
      { min: 0, max: 50, count: 0 },
      { min: 50, max: 100, count: 0 },
      { min: 100, max: 250, count: 0 },
      { min: 250, max: 500, count: 0 },
      { min: 500, max: 1000, count: 0 },
      { min: 1000, max: 2500, count: 0 },
      { min: 2500, max: 5000, count: 0 },
      { min: 5000, max: 10000, count: 0 },
      { min: 10000, max: Infinity, count: 0 },
    ];

    let total = 0;

    // Count services in each bucket
    services.forEach(service => {
      const price = service.pricing?.startingPrice;
      if (price && price > 0) {
        total++;
        for (const bucket of buckets) {
          if (price >= bucket.min && price < bucket.max) {
            bucket.count++;
            break;
          }
        }
      }
    });

    // Calculate percentages
    const result = buckets.map(bucket => ({
      ...bucket,
      percentage: total > 0 ? (bucket.count / total) * 100 : 0
    }));

    return { buckets: result, total };
  } catch (error) {
    console.error('Error generating price histogram:', error);
    throw new Error('Failed to generate price histogram');
  }
};

// Search services with filters and pagination
export const searchServices = async (
  filters: ServiceFilters = {},
  sortOptions: ServiceSortOptions = { field: 'relevance', direction: 'desc' },
  page: number = 1,
  pageSize: number = 24,
  lastDoc?: DocumentSnapshot
): Promise<ServicesResponse> => {
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
      generateFilterCounts(filters)
    ]);

    // Convert documents to services
    const services = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as Service;
    });

    // Get total count (for large datasets, this might need optimization)
    const totalQuery = buildQuery(filters, sortOptions);
    const totalSnapshot = await getCountFromServer(totalQuery);
    const total = totalSnapshot.data().count;

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = snapshot.docs.length === pageSize;
    const hasPrevPage = page > 1;

    return {
      services,
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
    console.error('Error searching services:', error);
    throw new Error('Failed to search services');
  }
};

// Get service by ID
export const getServiceById = async (serviceId: string): Promise<Service | null> => {
  try {
    const docRef = doc(db, 'services', serviceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as Service;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting service:', error);
    throw new Error('Failed to get service');
  }
};

// Search autocomplete suggestions
export const getSearchSuggestions = async (query: string, limit: number = 10): Promise<{
  services: { id: string; name: string; category: string }[];
  providers: { id: string; name: string; type: string }[];
  categories: { id: string; name: string; count: number }[];
}> => {
  try {
    if (query.length < 2) {
      return { services: [], providers: [], categories: [] };
    }

    const searchQuery = query.toLowerCase();
    
    // Search services by name
    const servicesQuery = query(
      collection(db, 'services'),
      where('status', '==', 'published'),
      where('searchTerms', 'array-contains-any', [searchQuery]),
      orderBy('priority', 'desc'),
      limit(limit)
    );

    const servicesSnapshot = await getDocs(servicesQuery);
    const services = servicesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
      };
    });

    // Search providers by name
    const providersQuery = query(
      collection(db, 'providers'),
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
        type: data.type,
      };
    });

    // Get categories that match
    const categories: { id: string; name: string; count: number }[] = [];
    // This would need to be implemented based on your category structure

    return { services, providers, categories };
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return { services: [], providers: [], categories: [] };
  }
};