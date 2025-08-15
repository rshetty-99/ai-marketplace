// Search and Discovery System
// Advanced search functionality for projects, freelancers, and vendors

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase-config';
import { Project } from './projects';

// User Profile Types
export interface FreelancerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  title: string;
  overview: string;
  skills: string[];
  experience: {
    level: 'entry' | 'intermediate' | 'expert';
    years: number;
  };
  hourlyRate: {
    min: number;
    max: number;
    currency: 'USD' | 'EUR' | 'GBP';
  };
  availability: 'available' | 'busy' | 'unavailable';
  location: {
    country: string;
    city?: string;
    timezone: string;
  };
  portfolio: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    projectUrl?: string;
    technologies: string[];
  }[];
  stats: {
    completedProjects: number;
    totalEarnings: number;
    averageRating: number;
    reviewCount: number;
    responseTime: string;
    repeatClients: number;
  };
  certifications: {
    name: string;
    issuer: string;
    dateIssued: Date;
    credentialUrl?: string;
  }[];
  languages: {
    language: string;
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  }[];
  preferences: {
    projectTypes: string[];
    workSchedule: 'full_time' | 'part_time' | 'project_based';
    remoteOnly: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorProfile {
  id: string;
  userId: string;
  companyName: string;
  logo?: string;
  description: string;
  website?: string;
  founded: Date;
  teamSize: {
    min: number;
    max: number;
  };
  specializations: string[];
  services: {
    id: string;
    name: string;
    description: string;
    startingPrice: number;
    currency: 'USD' | 'EUR' | 'GBP';
    deliveryTime: string;
  }[];
  location: {
    country: string;
    city?: string;
    addresses: {
      type: 'headquarters' | 'office' | 'remote';
      address: string;
      city: string;
      country: string;
    }[];
  };
  stats: {
    completedProjects: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
    clientRetention: number;
    averageProjectValue: number;
  };
  certifications: {
    name: string;
    issuer: string;
    dateIssued: Date;
    credentialUrl?: string;
  }[];
  portfolio: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    caseStudyUrl?: string;
    client: string;
    technologies: string[];
    projectValue: number;
  }[];
  clients: {
    name: string;
    logo?: string;
    testimonial?: string;
    rating?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Search Filters
export interface TalentSearchFilters {
  searchTerm?: string;
  skills?: string[];
  experience?: 'entry' | 'intermediate' | 'expert';
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  availability?: 'available' | 'busy' | 'unavailable';
  location?: string;
  languages?: string[];
  averageRating?: number;
  completedProjects?: number;
  type?: 'freelancer' | 'vendor';
}

export interface ServiceSearchFilters {
  searchTerm?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  deliveryTime?: string;
  vendorRating?: number;
  location?: string;
}

// Search Results
export interface TalentSearchResult {
  freelancers: FreelancerProfile[];
  vendors: VendorProfile[];
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  total?: number;
}

export interface ServiceSearchResult {
  services: Array<VendorProfile['services'][0] & { vendor: Pick<VendorProfile, 'id' | 'companyName' | 'logo' | 'stats'> }>;
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  total?: number;
}

// Collections
const FREELANCERS_COLLECTION = 'freelancers';
const VENDORS_COLLECTION = 'vendors';
const SERVICES_COLLECTION = 'services';

// Search Freelancers
export async function searchFreelancers(
  filters: TalentSearchFilters = {},
  pageSize: number = 20,
  lastDocument?: DocumentSnapshot
): Promise<{ freelancers: FreelancerProfile[], hasMore: boolean, lastDoc?: DocumentSnapshot }> {
  try {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (filters.skills && filters.skills.length > 0) {
      constraints.push(where('skills', 'array-contains-any', filters.skills));
    }
    if (filters.experience) {
      constraints.push(where('experience.level', '==', filters.experience));
    }
    if (filters.availability) {
      constraints.push(where('availability', '==', filters.availability));
    }
    if (filters.location) {
      constraints.push(where('location.country', '==', filters.location));
    }
    if (filters.averageRating) {
      constraints.push(where('stats.averageRating', '>=', filters.averageRating));
    }
    if (filters.completedProjects) {
      constraints.push(where('stats.completedProjects', '>=', filters.completedProjects));
    }

    // Add ordering and pagination
    constraints.push(orderBy('stats.averageRating', 'desc'));
    constraints.push(limit(pageSize));
    
    if (lastDocument) {
      constraints.push(startAfter(lastDocument));
    }

    const q = query(collection(db, FREELANCERS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);

    const freelancers: FreelancerProfile[] = [];
    let lastDoc: DocumentSnapshot | undefined;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      freelancers.push({
        id: doc.id,
        ...data,
        founded: data.founded?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        certifications: data.certifications?.map((cert: any) => ({
          ...cert,
          dateIssued: cert.dateIssued?.toDate() || new Date()
        })) || []
      } as FreelancerProfile);
      lastDoc = doc;
    });

    // Client-side filtering for complex queries
    let filteredFreelancers = freelancers;

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredFreelancers = freelancers.filter(freelancer => 
        freelancer.firstName.toLowerCase().includes(searchLower) ||
        freelancer.lastName.toLowerCase().includes(searchLower) ||
        freelancer.title.toLowerCase().includes(searchLower) ||
        freelancer.overview.toLowerCase().includes(searchLower) ||
        freelancer.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    if (filters.hourlyRateMin || filters.hourlyRateMax) {
      filteredFreelancers = filteredFreelancers.filter(freelancer => {
        const rate = freelancer.hourlyRate.min;
        const meetsMin = !filters.hourlyRateMin || rate >= filters.hourlyRateMin;
        const meetsMax = !filters.hourlyRateMax || rate <= filters.hourlyRateMax;
        return meetsMin && meetsMax;
      });
    }

    return {
      freelancers: filteredFreelancers,
      hasMore: freelancers.length === pageSize,
      lastDoc
    };
  } catch (error) {
    console.error('Error searching freelancers:', error);
    throw new Error('Failed to search freelancers');
  }
}

// Search Vendors
export async function searchVendors(
  filters: TalentSearchFilters = {},
  pageSize: number = 20,
  lastDocument?: DocumentSnapshot
): Promise<{ vendors: VendorProfile[], hasMore: boolean, lastDoc?: DocumentSnapshot }> {
  try {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (filters.skills && filters.skills.length > 0) {
      constraints.push(where('specializations', 'array-contains-any', filters.skills));
    }
    if (filters.location) {
      constraints.push(where('location.country', '==', filters.location));
    }
    if (filters.averageRating) {
      constraints.push(where('stats.averageRating', '>=', filters.averageRating));
    }
    if (filters.completedProjects) {
      constraints.push(where('stats.completedProjects', '>=', filters.completedProjects));
    }

    // Add ordering and pagination
    constraints.push(orderBy('stats.averageRating', 'desc'));
    constraints.push(limit(pageSize));
    
    if (lastDocument) {
      constraints.push(startAfter(lastDocument));
    }

    const q = query(collection(db, VENDORS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);

    const vendors: VendorProfile[] = [];
    let lastDoc: DocumentSnapshot | undefined;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      vendors.push({
        id: doc.id,
        ...data,
        founded: data.founded?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        certifications: data.certifications?.map((cert: any) => ({
          ...cert,
          dateIssued: cert.dateIssued?.toDate() || new Date()
        })) || []
      } as VendorProfile);
      lastDoc = doc;
    });

    // Client-side filtering for complex queries
    let filteredVendors = vendors;

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredVendors = vendors.filter(vendor => 
        vendor.companyName.toLowerCase().includes(searchLower) ||
        vendor.description.toLowerCase().includes(searchLower) ||
        vendor.specializations.some(spec => spec.toLowerCase().includes(searchLower))
      );
    }

    return {
      vendors: filteredVendors,
      hasMore: vendors.length === pageSize,
      lastDoc
    };
  } catch (error) {
    console.error('Error searching vendors:', error);
    throw new Error('Failed to search vendors');
  }
}

