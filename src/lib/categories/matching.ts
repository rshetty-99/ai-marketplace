import { 
  FreelancerProfile, 
  MatchingCriteria, 
  AIMatchingResult, 
  SkillMatch, 
  CategoryMatch,
  SkillLevel 
} from './types';

export class AIMatchingEngine {
  static async findMatches(
    criteria: MatchingCriteria,
    freelancers: FreelancerProfile[],
    options: {
      maxResults?: number;
      minScore?: number;
      useSemanticSearch?: boolean;
    } = {}
  ): Promise<AIMatchingResult[]> {
    const { maxResults = 20, minScore = 0.3, useSemanticSearch = true } = options;

    const results: AIMatchingResult[] = [];

    for (const freelancer of freelancers) {
      const matchResult = this.calculateMatch(criteria, freelancer, useSemanticSearch);
      
      if (matchResult.matchScore >= minScore) {
        results.push(matchResult);
      }
    }

    // Sort by match score descending
    results.sort((a, b) => b.matchScore - a.matchScore);

    return results.slice(0, maxResults);
  }

  private static calculateMatch(
    criteria: MatchingCriteria,
    freelancer: FreelancerProfile,
    useSemanticSearch: boolean
  ): AIMatchingResult {
    const skillMatches = this.calculateSkillMatches(criteria.skills, freelancer);
    const categoryMatches = this.calculateCategoryMatches(criteria.categories, freelancer);
    const availabilityMatch = this.calculateAvailabilityMatch(criteria, freelancer);
    const budgetMatch = this.calculateBudgetMatch(criteria.budget, freelancer);
    const timelineMatch = this.calculateTimelineMatch(criteria.timeline, freelancer);
    
    // Weighted scoring
    const weights = {
      skills: 0.3,
      categories: 0.25,
      availability: 0.2,
      budget: 0.15,
      timeline: 0.1,
    };

    const skillScore = this.averageSkillScore(skillMatches);
    const categoryScore = this.averageCategoryScore(categoryMatches);

    const matchScore = 
      skillScore * weights.skills +
      categoryScore * weights.categories +
      availabilityMatch * weights.availability +
      budgetMatch * weights.budget +
      timelineMatch * weights.timeline;

    // Apply semantic search boost if enabled
    let semanticBoost = 0;
    if (useSemanticSearch) {
      semanticBoost = this.calculateSemanticSimilarity(criteria, freelancer);
    }

    const finalScore = Math.min(1.0, matchScore + semanticBoost * 0.1);

    const riskFactors = this.identifyRiskFactors(criteria, freelancer);
    const recommendations = this.generateRecommendations(criteria, freelancer, skillMatches);

    return {
      freelancerId: freelancer.id,
      matchScore: finalScore,
      reasoning: this.generateReasoning(skillMatches, categoryMatches, availabilityMatch, budgetMatch),
      skillMatches,
      categoryMatches,
      availabilityMatch,
      budgetMatch,
      timelineMatch,
      riskFactors,
      recommendations,
    };
  }

  private static calculateSkillMatches(requiredSkills: string[], freelancer: FreelancerProfile): SkillMatch[] {
    const matches: SkillMatch[] = [];

    for (const skillId of requiredSkills) {
      const freelancerSkill = freelancer.skills.find(s => s.skillId === skillId);
      
      if (freelancerSkill) {
        const levelScore = this.getSkillLevelScore(freelancerSkill.level);
        const experienceScore = Math.min(1.0, freelancerSkill.experience / 5); // Max at 5 years
        const verificationBonus = freelancerSkill.verified ? 0.2 : 0;
        
        const matchScore = Math.min(1.0, levelScore + experienceScore * 0.3 + verificationBonus);

        matches.push({
          skillId,
          required: true,
          freelancerLevel: freelancerSkill.level,
          requiredLevel: SkillLevel.INTERMEDIATE, // Default requirement
          experience: freelancerSkill.experience,
          verified: freelancerSkill.verified,
          matchScore,
        });
      } else {
        matches.push({
          skillId,
          required: true,
          freelancerLevel: SkillLevel.BEGINNER,
          requiredLevel: SkillLevel.INTERMEDIATE,
          experience: 0,
          verified: false,
          matchScore: 0,
        });
      }
    }

    return matches;
  }

  private static calculateCategoryMatches(requiredCategories: string[], freelancer: FreelancerProfile): CategoryMatch[] {
    const matches: CategoryMatch[] = [];

    for (const categoryId of requiredCategories) {
      const hasCategory = freelancer.categories.includes(categoryId);
      const portfolioItems = freelancer.portfolio.filter(item => 
        item.categoryIds.includes(categoryId)
      ).length;

      const relevance = hasCategory ? 1.0 : 0.2; // Partial credit for related work
      const experience = Math.min(1.0, portfolioItems / 5); // Max at 5 projects
      const successRate = freelancer.successRate;

      matches.push({
        categoryId,
        relevance,
        experience,
        successRate,
        portfolioItems,
      });
    }

    return matches;
  }

