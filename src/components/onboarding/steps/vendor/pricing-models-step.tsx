'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, Plus, Trash2, Edit2, Star, Clock, 
  TrendingUp, Target, Calculator, Package, 
  Users, Zap, Crown, CheckCircle, AlertCircle 
} from 'lucide-react';
import { VendorCompanyOnboarding, PricingTier } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface PricingModelsStepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const PRICING_TYPES = [
  { value: 'subscription', label: 'Subscription', icon: <Clock className="w-4 h-4" /> },
  { value: 'usage_based', label: 'Usage-Based', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'project_based', label: 'Project-Based', icon: <Target className="w-4 h-4" /> },
  { value: 'hourly', label: 'Hourly Rate', icon: <Clock className="w-4 h-4" /> },
  { value: 'enterprise', label: 'Enterprise', icon: <Crown className="w-4 h-4" /> },
  { value: 'freemium', label: 'Freemium', icon: <Star className="w-4 h-4" /> }
];

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One-time' },
  { value: 'custom', label: 'Custom' }
];

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' }
];

const DEFAULT_PRICING_TIERS = [
  {
    name: 'Starter',
    type: 'subscription' as const,
    price: 99,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    description: 'Perfect for small teams getting started with AI',
    features: [
      'Up to 1,000 API calls/month',
      'Basic analytics',
      'Email support',
      'Standard SLA'
    ],
    isPopular: false,
    isCustom: false
  },
  {
    name: 'Professional',
    type: 'subscription' as const,
    price: 299,
    currency: 'USD',
    billingCycle: 'monthly' as const,
    description: 'For growing businesses with higher AI demands',
    features: [
      'Up to 10,000 API calls/month',
      'Advanced analytics',
      'Priority support',
      'Enhanced SLA',
      'Custom integrations'
    ],
    isPopular: true,
    isCustom: false
  },
  {
    name: 'Enterprise',
    type: 'enterprise' as const,
    price: 0,
    currency: 'USD',
    billingCycle: 'annually' as const,
    description: 'Custom solutions for large organizations',
    features: [
      'Unlimited API calls',
      'White-label options',
      'Dedicated support',
      'Custom SLA',
      'On-premise deployment',
      'Training & consulting'
    ],
    isPopular: false,
    isCustom: true
  }
];

