/**
 * Profile Optimization Service
 * Provides AI-powered suggestions to improve profile performance
 */

import { 
  doc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ProfileValidation } from './publishing-service';

export interface OptimizationSuggestion {
  id: string;
  type: 'content' | 'seo' | 'engagement' | 'conversion' | 'trust';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'easy' | 'moderate' | 'complex';
  expectedImprovement: string;
  field?: string;
  examples?: string[];
  resources?: OptimizationResource[];
}

export interface OptimizationResource {
  title: string;
  url: string;
  type: 'guide' | 'template' | 'example' | 'tool';
}

export interface ProfileOptimization {
  overallScore: number;
  completionScore: number;
  qualityScore: number;
  seoScore: number;
  engagementScore: number;
  trustScore: number;
  suggestions: OptimizationSuggestion[];
  benchmarks: ProfileBenchmarks;
  nextSteps: string[];
}

export interface ProfileBenchmarks {
  industry: string;
  avgCompletionScore: number;
  avgResponseRate: number;
  avgHourlyRate: number;
  topSkills: string[];
  successMetrics: {
    profileViews: number;
    contactRate: number;
    conversionRate: number;
  };
}

export interface IndustryInsights {
  trending_skills: string[];
  salary_ranges: {
    entry: number;
    mid: number;
    senior: number;
  };
  market_demand: 'low' | 'medium' | 'high' | 'very_high';
  competition_level: 'low' | 'medium' | 'high';
  growth_opportunities: string[];
}

export class ProfileOptimizationService {
  private static readonly PROFILES_COLLECTION = 'profiles';
  private static readonly ANALYTICS_COLLECTION = 'profile-analytics';
  private static readonly BENCHMARKS_COLLECTION = 'industry-benchmarks';

