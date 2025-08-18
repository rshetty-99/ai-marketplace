/**
 * Profile Branding Dashboard Component
 * Comprehensive interface for customizing profile themes and branding
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useProfileBranding } from '@/hooks/useProfileBranding';
import { BrandingTheme, CustomBranding } from '@/lib/profile/branding-service';
import { cn } from '@/lib/utils';

import {
  Palette,
  Type,
  Layout,
  Eye,
  Download,
  RefreshCw,
  Settings,
  Image,
  Link,
  Globe,
  Save,
  RotateCcw,
  Copy,
  ExternalLink,
  Zap,
  Sparkles,
  Paintbrush,
  Camera,
  Monitor,
  Smartphone,
  Tablet,
  Check,
  Upload,
  X
} from 'lucide-react';

interface ProfileBrandingDashboardProps {
  profileId: string;
  className?: string;
}

export function ProfileBrandingDashboard({
  profileId,
  className
}: ProfileBrandingDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('themes');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const {
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
    downloadTheme,
    validateCustomizations
  } = useProfileBranding({
    profileId,
    autoLoad: true
  });

  const handleThemeSelect = async (themeId: string) => {
    await applyTheme(themeId);
  };

  const handleColorChange = async (colorKey: string, value: string) => {
    if (!currentTheme) return;

    const customizations = {
      colors: {
        ...currentTheme.colors,
        ...themeSettings?.customizations?.colors,
        [colorKey]: value
      }
    };

    await updateCustomizations(customizations);
  };

  const handleTypographyChange = async (key: string, value: any) => {
    if (!currentTheme) return;

    const customizations = {
      typography: {
        ...currentTheme.typography,
        ...themeSettings?.customizations?.typography,
        [key]: value
      }
    };

    await updateCustomizations(customizations);
  };

  const handleLayoutChange = async (key: string, value: any) => {
    if (!currentTheme) return;

    const customizations = {
      layout: {
        ...currentTheme.layout,
        ...themeSettings?.customizations?.layout,
        [key]: value
      }
    };

    await updateCustomizations(customizations);
  };

  const handleComponentChange = async (key: string, value: any) => {
    if (!currentTheme) return;

    const customizations = {
      components: {
        ...currentTheme.components,
        ...themeSettings?.customizations?.components,
        [key]: value
      }
    };

    await updateCustomizations(customizations);
  };

  const handleBrandingChange = async (key: string, value: any) => {
    const branding = {
      [key]: value
    };

    await updateBranding(branding);
  };

  const handleCreatePreview = async () => {
    const url = await createPreview();
    if (url) {
      setPreviewUrl(url);
      setShowPreviewDialog(true);
    }
  };

  const copyPreviewUrl = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const mergedTheme = currentTheme ? {
    ...currentTheme,
    ...themeSettings?.customizations
  } : null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Branding</h2>
          <p className="text-gray-600">Customize your profile appearance and branding</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleCreatePreview}
            disabled={isGeneratingPreview}
          >
            {isGeneratingPreview ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Preview
          </Button>
          <Button variant="outline" onClick={downloadTheme}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={resetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Current Theme Info */}
      {currentTheme && (
        <Alert>
          <Palette className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Currently using <strong>{currentTheme.name}</strong> theme
              </span>
              <Badge variant="outline">
                {themeSettings?.customizations && Object.keys(themeSettings.customizations).length > 0 
                  ? 'Customized' 
                  : 'Default'
                }
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={themeSettings?.themeId === theme.id}
                onSelect={() => handleThemeSelect(theme.id)}
                isLoading={isSaving}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          {mergedTheme && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Brand Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ColorInput
                    label="Primary"
                    value={mergedTheme.colors.primary}
                    onChange={(value) => handleColorChange('primary', value)}
                  />
                  <ColorInput
                    label="Secondary"
                    value={mergedTheme.colors.secondary}
                    onChange={(value) => handleColorChange('secondary', value)}
                  />
                  <ColorInput
                    label="Accent"
                    value={mergedTheme.colors.accent}
                    onChange={(value) => handleColorChange('accent', value)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Surface Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ColorInput
                    label="Background"
                    value={mergedTheme.colors.background}
                    onChange={(value) => handleColorChange('background', value)}
                  />
                  <ColorInput
                    label="Surface"
                    value={mergedTheme.colors.surface}
                    onChange={(value) => handleColorChange('surface', value)}
                  />
                  <ColorInput
                    label="Border"
                    value={mergedTheme.colors.border}
                    onChange={(value) => handleColorChange('border', value)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ColorInput
                    label="Primary Text"
                    value={mergedTheme.colors.text}
                    onChange={(value) => handleColorChange('text', value)}
                  />
                  <ColorInput
                    label="Secondary Text"
                    value={mergedTheme.colors.textSecondary}
                    onChange={(value) => handleColorChange('textSecondary', value)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Color Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div 
                      className="h-16 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: mergedTheme.colors.primary }}
                    >
                      Primary Color
                    </div>
                    <div className="flex gap-2">
                      <div 
                        className="flex-1 h-8 rounded"
                        style={{ backgroundColor: mergedTheme.colors.secondary }}
                      />
                      <div 
                        className="flex-1 h-8 rounded"
                        style={{ backgroundColor: mergedTheme.colors.accent }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          {mergedTheme && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Font Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Font Family</Label>
                    <Select
                      value={mergedTheme.typography.fontFamily}
                      onValueChange={(value) => handleTypographyChange('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, system-ui, sans-serif">Inter</SelectItem>
                        <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                        <SelectItem value="Source Sans Pro, sans-serif">Source Sans Pro</SelectItem>
                        <SelectItem value="JetBrains Mono, monospace">JetBrains Mono</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Font Size</Label>
                    <Select
                      value={mergedTheme.typography.fontSize}
                      onValueChange={(value) => handleTypographyChange('fontSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Font Weight</Label>
                    <Select
                      value={mergedTheme.typography.fontWeight}
                      onValueChange={(value) => handleTypographyChange('fontWeight', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Typography Spacing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Line Height: {mergedTheme.typography.lineHeight}</Label>
                    <Slider
                      value={[mergedTheme.typography.lineHeight]}
                      onValueChange={([value]) => handleTypographyChange('lineHeight', value)}
                      min={1}
                      max={3}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Letter Spacing: {mergedTheme.typography.letterSpacing}px</Label>
                    <Slider
                      value={[mergedTheme.typography.letterSpacing]}
                      onValueChange={([value]) => handleTypographyChange('letterSpacing', value)}
                      min={-2}
                      max={5}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Typography Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="space-y-4 p-4 border rounded-lg"
                    style={{
                      fontFamily: mergedTheme.typography.fontFamily,
                      lineHeight: mergedTheme.typography.lineHeight,
                      letterSpacing: `${mergedTheme.typography.letterSpacing}px`
                    }}
                  >
                    <h1 className="text-3xl font-bold">Heading 1</h1>
                    <h2 className="text-2xl font-semibold">Heading 2</h2>
                    <h3 className="text-xl font-medium">Heading 3</h3>
                    <p className="text-base">
                      This is a paragraph of body text to demonstrate how your typography settings 
                      will look on your profile. The quick brown fox jumps over the lazy dog.
                    </p>
                    <p className="text-sm text-gray-600">
                      This is smaller secondary text that might be used for captions or metadata.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          {mergedTheme && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Layout Style
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Header Style</Label>
                    <Select
                      value={mergedTheme.layout.headerStyle}
                      onValueChange={(value) => handleLayoutChange('headerStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="banner">Banner</SelectItem>
                        <SelectItem value="split">Split</SelectItem>
                        <SelectItem value="centered">Centered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Content Width</Label>
                    <Select
                      value={mergedTheme.layout.contentWidth}
                      onValueChange={(value) => handleLayoutChange('contentWidth', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="narrow">Narrow</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="wide">Wide</SelectItem>
                        <SelectItem value="full">Full Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Section Spacing</Label>
                    <Select
                      value={mergedTheme.layout.sectionSpacing}
                      onValueChange={(value) => handleLayoutChange('sectionSpacing', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visual Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Border Radius</Label>
                    <Select
                      value={mergedTheme.layout.borderRadius}
                      onValueChange={(value) => handleLayoutChange('borderRadius', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Shadow Style</Label>
                    <Select
                      value={mergedTheme.layout.shadowStyle}
                      onValueChange={(value) => handleLayoutChange('shadowStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="subtle">Subtle</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Component Styles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Card Style</Label>
                    <Select
                      value={mergedTheme.components.cardStyle}
                      onValueChange={(value) => handleComponentChange('cardStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="bordered">Bordered</SelectItem>
                        <SelectItem value="shadow">Shadow</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Button Style</Label>
                    <Select
                      value={mergedTheme.components.buttonStyle}
                      onValueChange={(value) => handleComponentChange('buttonStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                        <SelectItem value="ghost">Ghost</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Portfolio Layout</Label>
                    <Select
                      value={mergedTheme.components.portfolioGrid}
                      onValueChange={(value) => handleComponentChange('portfolioGrid', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2-column">2 Columns</SelectItem>
                        <SelectItem value="3-column">3 Columns</SelectItem>
                        <SelectItem value="masonry">Masonry</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Skills Display</Label>
                    <Select
                      value={mergedTheme.components.skillsDisplay}
                      onValueChange={(value) => handleComponentChange('skillsDisplay', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tags">Tags</SelectItem>
                        <SelectItem value="bars">Progress Bars</SelectItem>
                        <SelectItem value="badges">Badges</SelectItem>
                        <SelectItem value="pills">Pills</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Logo & Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Profile Logo</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-400" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Background Image</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Image className="h-6 w-6 text-gray-400" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Background
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Social Media Banner</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-16 h-10 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <Image className="h-4 w-4 text-gray-400" />
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Banner
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO & Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Custom Domain</Label>
                  <Input 
                    placeholder="your-domain.com" 
                    onChange={(e) => handleBrandingChange('customDomain', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Meta Title</Label>
                  <Input 
                    placeholder="Your Professional Profile" 
                    onChange={(e) => handleBrandingChange('metaTitle', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea 
                    placeholder="Brief description of your services and expertise"
                    onChange={(e) => handleBrandingChange('metaDescription', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Contact Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Show Email</Label>
                  <Switch 
                    onCheckedChange={(checked) => 
                      handleBrandingChange('contactInfo', { showEmail: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Phone</Label>
                  <Switch 
                    onCheckedChange={(checked) => 
                      handleBrandingChange('contactInfo', { showPhone: checked })
                    }
                  />
                </div>

                <div>
                  <Label>Custom Contact Message</Label>
                  <Textarea 
                    placeholder="Let's discuss your project..."
                    onChange={(e) => 
                      handleBrandingChange('contactInfo', { customMessage: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Customization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Custom CSS</Label>
                  <Textarea 
                    placeholder="/* Add your custom CSS here */"
                    className="font-mono text-sm"
                    rows={6}
                    onChange={(e) => handleBrandingChange('customCss', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Advanced users can add custom CSS to further customize their profile
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Theme Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Preview link created. This link will expire in 1 hour.
              </AlertDescription>
            </Alert>
            
            {previewUrl && (
              <div className="flex items-center gap-2">
                <Input value={previewUrl} readOnly className="flex-1" />
                <Button variant="outline" size="sm" onClick={copyPreviewUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(previewUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Monitor className="h-4 w-4" />
              <span>Desktop</span>
              <Separator orientation="vertical" className="h-4" />
              <Tablet className="h-4 w-4" />
              <span>Tablet</span>
              <Separator orientation="vertical" className="h-4" />
              <Smartphone className="h-4 w-4" />
              <span>Mobile</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components

interface ThemeCardProps {
  theme: BrandingTheme;
  isSelected: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

function ThemeCard({ theme, isSelected, onSelect, isLoading }: ThemeCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{theme.name}</h3>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
            {theme.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
          </div>
          
          {/* Color Palette Preview */}
          <div className="flex gap-1">
            <div 
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div 
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <div 
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: theme.colors.accent }}
            />
          </div>

          {/* Theme Preview */}
          <div 
            className="h-24 rounded border p-2 text-xs"
            style={{ 
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily
            }}
          >
            <div 
              className="h-3 rounded mb-2"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div 
              className="h-2 rounded mb-1 w-3/4"
              style={{ backgroundColor: theme.colors.surface }}
            />
            <div 
              className="h-2 rounded w-1/2"
              style={{ backgroundColor: theme.colors.surface }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Label className="text-sm">{label}</Label>
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1"
        />
      </div>
      <div className="flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border cursor-pointer"
        />
      </div>
    </div>
  );
}