export function PricingModelsStep({ data, onUpdate, onNext, onPrevious, isSubmitting }: PricingModelsStepProps) {
  const { trackEvent } = useAnalytics();
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [newTier, setNewTier] = useState<Partial<PricingTier>>({
    name: '',
    type: 'subscription',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    description: '',
    features: [],
    isPopular: false,
    isCustom: false
  });
  const [newFeature, setNewFeature] = useState('');
  const [useDefaultTiers, setUseDefaultTiers] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pricingModels = data.pricingModels || {};

  useEffect(() => {
    trackEvent('vendor_onboarding_step_viewed', {
      step: 'pricing_models',
      stepNumber: 6
    });

    // Initialize with existing tiers or defaults
    if (pricingModels.tiers && pricingModels.tiers.length > 0) {
      setPricingTiers(pricingModels.tiers);
      setUseDefaultTiers(false);
    } else if (useDefaultTiers) {
      const defaultTiers = DEFAULT_PRICING_TIERS.map((tier, index) => ({
        ...tier,
        id: `tier_${index + 1}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      setPricingTiers(defaultTiers);
    }
  }, [trackEvent, pricingModels.tiers, useDefaultTiers]);

  const handleAddTier = () => {
    if (validateTier(newTier)) {
      const tier: PricingTier = {
        id: `tier_${Date.now()}`,
        name: newTier.name!,
        type: newTier.type as any,
        price: newTier.price || 0,
        currency: newTier.currency || 'USD',
        billingCycle: newTier.billingCycle as any,
        description: newTier.description || '',
        features: newTier.features || [],
        isPopular: newTier.isPopular || false,
        isCustom: newTier.isCustom || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedTiers = [...pricingTiers, tier];
      setPricingTiers(updatedTiers);
      updateData({ tiers: updatedTiers });

      // Reset form
      setNewTier({
        name: '',
        type: 'subscription',
        price: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        description: '',
        features: [],
        isPopular: false,
        isCustom: false
      });
      setIsAddingTier(false);
      setErrors({});

      trackEvent('vendor_pricing_tier_added', {
        tierName: tier.name,
        tierType: tier.type,
        price: tier.price,
        currency: tier.currency
      });
    }
  };

  const handleUpdateTier = (tierId: string, updates: Partial<PricingTier>) => {
    const updatedTiers = pricingTiers.map(tier => 
      tier.id === tierId ? { ...tier, ...updates, updatedAt: new Date() } : tier
    );
    setPricingTiers(updatedTiers);
    updateData({ tiers: updatedTiers });
  };

  const handleDeleteTier = (tierId: string) => {
    const updatedTiers = pricingTiers.filter(tier => tier.id !== tierId);
    setPricingTiers(updatedTiers);
    updateData({ tiers: updatedTiers });

    trackEvent('vendor_pricing_tier_removed', {
      totalTiers: updatedTiers.length
    });
  };

  const validateTier = (tier: Partial<PricingTier>): boolean => {
    const newErrors: Record<string, string> = {};

    if (!tier.name?.trim()) {
      newErrors.name = 'Tier name is required';
    }

    if (tier.type !== 'enterprise' && tier.type !== 'freemium' && (!tier.price || tier.price <= 0)) {
      newErrors.price = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateData = (updates: Partial<VendorCompanyOnboarding['pricingModels']>) => {
    onUpdate({
      ...data,
      pricingModels: {
        ...pricingModels,
        ...updates,
        currency: updates.tiers?.[0]?.currency || 'USD',
        hasFreeTier: updates.tiers?.some(t => t.type === 'freemium' || t.price === 0) || false,
        totalTiers: updates.tiers?.length || 0
      }
    });
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setNewTier(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setNewTier(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  const handleLoadDefaults = () => {
    const defaultTiers = DEFAULT_PRICING_TIERS.map((tier, index) => ({
      ...tier,
      id: `tier_${Date.now()}_${index}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    setPricingTiers(defaultTiers);
    updateData({ tiers: defaultTiers });
    setUseDefaultTiers(true);

    trackEvent('vendor_pricing_defaults_loaded', {
      tierCount: defaultTiers.length
    });
  };

  const handleNext = () => {
    updateData({ 
      lastUpdated: new Date(),
      totalTiers: pricingTiers.length
    });

    trackEvent('vendor_onboarding_step_completed', {
      step: 'pricing_models',
      stepNumber: 6,
      tierCount: pricingTiers.length,
      hasFreeTier: pricingTiers.some(t => t.type === 'freemium' || t.price === 0),
      hasEnterprise: pricingTiers.some(t => t.type === 'enterprise')
    });

    onNext();
  };

  const getCurrencySymbol = (currency: string) => {
    const currencyObj = CURRENCIES.find(c => c.value === currency);
    return currencyObj?.symbol || '$';
  };

  const formatPrice = (tier: PricingTier) => {
    if (tier.type === 'enterprise' || tier.isCustom) {
      return 'Custom';
    }
    if (tier.type === 'freemium' || tier.price === 0) {
      return 'Free';
    }
    return `${getCurrencySymbol(tier.currency)}${tier.price}`;
  };

  const getPricingTypeIcon = (type: string) => {
    const pricingType = PRICING_TYPES.find(t => t.value === type);
    return pricingType?.icon || <DollarSign className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-medium">Pricing Models</h3>
          <p className="text-sm text-muted-foreground">
            Set up your pricing tiers and billing structure
          </p>
        </div>
      </div>

      {/* Quick Setup */}
      {pricingTiers.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Setup
            </CardTitle>
            <CardDescription>
              Get started quickly with our recommended pricing structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Use Default Pricing Tiers</h3>
                <p className="text-sm text-muted-foreground">
                  Start with Starter, Professional, and Enterprise tiers (you can customize later)
                </p>
              </div>
              <Button onClick={handleLoadDefaults}>
                Load Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pricing Tiers List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Pricing Tiers ({pricingTiers.length})
                  </CardTitle>
                  <CardDescription>
                    Manage your pricing structure and tiers
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingTier(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pricingTiers.length > 0 ? (
                <div className="grid gap-4">
                  {pricingTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className={`p-4 border rounded-lg transition-all ${
                        tier.isPopular 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPricingTypeIcon(tier.type)}
                            <h3 className="font-semibold">{tier.name}</h3>
                            {tier.isPopular && (
                              <Badge variant="default" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {PRICING_TYPES.find(t => t.value === tier.type)?.label}
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-primary">
                                {formatPrice(tier)}
                              </span>
                              {tier.price > 0 && tier.type !== 'enterprise' && (
                                <span className="text-sm text-muted-foreground">
                                  /{tier.billingCycle}
                                </span>
                              )}
                            </div>
                            {tier.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {tier.description}
                              </p>
                            )}
                          </div>

                          {tier.features && tier.features.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium mb-2">Features:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                {tier.features.slice(0, 6).map((feature, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                  </div>
                                ))}
                              </div>
                              {tier.features.length > 6 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  +{tier.features.length - 6} more features
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{tier.currency}</span>
                            <span>{BILLING_CYCLES.find(c => c.value === tier.billingCycle)?.label}</span>
                            {tier.isCustom && <span>Custom pricing</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTier(tier.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTier(tier.id)}
                            className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">No Pricing Tiers</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create pricing tiers to define your service offerings
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleLoadDefaults} variant="outline">
                      Load Defaults
                    </Button>
                    <Button onClick={() => setIsAddingTier(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Custom
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Tier Form / Summary */}
        <div className="space-y-6">
          {isAddingTier ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Pricing Tier
                </CardTitle>
                <CardDescription>
                  Create a new pricing tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tierName">Tier Name *</Label>
                      <Input
                        id="tierName"
                        value={newTier.name || ''}
                        onChange={(e) => setNewTier(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Professional"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tierType">Pricing Type</Label>
                      <Select
                        value={newTier.type || 'subscription'}
                        onValueChange={(value) => setNewTier(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRICING_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                {type.icon}
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tierPrice">Price</Label>
                        <Input
                          id="tierPrice"
                          type="number"
                          value={newTier.price || ''}
                          onChange={(e) => setNewTier(prev => ({ ...prev, price: Number(e.target.value) }))}
                          placeholder="99"
                          disabled={newTier.type === 'enterprise' || newTier.type === 'freemium'}
                          className={errors.price ? 'border-red-500' : ''}
                        />
                        {errors.price && (
                          <p className="text-sm text-red-500">{errors.price}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tierCurrency">Currency</Label>
                        <Select
                          value={newTier.currency || 'USD'}
                          onValueChange={(value) => setNewTier(prev => ({ ...prev, currency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.symbol} {currency.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billingCycle">Billing Cycle</Label>
                      <Select
                        value={newTier.billingCycle || 'monthly'}
                        onValueChange={(value) => setNewTier(prev => ({ ...prev, billingCycle: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BILLING_CYCLES.map((cycle) => (
                            <SelectItem key={cycle.value} value={cycle.value}>
                              {cycle.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tierDescription">Description</Label>
                      <Textarea
                        id="tierDescription"
                        value={newTier.description || ''}
                        onChange={(e) => setNewTier(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Perfect for growing businesses..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Features</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Add a feature"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                        />
                        <Button type="button" onClick={handleAddFeature} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {newTier.features && newTier.features.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {newTier.features.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                {feature}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveFeature(index)}
                                className="h-6 w-6 p-0 text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isPopular"
                          checked={newTier.isPopular || false}
                          onCheckedChange={(checked) => setNewTier(prev => ({ ...prev, isPopular: checked as boolean }))}
                        />
                        <Label htmlFor="isPopular" className="text-sm">
                          Mark as popular tier
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isCustom"
                          checked={newTier.isCustom || false}
                          onCheckedChange={(checked) => setNewTier(prev => ({ ...prev, isCustom: checked as boolean }))}
                        />
                        <Label htmlFor="isCustom" className="text-sm">
                          Custom pricing (contact sales)
                        </Label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddTier} className="flex-1">
                        Add Tier
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsAddingTier(false);
                          setErrors({});
                          setNewTier({
                            name: '',
                            type: 'subscription',
                            price: 0,
                            currency: 'USD',
                            billingCycle: 'monthly',
                            description: '',
                            features: [],
                            isPopular: false,
                            isCustom: false
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Pricing Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{pricingTiers.length}</div>
                      <div className="text-sm text-muted-foreground">Total Tiers</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {pricingTiers.filter(t => t.isPopular).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Popular</div>
                    </div>
                  </div>

                  {pricingTiers.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Price Range</h4>
                        <div className="space-y-2">
                          {(() => {
                            const paidTiers = pricingTiers.filter(t => t.price > 0 && t.type !== 'enterprise');
                            if (paidTiers.length === 0) return <p className="text-sm text-muted-foreground">No paid tiers</p>;
                            
                            const minPrice = Math.min(...paidTiers.map(t => t.price));
                            const maxPrice = Math.max(...paidTiers.map(t => t.price));
                            const currency = paidTiers[0]?.currency || 'USD';
                            
                            return (
                              <p className="text-sm">
                                {getCurrencySymbol(currency)}{minPrice} - {getCurrencySymbol(currency)}{maxPrice} / month
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {pricingTiers.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                    <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-muted-foreground mb-2">Setup Pricing</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Define your pricing structure to attract customers
                    </p>
                    <Button onClick={() => setIsAddingTier(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tier
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Step 6 of 8 • {pricingTiers.length} pricing tiers configured
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}