// Onboarding Analytics Tracking
// Comprehensive analytics system for onboarding workflows

export interface OnboardingAnalyticsEvent {
  eventName: string;
  userId: string;
  userType: 'freelancer' | 'vendor' | 'customer';
  sessionId: string;
  timestamp: Date;
  properties: Record<string, any>;
}

export interface OnboardingMetrics {
  // Funnel metrics
  started: number;
  stepCompletions: Record<string, number>;
  completed: number;
  abandoned: number;
  
  // Performance metrics
  averageCompletionTime: number;
  dropoffRates: Record<string, number>;
  conversionRate: number;
  
  // Quality metrics
  validationErrors: Record<string, number>;
  retryRates: Record<string, number>;
  skipRates: Record<string, number>;
  
  // User behavior
  timePerStep: Record<string, number>;
  backNavigations: number;
  helpUsage: Record<string, number>;
}

export class OnboardingAnalytics {
  private userId: string;
  private userType: 'freelancer' | 'vendor' | 'customer';
  private sessionId: string;
  private startTime: Date;
  private currentStep: number;
  private stepStartTime: Date;

  constructor(userId: string, userType: 'freelancer' | 'vendor' | 'customer') {
    this.userId = userId;
    this.userType = userType;
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.currentStep = 0;
    this.stepStartTime = new Date();
  }

  // Core tracking methods
  trackOnboardingStarted(source: string = 'direct', campaign?: string) {
    this.track('onboarding_started', {
      source,
      campaign,
      user_type: this.userType,
      timestamp: this.startTime
    });
  }

  trackStepStarted(stepNumber: number, stepName: string) {
    this.currentStep = stepNumber;
    this.stepStartTime = new Date();
    
    this.track('onboarding_step_started', {
      step_number: stepNumber,
      step_name: stepName,
      user_type: this.userType
    });
  }

  trackStepCompleted(stepNumber: number, stepName: string, data?: any) {
    const stepDuration = Date.now() - this.stepStartTime.getTime();
    
    this.track('onboarding_step_completed', {
      step_number: stepNumber,
      step_name: stepName,
      user_type: this.userType,
      step_duration_ms: stepDuration,
      step_duration_seconds: Math.round(stepDuration / 1000),
      step_data: data ? this.sanitizeData(data) : undefined
    });
  }

  trackStepSkipped(stepNumber: number, stepName: string, reason?: string) {
    this.track('onboarding_step_skipped', {
      step_number: stepNumber,
      step_name: stepName,
      user_type: this.userType,
      skip_reason: reason
    });
  }

  trackValidationError(stepNumber: number, fieldName: string, errorType: string, errorMessage: string) {
    this.track('onboarding_validation_error', {
      step_number: stepNumber,
      field_name: fieldName,
      error_type: errorType,
      error_message: errorMessage,
      user_type: this.userType
    });
  }

  trackFormRetry(stepNumber: number, stepName: string, attemptCount: number) {
    this.track('onboarding_form_retry', {
      step_number: stepNumber,
      step_name: stepName,
      attempt_count: attemptCount,
      user_type: this.userType
    });
  }

  trackBackNavigation(fromStep: number, toStep: number) {
    this.track('onboarding_back_navigation', {
      from_step: fromStep,
      to_step: toStep,
      user_type: this.userType
    });
  }

  trackHelpUsage(stepNumber: number, helpType: 'tooltip' | 'modal' | 'external_link', helpContent: string) {
    this.track('onboarding_help_used', {
      step_number: stepNumber,
      help_type: helpType,
      help_content: helpContent,
      user_type: this.userType
    });
  }

  trackOnboardingCompleted(totalSteps: number, completedSteps: number) {
    const totalDuration = Date.now() - this.startTime.getTime();
    
    this.track('onboarding_completed', {
      user_type: this.userType,
      total_steps: totalSteps,
      completed_steps: completedSteps,
      completion_rate: (completedSteps / totalSteps) * 100,
      total_duration_ms: totalDuration,
      total_duration_minutes: Math.round(totalDuration / 60000),
      session_id: this.sessionId
    });
  }

