'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Palette, Upload, Eye, Globe, Smartphone, Monitor, 
  Image, Type, CheckCircle, AlertCircle, Download,
  Brush, Layout, Settings, Crown, Star
} from 'lucide-react';
import { VendorCompanyOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface WhiteLabelSetupStepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const BRAND_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

const FONT_OPTIONS = [
  { name: 'Inter', value: 'Inter, sans-serif', preview: 'Modern and clean' },
  { name: 'Roboto', value: 'Roboto, sans-serif', preview: 'Professional and readable' },
  { name: 'Poppins', value: 'Poppins, sans-serif', preview: 'Friendly and approachable' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif', preview: 'Versatile and neutral' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif', preview: 'Corporate and reliable' },
  { name: 'Lato', value: 'Lato, sans-serif', preview: 'Elegant and sophisticated' },
];

const LAYOUT_THEMES = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and focused design',
    preview: 'Simple layout with lots of white space'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional business theme',
    preview: 'Traditional layout with formal styling'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary and dynamic',
    preview: 'Bold design with gradients and animations'
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Technology-focused aesthetic',
    preview: 'Dark theme with accent colors'
  }
];

export function WhiteLabelSetupStep({ data, onUpdate, onNext, onPrevious, isSubmitting }: WhiteLabelSetupStepProps) {
  const { trackEvent } = useAnalytics();
  const [enableWhiteLabel, setEnableWhiteLabel] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const [customColors, setCustomColors] = useState({
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#10B981'
  });
  const [customFont, setCustomFont] = useState('Inter, sans-serif');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const whiteLabelSetup = data.whiteLabelSetup || {};

  useEffect(() => {
    trackEvent('vendor_onboarding_step_viewed', {
      step: 'white_label_setup',
      stepNumber: 7
    });

    // Initialize with existing data
    if (whiteLabelSetup.enabled !== undefined) {
      setEnableWhiteLabel(whiteLabelSetup.enabled);
    }
    if (whiteLabelSetup.theme) {
      setSelectedTheme(whiteLabelSetup.theme);
    }
    if (whiteLabelSetup.customization?.colors) {
      setCustomColors(whiteLabelSetup.customization.colors);
    }
    if (whiteLabelSetup.customization?.font) {
      setCustomFont(whiteLabelSetup.customization.font);
    }
  }, [trackEvent, whiteLabelSetup]);

  const handleEnableToggle = (enabled: boolean) => {
    setEnableWhiteLabel(enabled);
    updateData({ enabled });

    trackEvent('vendor_white_label_toggled', {
      enabled,
      theme: selectedTheme
    });
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    updateData({
      theme,
      customization: {
        ...whiteLabelSetup.customization,
        theme
      }
    });

    trackEvent('vendor_white_label_theme_changed', {
      theme,
      enabled: enableWhiteLabel
    });
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', color: string) => {
    const newColors = { ...customColors, [colorType]: color };
    setCustomColors(newColors);
    updateData({
      customization: {
        ...whiteLabelSetup.customization,
        colors: newColors
      }
    });
  };

  const handleFontChange = (font: string) => {
    setCustomFont(font);
    updateData({
      customization: {
        ...whiteLabelSetup.customization,
        font
      }
    });
  };

  const updateData = (updates: Partial<VendorCompanyOnboarding['whiteLabelSetup']>) => {
    onUpdate({
      ...data,
      whiteLabelSetup: {
        ...whiteLabelSetup,
        ...updates,
        lastUpdated: new Date()
      }
    });
  };

  const handleNext = () => {
    trackEvent('vendor_onboarding_step_completed', {
      step: 'white_label_setup',
      stepNumber: 7,
      whiteLabelEnabled: enableWhiteLabel,
      selectedTheme,
      hasCustomColors: customColors.primary !== '#3B82F6'
    });

    onNext();
  };

  const getPreviewIcon = () => {
    switch (previewMode) {
      case 'tablet': return <Smartphone className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Palette className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-medium">White-Label Setup</h3>
          <p className="text-sm text-muted-foreground">
            Customize the branding and appearance of your client portals (Optional)
          </p>
        </div>
      </div>

      {/* Enable White-Label */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-600" />
                White-Label Branding
              </CardTitle>
              <CardDescription>
                Customize the appearance of client-facing interfaces with your brand
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Premium Feature
              </Badge>
              <Switch
                checked={enableWhiteLabel}
                onCheckedChange={handleEnableToggle}
              />
            </div>
          </div>
        </CardHeader>
        
        {enableWhiteLabel && (
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Choose Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select a base theme for your white-label interface
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LAYOUT_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTheme === theme.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{theme.name}</h3>
                      {selectedTheme === theme.id && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{theme.description}</p>
                    <p className="text-xs text-muted-foreground italic">{theme.preview}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Brand Assets */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Brand Assets</Label>
                <p className="text-sm text-muted-foreground">
                  Upload your logo and favicon for consistent branding
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Company Logo</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your logo (PNG, SVG recommended)
                    </p>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: 200x60px, transparent background
                    </p>
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-3">
                  <Label>Favicon</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Globe className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload favicon (ICO, PNG)
                    </p>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Favicon
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      32x32px or 16x16px
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Color Customization */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Brand Colors</Label>
                <p className="text-sm text-muted-foreground">
                  Customize the color scheme to match your brand
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['primary', 'secondary', 'accent'] as const).map((colorType) => (
                  <div key={colorType} className="space-y-3">
                    <Label className="capitalize">{colorType} Color</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div 
                          className="w-12 h-10 rounded border cursor-pointer"
                          style={{ backgroundColor: customColors[colorType] }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'color';
                            input.value = customColors[colorType];
                            input.onchange = (e) => {
                              handleColorChange(colorType, (e.target as HTMLInputElement).value);
                            };
                            input.click();
                          }}
                        />
                        <Input
                          value={customColors[colorType]}
                          onChange={(e) => handleColorChange(colorType, e.target.value)}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {BRAND_COLORS.map((color) => (
                          <button
                            key={color.value}
                            className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                            style={{ backgroundColor: color.value }}
                            onClick={() => handleColorChange(colorType, color.value)}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Typography */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Typography</Label>
                <p className="text-sm text-muted-foreground">
                  Select the font family for your interface
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FONT_OPTIONS.map((font) => (
                  <div
                    key={font.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      customFont === font.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleFontChange(font.value)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium" style={{ fontFamily: font.value }}>
                        {font.name}
                      </h3>
                      {customFont === font.value && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: font.value }}>
                      {font.preview}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Preview</Label>
                  <p className="text-sm text-muted-foreground">
                    See how your customizations will look
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/20">
                <div 
                  className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${
                    previewMode === 'desktop' ? 'max-w-4xl' :
                    previewMode === 'tablet' ? 'max-w-md' : 'max-w-xs'
                  }`}
                  style={{
                    fontFamily: customFont,
                    '--primary-color': customColors.primary,
                    '--secondary-color': customColors.secondary,
                    '--accent-color': customColors.accent
                  } as React.CSSProperties}
                >
                  {/* Mock Header */}
                  <div 
                    className="h-16 flex items-center justify-between px-6"
                    style={{ backgroundColor: customColors.primary }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">L</span>
                      </div>
                      <span className="text-white font-medium">Your Company</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white/20 rounded"></div>
                      <div className="w-6 h-6 bg-white/20 rounded"></div>
                    </div>
                  </div>

                  {/* Mock Content */}
                  <div className="p-6">
                    <h1 className="text-xl font-bold mb-2" style={{ color: customColors.primary }}>
                      Welcome to Your AI Dashboard
                    </h1>
                    <p className="text-muted-foreground mb-4">
                      Manage your AI services and analytics from this custom-branded interface.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded mb-2" style={{ backgroundColor: customColors.secondary }}></div>
                        <div className="h-4 bg-muted rounded mb-1"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded mb-2" style={{ backgroundColor: customColors.accent }}></div>
                        <div className="h-4 bg-muted rounded mb-1"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </div>

                    <button 
                      className="px-4 py-2 rounded text-white font-medium"
                      style={{ backgroundColor: customColors.primary }}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Domain */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="w-4 h-4" />
                  Custom Domain (Optional)
                </CardTitle>
                <CardDescription>
                  Use your own domain for client portals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <Input
                    id="customDomain"
                    placeholder="portal.yourcompany.com"
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll need to configure DNS settings after setup
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">SSL certificate will be automatically provisioned</span>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        )}

        {!enableWhiteLabel && (
          <CardContent>
            <div className="text-center py-8">
              <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">White-Label Branding Disabled</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable white-label branding to customize client-facing interfaces with your brand
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Custom logo and colors
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Branded client portals
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Custom domain support
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Step 7 of 8 • White-label branding {enableWhiteLabel ? 'enabled' : 'optional'}
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}