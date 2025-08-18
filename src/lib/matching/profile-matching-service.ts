/**
 * Profile Matching Service
 * AI-powered algorithms to match profiles with relevant projects
 */

import { 
  doc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface MatchingProfile {
  id: string;
  userId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  name: string;
  title?: string;
  skills: string[];
  experience: {
    level: 'entry' | 'intermediate' | 'senior' | 'expert';
    years: number;
    industries: string[];
  };
  preferences: {
    projectTypes: string[];
    budgetRange: {
      min: number;
      max: number;
      currency: string;
    };
    workingHours: {
      timezone: string;
      availability: string[];
    };
    remote: boolean;
    locations: string[];
  };
  portfolio: {
    projects: Array<{
      title: string;
      description: string;
      technologies: string[];
      industry: string;
      duration: number;
      budget: number;
    }>;
    ratings: {
      average: number;
      count: number;
    };
  };
  pricing: {
    hourlyRate?: number;
    projectRate?: number;
    retainerRate?: number;
  };
  availability: {
    status: 'available' | 'busy' | 'unavailable';
    capacity: number; // percentage
    nextAvailable?: Date;
  };
  location: {
    country: string;
    city: string;
    timezone: string;
  };
  verification: {
    isVerified: boolean;
    badges: string[];
  };
  lastActive: Date;
  responseTime: number; // hours
}

export interface ProjectRequirement {
  id: string;
  title: string;
  description: string;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    required: boolean;
  }>;
  budget: {
    min: number;
    max: number;
    currency: string;
    type: 'hourly' | 'fixed' | 'retainer';
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    duration: number; // days
  };
  location: {
    type: 'remote' | 'onsite' | 'hybrid';
    countries?: string[];
    cities?: string[];
    timezone?: string;
  };
  industry: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  teamSize: number;
  experience: {
    minimumYears: number;
    preferredLevel: 'entry' | 'intermediate' | 'senior' | 'expert';
  };
  requirements: {
    languages: string[];
    certifications?: string[];
    portfolio: boolean;
    references: boolean;
  };
  clientInfo: {
    companySize: string;
    industry: string;
    previousProjects: number;
    responseTime: number;
  };
}

export interface MatchScore {
  overall: number;
  breakdown: {
    skills: number;
    experience: number;
    availability: number;
    budget: number;
    location: number;
    portfolio: number;
    responseTime: number;
    verification: number;
  };
  reasoning: string[];
  concerns: string[];
  strengths: string[];
}

export interface ProfileMatch {
  profile: MatchingProfile;
  project: ProjectRequirement;
  score: MatchScore;
  rank: number;
  confidence: 'low' | 'medium' | 'high' | 'excellent';
  recommendation: 'reject' | 'consider' | 'recommend' | 'highly_recommend';
  aiInsights: {
    summary: string;
    keyStrengths: string[];
    potentialConcerns: string[];
    recommendations: string[];
  };
  estimatedSuccessRate: number;
  competitionLevel: 'low' | 'medium' | 'high';
}

export interface MatchingPreferences {
  includePartialMatches: boolean;
  minimumScore: number;
  maxResults: number;
  prioritizeFactors: Array<{
    factor: keyof MatchScore['breakdown'];
    weight: number;
  }>;
  excludeProfiles: string[];
  requireVerification: boolean;
  budgetTolerance: number; // percentage
}

export class ProfileMatchingService {
  private static readonly PROFILES_COLLECTION = 'profiles';
  private static readonly PROJECTS_COLLECTION = 'projects';
  private static readonly MATCHES_COLLECTION = 'profile-matches';

  /**
   * Find matching profiles for a project
   */
  static async findMatchingProfiles(
    projectId: string,
    preferences: Partial<MatchingPreferences> = {}
  ): Promise<ProfileMatch[]> {
    try {
      // Get project requirements
      const projectDoc = await getDoc(doc(db, this.PROJECTS_COLLECTION, projectId));
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = this.parseProjectRequirement(projectDoc.data());
      
      // Get candidate profiles
      const candidateProfiles = await this.getCandidateProfiles(project);
      
      // Calculate matches with AI scoring
      const matches = await this.calculateMatches(candidateProfiles, project, preferences);
      
      // Sort by score and apply filters
      const filteredMatches = this.filterAndRankMatches(matches, preferences);
      
      // Store matches for analytics
      await this.storeMatches(projectId, filteredMatches);
      
      return filteredMatches;
    } catch (error) {
      console.error('Error finding matching profiles:', error);
      throw error;
    }
  }