  trackOnboardingAbandoned(currentStep: number, totalSteps: number, reason?: string) {
    const totalDuration = Date.now() - this.startTime.getTime();
    
    this.track('onboarding_abandoned', {
      user_type: this.userType,
      current_step: currentStep,
      total_steps: totalSteps,
      abandonment_point: (currentStep / totalSteps) * 100,
      total_duration_ms: totalDuration,
      abandonment_reason: reason,
      session_id: this.sessionId
    });
  }

  // Specialized tracking for different user types
  trackFreelancerSpecific(event: string, properties: Record<string, any>) {
    if (this.userType !== 'freelancer') return;
    
    const freelancerEvents = {
      skill_added: (skill: string, category: string) => ({
        skill_name: skill,
        skill_category: category
      }),
      portfolio_project_added: (projectTitle: string, technologies: string[]) => ({
        project_title: projectTitle,
        technologies: technologies,
        tech_count: technologies.length
      }),
      hourly_rate_set: (rate: number) => ({
        hourly_rate: rate,
        rate_tier: this.categorizeRate(rate)
      }),
      verification_started: (verificationType: 'identity' | 'skills' | 'background') => ({
        verification_type: verificationType
      })
    };

    if (event in freelancerEvents) {
      this.track(`freelancer_${event}`, {
        ...properties,
        user_type: 'freelancer'
      });
    }
  }

  trackVendorSpecific(event: string, properties: Record<string, any>) {
    if (this.userType !== 'vendor') return;
    
    const vendorEvents = {
      service_added: (serviceName: string, category: string, pricingModel: string) => ({
        service_name: serviceName,
        service_category: category,
        pricing_model: pricingModel
      }),
      employee_added: (role: string, department: string) => ({
        employee_role: role,
        department: department
      }),
      compliance_doc_uploaded: (docType: string) => ({
        document_type: docType
      })
    };

    if (event in vendorEvents) {
      this.track(`vendor_${event}`, {
        ...properties,
        user_type: 'vendor'
      });
    }
  }

  trackCustomerSpecific(event: string, properties: Record<string, any>) {
    if (this.userType !== 'customer') return;
    
    const customerEvents = {
      project_requirement_defined: (projectType: string, budget: number) => ({
        project_type: projectType,
        budget_range: this.categorizeBudget(budget)
      }),
      team_member_added: (role: string) => ({
        team_member_role: role
      }),
      integration_selected: (integrationType: string) => ({
        integration_type: integrationType
      })
    };

    if (event in customerEvents) {
      this.track(`customer_${event}`, {
        ...properties,
        user_type: 'customer'
      });
    }
  }

  // A/B Testing support
  trackExperiment(experimentName: string, variant: string, stepNumber?: number) {
    this.track('onboarding_experiment', {
      experiment_name: experimentName,
      variant: variant,
      step_number: stepNumber,
      user_type: this.userType
    });
  }

  // Performance tracking
  trackPerformanceMetric(metricName: string, value: number, unit: string) {
    this.track('onboarding_performance', {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
      user_type: this.userType,
      step_number: this.currentStep
    });
  }