// Combined Talent Search
export async function searchTalent(
  filters: TalentSearchFilters = {},
  pageSize: number = 20,
  lastDocument?: DocumentSnapshot
): Promise<TalentSearchResult> {
  try {
    const freelancersPromise = filters.type !== 'vendor' ? 
      searchFreelancers(filters, Math.ceil(pageSize / 2), lastDocument) : 
      Promise.resolve({ freelancers: [], hasMore: false });
    
    const vendorsPromise = filters.type !== 'freelancer' ? 
      searchVendors(filters, Math.ceil(pageSize / 2), lastDocument) : 
      Promise.resolve({ vendors: [], hasMore: false });

    const [freelancersResult, vendorsResult] = await Promise.all([
      freelancersPromise,
      vendorsPromise
    ]);

    return {
      freelancers: freelancersResult.freelancers,
      vendors: vendorsResult.vendors,
      hasMore: freelancersResult.hasMore || vendorsResult.hasMore,
      lastDoc: freelancersResult.lastDoc || vendorsResult.lastDoc
    };
  } catch (error) {
    console.error('Error searching talent:', error);
    throw new Error('Failed to search talent');
  }
}

// Search Services
export async function searchServices(
  filters: ServiceSearchFilters = {},
  pageSize: number = 20,
  lastDocument?: DocumentSnapshot
): Promise<ServiceSearchResult> {
  try {
    // First get vendors that match our criteria
    const vendorConstraints: QueryConstraint[] = [];
    
    if (filters.vendorRating) {
      vendorConstraints.push(where('stats.averageRating', '>=', filters.vendorRating));
    }
    if (filters.location) {
      vendorConstraints.push(where('location.country', '==', filters.location));
    }

    vendorConstraints.push(orderBy('stats.averageRating', 'desc'));
    vendorConstraints.push(limit(100)); // Get more vendors to have enough services

    const vendorQuery = query(collection(db, VENDORS_COLLECTION), ...vendorConstraints);
    const vendorSnapshot = await getDocs(vendorQuery);

    const services: ServiceSearchResult['services'] = [];

    vendorSnapshot.forEach((vendorDoc) => {
      const vendorData = vendorDoc.data() as VendorProfile;
      
      vendorData.services?.forEach((service) => {
        // Apply service-level filters
        if (filters.priceMin && service.startingPrice < filters.priceMin) return;
        if (filters.priceMax && service.startingPrice > filters.priceMax) return;
        if (filters.deliveryTime && service.deliveryTime !== filters.deliveryTime) return;
        if (filters.category && !service.name.toLowerCase().includes(filters.category.toLowerCase())) return;
        
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const matchesSearch = 
            service.name.toLowerCase().includes(searchLower) ||
            service.description.toLowerCase().includes(searchLower) ||
            vendorData.companyName.toLowerCase().includes(searchLower) ||
            vendorData.specializations.some(spec => spec.toLowerCase().includes(searchLower));
          
          if (!matchesSearch) return;
        }

        services.push({
          ...service,
          vendor: {
            id: vendorData.id,
            companyName: vendorData.companyName,
            logo: vendorData.logo,
            stats: vendorData.stats
          }
        });
      });
    });

    // Sort by vendor rating and service price
    services.sort((a, b) => {
      const ratingDiff = b.vendor.stats.averageRating - a.vendor.stats.averageRating;
      if (ratingDiff !== 0) return ratingDiff;
      return a.startingPrice - b.startingPrice;
    });

    // Apply pagination
    const startIndex = lastDocument ? parseInt(lastDocument.id) || 0 : 0;
    const paginatedServices = services.slice(startIndex, startIndex + pageSize);

    return {
      services: paginatedServices,
      hasMore: services.length > startIndex + pageSize,
      lastDoc: services.length > pageSize ? { id: (startIndex + pageSize).toString() } as DocumentSnapshot : undefined
    };
  } catch (error) {
    console.error('Error searching services:', error);
    throw new Error('Failed to search services');
  }
}

