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
import { Progress } from '@/components/ui/progress';
import { 
  Key, Code, Globe, Shield, Zap, Copy, Eye, EyeOff,
  CheckCircle, AlertCircle, Settings, Lock, Unlock,
  Clock, TrendingUp, Users, Database, ExternalLink,
  Terminal, Book, Download, RefreshCw
} from 'lucide-react';
import { VendorCompanyOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface APIAccessStepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const RATE_LIMIT_OPTIONS = [
  { value: '100', label: '100 requests/minute', tier: 'starter' },
  { value: '500', label: '500 requests/minute', tier: 'professional' },
  { value: '1000', label: '1,000 requests/minute', tier: 'business' },
  { value: '5000', label: '5,000 requests/minute', tier: 'enterprise' },
  { value: 'unlimited', label: 'Unlimited', tier: 'enterprise' },
];

const ENDPOINT_TYPES = [
  {
    id: 'rest',
    name: 'REST API',
    description: 'Standard HTTP REST endpoints',
    icon: <Globe className="w-4 h-4" />,
    enabled: true
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    description: 'Flexible GraphQL endpoint',
    icon: <Database className="w-4 h-4" />,
    enabled: false
  },
  {
    id: 'websocket',
    name: 'WebSocket',
    description: 'Real-time bidirectional communication',
    icon: <Zap className="w-4 h-4" />,
    enabled: false
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    description: 'Event-driven HTTP callbacks',
    icon: <RefreshCw className="w-4 h-4" />,
    enabled: true
  }
];

const AUTHENTICATION_METHODS = [
  {
    id: 'api_key',
    name: 'API Key',
    description: 'Simple API key authentication',
    security: 'medium',
    recommended: true
  },
  {
    id: 'oauth2',
    name: 'OAuth 2.0',
    description: 'Industry standard OAuth 2.0',
    security: 'high',
    recommended: true
  },
  {
    id: 'jwt',
    name: 'JWT Tokens',
    description: 'JSON Web Token authentication',
    security: 'high',
    recommended: false
  },
  {
    id: 'basic',
    name: 'Basic Auth',
    description: 'Username and password',
    security: 'low',
    recommended: false
  }
];

export function APIAccessStep({ data, onUpdate, onNext, onPrevious, isSubmitting }: APIAccessStepProps) {
  const { trackEvent } = useAnalytics();
  const [enableAPI, setEnableAPI] = useState(false);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(['rest', 'webhook']);
  const [selectedAuth, setSelectedAuth] = useState<string[]>(['api_key', 'oauth2']);
  const [rateLimit, setRateLimit] = useState('500');
  const [customDomain, setCustomDomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrls, setWebhookUrls] = useState<string[]>(['']);
  const [documentation, setDocumentation] = useState({
    generateDocs: true,
    includeExamples: true,
    enableTesting: true
  });

  const apiAccess = data.apiAccess || {};

  useEffect(() => {
    trackEvent('vendor_onboarding_step_viewed', {
      step: 'api_access',
      stepNumber: 8
    });

    // Initialize with existing data
    if (apiAccess.enabled !== undefined) {
      setEnableAPI(apiAccess.enabled);
    }
    if (apiAccess.endpoints) {
      setSelectedEndpoints(apiAccess.endpoints);
    }
    if (apiAccess.authentication) {
      setSelectedAuth(apiAccess.authentication);
    }
    if (apiAccess.rateLimit) {
      setRateLimit(apiAccess.rateLimit);
    }
    if (apiAccess.customDomain) {
      setCustomDomain(apiAccess.customDomain);
    }

    // Generate API key if not exists
    if (enableAPI && !apiKey) {
      generateApiKey();
    }
  }, [trackEvent, apiAccess, enableAPI, apiKey]);

  const generateApiKey = () => {
    const newApiKey = `ak_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newApiKey);
  };

  const handleEnableToggle = (enabled: boolean) => {
    setEnableAPI(enabled);
    if (enabled && !apiKey) {
      generateApiKey();
    }
    updateData({ enabled });

    trackEvent('vendor_api_access_toggled', {
      enabled,
      endpoints: selectedEndpoints.length,
      authMethods: selectedAuth.length
    });
  };

  const handleEndpointToggle = (endpointId: string, enabled: boolean) => {
    const newEndpoints = enabled 
      ? [...selectedEndpoints, endpointId]
      : selectedEndpoints.filter(id => id !== endpointId);
    
    setSelectedEndpoints(newEndpoints);
    updateData({ endpoints: newEndpoints });
  };

  const handleAuthToggle = (authId: string, enabled: boolean) => {
    const newAuth = enabled 
      ? [...selectedAuth, authId]
      : selectedAuth.filter(id => id !== authId);
    
    setSelectedAuth(newAuth);
    updateData({ authentication: newAuth });
  };

  const handleRateLimitChange = (limit: string) => {
    setRateLimit(limit);
    updateData({ rateLimit: limit });
  };

  const handleWebhookUrlChange = (index: number, url: string) => {
    const newUrls = [...webhookUrls];
    newUrls[index] = url;
    setWebhookUrls(newUrls);
  };

  const addWebhookUrl = () => {
    setWebhookUrls([...webhookUrls, '']);
  };

  const removeWebhookUrl = (index: number) => {
    setWebhookUrls(webhookUrls.filter((_, i) => i !== index));
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    trackEvent('vendor_api_key_copied');
  };

  const updateData = (updates: Partial<VendorCompanyOnboarding['apiAccess']>) => {
    onUpdate({
      ...data,
      apiAccess: {
        ...apiAccess,
        ...updates,
        lastUpdated: new Date()
      }
    });
  };

  const handleNext = () => {
    // Final data update
    updateData({
      apiKey: enableAPI ? apiKey : undefined,
      webhookUrls: webhookUrls.filter(url => url.trim()),
      customDomain: customDomain.trim(),
      documentation
    });

    trackEvent('vendor_onboarding_step_completed', {
      step: 'api_access',
      stepNumber: 8,
      apiEnabled: enableAPI,
      endpointCount: selectedEndpoints.length,
      authMethodCount: selectedAuth.length,
      hasCustomDomain: !!customDomain.trim()
    });

    onNext();
  };

  const getSecurityColor = (security: string) => {
    switch (security) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'text-purple-600 bg-purple-100';
      case 'business': return 'text-blue-600 bg-blue-100';
      case 'professional': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Key className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-medium">API Access Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Set up API endpoints and access controls for your services (Optional)
          </p>
        </div>
      </div>

      {/* Enable API Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                API Access
              </CardTitle>
              <CardDescription>
                Enable programmatic access to your AI services
              </CardDescription>
            </div>
            <Switch
              checked={enableAPI}
              onCheckedChange={handleEnableToggle}
            />
          </div>
        </CardHeader>

        {enableAPI && (
          <CardContent className="space-y-6">
            {/* API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="w-4 h-4" />
                  API Credentials
                </CardTitle>
                <CardDescription>
                  Your primary API key for authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={apiKey}
                      type={showApiKey ? 'text' : 'password'}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyApiKey}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateApiKey}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this API key secure. It provides access to your services.
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-700">
                    Store your API key securely. You won't be able to see it again after leaving this page.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Endpoint Configuration */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">API Endpoints</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which types of API endpoints to enable
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ENDPOINT_TYPES.map((endpoint) => (
                  <div
                    key={endpoint.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedEndpoints.includes(endpoint.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {endpoint.icon}
                        <span className="font-medium">{endpoint.name}</span>
                      </div>
                      <Switch
                        checked={selectedEndpoints.includes(endpoint.id)}
                        onCheckedChange={(checked) => handleEndpointToggle(endpoint.id, checked)}
                        disabled={!endpoint.enabled}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    {!endpoint.enabled && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Authentication Methods */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Authentication Methods</Label>
                <p className="text-sm text-muted-foreground">
                  Select supported authentication methods for API access
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUTHENTICATION_METHODS.map((auth) => (
                  <div
                    key={auth.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedAuth.includes(auth.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">{auth.name}</span>
                        {auth.recommended && (
                          <Badge variant="default" className="text-xs">Recommended</Badge>
                        )}
                      </div>
                      <Switch
                        checked={selectedAuth.includes(auth.id)}
                        onCheckedChange={(checked) => handleAuthToggle(auth.id, checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{auth.description}</p>
                    <Badge variant="outline" className={`text-xs ${getSecurityColor(auth.security)}`}>
                      {auth.security.toUpperCase()} Security
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Rate Limiting */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Rate Limiting</Label>
                <p className="text-sm text-muted-foreground">
                  Set request rate limits for API usage
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {RATE_LIMIT_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      rateLimit === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleRateLimitChange(option.value)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{option.label}</span>
                      {rateLimit === option.value && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs ${getTierColor(option.tier)}`}>
                      {option.tier.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Webhook Configuration */}
            {selectedEndpoints.includes('webhook') && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Webhook URLs</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure endpoints to receive webhook notifications
                  </p>
                </div>

                <div className="space-y-3">
                  {webhookUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={url}
                        onChange={(e) => handleWebhookUrlChange(index, e.target.value)}
                        placeholder="https://yourdomain.com/webhook"
                        className="flex-1"
                      />
                      {webhookUrls.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeWebhookUrl(index)}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" onClick={addWebhookUrl} className="w-full">
                    Add Webhook URL
                  </Button>
                </div>
              </div>
            )}

            {/* Custom Domain */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="w-4 h-4" />
                  Custom API Domain
                </CardTitle>
                <CardDescription>
                  Use your own domain for API endpoints (Optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiDomain">API Domain</Label>
                  <Input
                    id="apiDomain"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="api.yourcompany.com"
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API will be accessible at: https://{customDomain || 'your-domain.com'}/v1/
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">SSL certificate automatically provisioned</span>
                </div>
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Book className="w-4 h-4" />
                  API Documentation
                </CardTitle>
                <CardDescription>
                  Automatically generate documentation for your API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Generate Documentation</Label>
                      <p className="text-sm text-muted-foreground">Auto-generate OpenAPI/Swagger docs</p>
                    </div>
                    <Switch
                      checked={documentation.generateDocs}
                      onCheckedChange={(checked) => 
                        setDocumentation(prev => ({ ...prev, generateDocs: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Include Code Examples</Label>
                      <p className="text-sm text-muted-foreground">Add SDK examples in multiple languages</p>
                    </div>
                    <Switch
                      checked={documentation.includeExamples}
                      onCheckedChange={(checked) => 
                        setDocumentation(prev => ({ ...prev, includeExamples: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Interactive Testing</Label>
                      <p className="text-sm text-muted-foreground">Enable API testing directly in docs</p>
                    </div>
                    <Switch
                      checked={documentation.enableTesting}
                      onCheckedChange={(checked) => 
                        setDocumentation(prev => ({ ...prev, enableTesting: checked }))
                      }
                    />
                  </div>
                </div>

                {documentation.generateDocs && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Documentation will be available at: /docs
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        )}

        {!enableAPI && (
          <CardContent>
            <div className="text-center py-8">
              <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">API Access Disabled</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable API access to allow programmatic integration with your AI services
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  REST API endpoints
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Multiple authentication methods
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Rate limiting and monitoring
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Auto-generated documentation
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
            Step 8 of 8 • API access {enableAPI ? 'enabled' : 'optional'}
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
          </Button>
        </div>
      </div>
    </div>
  );
}