  // Error tracking
  trackError(error: Error, context?: string) {
    this.track('onboarding_error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Limit stack trace size
      context: context,
      user_type: this.userType,
      step_number: this.currentStep
    });
  }

  // Utility methods
  private track(eventName: string, properties: Record<string, any>) {
    const event: OnboardingAnalyticsEvent = {
      eventName,
      userId: this.userId,
      userType: this.userType,
      sessionId: this.sessionId,
      timestamp: new Date(),
      properties: {
        ...properties,
        session_id: this.sessionId,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        referrer: typeof document !== 'undefined' ? document.referrer : 'server'
      }
    };

    // Send to multiple analytics providers
    this.sendToAnalyticsProviders(event);
  }

  private sendToAnalyticsProviders(event: OnboardingAnalyticsEvent) {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.eventName, {
        user_id: event.userId,
        custom_parameters: event.properties
      });
    }

    // Mixpanel
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.track(event.eventName, {
        distinct_id: event.userId,
        ...event.properties
      });
    }

    // PostHog
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(event.eventName, {
        distinct_id: event.userId,
        ...event.properties
      });
    }

    // Custom Analytics API
    this.sendToCustomAPI(event);
  }

  private async sendToCustomAPI(event: OnboardingAnalyticsEvent) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private generateSessionId(): string {
    return `onb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeData(data: any): any {
    const sanitized = { ...data };
    
    // Remove sensitive information
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    // Limit string lengths to prevent large payloads
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...';
      }
    });

    return sanitized;
  }

  private categorizeRate(rate: number): string {
    if (rate < 25) return 'low';
    if (rate < 75) return 'medium';
    if (rate < 150) return 'high';
    return 'premium';
  }

  private categorizeBudget(budget: number): string {
    if (budget < 5000) return 'small';
    if (budget < 25000) return 'medium';
    if (budget < 100000) return 'large';
    return 'enterprise';
  }
}

// Analytics helper functions
export const createOnboardingAnalytics = (
  userId: string, 
  userType: 'freelancer' | 'vendor' | 'customer'
): OnboardingAnalytics => {
  return new OnboardingAnalytics(userId, userType);
};

export const trackConversionFunnel = (
  events: OnboardingAnalyticsEvent[]
): OnboardingMetrics => {
  const metrics: OnboardingMetrics = {
    started: 0,
    stepCompletions: {},
    completed: 0,
    abandoned: 0,
    averageCompletionTime: 0,
    dropoffRates: {},
    conversionRate: 0,
    validationErrors: {},
    retryRates: {},
    skipRates: {},
    timePerStep: {},
    backNavigations: 0,
    helpUsage: {}
  };

  // Calculate funnel metrics
  const startedEvents = events.filter(e => e.eventName === 'onboarding_started');
  const completedEvents = events.filter(e => e.eventName === 'onboarding_completed');
  const abandonedEvents = events.filter(e => e.eventName === 'onboarding_abandoned');

  metrics.started = startedEvents.length;
  metrics.completed = completedEvents.length;
  metrics.abandoned = abandonedEvents.length;
  metrics.conversionRate = metrics.started > 0 ? (metrics.completed / metrics.started) * 100 : 0;

  // Calculate step-specific metrics
  const stepEvents = events.filter(e => 
    e.eventName === 'onboarding_step_completed' || 
    e.eventName === 'onboarding_step_skipped'
  );

  stepEvents.forEach(event => {
    const stepName = event.properties.step_name;
    if (event.eventName === 'onboarding_step_completed') {
      metrics.stepCompletions[stepName] = (metrics.stepCompletions[stepName] || 0) + 1;
      if (event.properties.step_duration_seconds) {
        metrics.timePerStep[stepName] = (metrics.timePerStep[stepName] || 0) + event.properties.step_duration_seconds;
      }
    } else if (event.eventName === 'onboarding_step_skipped') {
      metrics.skipRates[stepName] = (metrics.skipRates[stepName] || 0) + 1;
    }
  });

  // Calculate average completion time
  const completionTimes = completedEvents
    .map(e => e.properties.total_duration_minutes)
    .filter(time => typeof time === 'number');
  
  if (completionTimes.length > 0) {
    metrics.averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  }

  return metrics;
};

// Global analytics instance
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    mixpanel: {
      track: (event: string, properties: Record<string, any>) => void;
    };
    posthog: {
      capture: (event: string, properties: Record<string, any>) => void;
    };
  }
}

export default OnboardingAnalytics;