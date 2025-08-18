/**
 * Themed Profile Wrapper Component
 * Applies custom theming to profile displays
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useProfileBranding } from '@/hooks/useProfileBranding';
import { BrandingTheme, CustomBranding } from '@/lib/profile/branding-service';
import { cn } from '@/lib/utils';

interface ThemedProfileWrapperProps {
  profileId: string;
  children: React.ReactNode;
  previewMode?: boolean;
  previewTheme?: {
    themeId: string;
    customizations?: Partial<BrandingTheme>;
  };
  className?: string;
}

export function ThemedProfileWrapper({
  profileId,
  children,
  previewMode = false,
  previewTheme,
  className
}: ThemedProfileWrapperProps) {
  const [cssInjected, setCssInjected] = useState(false);
  
  const { 
    themeSettings, 
    currentTheme, 
    generateCSS,
    isLoading 
  } = useProfileBranding({
    profileId,
    autoLoad: !previewMode
  });

  // Generate and inject CSS
  useEffect(() => {
    if (isLoading) return;

    let theme: BrandingTheme | null = null;
    let customizations: Partial<BrandingTheme> | undefined = undefined;

    if (previewMode && previewTheme) {
      // Use preview theme data (would need to fetch theme by ID)
      // For now, using current theme as fallback
      theme = currentTheme;
      customizations = previewTheme.customizations;
    } else if (currentTheme && themeSettings) {
      theme = currentTheme;
      customizations = themeSettings.customizations;
    }

    if (!theme) return;

    // Generate CSS
    const css = generateCSS(theme, customizations);
    
    // Inject CSS into document
    const styleId = `profile-theme-${profileId}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
    setCssInjected(true);

    // Cleanup function
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [
    profileId, 
    currentTheme, 
    themeSettings, 
    generateCSS, 
    previewMode, 
    previewTheme, 
    isLoading
  ]);

  // Apply background image if set
  const backgroundImage = themeSettings?.branding?.backgroundImage;
  const backgroundStyle = backgroundImage ? {
    backgroundImage: `url(${backgroundImage.url})`,
    backgroundSize: backgroundImage.position,
    backgroundRepeat: backgroundImage.position === 'repeat' ? 'repeat' : 'no-repeat',
    backgroundPosition: 'center'
  } : {};

  // Apply overlay if background image has one
  const overlayStyle = backgroundImage?.overlay ? {
    position: 'relative' as const,
    '::before': {
      content: '""',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: backgroundImage.overlay,
      zIndex: 1
    }
  } : {};

  if (isLoading || !cssInjected) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Custom branding metadata */}
      {themeSettings?.branding && (
        <ProfileMetadata branding={themeSettings.branding} />
      )}
      
      {/* Themed profile container */}
      <div 
        className={cn(
          'profile-container min-h-screen',
          previewMode && 'preview-mode',
          className
        )}
        style={backgroundStyle}
      >
        {/* Background overlay */}
        {backgroundImage?.overlay && (
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            style={{ backgroundColor: backgroundImage.overlay }}
          />
        )}
        
        {/* Content wrapper */}
        <div className="relative z-20">
          {children}
        </div>

        {/* Watermark */}
        {themeSettings?.branding?.watermark && (
          <ProfileWatermark watermark={themeSettings.branding.watermark} />
        )}

        {/* Preview mode indicator */}
        {previewMode && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Preview Mode
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Profile Metadata Component
 * Injects custom meta tags and favicon
 */
interface ProfileMetadataProps {
  branding: CustomBranding;
}

function ProfileMetadata({ branding }: ProfileMetadataProps) {
  useEffect(() => {
    // Update favicon
    if (branding.favicon) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = branding.favicon;
    }

    // Update meta title
    if (branding.metaTitle) {
      document.title = branding.metaTitle;
    }

    // Update meta description
    if (branding.metaDescription) {
      let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = branding.metaDescription;
    }

    // Update social media meta tags
    if (branding.socialBanner) {
      // Open Graph tags
      updateMetaTag('property', 'og:title', branding.socialBanner.title);
      updateMetaTag('property', 'og:description', branding.socialBanner.description);
      updateMetaTag('property', 'og:image', branding.socialBanner.url);
      
      // Twitter Card tags
      updateMetaTag('name', 'twitter:title', branding.socialBanner.title);
      updateMetaTag('name', 'twitter:description', branding.socialBanner.description);
      updateMetaTag('name', 'twitter:image', branding.socialBanner.url);
    }
  }, [branding]);

  return null;
}