  /**
   * Analyze profile and generate optimization suggestions
   */
  static async analyzeProfile(
    profileId: string,
    userType: 'freelancer' | 'vendor' | 'organization',
    validation?: ProfileValidation
  ): Promise<ProfileOptimization> {
    try {
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        throw new Error('Profile not found');
      }

      const profile = profileDoc.data();
      const suggestions: OptimizationSuggestion[] = [];

      // Get validation if not provided
      if (!validation) {
        const { ProfilePublishingService } = await import('./publishing-service');
        validation = await ProfilePublishingService.validateProfile(profileId, userType);
      }

      // Get analytics data
      const analytics = await this.getProfileAnalytics(profileId);
      
      // Get industry benchmarks
      const benchmarks = await this.getIndustryBenchmarks(profile.industry || 'general', userType);

      // Calculate individual scores
      const completionScore = validation.completeness.score;
      const qualityScore = this.calculateQualityScore(profile, userType);
      const seoScore = this.calculateSEOScore(profile);
      const engagementScore = this.calculateEngagementScore(analytics);
      const trustScore = this.calculateTrustScore(profile);

      // Calculate overall score
      const overallScore = Math.round(
        (completionScore * 0.25) +
        (qualityScore * 0.25) +
        (seoScore * 0.20) +
        (engagementScore * 0.15) +
        (trustScore * 0.15)
      );

      // Generate suggestions based on analysis
      suggestions.push(...this.generateContentSuggestions(profile, userType, validation));
      suggestions.push(...this.generateSEOSuggestions(profile, seoScore));
      suggestions.push(...this.generateEngagementSuggestions(profile, analytics, benchmarks));
      suggestions.push(...this.generateTrustSuggestions(profile, userType));
      suggestions.push(...this.generateIndustrySuggestions(profile, userType, benchmarks));

      // Sort suggestions by priority and impact
      suggestions.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const impactOrder = { high: 3, medium: 2, low: 1 };
        
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return impactOrder[b.impact] - impactOrder[a.impact];
      });

      // Generate next steps
      const nextSteps = this.generateNextSteps(suggestions.slice(0, 3));

      return {
        overallScore,
        completionScore,
        qualityScore,
        seoScore,
        engagementScore,
        trustScore,
        suggestions: suggestions.slice(0, 10), // Top 10 suggestions
        benchmarks,
        nextSteps
      };
    } catch (error) {
      console.error('Error analyzing profile:', error);
      throw error;
    }
  }

  /**
   * Get industry-specific insights
   */
  static async getIndustryInsights(
    industry: string,
    userType: 'freelancer' | 'vendor' | 'organization'
  ): Promise<IndustryInsights> {
    try {
      // This would typically come from a market research API or database
      // For now, we'll provide static insights based on common industries
      
      const insights = this.getStaticIndustryInsights(industry, userType);
      return insights;
    } catch (error) {
      console.error('Error fetching industry insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Get profile improvement timeline
   */
  static generateImprovementTimeline(suggestions: OptimizationSuggestion[]): {
    week1: OptimizationSuggestion[];
    week2: OptimizationSuggestion[];
    month1: OptimizationSuggestion[];
    ongoing: OptimizationSuggestion[];
  } {
    const timeline = {
      week1: [] as OptimizationSuggestion[],
      week2: [] as OptimizationSuggestion[],
      month1: [] as OptimizationSuggestion[],
      ongoing: [] as OptimizationSuggestion[]
    };

    suggestions.forEach(suggestion => {
      if (suggestion.effort === 'easy' && suggestion.priority === 'critical') {
        timeline.week1.push(suggestion);
      } else if (suggestion.effort === 'easy' || suggestion.priority === 'high') {
        timeline.week2.push(suggestion);
      } else if (suggestion.effort === 'moderate') {
        timeline.month1.push(suggestion);
      } else {
        timeline.ongoing.push(suggestion);
      }
    });

    return timeline;
  }

  // Private helper methods

  private static async getProfileAnalytics(profileId: string) {
    try {
      const analyticsQuery = query(
        collection(db, this.ANALYTICS_COLLECTION),
        where('profileId', '==', profileId),
        orderBy('date', 'desc'),
        limit(30)
      );

      const snapshot = await getDocs(analyticsQuery);
      
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }
  }

  private static async getIndustryBenchmarks(
    industry: string, 
    userType: 'freelancer' | 'vendor' | 'organization'
  ): Promise<ProfileBenchmarks> {
    try {
      const benchmarkRef = doc(db, this.BENCHMARKS_COLLECTION, `${industry}-${userType}`);
      const benchmarkDoc = await getDoc(benchmarkRef);

      if (benchmarkDoc.exists()) {
        return benchmarkDoc.data() as ProfileBenchmarks;
      }

      // Return default benchmarks
      return this.getDefaultBenchmarks(industry, userType);
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      return this.getDefaultBenchmarks(industry, userType);
    }
  }

  private static calculateQualityScore(profile: any, userType: string): number {
    let score = 0;
    let maxScore = 0;

    // Bio quality (0-25 points)
    maxScore += 25;
    if (profile.bio) {
      if (profile.bio.length > 150) score += 25;
      else if (profile.bio.length > 100) score += 20;
      else if (profile.bio.length > 50) score += 15;
      else score += 10;
    }

    // Skills relevance (0-20 points)
    maxScore += 20;
    if (profile.skills && profile.skills.length >= 5) score += 20;
    else if (profile.skills && profile.skills.length >= 3) score += 15;
    else if (profile.skills && profile.skills.length >= 1) score += 10;

    // Portfolio/work samples (0-25 points)
    maxScore += 25;
    if (profile.portfolio && profile.portfolio.length >= 3) score += 25;
    else if (profile.portfolio && profile.portfolio.length >= 2) score += 20;
    else if (profile.portfolio && profile.portfolio.length >= 1) score += 15;

    // Professional photo (0-15 points)
    maxScore += 15;
    if (profile.avatar) score += 15;

    // Testimonials (0-15 points)
    maxScore += 15;
    if (profile.testimonials && profile.testimonials.length >= 2) score += 15;
    else if (profile.testimonials && profile.testimonials.length >= 1) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  private static calculateSEOScore(profile: any): number {
    let score = 0;
    let maxScore = 0;

    // Custom slug (0-20 points)
    maxScore += 20;
    if (profile.publicProfile?.slug) score += 20;

    // Meta description (0-20 points)
    maxScore += 20;
    if (profile.publicProfile?.metaDescription) score += 20;

    // Keywords in bio (0-20 points)
    maxScore += 20;
    if (profile.bio && profile.bio.length > 100) score += 20;

    // Contact information (0-20 points)
    maxScore += 20;
    if (profile.contact && (profile.contact.email || profile.contact.phone)) score += 20;

    // Social links (0-20 points)
    maxScore += 20;
    if (profile.socialLinks && Object.keys(profile.socialLinks).length > 0) score += 20;

    return Math.round((score / maxScore) * 100);
  }

  private static calculateEngagementScore(analytics: any[]): number {
    if (!analytics || analytics.length === 0) return 0;

    // Calculate based on recent analytics data
    const totalViews = analytics.reduce((sum, day) => sum + (day.views || 0), 0);
    const totalContacts = analytics.reduce((sum, day) => sum + (day.contacts || 0), 0);
    
    const contactRate = totalViews > 0 ? (totalContacts / totalViews) * 100 : 0;

    // Score based on contact rate
    if (contactRate > 10) return 100;
    if (contactRate > 5) return 80;
    if (contactRate > 2) return 60;
    if (contactRate > 1) return 40;
    return 20;
  }

  private static calculateTrustScore(profile: any): number {
    let score = 0;
    let maxScore = 0;

    // Verification status (0-30 points)
    maxScore += 30;
    if (profile.verification?.isVerified) score += 30;

    // Testimonials (0-25 points)
    maxScore += 25;
    if (profile.testimonials && profile.testimonials.length >= 3) score += 25;
    else if (profile.testimonials && profile.testimonials.length >= 1) score += 15;

    // Complete contact info (0-20 points)
    maxScore += 20;
    if (profile.contact && profile.contact.email && profile.contact.phone) score += 20;
    else if (profile.contact && (profile.contact.email || profile.contact.phone)) score += 15;

    // Professional associations (0-15 points)
    maxScore += 15;
    if (profile.certifications && profile.certifications.length > 0) score += 15;

    // Response time (0-10 points)
    maxScore += 10;
    if (profile.responseTime && profile.responseTime === 'within_hour') score += 10;
    else if (profile.responseTime && profile.responseTime === 'within_day') score += 7;

    return Math.round((score / maxScore) * 100);
  }

  private static generateContentSuggestions(
    profile: any, 
    userType: string, 
    validation: ProfileValidation
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Bio improvement
    if (!profile.bio || profile.bio.length < 150) {
      suggestions.push({
        id: 'improve-bio',
        type: 'content',
        priority: 'high',
        title: 'Enhance your professional bio',
        description: 'A compelling bio can increase profile views by 40%',
        action: 'Write a detailed bio (150+ characters) highlighting your expertise and unique value',
        impact: 'high',
        effort: 'moderate',
        expectedImprovement: '40% more profile views',
        field: 'bio',
        examples: [
          'Include your years of experience',
          'Mention specific achievements',
          'Highlight unique skills or specializations',
          'Add personality while staying professional'
        ]
      });
    }

    // Skills optimization
    if (!profile.skills || profile.skills.length < 5) {
      suggestions.push({
        id: 'add-skills',
        type: 'content',
        priority: 'medium',
        title: 'Add more relevant skills',
        description: 'Profiles with 5+ skills get 60% more visibility in search',
        action: 'Add at least 5 relevant skills to your profile',
        impact: 'medium',
        effort: 'easy',
        expectedImprovement: '60% better search visibility',
        field: 'skills'
      });
    }

    // Portfolio suggestions
    if (!profile.portfolio || profile.portfolio.length < 3) {
      suggestions.push({
        id: 'add-portfolio',
        type: 'content',
        priority: 'high',
        title: 'Showcase your best work',
        description: 'Profiles with portfolio items get 5x more contact requests',
        action: 'Upload 3-5 examples of your best work with detailed descriptions',
        impact: 'high',
        effort: 'moderate',
        expectedImprovement: '5x more contact requests',
        field: 'portfolio'
      });
    }

    return suggestions;
  }

  private static generateSEOSuggestions(profile: any, seoScore: number): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    if (seoScore < 60) {
      suggestions.push({
        id: 'optimize-seo',
        type: 'seo',
        priority: 'medium',
        title: 'Improve SEO optimization',
        description: 'Better SEO helps potential clients find you through search engines',
        action: 'Add a custom URL, meta description, and optimize your content for search',
        impact: 'medium',
        effort: 'moderate',
        expectedImprovement: '30% more organic discovery'
      });
    }

    return suggestions;
  }

  private static generateEngagementSuggestions(
    profile: any, 
    analytics: any[], 
    benchmarks: ProfileBenchmarks
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Low engagement suggestions
    if (analytics.length > 0) {
      const avgViews = analytics.reduce((sum, day) => sum + (day.views || 0), 0) / 30;
      
      if (avgViews < benchmarks.successMetrics.profileViews) {
        suggestions.push({
          id: 'boost-engagement',
          type: 'engagement',
          priority: 'medium',
          title: 'Increase profile engagement',
          description: 'Your profile views are below industry average',
          action: 'Update your profile regularly and share your expertise on social media',
          impact: 'medium',
          effort: 'moderate',
          expectedImprovement: 'Reach industry average engagement'
        });
      }
    }

    return suggestions;
  }

  private static generateTrustSuggestions(profile: any, userType: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    if (!profile.verification?.isVerified) {
      suggestions.push({
        id: 'verify-profile',
        type: 'trust',
        priority: 'high',
        title: 'Verify your identity',
        description: 'Verified profiles get 3x more trust from potential clients',
        action: 'Complete the identity verification process',
        impact: 'high',
        effort: 'easy',
        expectedImprovement: '3x more client trust'
      });
    }

    return suggestions;
  }

  private static generateIndustrySuggestions(
    profile: any, 
    userType: string, 
    benchmarks: ProfileBenchmarks
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Industry-specific suggestions based on benchmarks
    if (benchmarks.topSkills.length > 0) {
      const profileSkills = profile.skills || [];
      const missingTopSkills = benchmarks.topSkills.filter(
        skill => !profileSkills.includes(skill)
      );

      if (missingTopSkills.length > 0) {
        suggestions.push({
          id: 'trending-skills',
          type: 'content',
          priority: 'medium',
          title: 'Add trending skills',
          description: `Consider adding these in-demand skills: ${missingTopSkills.slice(0, 3).join(', ')}`,
          action: 'Add trending skills that match your expertise',
          impact: 'medium',
          effort: 'easy',
          expectedImprovement: 'Better match with client needs'
        });
      }
    }

    return suggestions;
  }

  private static generateNextSteps(topSuggestions: OptimizationSuggestion[]): string[] {
    return topSuggestions.map((suggestion, index) => 
      `${index + 1}. ${suggestion.action}`
    );
  }

  private static getDefaultBenchmarks(
    industry: string, 
    userType: string
  ): ProfileBenchmarks {
    return {
      industry,
      avgCompletionScore: 75,
      avgResponseRate: 85,
      avgHourlyRate: userType === 'freelancer' ? 65 : 95,
      topSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      successMetrics: {
        profileViews: 100,
        contactRate: 5,
        conversionRate: 15
      }
    };
  }

  private static getStaticIndustryInsights(
    industry: string, 
    userType: string
  ): IndustryInsights {
    const insights: Record<string, IndustryInsights> = {
      'technology': {
        trending_skills: ['AI/ML', 'Cloud Computing', 'Cybersecurity', 'Blockchain', 'DevOps'],
        salary_ranges: { entry: 50, mid: 85, senior: 130 },
        market_demand: 'very_high',
        competition_level: 'high',
        growth_opportunities: ['AI Integration', 'Cloud Migration', 'Security Consulting']
      },
      'design': {
        trending_skills: ['UI/UX', 'Figma', 'Prototyping', 'User Research', 'Design Systems'],
        salary_ranges: { entry: 40, mid: 70, senior: 110 },
        market_demand: 'high',
        competition_level: 'medium',
        growth_opportunities: ['UX Strategy', 'Design Leadership', 'Product Design']
      },
      'marketing': {
        trending_skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Social Media', 'Analytics'],
        salary_ranges: { entry: 35, mid: 60, senior: 95 },
        market_demand: 'high',
        competition_level: 'medium',
        growth_opportunities: ['Growth Hacking', 'Marketing Automation', 'Brand Strategy']
      }
    };

    return insights[industry.toLowerCase()] || this.getDefaultInsights();
  }

  private static getDefaultInsights(): IndustryInsights {
    return {
      trending_skills: ['Communication', 'Project Management', 'Problem Solving'],
      salary_ranges: { entry: 30, mid: 55, senior: 85 },
      market_demand: 'medium',
      competition_level: 'medium',
      growth_opportunities: ['Specialization', 'Certification', 'Leadership']
    };
  }
}