declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, any>) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID!, {
      page_path: url,
    });
  }
};

export const event = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const trackProjectCreated = (projectType: string) => {
  event('project_created', 'engagement', projectType);
};

export const trackFreelancerHired = (category: string) => {
  event('freelancer_hired', 'conversion', category);
};

export const trackSearchPerformed = (query: string, filters: string[]) => {
  event('search', 'engagement', query, filters.length);
};