function updateMetaTag(attribute: string, value: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, value);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/**
 * Profile Watermark Component
 */
interface ProfileWatermarkProps {
  watermark: {
    url: string;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
}

function ProfileWatermark({ watermark }: ProfileWatermarkProps) {
  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <div 
      className={cn(
        'fixed z-30 pointer-events-none',
        getPositionClasses(watermark.position)
      )}
      style={{ opacity: watermark.opacity / 100 }}
    >
      <img 
        src={watermark.url} 
        alt="Watermark" 
        className="max-w-32 max-h-32 object-contain"
      />
    </div>
  );
}

/**
 * Theme Preview Component
 * For use in theme selection interfaces
 */
interface ThemePreviewProps {
  theme: BrandingTheme;
  customizations?: Partial<BrandingTheme>;
  className?: string;
}

export function ThemePreview({ 
  theme, 
  customizations, 
  className 
}: ThemePreviewProps) {
  const mergedTheme = { ...theme, ...customizations };

  return (
    <div 
      className={cn(
        'border rounded-lg overflow-hidden',
        className
      )}
      style={{ backgroundColor: mergedTheme.colors.background }}
    >
      {/* Header Preview */}
      <div 
        className="p-4"
        style={{
          backgroundColor: mergedTheme.layout.headerStyle === 'banner' 
            ? mergedTheme.colors.primary 
            : mergedTheme.colors.surface,
          color: mergedTheme.layout.headerStyle === 'banner' 
            ? 'white' 
            : mergedTheme.colors.text
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: mergedTheme.colors.accent }}
          />
          <div>
            <div 
              className="h-3 w-20 rounded mb-1"
              style={{ backgroundColor: 'currentColor', opacity: 0.8 }}
            />
            <div 
              className="h-2 w-16 rounded"
              style={{ backgroundColor: 'currentColor', opacity: 0.6 }}
            />
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="p-4 space-y-3">
        <div 
          className="h-2 w-3/4 rounded"
          style={{ backgroundColor: mergedTheme.colors.text, opacity: 0.7 }}
        />
        <div 
          className="h-2 w-full rounded"
          style={{ backgroundColor: mergedTheme.colors.textSecondary, opacity: 0.5 }}
        />
        <div 
          className="h-2 w-1/2 rounded"
          style={{ backgroundColor: mergedTheme.colors.textSecondary, opacity: 0.5 }}
        />

        {/* Skills Preview */}
        <div className="flex gap-1 mt-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="px-2 py-1 rounded text-xs"
              style={{
                backgroundColor: mergedTheme.colors.accent,
                opacity: 0.8
              }}
            />
          ))}
        </div>

        {/* Card Preview */}
        <div 
          className="p-3 rounded border mt-3"
          style={{
            backgroundColor: mergedTheme.colors.surface,
            borderColor: mergedTheme.colors.border,
            borderRadius: mergedTheme.layout.borderRadius === 'large' ? '12px' : 
                         mergedTheme.layout.borderRadius === 'medium' ? '6px' : '3px'
          }}
        >
          <div 
            className="h-2 w-1/3 rounded mb-2"
            style={{ backgroundColor: mergedTheme.colors.text, opacity: 0.6 }}
          />
          <div 
            className="h-1 w-full rounded"
            style={{ backgroundColor: mergedTheme.colors.textSecondary, opacity: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Theme Preview
 * Compact preview for mobile layouts
 */
export function MobileThemePreview({ theme, customizations, className }: ThemePreviewProps) {
  const mergedTheme = { ...theme, ...customizations };

  return (
    <div 
      className={cn(
        'w-20 h-32 border rounded-lg overflow-hidden',
        className
      )}
      style={{ backgroundColor: mergedTheme.colors.background }}
    >
      <div 
        className="h-6 p-1"
        style={{ backgroundColor: mergedTheme.colors.primary }}
      >
        <div className="w-3 h-3 rounded-full bg-white opacity-80" />
      </div>
      <div className="p-1 space-y-1">
        <div 
          className="h-1 w-3/4 rounded"
          style={{ backgroundColor: mergedTheme.colors.text, opacity: 0.7 }}
        />
        <div 
          className="h-1 w-full rounded"
          style={{ backgroundColor: mergedTheme.colors.textSecondary, opacity: 0.5 }}
        />
        <div 
          className="h-6 rounded border mt-1"
          style={{
            backgroundColor: mergedTheme.colors.surface,
            borderColor: mergedTheme.colors.border
          }}
        />
      </div>
    </div>
  );
}