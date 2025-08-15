'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Database, Cloud, Code, Globe, Plus, Trash2, 
  CheckCircle, Link, Server, Smartphone, Monitor 
} from 'lucide-react';
import { CustomerOrganizationOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface IntegrationRequirementsStepProps {
  data: Partial<CustomerOrganizationOnboarding>;
  onUpdate: (data: Partial<CustomerOrganizationOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const SYSTEM_TYPES = [
  { 
    id: 'crm', 
    name: 'CRM Systems', 
    examples: ['Salesforce', 'HubSpot', 'Microsoft Dynamics'], 
    icon: <Users className="w-4 h-4" /> 
  },
  { 
    id: 'erp', 
    name: 'ERP Systems', 
    examples: ['SAP', 'Oracle', 'NetSuite'], 
    icon: <Building className="w-4 h-4" /> 
  },
  { 
    id: 'database', 
    name: 'Databases', 
    examples: ['PostgreSQL', 'MySQL', 'MongoDB'], 
    icon: <Database className="w-4 h-4" /> 
  },
  { 
    id: 'cloud', 
    name: 'Cloud Platforms', 
    examples: ['AWS', 'Azure', 'Google Cloud'], 
    icon: <Cloud className="w-4 h-4" /> 
  },
  { 
    id: 'analytics', 
    name: 'Analytics Tools', 
    examples: ['Tableau', 'Power BI', 'Google Analytics'], 
    icon: <TrendingUp className="w-4 h-4" /> 
  },
  { 
    id: 'collaboration', 
    name: 'Collaboration Tools', 
    examples: ['Slack', 'Microsoft Teams', 'Zoom'], 
    icon: <MessageSquare className="w-4 h-4" /> 
  },
  { 
    id: 'marketing', 
    name: 'Marketing Automation', 
    examples: ['Marketo', 'Pardot', 'Mailchimp'], 
    icon: <Mail className="w-4 h-4" /> 
  },
  { 
    id: 'custom', 
    name: 'Custom Applications', 
    examples: ['Internal tools', 'Legacy systems'], 
    icon: <Code className="w-4 h-4" /> 
  }
];

const INTEGRATION_METHODS = [
  {
    id: 'api_rest',
    name: 'REST API',
    description: 'Standard HTTP REST API integration',
    complexity: 'low'
  },
  {
    id: 'api_graphql',
    name: 'GraphQL API',
    description: 'GraphQL endpoint integration',
    complexity: 'medium'
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    description: 'Event-driven webhook integration',
    complexity: 'low'
  },
  {
    id: 'database_direct',
    name: 'Direct Database',
    description: 'Direct database connection',
    complexity: 'high'
  },
  {
    id: 'file_transfer',
    name: 'File Transfer',
    description: 'FTP, SFTP, or cloud file sharing',
    complexity: 'low'
  },
  {
    id: 'messaging',
    name: 'Message Queues',
    description: 'RabbitMQ, Apache Kafka, etc.',
    complexity: 'high'
  },
  {
    id: 'etl',
    name: 'ETL Pipeline',
    description: 'Extract, Transform, Load processes',
    complexity: 'medium'
  },
  {
    id: 'custom',
    name: 'Custom Integration',
    description: 'Proprietary or specialized method',
    complexity: 'high'
  }
];

const DATA_FORMATS = [
  'JSON', 'XML', 'CSV', 'Excel', 'Parquet', 'Avro', 'PDF', 'Text', 'Images', 'Audio', 'Video', 'Other'
];

const PLATFORMS = [
  {
    id: 'web',
    name: 'Web Application',
    icon: <Globe className="w-4 h-4" />
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    icon: <Smartphone className="w-4 h-4" />
  },
  {
    id: 'desktop',
    name: 'Desktop Application',
    icon: <Monitor className="w-4 h-4" />
  },
  {
    id: 'api',
    name: 'API Only',
    icon: <Code className="w-4 h-4" />
  },
  {
    id: 'embedded',
    name: 'Embedded Widget',
    icon: <Zap className="w-4 h-4" />
  }
];

interface SystemIntegration {
  id: string;
  systemType: string;
  systemName: string;
  purpose: string;
  integrationMethod: string;
  dataFormats: string[];
  priority: 'high' | 'medium' | 'low';
}

import { TrendingUp, MessageSquare, Mail, Users, Building } from 'lucide-react';

export function IntegrationRequirementsStep({ data, onUpdate, onNext, onPrevious, onSkip, isSubmitting }: IntegrationRequirementsStepProps) {
  const { trackEvent } = useAnalytics();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [systemIntegrations, setSystemIntegrations] = useState<SystemIntegration[]>([]);
  const [isAddingSystem, setIsAddingSystem] = useState(false);
  const [newSystem, setNewSystem] = useState<Partial<SystemIntegration>>({
    systemType: '',
    systemName: '',
    purpose: '',
    integrationMethod: '',
    dataFormats: [],
    priority: 'medium'
  });
  const [performanceRequirements, setPerformanceRequirements] = useState('');
  const [scalabilityNeeds, setScalabilityNeeds] = useState('');
  const [technicalConstraints, setTechnicalConstraints] = useState('');

  const integration = data.integration || {};

  useEffect(() => {
    trackEvent('customer_onboarding_step_viewed', {
      step: 'integration_requirements',
      stepNumber: 6
    });

    // Initialize with existing data
    if (integration.platforms) setSelectedPlatforms(integration.platforms);
    if (integration.systemIntegrations) setSystemIntegrations(integration.systemIntegrations);
    if (integration.performanceRequirements) setPerformanceRequirements(integration.performanceRequirements);
    if (integration.scalabilityNeeds) setScalabilityNeeds(integration.scalabilityNeeds);
    if (integration.technicalConstraints) setTechnicalConstraints(integration.technicalConstraints);
  }, [trackEvent, integration]);

  const handlePlatformToggle = (platformId: string, checked: boolean) => {
    const newPlatforms = checked
      ? [...selectedPlatforms, platformId]
      : selectedPlatforms.filter(id => id !== platformId);
    
    setSelectedPlatforms(newPlatforms);
  };

  const handleDataFormatToggle = (format: string, checked: boolean) => {
    const currentFormats = newSystem.dataFormats || [];
    const newFormats = checked
      ? [...currentFormats, format]
      : currentFormats.filter(f => f !== format);
    
    setNewSystem(prev => ({ ...prev, dataFormats: newFormats }));
  };

  const handleAddSystem = () => {
    if (!newSystem.systemName?.trim() || !newSystem.systemType) return;

    const system: SystemIntegration = {
      id: `system_${Date.now()}`,
      systemType: newSystem.systemType!,
      systemName: newSystem.systemName!,
      purpose: newSystem.purpose || '',
      integrationMethod: newSystem.integrationMethod || '',
      dataFormats: newSystem.dataFormats || [],
      priority: newSystem.priority as SystemIntegration['priority']
    };

    const updatedSystems = [...systemIntegrations, system];
    setSystemIntegrations(updatedSystems);

    // Reset form
    setNewSystem({
      systemType: '',
      systemName: '',
      purpose: '',
      integrationMethod: '',
      dataFormats: [],
      priority: 'medium'
    });
    setIsAddingSystem(false);

    trackEvent('customer_system_integration_added', {
      systemType: system.systemType,
      integrationMethod: system.integrationMethod,
      totalSystems: updatedSystems.length
    });
  };

  const handleRemoveSystem = (systemId: string) => {
    const updatedSystems = systemIntegrations.filter(system => system.id !== systemId);
    setSystemIntegrations(updatedSystems);

    trackEvent('customer_system_integration_removed', {
      totalSystems: updatedSystems.length
    });
  };

  const updateData = () => {
    onUpdate({
      ...data,
      integration: {
        platforms: selectedPlatforms,
        systemIntegrations,
        performanceRequirements,
        scalabilityNeeds,
        technicalConstraints
      }
    });
  };

  const handleNext = () => {
    updateData();

    trackEvent('customer_onboarding_step_completed', {
      step: 'integration_requirements',
      stepNumber: 6,
      platformCount: selectedPlatforms.length,
      systemCount: systemIntegrations.length,
      hasPerformanceReqs: !!performanceRequirements.trim()
    });

    onNext();
  };

  const handleSkip = () => {
    trackEvent('customer_onboarding_step_skipped', {
      step: 'integration_requirements',
      stepNumber: 6
    });

    onSkip();
  };

  const getSystemTypeIcon = (systemType: string) => {
    const type = SYSTEM_TYPES.find(t => t.id === systemType);
    return type?.icon || <Code className="w-4 h-4" />;
  };

  const getSystemTypeName = (systemType: string) => {
    const type = SYSTEM_TYPES.find(t => t.id === systemType);
    return type?.name || systemType;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Zap className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="font-medium">Integration Requirements</h3>
          <p className="text-sm text-muted-foreground">
            Define how the AI solution should integrate with your existing systems (Optional)
          </p>
        </div>
      </div>

      {/* Platform Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Target Platforms
          </CardTitle>
          <CardDescription>
            Which platforms should the AI solution support?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => handlePlatformToggle(platform.id, !selectedPlatforms.includes(platform.id))}
              >
                <Checkbox
                  checked={selectedPlatforms.includes(platform.id)}
                  readOnly
                />
                {platform.icon}
                <span className="font-medium">{platform.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                System Integrations ({systemIntegrations.length})
              </CardTitle>
              <CardDescription>
                Define integrations with your existing systems
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddingSystem(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {systemIntegrations.length > 0 ? (
            <div className="space-y-4">
              {systemIntegrations.map((system) => (
                <div
                  key={system.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {getSystemTypeIcon(system.systemType)}
                    
                    <div>
                      <div className="font-medium">{system.systemName}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {getSystemTypeName(system.systemType)}
                      </div>
                      {system.purpose && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {system.purpose}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {INTEGRATION_METHODS.find(m => m.id === system.integrationMethod)?.name || 'Method TBD'}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityColor(system.priority)}`}
                        >
                          {system.priority.toUpperCase()} Priority
                        </Badge>
                        {system.dataFormats.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {system.dataFormats.length} formats
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveSystem(system.id)}
                    className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Link className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">No Integrations Added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add systems that the AI solution should integrate with
              </p>
              <Button onClick={() => setIsAddingSystem(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add System Form */}
      {isAddingSystem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add System Integration
            </CardTitle>
            <CardDescription>
              Define an integration with an existing system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemType">System Type *</Label>
                <Select
                  value={newSystem.systemType || ''}
                  onValueChange={(value) => setNewSystem(prev => ({ ...prev, systemType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select system type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemName">System Name *</Label>
                <Input
                  id="systemName"
                  value={newSystem.systemName || ''}
                  onChange={(e) => setNewSystem(prev => ({ ...prev, systemName: e.target.value }))}
                  placeholder="e.g., Salesforce CRM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="integrationMethod">Integration Method</Label>
                <Select
                  value={newSystem.integrationMethod || ''}
                  onValueChange={(value) => setNewSystem(prev => ({ ...prev, integrationMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration method" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEGRATION_METHODS.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div>
                          <div className="flex items-center gap-2">
                            {method.name}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getComplexityColor(method.complexity)}`}
                            >
                              {method.complexity}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{method.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newSystem.priority || 'medium'}
                  onValueChange={(value) => setNewSystem(prev => ({ ...prev, priority: value as SystemIntegration['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High - Must have</SelectItem>
                    <SelectItem value="medium">Medium - Important</SelectItem>
                    <SelectItem value="low">Low - Nice to have</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Integration Purpose</Label>
              <Textarea
                id="purpose"
                value={newSystem.purpose || ''}
                onChange={(e) => setNewSystem(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Describe what this integration will accomplish..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Formats</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {DATA_FORMATS.map((format) => (
                  <div
                    key={format}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <Checkbox
                      checked={newSystem.dataFormats?.includes(format) || false}
                      onCheckedChange={(checked) => handleDataFormatToggle(format, checked as boolean)}
                    />
                    <span>{format}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddSystem}
                disabled={!newSystem.systemName?.trim() || !newSystem.systemType}
              >
                Add Integration
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingSystem(false);
                  setNewSystem({
                    systemType: '',
                    systemName: '',
                    purpose: '',
                    integrationMethod: '',
                    dataFormats: [],
                    priority: 'medium'
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Technical Requirements
          </CardTitle>
          <CardDescription>
            Additional technical considerations for the AI implementation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="performanceRequirements">Performance Requirements</Label>
            <Textarea
              id="performanceRequirements"
              value={performanceRequirements}
              onChange={(e) => setPerformanceRequirements(e.target.value)}
              placeholder="Describe response time, throughput, or other performance requirements..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scalabilityNeeds">Scalability Needs</Label>
            <Textarea
              id="scalabilityNeeds"
              value={scalabilityNeeds}
              onChange={(e) => setScalabilityNeeds(e.target.value)}
              placeholder="Expected growth, peak usage patterns, scaling requirements..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technicalConstraints">Technical Constraints</Label>
            <Textarea
              id="technicalConstraints"
              value={technicalConstraints}
              onChange={(e) => setTechnicalConstraints(e.target.value)}
              placeholder="Any technical limitations, legacy system constraints, or architectural requirements..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {(selectedPlatforms.length > 0 || systemIntegrations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Integration Summary
            </CardTitle>
            <CardDescription>
              Review your integration and technical requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Globe className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{selectedPlatforms.length}</div>
                <div className="text-sm text-muted-foreground">Target Platforms</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Link className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{systemIntegrations.length}</div>
                <div className="text-sm text-muted-foreground">System Integrations</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Server className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {systemIntegrations.filter(s => s.priority === 'high').length}
                </div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedPlatforms.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Target Platforms:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlatforms.map((platformId) => {
                      const platform = PLATFORMS.find(p => p.id === platformId);
                      return (
                        <Badge key={platformId} variant="secondary">
                          {platform?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {systemIntegrations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">System Integrations:</h4>
                  <div className="space-y-1">
                    {systemIntegrations.map((system) => (
                      <div key={system.id} className="flex justify-between items-center text-sm">
                        <span>{system.systemName}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(system.priority)}`}
                        >
                          {system.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Step 6 of 6 • Integration requirements defined
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
              Skip
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}