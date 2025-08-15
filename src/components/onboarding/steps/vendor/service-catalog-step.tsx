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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, Plus, Trash2, Edit2, Star, Clock, DollarSign, 
  Brain, Bot, Database, Image, FileText, Mic, Video, 
  Code, Search, Shield, Zap, Settings, CheckCircle, AlertCircle 
} from 'lucide-react';
import { VendorCompanyOnboarding, ServiceOffering } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface ServiceCatalogStepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const SERVICE_CATEGORIES = [
  { id: 'nlp', name: 'Natural Language Processing', icon: <FileText className="w-4 h-4" /> },
  { id: 'computer_vision', name: 'Computer Vision', icon: <Image className="w-4 h-4" /> },
  { id: 'machine_learning', name: 'Machine Learning', icon: <Brain className="w-4 h-4" /> },
  { id: 'deep_learning', name: 'Deep Learning', icon: <Bot className="w-4 h-4" /> },
  { id: 'data_analytics', name: 'Data Analytics', icon: <Database className="w-4 h-4" /> },
  { id: 'speech_recognition', name: 'Speech Recognition', icon: <Mic className="w-4 h-4" /> },
  { id: 'video_analytics', name: 'Video Analytics', icon: <Video className="w-4 h-4" /> },
  { id: 'automation', name: 'Process Automation', icon: <Zap className="w-4 h-4" /> },
  { id: 'recommendation', name: 'Recommendation Systems', icon: <Star className="w-4 h-4" /> },
  { id: 'search', name: 'Intelligent Search', icon: <Search className="w-4 h-4" /> },
  { id: 'security', name: 'AI Security', icon: <Shield className="w-4 h-4" /> },
  { id: 'custom_development', name: 'Custom AI Development', icon: <Code className="w-4 h-4" /> },
];

const DELIVERY_MODELS = [
  { value: 'saas', label: 'Software as a Service (SaaS)' },
  { value: 'api', label: 'API Integration' },
  { value: 'on_premise', label: 'On-Premise Deployment' },
  { value: 'cloud', label: 'Cloud-Based Solution' },
  { value: 'consulting', label: 'Consulting & Implementation' },
  { value: 'custom', label: 'Custom Development' },
];

const PRICING_MODELS = [
  { value: 'subscription', label: 'Subscription-based' },
  { value: 'usage', label: 'Pay-per-use' },
  { value: 'project', label: 'Project-based' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'enterprise', label: 'Enterprise License' },
  { value: 'freemium', label: 'Freemium' },
];

const IMPLEMENTATION_TIMES = [
  { value: 'immediate', label: 'Immediate (< 1 week)' },
  { value: 'fast', label: 'Fast (1-4 weeks)' },
  { value: 'standard', label: 'Standard (1-3 months)' },
  { value: 'extended', label: 'Extended (3-6 months)' },
  { value: 'enterprise', label: 'Enterprise (6+ months)' },
];

