/**
 * React Hook for Profile Branding
 * Manages theme customization and branding settings
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ProfileBrandingService,
  BrandingTheme,
  CustomBranding,
  ProfileThemeSettings
} from '@/lib/profile/branding-service';
import { useToast } from '@/hooks/use-toast';

interface UseProfileBrandingProps {
  profileId: string;
  autoLoad?: boolean;
}

interface UseProfileBrandingReturn {
  // Current settings
  themeSettings: ProfileThemeSettings | null;
  availableThemes: BrandingTheme[];
  currentTheme: BrandingTheme | null;
  generatedCSS: string;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isGeneratingPreview: boolean;
  
  // Theme management
  applyTheme: (themeId: string) => Promise<boolean>;
  updateCustomizations: (customizations: Partial<BrandingTheme>) => Promise<boolean>;
  updateBranding: (branding: Partial<CustomBranding>) => Promise<boolean>;
  resetToDefault: () => Promise<boolean>;
  
  // Preview functionality
  createPreview: (themeId?: string, customizations?: Partial<BrandingTheme>) => Promise<string | null>;
  enablePreviewMode: () => void;
  disablePreviewMode: () => Promise<boolean>;
  
  // CSS generation
  generateCSS: (theme?: BrandingTheme, customizations?: Partial<BrandingTheme>) => string;
  downloadTheme: () => void;
  
  // Utilities
  refreshSettings: () => Promise<void>;
  validateCustomizations: (customizations: Partial<BrandingTheme>) => string[];
}

export function useProfileBranding({
  profileId,
  autoLoad = true
}: UseProfileBrandingProps): UseProfileBrandingReturn {
  const { toast } = useToast();
  const [themeSettings, setThemeSettings] = useState<ProfileThemeSettings | null>(null);
  const [availableThemes, setAvailableThemes] = useState<BrandingTheme[]>([]);
  const [currentTheme, setCurrentTheme] = useState<BrandingTheme | null>(null);
  const [generatedCSS, setGeneratedCSS] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Load available themes
  const loadAvailableThemes = useCallback(async () => {
    try {
      const themes = await ProfileBrandingService.getAvailableThemes();
      setAvailableThemes(themes);
      return themes;
    } catch (error) {
      console.error('Error loading themes:', error);
      toast({
        title: 'Failed to load themes',
        description: 'Unable to load available themes. Please try again.',
        variant: 'destructive'
      });
      return [];
    }
  }, [toast]);

  // Load profile theme settings
  const loadThemeSettings = useCallback(async () => {
    try {
      const settings = await ProfileBrandingService.getProfileTheme(profileId);
      setThemeSettings(settings);
      return settings;
    } catch (error) {
      console.error('Error loading theme settings:', error);
      toast({
        title: 'Failed to load theme',
        description: 'Unable to load your theme settings. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  }, [profileId, toast]);

  // Apply theme
  const applyTheme = useCallback(async (themeId: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      const theme = availableThemes.find(t => t.id === themeId);
      if (!theme) {
        toast({
          title: 'Theme not found',
          description: 'The selected theme could not be found.',
          variant: 'destructive'
        });
        return false;
      }

      const result = await ProfileBrandingService.updateProfileTheme(profileId, {
        themeId,
        customizations: {},
        isActive: true,
        previewMode: false
      });

      if (result.success) {
        await refreshSettings();
        toast({
          title: 'Theme applied',
          description: 'Your profile theme has been updated successfully.'
        });
        return true;
      } else {
        toast({
          title: 'Failed to apply theme',
          description: result.message,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply theme. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profileId, availableThemes, toast]);

  // Update customizations
  const updateCustomizations = useCallback(async (customizations: Partial<BrandingTheme>): Promise<boolean> => {
    setIsSaving(true);
    try {
      // Validate customizations
      const validationErrors = validateCustomizations(customizations);
      if (validationErrors.length > 0) {
        toast({
          title: 'Invalid customizations',
          description: validationErrors[0],
          variant: 'destructive'
        });
        return false;
      }

      const result = await ProfileBrandingService.applyCustomizations(profileId, customizations);

      if (result.success) {
        await refreshSettings();
        toast({
          title: 'Customizations saved',
          description: 'Your theme customizations have been saved.'
        });
        return true;
      } else {
        toast({
          title: 'Failed to save customizations',
          description: result.message,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating customizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to save customizations. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profileId, toast]);

  // Update branding
  const updateBranding = useCallback(async (branding: Partial<CustomBranding>): Promise<boolean> => {
    setIsSaving(true);
    try {
      const result = await ProfileBrandingService.updateCustomBranding(profileId, branding);

      if (result.success) {
        await refreshSettings();
        toast({
          title: 'Branding updated',
          description: 'Your custom branding has been saved.'
        });
        return true;
      } else {
        toast({
          title: 'Failed to update branding',
          description: result.message,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating branding:', error);
      toast({
        title: 'Error',
        description: 'Failed to update branding. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profileId, toast]);

  // Reset to default
  const resetToDefault = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const defaultTheme = availableThemes.find(t => t.isDefault);
      if (!defaultTheme) {
        toast({
          title: 'Default theme not found',
          description: 'Could not find the default theme.',
          variant: 'destructive'
        });
        return false;
      }

      const result = await ProfileBrandingService.updateProfileTheme(profileId, {
        themeId: defaultTheme.id,
        customizations: {},
        branding: {},
        isActive: true,
        previewMode: false
      });

      if (result.success) {
        await refreshSettings();
        toast({
          title: 'Theme reset',
          description: 'Your theme has been reset to default.'
        });
        return true;
      } else {
        toast({
          title: 'Failed to reset theme',
          description: result.message,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error resetting theme:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset theme. Please try again.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profileId, availableThemes, toast]);

  // Create preview
  const createPreview = useCallback(async (
    themeId?: string,
    customizations?: Partial<BrandingTheme>
  ): Promise<string | null> => {
    setIsGeneratingPreview(true);
    try {
      const targetThemeId = themeId || themeSettings?.themeId || 'modern-minimal';
      const preview = await ProfileBrandingService.createThemePreview(
        profileId,
        targetThemeId,
        customizations
      );

      toast({
        title: 'Preview created',
        description: 'Theme preview link has been generated.'
      });

      return preview.previewUrl;
    } catch (error) {
      console.error('Error creating preview:', error);
      toast({
        title: 'Preview failed',
        description: 'Failed to create theme preview. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [profileId, themeSettings, toast]);

  // Enable preview mode
  const enablePreviewMode = useCallback(() => {
    if (themeSettings) {
      setThemeSettings({
        ...themeSettings,
        previewMode: true
      });
    }
  }, [themeSettings]);

  // Disable preview mode
  const disablePreviewMode = useCallback(async (): Promise<boolean> => {
    if (!themeSettings) return false;

    try {
      const result = await ProfileBrandingService.updateProfileTheme(profileId, {
        ...themeSettings,
        previewMode: false
      });

      if (result.success) {
        await refreshSettings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error disabling preview mode:', error);
      return false;
    }
  }, [profileId, themeSettings]);

  // Generate CSS
  const generateCSS = useCallback((
    theme?: BrandingTheme,
    customizations?: Partial<BrandingTheme>
  ): string => {
    const targetTheme = theme || currentTheme;
    if (!targetTheme) return '';

    const css = ProfileBrandingService.generateThemeCSS(targetTheme, customizations);
    return css;
  }, [currentTheme]);

  // Download theme
  const downloadTheme = useCallback(() => {
    if (!currentTheme || !themeSettings) return;

    const themeData = {
      theme: currentTheme,
      customizations: themeSettings.customizations,
      branding: themeSettings.branding,
      css: generatedCSS
    };

    const blob = new Blob([JSON.stringify(themeData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile-theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Theme downloaded',
      description: 'Your theme configuration has been downloaded.'
    });
  }, [currentTheme, themeSettings, generatedCSS, toast]);

  // Validate customizations
  const validateCustomizations = useCallback((customizations: Partial<BrandingTheme>): string[] => {
    const errors: string[] = [];

    // Validate colors
    if (customizations.colors) {
      Object.entries(customizations.colors).forEach(([key, value]) => {
        if (value && !isValidColor(value)) {
          errors.push(`Invalid color value for ${key}: ${value}`);
        }
      });
    }

    // Validate typography
    if (customizations.typography) {
      if (customizations.typography.lineHeight && 
          (customizations.typography.lineHeight < 1 || customizations.typography.lineHeight > 3)) {
        errors.push('Line height must be between 1 and 3');
      }

      if (customizations.typography.letterSpacing && 
          (customizations.typography.letterSpacing < -2 || customizations.typography.letterSpacing > 5)) {
        errors.push('Letter spacing must be between -2px and 5px');
      }
    }

    return errors;
  }, []);

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [themes, settings] = await Promise.all([
        loadAvailableThemes(),
        loadThemeSettings()
      ]);

      if (settings && themes.length > 0) {
        const theme = themes.find(t => t.id === settings.themeId);
        setCurrentTheme(theme || themes[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadAvailableThemes, loadThemeSettings]);

  // Update generated CSS when theme or settings change
  useEffect(() => {
    if (currentTheme && themeSettings) {
      const css = generateCSS(currentTheme, themeSettings.customizations);
      setGeneratedCSS(css);
    }
  }, [currentTheme, themeSettings, generateCSS]);

  // Initial load
  useEffect(() => {
    if (autoLoad && profileId) {
      refreshSettings();
    }
  }, [autoLoad, profileId, refreshSettings]);

  return {
    themeSettings,
    availableThemes,
    currentTheme,
    generatedCSS,
    isLoading,
    isSaving,
    isGeneratingPreview,
    applyTheme,
    updateCustomizations,
    updateBranding,
    resetToDefault,
    createPreview,
    enablePreviewMode,
    disablePreviewMode,
    generateCSS,
    downloadTheme,
    refreshSettings,
    validateCustomizations
  };
}

// Helper function to validate color values
function isValidColor(color: string): boolean {
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }

  // Check for rgb/rgba colors
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  // Check for hsl/hsla colors
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+)?\s*\)$/.test(color)) {
    return true;
  }

  // Check for named colors (basic validation)
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'grey', 'transparent'
  ];
  
  return namedColors.includes(color.toLowerCase());
}

/**
 * Hook for theme preview functionality
 */
export function useThemePreview(profileId: string, token: string) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<{
    themeId: string;
    customizations?: Partial<BrandingTheme>;
  } | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const result = await ProfileBrandingService.validatePreviewToken(profileId, token);
        setIsValid(result.isValid);
        
        if (result.isValid) {
          setPreviewData({
            themeId: result.themeId!,
            customizations: result.customizations
          });
        }
      } catch (error) {
        console.error('Error validating preview token:', error);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (profileId && token) {
      validateToken();
    }
  }, [profileId, token]);

  return {
    isValid,
    isLoading,
    previewData
  };
}