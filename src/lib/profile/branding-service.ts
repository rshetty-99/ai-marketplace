/**
 * Profile Branding Service
 * Manages custom branding and theme customization for profiles
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface BrandingTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    headingFont?: string;
    fontSize: 'small' | 'medium' | 'large';
    fontWeight: 'light' | 'normal' | 'medium' | 'bold';
    lineHeight: number;
    letterSpacing: number;
  };
  layout: {
    headerStyle: 'minimal' | 'banner' | 'split' | 'centered';
    sectionSpacing: 'compact' | 'normal' | 'spacious';
    borderRadius: 'none' | 'small' | 'medium' | 'large';
    shadowStyle: 'none' | 'subtle' | 'medium' | 'strong';
    contentWidth: 'narrow' | 'medium' | 'wide' | 'full';
  };
  components: {
    cardStyle: 'flat' | 'bordered' | 'shadow' | 'gradient';
    buttonStyle: 'solid' | 'outline' | 'ghost' | 'gradient';
    portfolioGrid: '2-column' | '3-column' | 'masonry' | 'carousel';
    skillsDisplay: 'tags' | 'bars' | 'badges' | 'pills';
  };
  customCss?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomBranding {
  logo?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
  favicon?: string;
  backgroundImage?: {
    url: string;
    overlay?: string;
    position: 'cover' | 'contain' | 'repeat';
  };
  watermark?: {
    url: string;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  socialBanner?: {
    url: string;
    title: string;
    description: string;
  };
  customDomain?: string;
  metaTitle?: string;
  metaDescription?: string;
  contactInfo?: {
    showEmail: boolean;
    showPhone: boolean;
    customMessage: string;
  };
}

export interface ProfileThemeSettings {
  themeId: string;
  customizations: Partial<BrandingTheme>;
  branding: CustomBranding;
  isActive: boolean;
  previewMode: boolean;
  lastModified: Date;
}

export class ProfileBrandingService {
  private static readonly PROFILES_COLLECTION = 'profiles';
  private static readonly THEMES_COLLECTION = 'branding-themes';

  /**
   * Get available themes
   */
  static async getAvailableThemes(): Promise<BrandingTheme[]> {
    // For now, return predefined themes
    // In production, these could be fetched from Firestore
    return this.getDefaultThemes();
  }

  /**
   * Get profile theme settings
   */
  static async getProfileTheme(profileId: string): Promise<ProfileThemeSettings | null> {
    try {
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        return null;
      }

      const data = profileDoc.data();
      return data.themeSettings || this.getDefaultThemeSettings();
    } catch (error) {
      console.error('Error fetching profile theme:', error);
      return null;
    }
  }

  /**
   * Update profile theme
   */
  static async updateProfileTheme(
    profileId: string,
    themeSettings: Partial<ProfileThemeSettings>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      
      const updates = {
        'themeSettings': {
          ...themeSettings,
          lastModified: Timestamp.now()
        },
        'publicProfile.lastModified': Timestamp.now()
      };

      await updateDoc(profileRef, updates);

      return {
        success: true,
        message: 'Theme updated successfully'
      };
    } catch (error) {
      console.error('Error updating profile theme:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update theme'
      };
    }
  }

  /**
   * Apply theme customizations
   */
  static async applyCustomizations(
    profileId: string,
    customizations: Partial<BrandingTheme>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentTheme = await this.getProfileTheme(profileId);
      
      if (!currentTheme) {
        return {
          success: false,
          message: 'Profile theme not found'
        };
      }

      const updatedTheme: ProfileThemeSettings = {
        ...currentTheme,
        customizations: {
          ...currentTheme.customizations,
          ...customizations
        },
        lastModified: new Date()
      };

      return await this.updateProfileTheme(profileId, updatedTheme);
    } catch (error) {
      console.error('Error applying customizations:', error);
      return {
        success: false,
        message: 'Failed to apply customizations'
      };
    }
  }

  /**
   * Update custom branding
   */
  static async updateCustomBranding(
    profileId: string,
    branding: Partial<CustomBranding>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentTheme = await this.getProfileTheme(profileId);
      
      if (!currentTheme) {
        return {
          success: false,
          message: 'Profile theme not found'
        };
      }

      const updatedTheme: ProfileThemeSettings = {
        ...currentTheme,
        branding: {
          ...currentTheme.branding,
          ...branding
        },
        lastModified: new Date()
      };

      return await this.updateProfileTheme(profileId, updatedTheme);
    } catch (error) {
      console.error('Error updating branding:', error);
      return {
        success: false,
        message: 'Failed to update branding'
      };
    }
  }

  /**
   * Generate CSS from theme
   */
  static generateThemeCSS(theme: BrandingTheme, customizations?: Partial<BrandingTheme>): string {
    const mergedTheme = { ...theme, ...customizations };
    
    return `
      :root {
        --profile-primary: ${mergedTheme.colors.primary};
        --profile-secondary: ${mergedTheme.colors.secondary};
        --profile-accent: ${mergedTheme.colors.accent};
        --profile-background: ${mergedTheme.colors.background};
        --profile-surface: ${mergedTheme.colors.surface};
        --profile-text: ${mergedTheme.colors.text};
        --profile-text-secondary: ${mergedTheme.colors.textSecondary};
        --profile-border: ${mergedTheme.colors.border};
        
        --profile-font-family: ${mergedTheme.typography.fontFamily};
        --profile-heading-font: ${mergedTheme.typography.headingFont || mergedTheme.typography.fontFamily};
        --profile-font-size: ${this.getFontSizeValue(mergedTheme.typography.fontSize)};
        --profile-font-weight: ${this.getFontWeightValue(mergedTheme.typography.fontWeight)};
        --profile-line-height: ${mergedTheme.typography.lineHeight};
        --profile-letter-spacing: ${mergedTheme.typography.letterSpacing}px;
        
        --profile-border-radius: ${this.getBorderRadiusValue(mergedTheme.layout.borderRadius)};
        --profile-shadow: ${this.getShadowValue(mergedTheme.layout.shadowStyle)};
        --profile-content-width: ${this.getContentWidthValue(mergedTheme.layout.contentWidth)};
        --profile-section-spacing: ${this.getSectionSpacingValue(mergedTheme.layout.sectionSpacing)};
      }

      .profile-container {
        font-family: var(--profile-font-family);
        font-size: var(--profile-font-size);
        font-weight: var(--profile-font-weight);
        line-height: var(--profile-line-height);
        letter-spacing: var(--profile-letter-spacing);
        color: var(--profile-text);
        background-color: var(--profile-background);
        max-width: var(--profile-content-width);
        margin: 0 auto;
      }

      .profile-header {
        ${this.getHeaderStyles(mergedTheme.layout.headerStyle)}
      }

      .profile-section {
        margin-bottom: var(--profile-section-spacing);
      }

      .profile-card {
        ${this.getCardStyles(mergedTheme.components.cardStyle)}
        background-color: var(--profile-surface);
        border: 1px solid var(--profile-border);
        border-radius: var(--profile-border-radius);
        box-shadow: var(--profile-shadow);
      }

      .profile-button {
        ${this.getButtonStyles(mergedTheme.components.buttonStyle)}
        border-radius: var(--profile-border-radius);
      }

      .profile-skills {
        ${this.getSkillsStyles(mergedTheme.components.skillsDisplay)}
      }

      .profile-portfolio {
        ${this.getPortfolioStyles(mergedTheme.components.portfolioGrid)}
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--profile-heading-font);
        color: var(--profile-text);
      }

      ${mergedTheme.customCss || ''}
    `;
  }

  /**
   * Create theme preview
   */
  static async createThemePreview(
    profileId: string,
    themeId: string,
    customizations?: Partial<BrandingTheme>
  ): Promise<{ previewUrl: string; expiresAt: Date }> {
    try {
      // Generate preview token
      const previewToken = this.generatePreviewToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

      // Store preview settings temporarily
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      await updateDoc(profileRef, {
        'themePreview': {
          token: previewToken,
          themeId,
          customizations,
          expiresAt: Timestamp.fromDate(expiresAt)
        }
      });

      const previewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/preview/theme/${profileId}?token=${previewToken}`;

      return { previewUrl, expiresAt };
    } catch (error) {
      console.error('Error creating theme preview:', error);
      throw error;
    }
  }

  /**
   * Validate theme preview token
   */
  static async validatePreviewToken(profileId: string, token: string): Promise<{
    isValid: boolean;
    themeId?: string;
    customizations?: Partial<BrandingTheme>;
  }> {
    try {
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        return { isValid: false };
      }

      const data = profileDoc.data();
      const preview = data.themePreview;

      if (!preview || preview.token !== token) {
        return { isValid: false };
      }

      const now = new Date();
      const expiresAt = preview.expiresAt.toDate();

      if (now > expiresAt) {
        return { isValid: false };
      }

      return {
        isValid: true,
        themeId: preview.themeId,
        customizations: preview.customizations
      };
    } catch (error) {
      console.error('Error validating preview token:', error);
      return { isValid: false };
    }
  }

  // Private helper methods

  private static getDefaultThemes(): BrandingTheme[] {
    return [
      {
        id: 'modern-minimal',
        name: 'Modern Minimal',
        colors: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#06b6d4',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 'medium',
          fontWeight: 'normal',
          lineHeight: 1.6,
          letterSpacing: 0
        },
        layout: {
          headerStyle: 'minimal',
          sectionSpacing: 'normal',
          borderRadius: 'medium',
          shadowStyle: 'subtle',
          contentWidth: 'medium'
        },
        components: {
          cardStyle: 'bordered',
          buttonStyle: 'solid',
          portfolioGrid: '3-column',
          skillsDisplay: 'tags'
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'creative-bold',
        name: 'Creative Bold',
        colors: {
          primary: '#7c3aed',
          secondary: '#a855f7',
          accent: '#ec4899',
          background: '#fafafa',
          surface: '#ffffff',
          text: '#111827',
          textSecondary: '#6b7280',
          border: '#d1d5db'
        },
        typography: {
          fontFamily: 'Poppins, sans-serif',
          headingFont: 'Playfair Display, serif',
          fontSize: 'large',
          fontWeight: 'medium',
          lineHeight: 1.7,
          letterSpacing: 0.5
        },
        layout: {
          headerStyle: 'banner',
          sectionSpacing: 'spacious',
          borderRadius: 'large',
          shadowStyle: 'medium',
          contentWidth: 'wide'
        },
        components: {
          cardStyle: 'gradient',
          buttonStyle: 'gradient',
          portfolioGrid: 'masonry',
          skillsDisplay: 'pills'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'professional-classic',
        name: 'Professional Classic',
        colors: {
          primary: '#1f2937',
          secondary: '#4b5563',
          accent: '#059669',
          background: '#ffffff',
          surface: '#f9fafb',
          text: '#111827',
          textSecondary: '#6b7280',
          border: '#d1d5db'
        },
        typography: {
          fontFamily: 'Source Sans Pro, sans-serif',
          fontSize: 'medium',
          fontWeight: 'normal',
          lineHeight: 1.5,
          letterSpacing: 0
        },
        layout: {
          headerStyle: 'split',
          sectionSpacing: 'compact',
          borderRadius: 'small',
          shadowStyle: 'none',
          contentWidth: 'narrow'
        },
        components: {
          cardStyle: 'flat',
          buttonStyle: 'outline',
          portfolioGrid: '2-column',
          skillsDisplay: 'bars'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dark-elegant',
        name: 'Dark Elegant',
        colors: {
          primary: '#3b82f6',
          secondary: '#6366f1',
          accent: '#8b5cf6',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          textSecondary: '#94a3b8',
          border: '#334155'
        },
        typography: {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 'medium',
          fontWeight: 'light',
          lineHeight: 1.6,
          letterSpacing: 0.5
        },
        layout: {
          headerStyle: 'centered',
          sectionSpacing: 'normal',
          borderRadius: 'medium',
          shadowStyle: 'strong',
          contentWidth: 'medium'
        },
        components: {
          cardStyle: 'shadow',
          buttonStyle: 'ghost',
          portfolioGrid: 'carousel',
          skillsDisplay: 'badges'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private static getDefaultThemeSettings(): ProfileThemeSettings {
    return {
      themeId: 'modern-minimal',
      customizations: {},
      branding: {},
      isActive: true,
      previewMode: false,
      lastModified: new Date()
    };
  }

  private static getFontSizeValue(size: string): string {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    return sizes[size as keyof typeof sizes] || sizes.medium;
  }

  private static getFontWeightValue(weight: string): string {
    const weights = {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700'
    };
    return weights[weight as keyof typeof weights] || weights.normal;
  }

  private static getBorderRadiusValue(radius: string): string {
    const radii = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '16px'
    };
    return radii[radius as keyof typeof radii] || radii.medium;
  }

  private static getShadowValue(shadow: string): string {
    const shadows = {
      none: 'none',
      subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      strong: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    };
    return shadows[shadow as keyof typeof shadows] || shadows.subtle;
  }

  private static getContentWidthValue(width: string): string {
    const widths = {
      narrow: '720px',
      medium: '1024px',
      wide: '1280px',
      full: '100%'
    };
    return widths[width as keyof typeof widths] || widths.medium;
  }

  private static getSectionSpacingValue(spacing: string): string {
    const spacings = {
      compact: '1.5rem',
      normal: '2.5rem',
      spacious: '4rem'
    };
    return spacings[spacing as keyof typeof spacings] || spacings.normal;
  }

  private static getHeaderStyles(style: string): string {
    const styles = {
      minimal: 'padding: 2rem 0; text-align: left;',
      banner: 'padding: 4rem 0; text-align: center; background: linear-gradient(135deg, var(--profile-primary), var(--profile-secondary));',
      split: 'display: flex; align-items: center; justify-content: space-between; padding: 3rem 0;',
      centered: 'text-align: center; padding: 3rem 0;'
    };
    return styles[style as keyof typeof styles] || styles.minimal;
  }

  private static getCardStyles(style: string): string {
    const styles = {
      flat: 'background: var(--profile-surface);',
      bordered: 'background: var(--profile-surface); border: 1px solid var(--profile-border);',
      shadow: 'background: var(--profile-surface); box-shadow: var(--profile-shadow);',
      gradient: 'background: linear-gradient(135deg, var(--profile-surface), var(--profile-primary)10);'
    };
    return styles[style as keyof typeof styles] || styles.bordered;
  }

  private static getButtonStyles(style: string): string {
    const styles = {
      solid: 'background: var(--profile-primary); color: white; border: none;',
      outline: 'background: transparent; color: var(--profile-primary); border: 2px solid var(--profile-primary);',
      ghost: 'background: transparent; color: var(--profile-primary); border: none;',
      gradient: 'background: linear-gradient(135deg, var(--profile-primary), var(--profile-accent)); color: white; border: none;'
    };
    return styles[style as keyof typeof styles] || styles.solid;
  }

  private static getSkillsStyles(style: string): string {
    const styles = {
      tags: 'display: flex; flex-wrap: wrap; gap: 0.5rem;',
      bars: 'display: flex; flex-direction: column; gap: 1rem;',
      badges: 'display: flex; flex-wrap: wrap; gap: 0.75rem;',
      pills: 'display: flex; flex-wrap: wrap; gap: 0.5rem;'
    };
    return styles[style as keyof typeof styles] || styles.tags;
  }

  private static getPortfolioStyles(style: string): string {
    const styles = {
      '2-column': 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;',
      '3-column': 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;',
      masonry: 'column-count: 3; column-gap: 1.5rem;',
      carousel: 'display: flex; overflow-x: auto; gap: 1.5rem; scroll-snap-type: x mandatory;'
    };
    return styles[style as keyof typeof styles] || styles['3-column'];
  }

  private static generatePreviewToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}