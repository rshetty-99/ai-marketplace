'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Lock, FileCheck, AlertTriangle, CheckCircle, 
  Globe, Database, Users, Eye, Server 
} from 'lucide-react';
import { CustomerOrganizationOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface SecurityComplianceStepProps {
  data: Partial<CustomerOrganizationOnboarding>;
  onUpdate: (data: Partial<CustomerOrganizationOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const COMPLIANCE_STANDARDS = [
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation (EU)',
    category: 'Privacy'
  },
  {
    id: 'ccpa',
    name: 'CCPA',
    description: 'California Consumer Privacy Act',
    category: 'Privacy'
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    category: 'Healthcare'
  },
  {
    id: 'sox',
    name: 'SOX',
    description: 'Sarbanes-Oxley Act',
    category: 'Financial'
  },
  {
    id: 'pci_dss',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    category: 'Payment'
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Information Security Management',
    category: 'Security'
  },
  {
    id: 'fedramp',
    name: 'FedRAMP',
    description: 'Federal Risk and Authorization Management Program',
    category: 'Government'
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Industry-specific or custom compliance requirements',
    category: 'Other'
  }
];

const SECURITY_REQUIREMENTS = [
  {
    id: 'data_encryption',
    name: 'Data Encryption',
    description: 'End-to-end encryption for data in transit and at rest',
    critical: true
  },
  {
    id: 'access_control',
    name: 'Access Control',
    description: 'Role-based access control and user authentication',
    critical: true
  },
  {
    id: 'audit_logging',
    name: 'Audit Logging',
    description: 'Comprehensive logging and audit trails',
    critical: true
  },
  {
    id: 'data_backup',
    name: 'Data Backup & Recovery',
    description: 'Regular backups and disaster recovery procedures',
    critical: true
  },
  {
    id: 'network_security',
    name: 'Network Security',
    description: 'Firewalls, VPNs, and network segmentation',
    critical: false
  },
  {
    id: 'vulnerability_scanning',
    name: 'Vulnerability Scanning',
    description: 'Regular security assessments and penetration testing',
    critical: false
  },
  {
    id: 'incident_response',
    name: 'Incident Response',
    description: 'Security incident handling and response procedures',
    critical: false
  },
  {
    id: 'data_anonymization',
    name: 'Data Anonymization',
    description: 'Data masking and anonymization capabilities',
    critical: false
  }
];

const DATA_SENSITIVITY_LEVELS = [
  { value: 'public', label: 'Public', description: 'No restrictions on access or sharing' },
  { value: 'internal', label: 'Internal', description: 'Restricted to organization members' },
  { value: 'confidential', label: 'Confidential', description: 'Sensitive business information' },
  { value: 'restricted', label: 'Restricted', description: 'Highly sensitive, requires special handling' }
];

const DEPLOYMENT_PREFERENCES = [
  {
    value: 'cloud_public',
    label: 'Public Cloud',
    description: 'AWS, Azure, GCP - managed by cloud provider',
    icon: <Globe className="w-4 h-4" />
  },
  {
    value: 'cloud_private',
    label: 'Private Cloud',
    description: 'Dedicated cloud infrastructure',
    icon: <Lock className="w-4 h-4" />
  },
  {
    value: 'on_premise',
    label: 'On-Premise',
    description: 'Deployed within organization infrastructure',
    icon: <Server className="w-4 h-4" />
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Combination of cloud and on-premise',
    icon: <Database className="w-4 h-4" />
  }
];

export function SecurityComplianceStep({ data, onUpdate, onNext, onPrevious, onSkip, isSubmitting }: SecurityComplianceStepProps) {
  const { trackEvent } = useAnalytics();
  const [complianceStandards, setComplianceStandards] = useState<string[]>([]);
  const [securityRequirements, setSecurityRequirements] = useState<string[]>([]);
  const [dataSensitivity, setDataSensitivity] = useState('');
  const [deploymentPreference, setDeploymentPreference] = useState('');
  const [dataResidency, setDataResidency] = useState('');
  const [securityConcerns, setSecurityConcerns] = useState('');
  const [existingSecurity, setExistingSecurity] = useState('');

  const security = data.security || {};

  useEffect(() => {
    trackEvent('customer_onboarding_step_viewed', {
      step: 'security_compliance',
      stepNumber: 5
    });

    // Initialize with existing data
    if (security.complianceStandards) setComplianceStandards(security.complianceStandards);
    if (security.securityRequirements) setSecurityRequirements(security.securityRequirements);
    if (security.dataSensitivity) setDataSensitivity(security.dataSensitivity);
    if (security.deploymentPreference) setDeploymentPreference(security.deploymentPreference);
    if (security.dataResidency) setDataResidency(security.dataResidency);
    if (security.securityConcerns) setSecurityConcerns(security.securityConcerns);
    if (security.existingSecurity) setExistingSecurity(security.existingSecurity);
  }, [trackEvent, security]);

  const handleComplianceToggle = (standardId: string, checked: boolean) => {
    const newStandards = checked
      ? [...complianceStandards, standardId]
      : complianceStandards.filter(id => id !== standardId);
    
    setComplianceStandards(newStandards);
  };

  const handleSecurityToggle = (requirementId: string, checked: boolean) => {
    const newRequirements = checked
      ? [...securityRequirements, requirementId]
      : securityRequirements.filter(id => id !== requirementId);
    
    setSecurityRequirements(newRequirements);
  };

  const updateData = () => {
    onUpdate({
      ...data,
      security: {
        complianceStandards,
        securityRequirements,
        dataSensitivity,
        deploymentPreference,
        dataResidency,
        securityConcerns,
        existingSecurity
      }
    });
  };

  const handleNext = () => {
    updateData();

    trackEvent('customer_onboarding_step_completed', {
      step: 'security_compliance',
      stepNumber: 5,
      complianceCount: complianceStandards.length,
      securityRequirements: securityRequirements.length,
      dataSensitivity,
      deploymentPreference
    });

    onNext();
  };

  const handleSkip = () => {
    trackEvent('customer_onboarding_step_skipped', {
      step: 'security_compliance',
      stepNumber: 5
    });

    onSkip();
  };

  const getCriticalRequirements = () => {
    return SECURITY_REQUIREMENTS.filter(req => req.critical && securityRequirements.includes(req.id));
  };

  const getOptionalRequirements = () => {
    return SECURITY_REQUIREMENTS.filter(req => !req.critical && securityRequirements.includes(req.id));
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Shield className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="font-medium">Security & Compliance Requirements</h3>
          <p className="text-sm text-muted-foreground">
            Define your security and compliance needs for the AI implementation (Optional)
          </p>
        </div>
      </div>

      {/* Compliance Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Compliance Standards
          </CardTitle>
          <CardDescription>
            Which compliance standards does your organization need to adhere to?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPLIANCE_STANDARDS.map((standard) => (
              <div
                key={standard.id}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  complianceStandards.includes(standard.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => handleComplianceToggle(standard.id, !complianceStandards.includes(standard.id))}
              >
                <Checkbox
                  checked={complianceStandards.includes(standard.id)}
                  readOnly
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{standard.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {standard.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{standard.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security Requirements
          </CardTitle>
          <CardDescription>
            Select the security measures that are important for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Critical Requirements */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Critical Security Requirements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SECURITY_REQUIREMENTS.filter(req => req.critical).map((requirement) => (
                  <div
                    key={requirement.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      securityRequirements.includes(requirement.id)
                        ? 'border-red-500 bg-red-50'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleSecurityToggle(requirement.id, !securityRequirements.includes(requirement.id))}
                  >
                    <Checkbox
                      checked={securityRequirements.includes(requirement.id)}
                      readOnly
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{requirement.name}</h4>
                      <p className="text-xs text-muted-foreground">{requirement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Requirements */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Additional Security Requirements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SECURITY_REQUIREMENTS.filter(req => !req.critical).map((requirement) => (
                  <div
                    key={requirement.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      securityRequirements.includes(requirement.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleSecurityToggle(requirement.id, !securityRequirements.includes(requirement.id))}
                  >
                    <Checkbox
                      checked={securityRequirements.includes(requirement.id)}
                      readOnly
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{requirement.name}</h4>
                      <p className="text-xs text-muted-foreground">{requirement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sensitivity & Deployment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Sensitivity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Data Sensitivity
            </CardTitle>
            <CardDescription>
              What is the sensitivity level of your data?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DATA_SENSITIVITY_LEVELS.map((level) => (
              <div
                key={level.value}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  dataSensitivity === level.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => setDataSensitivity(level.value)}
              >
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={dataSensitivity === level.value}
                    readOnly
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{level.label}</h4>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Deployment Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Deployment Preference
            </CardTitle>
            <CardDescription>
              Where would you prefer to deploy the AI solution?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DEPLOYMENT_PREFERENCES.map((pref) => (
              <div
                key={pref.value}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  deploymentPreference === pref.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => setDeploymentPreference(pref.value)}
              >
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={deploymentPreference === pref.value}
                    readOnly
                    className="rounded-full"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  {pref.icon}
                  <div>
                    <h4 className="font-medium text-sm">{pref.label}</h4>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Additional Security Information
          </CardTitle>
          <CardDescription>
            Provide additional context about your security requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataResidency">Data Residency Requirements</Label>
            <Select value={dataResidency} onValueChange={setDataResidency}>
              <SelectTrigger>
                <SelectValue placeholder="Where must data be stored?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_restriction">No restrictions</SelectItem>
                <SelectItem value="same_country">Must remain in same country</SelectItem>
                <SelectItem value="same_region">Must remain in same region (EU, US, etc.)</SelectItem>
                <SelectItem value="on_premise">Must remain on-premise</SelectItem>
                <SelectItem value="specific_locations">Specific approved locations only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="existingSecurity">Existing Security Infrastructure</Label>
            <Textarea
              id="existingSecurity"
              value={existingSecurity}
              onChange={(e) => setExistingSecurity(e.target.value)}
              placeholder="Describe your current security tools, policies, and infrastructure that the AI solution needs to integrate with..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="securityConcerns">Specific Security Concerns</Label>
            <Textarea
              id="securityConcerns"
              value={securityConcerns}
              onChange={(e) => setSecurityConcerns(e.target.value)}
              placeholder="Any specific security concerns or requirements not covered above?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {(complianceStandards.length > 0 || securityRequirements.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Security & Compliance Summary
            </CardTitle>
            <CardDescription>
              Review your security and compliance requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileCheck className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{complianceStandards.length}</div>
                <div className="text-sm text-muted-foreground">Compliance Standards</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                <div className="text-2xl font-bold text-red-600">{getCriticalRequirements().length}</div>
                <div className="text-sm text-muted-foreground">Critical Requirements</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Shield className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{getOptionalRequirements().length}</div>
                <div className="text-sm text-muted-foreground">Additional Requirements</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Lock className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="font-medium text-purple-600">
                  {DATA_SENSITIVITY_LEVELS.find(l => l.value === dataSensitivity)?.label || 'Not Set'}
                </div>
                <div className="text-sm text-muted-foreground">Data Sensitivity</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complianceStandards.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Compliance Standards:</h4>
                  <div className="flex flex-wrap gap-2">
                    {complianceStandards.map((standardId) => {
                      const standard = COMPLIANCE_STANDARDS.find(s => s.id === standardId);
                      return (
                        <Badge key={standardId} variant="secondary">
                          {standard?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {securityRequirements.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Security Requirements:</h4>
                  <div className="flex flex-wrap gap-2">
                    {securityRequirements.map((reqId) => {
                      const requirement = SECURITY_REQUIREMENTS.find(r => r.id === reqId);
                      return (
                        <Badge 
                          key={reqId} 
                          variant={requirement?.critical ? "destructive" : "outline"}
                        >
                          {requirement?.name}
                        </Badge>
                      );
                    })}
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
            Step 5 of 6 • Security requirements defined
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
              Skip
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}