  /**
   * Find matching projects for a profile
   */
  static async findMatchingProjects(
    profileId: string,
    preferences: Partial<MatchingPreferences> = {}
  ): Promise<Array<{
    project: ProjectRequirement;
    score: MatchScore;
    recommendation: string;
  }>> {
    try {
      // Get profile data
      const profileDoc = await getDoc(doc(db, this.PROFILES_COLLECTION, profileId));
      if (!profileDoc.exists()) {
        throw new Error('Profile not found');
      }

      const profile = this.parseProfile(profileDoc.data());
      
      // Get available projects
      const availableProjects = await this.getAvailableProjects(profile);
      
      // Calculate matches
      const projectMatches = await Promise.all(
        availableProjects.map(async (project) => {
          const score = await this.calculateMatchScore(profile, project);
          return {
            project,
            score,
            recommendation: this.getRecommendation(score.overall)
          };
        })
      );
      
      // Sort by score
      return projectMatches
        .filter(match => match.score.overall >= (preferences.minimumScore || 0.3))
        .sort((a, b) => b.score.overall - a.score.overall)
        .slice(0, preferences.maxResults || 20);
    } catch (error) {
      console.error('Error finding matching projects:', error);
      throw error;
    }
  }

  /**
   * Calculate detailed match score between profile and project
   */
  static async calculateMatchScore(
    profile: MatchingProfile,
    project: ProjectRequirement
  ): Promise<MatchScore> {
    try {
      const breakdown = {
        skills: this.calculateSkillsMatch(profile.skills, project.skills),
        experience: this.calculateExperienceMatch(profile.experience, project.experience),
        availability: this.calculateAvailabilityMatch(profile.availability, project.timeline),
        budget: this.calculateBudgetMatch(profile.pricing, project.budget),
        location: this.calculateLocationMatch(profile.location, project.location),
        portfolio: this.calculatePortfolioMatch(profile.portfolio, project),
        responseTime: this.calculateResponseTimeMatch(profile.responseTime, project.clientInfo.responseTime),
        verification: this.calculateVerificationMatch(profile.verification, project.requirements)
      };

      // Weighted overall score
      const weights = {
        skills: 0.25,
        experience: 0.20,
        availability: 0.15,
        budget: 0.15,
        location: 0.10,
        portfolio: 0.08,
        responseTime: 0.04,
        verification: 0.03
      };

      const overall = Object.entries(breakdown).reduce(
        (sum, [key, score]) => sum + (score * weights[key as keyof typeof weights]),
        0
      );

      const reasoning = this.generateReasonings(breakdown, profile, project);
      const concerns = this.identifyConcerns(breakdown, profile, project);
      const strengths = this.identifyStrengths(breakdown, profile, project);

      return {
        overall: Math.round(overall * 100) / 100,
        breakdown,
        reasoning,
        concerns,
        strengths
      };
    } catch (error) {
      console.error('Error calculating match score:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered insights for a match
   */
  static async getMatchInsights(
    profile: MatchingProfile,
    project: ProjectRequirement,
    score: MatchScore
  ): Promise<ProfileMatch['aiInsights']> {
    try {
      // In a real implementation, this would call an AI service
      // For now, we'll generate insights based on the match data
      
      const keyStrengths = [];
      const potentialConcerns = [];
      const recommendations = [];

      // Analyze strengths
      if (score.breakdown.skills > 0.8) {
        keyStrengths.push('Excellent skill match with all required technologies');
      }
      if (score.breakdown.experience > 0.8) {
        keyStrengths.push('Strong relevant experience in similar projects');
      }
      if (score.breakdown.portfolio > 0.7) {
        keyStrengths.push('Proven track record with relevant portfolio projects');
      }

      // Identify concerns
      if (score.breakdown.budget < 0.5) {
        potentialConcerns.push('Budget expectations may not align with project budget');
      }
      if (score.breakdown.availability < 0.6) {
        potentialConcerns.push('Availability constraints might affect project timeline');
      }
      if (score.breakdown.location < 0.4 && project.location.type !== 'remote') {
        potentialConcerns.push('Location mismatch may require additional coordination');
      }

      // Generate recommendations
      if (score.overall > 0.8) {
        recommendations.push('Highly recommended candidate - proceed with interview');
      } else if (score.overall > 0.6) {
        recommendations.push('Good candidate - review portfolio and conduct screening');
      } else {
        recommendations.push('Consider for backup - address identified concerns first');
      }

      const summary = this.generateMatchSummary(profile, project, score);

      return {
        summary,
        keyStrengths,
        potentialConcerns,
        recommendations
      };
    } catch (error) {
      console.error('Error generating match insights:', error);
      return {
        summary: 'Unable to generate insights',
        keyStrengths: [],
        potentialConcerns: [],
        recommendations: []
      };
    }
  }

  /**
   * Estimate project success rate for a match
   */
  static estimateSuccessRate(
    profile: MatchingProfile,
    project: ProjectRequirement,
    score: MatchScore
  ): number {
    // Base success rate from overall score
    let successRate = score.overall * 0.7;

    // Adjust based on profile history
    if (profile.portfolio.ratings.average > 4.5) {
      successRate += 0.15;
    } else if (profile.portfolio.ratings.average < 3.5) {
      successRate -= 0.1;
    }

    // Adjust based on experience match
    if (score.breakdown.experience > 0.9) {
      successRate += 0.1;
    }

    // Adjust based on verification
    if (profile.verification.isVerified) {
      successRate += 0.05;
    }

    // Adjust based on project complexity
    if (project.complexity === 'enterprise' && profile.experience.level !== 'expert') {
      successRate -= 0.15;
    }

    return Math.max(0, Math.min(1, successRate));
  }

  // Private helper methods

  private static async getCandidateProfiles(project: ProjectRequirement): Promise<MatchingProfile[]> {
    const profilesQuery = query(
      collection(db, this.PROFILES_COLLECTION),
      where('isActive', '==', true),
      where('publicProfile.isPublic', '==', true),
      limit(100)
    );

    const snapshot = await getDocs(profilesQuery);
    return snapshot.docs
      .map(doc => this.parseProfile(doc.data()))
      .filter(profile => this.isEligibleForProject(profile, project));
  }

  private static async getAvailableProjects(profile: MatchingProfile): Promise<ProjectRequirement[]> {
    const projectsQuery = query(
      collection(db, this.PROJECTS_COLLECTION),
      where('status', '==', 'open'),
      where('deadline', '>', Timestamp.now()),
      orderBy('deadline'),
      limit(50)
    );

    const snapshot = await getDocs(projectsQuery);
    return snapshot.docs.map(doc => this.parseProjectRequirement(doc.data()));
  }

  private static calculateSkillsMatch(profileSkills: string[], projectSkills: Array<{ name: string; required: boolean; level: string }>): number {
    if (projectSkills.length === 0) return 1.0;

    const requiredSkills = projectSkills.filter(skill => skill.required);
    const optionalSkills = projectSkills.filter(skill => !skill.required);

    // Check required skills
    const requiredMatches = requiredSkills.filter(skill => 
      profileSkills.some(pSkill => 
        pSkill.toLowerCase().includes(skill.name.toLowerCase()) ||
        skill.name.toLowerCase().includes(pSkill.toLowerCase())
      )
    ).length;

    const requiredScore = requiredSkills.length > 0 ? requiredMatches / requiredSkills.length : 1.0;

    // Check optional skills
    const optionalMatches = optionalSkills.filter(skill =>
      profileSkills.some(pSkill =>
        pSkill.toLowerCase().includes(skill.name.toLowerCase()) ||
        skill.name.toLowerCase().includes(pSkill.toLowerCase())
      )
    ).length;

    const optionalScore = optionalSkills.length > 0 ? optionalMatches / optionalSkills.length : 1.0;

    // Weight required skills more heavily
    return (requiredScore * 0.8) + (optionalScore * 0.2);
  }

  private static calculateExperienceMatch(profileExp: MatchingProfile['experience'], projectExp: ProjectRequirement['experience']): number {
    const experienceLevels = { entry: 1, intermediate: 2, senior: 3, expert: 4 };
    const profileLevel = experienceLevels[profileExp.level];
    const requiredLevel = experienceLevels[projectExp.preferredLevel];

    let score = 0;

    // Years of experience
    if (profileExp.years >= projectExp.minimumYears) {
      score += 0.5;
      if (profileExp.years >= projectExp.minimumYears * 1.5) {
        score += 0.2;
      }
    } else {
      score -= 0.3;
    }

    // Experience level
    if (profileLevel >= requiredLevel) {
      score += 0.5;
    } else {
      score += Math.max(0, (profileLevel / requiredLevel) * 0.3);
    }

    return Math.max(0, Math.min(1, score));
  }

  private static calculateAvailabilityMatch(availability: MatchingProfile['availability'], timeline: ProjectRequirement['timeline']): number {
    if (availability.status === 'unavailable') return 0;
    if (availability.status === 'busy' && availability.capacity < 0.3) return 0.2;

    let score = 0.5; // Base score for being available

    // Capacity match
    if (availability.capacity >= 0.8) score += 0.3;
    else if (availability.capacity >= 0.5) score += 0.2;
    else score += 0.1;

    // Timeline alignment
    if (availability.nextAvailable) {
      const daysUntilAvailable = Math.ceil(
        (availability.nextAvailable.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const projectStartDays = Math.ceil(
        (timeline.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilAvailable <= projectStartDays) {
        score += 0.2;
      } else {
        score -= 0.1;
      }
    } else {
      score += 0.2; // Immediately available
    }

    return Math.max(0, Math.min(1, score));
  }

  private static calculateBudgetMatch(pricing: MatchingProfile['pricing'], budget: ProjectRequirement['budget']): number {
    let profileRate = 0;
    
    switch (budget.type) {
      case 'hourly':
        profileRate = pricing.hourlyRate || 0;
        break;
      case 'fixed':
        profileRate = pricing.projectRate || pricing.hourlyRate || 0;
        break;
      case 'retainer':
        profileRate = pricing.retainerRate || pricing.hourlyRate || 0;
        break;
    }

    if (profileRate === 0) return 0.5; // Neutral if no pricing info

    const budgetMidpoint = (budget.min + budget.max) / 2;
    const deviation = Math.abs(profileRate - budgetMidpoint) / budgetMidpoint;

    if (deviation <= 0.1) return 1.0; // Perfect match
    if (deviation <= 0.2) return 0.8; // Good match
    if (deviation <= 0.4) return 0.6; // Acceptable
    if (deviation <= 0.6) return 0.4; // Stretch
    return 0.2; // Poor match
  }

  private static calculateLocationMatch(profileLocation: MatchingProfile['location'], projectLocation: ProjectRequirement['location']): number {
    if (projectLocation.type === 'remote') return 1.0;

    let score = 0;

    if (projectLocation.countries?.includes(profileLocation.country)) {
      score += 0.6;
    }

    if (projectLocation.cities?.includes(profileLocation.city)) {
      score += 0.4;
    }

    // Timezone compatibility
    if (projectLocation.timezone === profileLocation.timezone) {
      score += 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private static calculatePortfolioMatch(portfolio: MatchingProfile['portfolio'], project: ProjectRequirement): number {
    if (portfolio.projects.length === 0) return 0.3;

    const relevantProjects = portfolio.projects.filter(p => 
      p.industry === project.industry ||
      p.technologies.some(tech => 
        project.skills.some(skill => 
          skill.name.toLowerCase().includes(tech.toLowerCase())
        )
      )
    );

    const relevanceScore = relevantProjects.length / Math.min(portfolio.projects.length, 5);
    const ratingScore = Math.min(portfolio.ratings.average / 5, 1.0);
    const experienceScore = Math.min(portfolio.projects.length / 10, 1.0);

    return (relevanceScore * 0.5) + (ratingScore * 0.3) + (experienceScore * 0.2);
  }

  private static calculateResponseTimeMatch(profileResponseTime: number, clientExpectedTime: number): number {
    if (profileResponseTime <= clientExpectedTime) return 1.0;
    
    const ratio = clientExpectedTime / profileResponseTime;
    return Math.max(0, ratio);
  }

  private static calculateVerificationMatch(verification: MatchingProfile['verification'], requirements: ProjectRequirement['requirements']): number {
    let score = 0;

    if (verification.isVerified) score += 0.5;
    
    // Badge matching would go here
    score += Math.min(verification.badges.length * 0.1, 0.5);

    return Math.min(1, score);
  }

  private static async calculateMatches(
    profiles: MatchingProfile[],
    project: ProjectRequirement,
    preferences: Partial<MatchingPreferences>
  ): Promise<ProfileMatch[]> {
    const matches = await Promise.all(
      profiles.map(async (profile, index) => {
        const score = await this.calculateMatchScore(profile, project);
        const aiInsights = await this.getMatchInsights(profile, project, score);
        const estimatedSuccessRate = this.estimateSuccessRate(profile, project, score);
        
        return {
          profile,
          project,
          score,
          rank: index + 1,
          confidence: this.getConfidenceLevel(score.overall),
          recommendation: this.getRecommendation(score.overall),
          aiInsights,
          estimatedSuccessRate,
          competitionLevel: this.calculateCompetitionLevel(profiles.length, index)
        } as ProfileMatch;
      })
    );

    return matches;
  }

  private static filterAndRankMatches(
    matches: ProfileMatch[],
    preferences: Partial<MatchingPreferences>
  ): ProfileMatch[] {
    const minimumScore = preferences.minimumScore || 0.3;
    const maxResults = preferences.maxResults || 20;

    return matches
      .filter(match => match.score.overall >= minimumScore)
      .filter(match => !preferences.excludeProfiles?.includes(match.profile.id))
      .filter(match => !preferences.requireVerification || match.profile.verification.isVerified)
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, maxResults)
      .map((match, index) => ({ ...match, rank: index + 1 }));
  }

  private static async storeMatches(projectId: string, matches: ProfileMatch[]): Promise<void> {
    // Store matches for analytics and caching
    // Implementation would save to Firestore for future reference
  }

  private static parseProfile(data: any): MatchingProfile {
    // Parse Firestore document data into MatchingProfile interface
    return {
      id: data.id || '',
      userId: data.userId || '',
      userType: data.userType || 'freelancer',
      name: data.name || '',
      title: data.title,
      skills: data.skills || [],
      experience: {
        level: data.experience?.level || 'entry',
        years: data.experience?.years || 0,
        industries: data.experience?.industries || []
      },
      preferences: {
        projectTypes: data.preferences?.projectTypes || [],
        budgetRange: {
          min: data.preferences?.budgetRange?.min || 0,
          max: data.preferences?.budgetRange?.max || 0,
          currency: data.preferences?.budgetRange?.currency || 'USD'
        },
        workingHours: {
          timezone: data.preferences?.workingHours?.timezone || 'UTC',
          availability: data.preferences?.workingHours?.availability || []
        },
        remote: data.preferences?.remote ?? true,
        locations: data.preferences?.locations || []
      },
      portfolio: {
        projects: data.portfolio?.projects || [],
        ratings: {
          average: data.portfolio?.ratings?.average || 0,
          count: data.portfolio?.ratings?.count || 0
        }
      },
      pricing: {
        hourlyRate: data.pricing?.hourlyRate,
        projectRate: data.pricing?.projectRate,
        retainerRate: data.pricing?.retainerRate
      },
      availability: {
        status: data.availability?.status || 'available',
        capacity: data.availability?.capacity || 100,
        nextAvailable: data.availability?.nextAvailable?.toDate()
      },
      location: {
        country: data.location?.country || '',
        city: data.location?.city || '',
        timezone: data.location?.timezone || 'UTC'
      },
      verification: {
        isVerified: data.verification?.isVerified || false,
        badges: data.verification?.badges || []
      },
      lastActive: data.lastActive?.toDate() || new Date(),
      responseTime: data.responseTime || 24
    };
  }

  private static parseProjectRequirement(data: any): ProjectRequirement {
    // Parse Firestore document data into ProjectRequirement interface
    return {
      id: data.id || '',
      title: data.title || '',
      description: data.description || '',
      skills: data.skills || [],
      budget: {
        min: data.budget?.min || 0,
        max: data.budget?.max || 0,
        currency: data.budget?.currency || 'USD',
        type: data.budget?.type || 'fixed'
      },
      timeline: {
        startDate: data.timeline?.startDate?.toDate() || new Date(),
        endDate: data.timeline?.endDate?.toDate() || new Date(),
        duration: data.timeline?.duration || 0
      },
      location: {
        type: data.location?.type || 'remote',
        countries: data.location?.countries,
        cities: data.location?.cities,
        timezone: data.location?.timezone
      },
      industry: data.industry || '',
      complexity: data.complexity || 'moderate',
      teamSize: data.teamSize || 1,
      experience: {
        minimumYears: data.experience?.minimumYears || 0,
        preferredLevel: data.experience?.preferredLevel || 'intermediate'
      },
      requirements: {
        languages: data.requirements?.languages || [],
        certifications: data.requirements?.certifications,
        portfolio: data.requirements?.portfolio || false,
        references: data.requirements?.references || false
      },
      clientInfo: {
        companySize: data.clientInfo?.companySize || '',
        industry: data.clientInfo?.industry || '',
        previousProjects: data.clientInfo?.previousProjects || 0,
        responseTime: data.clientInfo?.responseTime || 24
      }
    };
  }

  private static isEligibleForProject(profile: MatchingProfile, project: ProjectRequirement): boolean {
    // Basic eligibility checks
    if (profile.availability.status === 'unavailable') return false;
    if (project.location.type !== 'remote' && !profile.preferences.remote) {
      // Check location compatibility
      if (!project.location.countries?.includes(profile.location.country)) return false;
    }
    return true;
  }

  private static getConfidenceLevel(score: number): 'low' | 'medium' | 'high' | 'excellent' {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private static getRecommendation(score: number): 'reject' | 'consider' | 'recommend' | 'highly_recommend' {
    if (score >= 0.8) return 'highly_recommend';
    if (score >= 0.6) return 'recommend';
    if (score >= 0.4) return 'consider';
    return 'reject';
  }

  private static calculateCompetitionLevel(totalCandidates: number, rank: number): 'low' | 'medium' | 'high' {
    if (rank <= totalCandidates * 0.1) return 'low';
    if (rank <= totalCandidates * 0.3) return 'medium';
    return 'high';
  }

  private static generateReasonings(breakdown: MatchScore['breakdown'], profile: MatchingProfile, project: ProjectRequirement): string[] {
    const reasonings = [];
    
    if (breakdown.skills > 0.8) {
      reasonings.push('Strong technical skill alignment with project requirements');
    }
    if (breakdown.experience > 0.7) {
      reasonings.push('Relevant experience level matches project complexity');
    }
    if (breakdown.portfolio > 0.7) {
      reasonings.push('Portfolio demonstrates success in similar projects');
    }
    
    return reasonings;
  }

  private static identifyConcerns(breakdown: MatchScore['breakdown'], profile: MatchingProfile, project: ProjectRequirement): string[] {
    const concerns = [];
    
    if (breakdown.budget < 0.5) {
      concerns.push('Budget expectations may exceed project constraints');
    }
    if (breakdown.availability < 0.6) {
      concerns.push('Limited availability may impact project timeline');
    }
    if (breakdown.location < 0.4) {
      concerns.push('Geographic location may present coordination challenges');
    }
    
    return concerns;
  }

  private static identifyStrengths(breakdown: MatchScore['breakdown'], profile: MatchingProfile, project: ProjectRequirement): string[] {
    const strengths = [];
    
    Object.entries(breakdown).forEach(([key, score]) => {
      if (score > 0.8) {
        strengths.push(`Excellent ${key} match`);
      }
    });
    
    return strengths;
  }

  private static generateMatchSummary(profile: MatchingProfile, project: ProjectRequirement, score: MatchScore): string {
    const confidence = this.getConfidenceLevel(score.overall);
    const recommendation = this.getRecommendation(score.overall);
    
    return `${confidence.charAt(0).toUpperCase() + confidence.slice(1)} match with ${Math.round(score.overall * 100)}% compatibility. ${recommendation.replace('_', ' ').charAt(0).toUpperCase() + recommendation.replace('_', ' ').slice(1)} for this project.`;
  }
}