// Get Popular Skills
export async function getPopularSkills(): Promise<{ skill: string, count: number }[]> {
  try {
    // This would typically use aggregation, but for now we'll return a static list
    const popularSkills = [
      { skill: 'React', count: 150 },
      { skill: 'Node.js', count: 130 },
      { skill: 'Python', count: 125 },
      { skill: 'Machine Learning', count: 85 },
      { skill: 'TypeScript', count: 80 },
      { skill: 'AWS', count: 75 },
      { skill: 'UI/UX Design', count: 70 },
      { skill: 'MongoDB', count: 65 },
      { skill: 'Vue.js', count: 60 },
      { skill: 'Docker', count: 55 }
    ];

    return popularSkills;
  } catch (error) {
    console.error('Error getting popular skills:', error);
    return [];
  }
}

// Get Trending Categories
export async function getTrendingCategories(): Promise<{ category: string, projectCount: number, growth: number }[]> {
  try {
    // This would typically aggregate project data, but for now we'll return static data
    const trendingCategories = [
      { category: 'AI & Machine Learning', projectCount: 45, growth: 25 },
      { category: 'Web Development', projectCount: 120, growth: 15 },
      { category: 'Mobile Development', projectCount: 80, growth: 20 },
      { category: 'Blockchain', projectCount: 30, growth: 40 },
      { category: 'Data & Analytics', projectCount: 55, growth: 18 },
      { category: 'DevOps & Infrastructure', projectCount: 35, growth: 22 }
    ];

    return trendingCategories;
  } catch (error) {
    console.error('Error getting trending categories:', error);
    return [];
  }
}

// Smart Recommendations
export async function getRecommendedTalent(
  userId: string,
  projectId?: string
): Promise<{ freelancers: FreelancerProfile[], vendors: VendorProfile[] }> {
  try {
    // This would implement ML-based recommendations
    // For now, return top-rated talent
    const freelancersResult = await searchFreelancers({ 
      averageRating: 4.5,
      availability: 'available' 
    }, 5);
    
    const vendorsResult = await searchVendors({ 
      averageRating: 4.5 
    }, 5);

    return {
      freelancers: freelancersResult.freelancers,
      vendors: vendorsResult.vendors
    };
  } catch (error) {
    console.error('Error getting recommended talent:', error);
    return { freelancers: [], vendors: [] };
  }
}