  private static calculateAvailabilityMatch(criteria: MatchingCriteria, freelancer: FreelancerProfile): number {
    if (!criteria.timeline) return 0.8; // Default good availability

    const requiredHours = this.estimateRequiredHours(criteria);
    const availableHours = freelancer.availability.hoursPerWeek;

    if (availableHours >= requiredHours) return 1.0;
    if (availableHours >= requiredHours * 0.7) return 0.8;
    if (availableHours >= requiredHours * 0.5) return 0.6;
    return 0.3;
  }

  private static calculateBudgetMatch(budget: any, freelancer: FreelancerProfile): number {
    if (budget.type === 'hourly') {
      const freelancerRate = freelancer.rates.hourlyRate;
      if (freelancerRate <= budget.max && freelancerRate >= budget.min) return 1.0;
      if (freelancerRate <= budget.max * 1.2) return 0.7;
      if (freelancerRate >= budget.min * 0.8) return 0.7;
      return 0.3;
    }

    // Fixed price logic would go here
    return 0.8; // Default for fixed price
  }

  private static calculateTimelineMatch(timeline: any, freelancer: FreelancerProfile): number {
    // Simple timeline matching based on response time and availability
    const responseTimeScore = freelancer.responseTime <= 2 ? 1.0 : 
                             freelancer.responseTime <= 6 ? 0.8 : 
                             freelancer.responseTime <= 24 ? 0.6 : 0.3;

    return responseTimeScore;
  }

  private static calculateSemanticSimilarity(criteria: MatchingCriteria, freelancer: FreelancerProfile): number {
    // Simplified semantic matching - in production, this would use embeddings
    const freelancerTags = [
      ...freelancer.tags,
      ...freelancer.skills.map(s => s.skillId),
      ...freelancer.categories
    ];

    const criteriaTags = [
      ...criteria.skills,
      ...criteria.categories,
      ...criteria.tools || []
    ];

    const intersection = freelancerTags.filter(tag => criteriaTags.includes(tag));
    const union = [...new Set([...freelancerTags, ...criteriaTags])];

    return intersection.length / union.length;
  }

  private static getSkillLevelScore(level: SkillLevel): number {
    switch (level) {
      case SkillLevel.EXPERT: return 1.0;
      case SkillLevel.ADVANCED: return 0.8;
      case SkillLevel.INTERMEDIATE: return 0.6;
      case SkillLevel.BEGINNER: return 0.4;
      default: return 0.2;
    }
  }

  private static averageSkillScore(skillMatches: SkillMatch[]): number {
    if (skillMatches.length === 0) return 0;
    return skillMatches.reduce((sum, match) => sum + match.matchScore, 0) / skillMatches.length;
  }

  private static averageCategoryScore(categoryMatches: CategoryMatch[]): number {
    if (categoryMatches.length === 0) return 0;
    return categoryMatches.reduce((sum, match) => sum + match.relevance * match.experience, 0) / categoryMatches.length;
  }

  private static estimateRequiredHours(criteria: MatchingCriteria): number {
    // Simplified estimation - in production, this would use ML models
    const complexityMultiplier = criteria.complexity === 'simple' ? 0.5 : 
                                criteria.complexity === 'moderate' ? 1.0 : 
                                criteria.complexity === 'complex' ? 2.0 : 3.0;

    return 20 * complexityMultiplier; // Base 20 hours per week
  }

  private static identifyRiskFactors(criteria: MatchingCriteria, freelancer: FreelancerProfile): string[] {
    const risks: string[] = [];

    if (freelancer.successRate < 0.85) {
      risks.push('Below average success rate');
    }

    if (freelancer.responseTime > 12) {
      risks.push('Slow response time');
    }

    if (freelancer.totalProjects < 5) {
      risks.push('Limited project history');
    }

    if (freelancer.averageRating < 4.5) {
      risks.push('Below average ratings');
    }

    return risks;
  }

  private static generateRecommendations(
    criteria: MatchingCriteria,
    freelancer: FreelancerProfile,
    skillMatches: SkillMatch[]
  ): string[] {
    const recommendations: string[] = [];

    const missingSkills = skillMatches.filter(match => match.matchScore === 0);
    if (missingSkills.length > 0) {
      recommendations.push(`Consider providing training for: ${missingSkills.map(s => s.skillId).join(', ')}`);
    }

    if (freelancer.rates.hourlyRate > criteria.budget?.max) {
      recommendations.push('Consider negotiating project-based pricing');
    }

    if (freelancer.portfolio.length > 10) {
      recommendations.push('Experienced freelancer with strong portfolio');
    }

    return recommendations;
  }

  private static generateReasoning(
    skillMatches: SkillMatch[],
    categoryMatches: CategoryMatch[],
    availabilityMatch: number,
    budgetMatch: number
  ): string {
    const matchedSkills = skillMatches.filter(s => s.matchScore > 0.5).length;
    const totalSkills = skillMatches.length;
    
    let reasoning = `Matched ${matchedSkills}/${totalSkills} required skills. `;
    
    if (availabilityMatch > 0.8) {
      reasoning += 'Good availability alignment. ';
    }
    
    if (budgetMatch > 0.8) {
      reasoning += 'Budget requirements met. ';
    }

    const avgCategoryMatch = categoryMatches.reduce((sum, match) => sum + match.relevance, 0) / categoryMatches.length;
    if (avgCategoryMatch > 0.7) {
      reasoning += 'Strong category expertise. ';
    }

    return reasoning.trim();
  }
}