export function ServiceCatalogStep({ data, onUpdate, onNext, onPrevious, isSubmitting }: ServiceCatalogStepProps) {
  const { trackEvent } = useAnalytics();
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [newService, setNewService] = useState<Partial<ServiceOffering>>({
    name: '',
    description: '',
    category: '',
    deliveryModel: 'api',
    pricingModel: 'subscription',
    implementationTime: 'standard',
    features: [],
    targetIndustries: [],
    isActive: true,
    isFeatured: false
  });
  const [newFeature, setNewFeature] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const serviceCatalog = data.serviceCatalog || {};

  useEffect(() => {
    trackEvent('vendor_onboarding_step_viewed', {
      step: 'service_catalog',
      stepNumber: 4
    });

    // Initialize with existing services
    if (serviceCatalog.primaryServices && serviceCatalog.primaryServices.length > 0) {
      setServices(serviceCatalog.primaryServices);
    }
  }, [trackEvent, serviceCatalog.primaryServices]);

  const handleAddService = () => {
    if (validateService(newService)) {
      const service: ServiceOffering = {
        id: `service_${Date.now()}`,
        name: newService.name!,
        description: newService.description!,
        category: newService.category!,
        deliveryModel: newService.deliveryModel as any,
        pricingModel: newService.pricingModel as any,
        implementationTime: newService.implementationTime as any,
        features: newService.features || [],
        targetIndustries: newService.targetIndustries || [],
        isActive: true,
        isFeatured: newService.isFeatured || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedServices = [...services, service];
      setServices(updatedServices);
      updateData({ primaryServices: updatedServices });

      // Reset form
      setNewService({
        name: '',
        description: '',
        category: '',
        deliveryModel: 'api',
        pricingModel: 'subscription',
        implementationTime: 'standard',
        features: [],
        targetIndustries: [],
        isActive: true,
        isFeatured: false
      });
      setIsAddingService(false);
      setErrors({});

      trackEvent('vendor_service_added', {
        serviceName: service.name,
        category: service.category,
        deliveryModel: service.deliveryModel,
        pricingModel: service.pricingModel
      });
    }
  };

  const handleUpdateService = (serviceId: string, updates: Partial<ServiceOffering>) => {
    const updatedServices = services.map(service => 
      service.id === serviceId ? { ...service, ...updates, updatedAt: new Date() } : service
    );
    setServices(updatedServices);
    updateData({ primaryServices: updatedServices });
  };

  const handleDeleteService = (serviceId: string) => {
    const updatedServices = services.filter(service => service.id !== serviceId);
    setServices(updatedServices);
    updateData({ primaryServices: updatedServices });

    trackEvent('vendor_service_removed', {
      totalServices: updatedServices.length
    });
  };

  const validateService = (service: Partial<ServiceOffering>): boolean => {
    const newErrors: Record<string, string> = {};

    if (!service.name?.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!service.description?.trim()) {
      newErrors.description = 'Service description is required';
    }

    if (!service.category?.trim()) {
      newErrors.category = 'Service category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateData = (updates: Partial<VendorCompanyOnboarding['serviceCatalog']>) => {
    onUpdate({
      ...data,
      serviceCatalog: {
        ...serviceCatalog,
        ...updates,
        totalServices: services.length + (updates.primaryServices ? updates.primaryServices.length - services.length : 0),
        categoryBreakdown: calculateCategoryBreakdown(updates.primaryServices || services)
      }
    });
  };

  const calculateCategoryBreakdown = (serviceList: ServiceOffering[]) => {
    const breakdown: Record<string, number> = {};
    serviceList.forEach(service => {
      breakdown[service.category] = (breakdown[service.category] || 0) + 1;
    });
    return breakdown;
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setNewService(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setNewService(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddIndustry = () => {
    if (newIndustry.trim()) {
      setNewService(prev => ({
        ...prev,
        targetIndustries: [...(prev.targetIndustries || []), newIndustry.trim()]
      }));
      setNewIndustry('');
    }
  };

  const handleRemoveIndustry = (index: number) => {
    setNewService(prev => ({
      ...prev,
      targetIndustries: prev.targetIndustries?.filter((_, i) => i !== index) || []
    }));
  };

  const handleNext = () => {
    trackEvent('vendor_onboarding_step_completed', {
      step: 'service_catalog',
      stepNumber: 4,
      serviceCount: services.length,
      categoryCount: Object.keys(calculateCategoryBreakdown(services)).length
    });

    onNext();
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = SERVICE_CATEGORIES.find(cat => cat.id === categoryId);
    return category?.icon || <Package className="w-4 h-4" />;
  };

  const getCategoryName = (categoryId: string) => {
    const category = SERVICE_CATEGORIES.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Package className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-medium">Service Catalog</h3>
          <p className="text-sm text-muted-foreground">
            Define your AI service offerings and capabilities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Service Offerings ({services.length})
                  </CardTitle>
                  <CardDescription>
                    Manage your AI services and capabilities
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingService(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {services.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getCategoryIcon(service.category)}
                              <h3 className="font-medium">{service.name}</h3>
                              {service.isFeatured && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {service.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="secondary" className="text-xs">
                                {getCategoryName(service.category)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {DELIVERY_MODELS.find(d => d.value === service.deliveryModel)?.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {PRICING_MODELS.find(p => p.value === service.pricingModel)?.label}
                              </Badge>
                            </div>

                            {service.features && service.features.length > 0 && (
                              <div className="mb-2">
                                <div className="text-xs text-muted-foreground mb-1">Key Features:</div>
                                <div className="flex flex-wrap gap-1">
                                  {service.features.slice(0, 3).map((feature, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {service.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{service.features.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {IMPLEMENTATION_TIMES.find(t => t.value === service.implementationTime)?.label}
                              </div>
                              {service.targetIndustries && service.targetIndustries.length > 0 && (
                                <div>
                                  Industries: {service.targetIndustries.slice(0, 2).join(', ')}
                                  {service.targetIndustries.length > 2 && ` +${service.targetIndustries.length - 2}`}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingService(service.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">No Services Added</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start building your service catalog by adding your AI offerings
                  </p>
                  <Button onClick={() => setIsAddingService(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Service Form / Statistics */}
        <div className="space-y-6">
          {isAddingService ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Service
                </CardTitle>
                <CardDescription>
                  Define a new AI service offering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceName">Service Name *</Label>
                      <Input
                        id="serviceName"
                        value={newService.name || ''}
                        onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="AI-Powered Document Analysis"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceDescription">Description *</Label>
                      <Textarea
                        id="serviceDescription"
                        value={newService.description || ''}
                        onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Automatically extract and analyze key information from documents using advanced NLP..."
                        rows={3}
                        className={errors.description ? 'border-red-500' : ''}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-500">{errors.description}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceCategory">Category *</Label>
                      <Select
                        value={newService.category || ''}
                        onValueChange={(value) => setNewService(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_CATEGORIES.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                {category.icon}
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-500">{errors.category}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deliveryModel">Delivery Model</Label>
                      <Select
                        value={newService.deliveryModel || 'api'}
                        onValueChange={(value) => setNewService(prev => ({ ...prev, deliveryModel: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pricingModel">Pricing Model</Label>
                      <Select
                        value={newService.pricingModel || 'subscription'}
                        onValueChange={(value) => setNewService(prev => ({ ...prev, pricingModel: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRICING_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="implementationTime">Implementation Time</Label>
                      <Select
                        value={newService.implementationTime || 'standard'}
                        onValueChange={(value) => setNewService(prev => ({ ...prev, implementationTime: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IMPLEMENTATION_TIMES.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Key Features</Label>
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
                      {newService.features && newService.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {newService.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                              <button
                                onClick={() => handleRemoveFeature(index)}
                                className="ml-1 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Target Industries</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newIndustry}
                          onChange={(e) => setNewIndustry(e.target.value)}
                          placeholder="Add an industry"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddIndustry()}
                        />
                        <Button type="button" onClick={handleAddIndustry} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {newService.targetIndustries && newService.targetIndustries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {newService.targetIndustries.map((industry, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {industry}
                              <button
                                onClick={() => handleRemoveIndustry(index)}
                                className="ml-1 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={newService.isFeatured || false}
                        onCheckedChange={(checked) => setNewService(prev => ({ ...prev, isFeatured: checked as boolean }))}
                      />
                      <Label htmlFor="isFeatured" className="text-sm">
                        Featured service
                      </Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddService} className="flex-1">
                        Add Service
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsAddingService(false);
                          setErrors({});
                          setNewService({
                            name: '',
                            description: '',
                            category: '',
                            deliveryModel: 'api',
                            pricingModel: 'subscription',
                            implementationTime: 'standard',
                            features: [],
                            targetIndustries: [],
                            isActive: true,
                            isFeatured: false
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
              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Catalog Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                      <div className="text-sm text-muted-foreground">Total Services</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {services.filter(s => s.isFeatured).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Featured</div>
                    </div>
                  </div>

                  {services.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Category Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(calculateCategoryBreakdown(services)).map(([categoryId, count]) => (
                            <div key={categoryId} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground flex items-center gap-2">
                                {getCategoryIcon(categoryId)}
                                {getCategoryName(categoryId)}
                              </span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {services.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-muted-foreground mb-2">Build Your Catalog</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add AI services to showcase your capabilities
                    </p>
                    <Button onClick={() => setIsAddingService(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
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
            Step 4 of 8 • {services.length} services added
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}