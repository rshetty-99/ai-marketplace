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
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Upload, FileCheck, AlertTriangle, CheckCircle, 
  Clock, Calendar, Download, ExternalLink, Lock, 
  Award, Building, Globe, Users, Database, Zap 
} from 'lucide-react';
import { VendorCompanyOnboarding, ComplianceDocument } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface ComplianceInfoStepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const COMPLIANCE_STANDARDS = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    description: 'System and Organization Controls for service organizations',
    required: true,
    category: 'Security',
    icon: <Shield className="w-4 h-4" />
  },
  {
    id: 'gdpr',
    name: 'GDPR Compliance',
    description: 'General Data Protection Regulation compliance',
    required: true,
    category: 'Privacy',
    icon: <Lock className="w-4 h-4" />
  },
  {
    id: 'hipaa',
    name: 'HIPAA Compliance',
    description: 'Health Insurance Portability and Accountability Act',
    required: false,
    category: 'Healthcare',
    icon: <Building className="w-4 h-4" />
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Information Security Management System',
    required: false,
    category: 'Security',
    icon: <Award className="w-4 h-4" />
  },
  {
    id: 'pci_dss',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    required: false,
    category: 'Payment',
    icon: <Database className="w-4 h-4" />
  },
  {
    id: 'fedramp',
    name: 'FedRAMP',
    description: 'Federal Risk and Authorization Management Program',
    required: false,
    category: 'Government',
    icon: <Globe className="w-4 h-4" />
  },
  {
    id: 'ccpa',
    name: 'CCPA',
    description: 'California Consumer Privacy Act',
    required: false,
    category: 'Privacy',
    icon: <Users className="w-4 h-4" />
  }
];

const DOCUMENT_TYPES = [
  'Security Audit Report',
  'Compliance Certificate',
  'Privacy Policy',
  'Data Processing Agreement',
  'Security Whitepaper',
  'Penetration Test Report',
  'Business Associate Agreement',
  'Other'
];

const COMPLIANCE_STATUS_OPTIONS = [
  { value: 'certified', label: 'Certified', color: 'text-green-600' },
  { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600' },
  { value: 'planning', label: 'Planning', color: 'text-blue-600' },
  { value: 'not_applicable', label: 'Not Applicable', color: 'text-gray-600' }
];

export function ComplianceInfoStep({ data, onUpdate, onNext, onPrevious, isSubmitting }: ComplianceInfoStepProps) {
  const { trackEvent } = useAnalytics();
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<Record<string, string>>({});
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: '',
    description: '',
    standard: '',
    expiryDate: '',
    issuedBy: ''
  });

  const complianceInfo = data.complianceInfo || {};

  useEffect(() => {
    trackEvent('vendor_onboarding_step_viewed', {
      step: 'compliance_info',
      stepNumber: 5
    });

    // Initialize with existing data
    if (complianceInfo.documents && complianceInfo.documents.length > 0) {
      setDocuments(complianceInfo.documents);
    }
    if (complianceInfo.certifications) {
      setComplianceStatus(complianceInfo.certifications);
    }
  }, [trackEvent, complianceInfo.documents, complianceInfo.certifications]);

  const handleComplianceStatusChange = (standardId: string, status: string) => {
    const updatedStatus = { ...complianceStatus, [standardId]: status };
    setComplianceStatus(updatedStatus);
    updateData({ certifications: updatedStatus });

    trackEvent('vendor_compliance_status_updated', {
      standard: standardId,
      status,
      totalCertified: Object.values(updatedStatus).filter(s => s === 'certified').length
    });
  };

  const handleAddDocument = () => {
    if (!newDocument.name.trim() || !newDocument.type.trim()) return;

    const document: ComplianceDocument = {
      id: `doc_${Date.now()}`,
      name: newDocument.name,
      type: newDocument.type,
      description: newDocument.description,
      standard: newDocument.standard,
      uploadedAt: new Date(),
      expiryDate: newDocument.expiryDate ? new Date(newDocument.expiryDate) : undefined,
      issuedBy: newDocument.issuedBy,
      verified: false,
      fileSize: 0, // Would be set during actual file upload
      fileType: 'pdf' // Would be determined from file
    };

    const updatedDocuments = [...documents, document];
    setDocuments(updatedDocuments);
    updateData({ documents: updatedDocuments });

    // Reset form
    setNewDocument({
      name: '',
      type: '',
      description: '',
      standard: '',
      expiryDate: '',
      issuedBy: ''
    });
    setIsUploadingDocument(false);

    trackEvent('vendor_compliance_document_added', {
      documentType: document.type,
      standard: document.standard,
      totalDocuments: updatedDocuments.length
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    updateData({ documents: updatedDocuments });

    trackEvent('vendor_compliance_document_removed', {
      totalDocuments: updatedDocuments.length
    });
  };

  const updateData = (updates: Partial<VendorCompanyOnboarding['complianceInfo']>) => {
    onUpdate({
      ...data,
      complianceInfo: {
        ...complianceInfo,
        ...updates
      }
    });
  };

  const handleNext = () => {
    // Calculate compliance score
    const totalStandards = COMPLIANCE_STANDARDS.length;
    const certifiedCount = Object.values(complianceStatus).filter(status => status === 'certified').length;
    const complianceScore = Math.round((certifiedCount / totalStandards) * 100);

    updateData({ 
      complianceScore,
      lastUpdated: new Date()
    });

    trackEvent('vendor_onboarding_step_completed', {
      step: 'compliance_info',
      stepNumber: 5,
      complianceScore,
      documentCount: documents.length,
      certifiedStandards: certifiedCount
    });

    onNext();
  };

  const getComplianceScore = () => {
    const totalStandards = COMPLIANCE_STANDARDS.length;
    const certifiedCount = Object.values(complianceStatus).filter(status => status === 'certified').length;
    return Math.round((certifiedCount / totalStandards) * 100);
  };

  const getRequiredComplianceCount = () => {
    const requiredStandards = COMPLIANCE_STANDARDS.filter(s => s.required);
    const certifiedRequired = requiredStandards.filter(s => 
      complianceStatus[s.id] === 'certified'
    ).length;
    return { certified: certifiedRequired, total: requiredStandards.length };
  };

  const getStatusColor = (status: string) => {
    const statusOption = COMPLIANCE_STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.color || 'text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const statusOption = COMPLIANCE_STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.label || 'Unknown';
  };

  const requiredCompliance = getRequiredComplianceCount();
  const complianceScore = getComplianceScore();

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Shield className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-medium">Compliance Documentation</h3>
          <p className="text-sm text-muted-foreground">
            Upload compliance certificates and security documentation
          </p>
        </div>
      </div>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Compliance Overview
          </CardTitle>
          <CardDescription>
            Track your compliance status across industry standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{complianceScore}%</div>
              <div className="text-sm text-muted-foreground">Overall Compliance</div>
              <Progress value={complianceScore} className="mt-2 h-2" />
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {requiredCompliance.certified}/{requiredCompliance.total}
              </div>
              <div className="text-sm text-muted-foreground">Required Standards</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{documents.length}</div>
              <div className="text-sm text-muted-foreground">Documents Uploaded</div>
            </div>
          </div>

          <div className="space-y-4">
            {COMPLIANCE_STANDARDS.map((standard) => (
              <div key={standard.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {standard.icon}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{standard.name}</span>
                      {standard.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{standard.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{standard.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Select
                    value={complianceStatus[standard.id] || ''}
                    onValueChange={(value) => handleComplianceStatusChange(standard.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLIANCE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className={option.color}>{option.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {complianceStatus[standard.id] && (
                    <div className={`flex items-center gap-1 ${getStatusColor(complianceStatus[standard.id])}`}>
                      {complianceStatus[standard.id] === 'certified' && <CheckCircle className="w-4 h-4" />}
                      {complianceStatus[standard.id] === 'in_progress' && <Clock className="w-4 h-4" />}
                      {complianceStatus[standard.id] === 'planning' && <Calendar className="w-4 h-4" />}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Compliance Documents ({documents.length})
                </CardTitle>
                <CardDescription>
                  Manage your compliance certificates and reports
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsUploadingDocument(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {documents.map((document) => (
                    <div key={document.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileCheck className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm">{document.name}</span>
                            {document.verified && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{document.type}</Badge>
                              {document.standard && (
                                <Badge variant="secondary" className="text-xs">{document.standard}</Badge>
                              )}
                            </div>
                            
                            {document.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {document.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Uploaded: {document.uploadedAt.toLocaleDateString()}</span>
                              {document.expiryDate && (
                                <span className={
                                  document.expiryDate < new Date() 
                                    ? 'text-red-600' 
                                    : document.expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                    ? 'text-yellow-600'
                                    : ''
                                }>
                                  Expires: {document.expiryDate.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            
                            {document.issuedBy && (
                              <div className="text-xs text-muted-foreground">
                                Issued by: {document.issuedBy}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-3">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDocument(document.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <FileCheck className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">No Documents Uploaded</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload compliance certificates to verify your standards
                </p>
                <Button onClick={() => setIsUploadingDocument(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isUploadingDocument ? <Upload className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {isUploadingDocument ? 'Upload Document' : 'Compliance Status'}
            </CardTitle>
            <CardDescription>
              {isUploadingDocument 
                ? 'Add a new compliance document'
                : 'Track your compliance progress'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isUploadingDocument ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentName">Document Name *</Label>
                  <Input
                    id="documentName"
                    value={newDocument.name}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="SOC 2 Type II Report 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Select
                    value={newDocument.type}
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complianceStandard">Related Standard</Label>
                  <Select
                    value={newDocument.standard}
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, standard: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select compliance standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLIANCE_STANDARDS.map((standard) => (
                        <SelectItem key={standard.id} value={standard.id}>
                          {standard.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuedBy">Issued By</Label>
                  <Input
                    id="issuedBy"
                    value={newDocument.issuedBy}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, issuedBy: e.target.value }))}
                    placeholder="Auditing Firm or Certification Body"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newDocument.expiryDate}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentDescription">Description</Label>
                  <Textarea
                    id="documentDescription"
                    value={newDocument.description}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the document..."
                    rows={3}
                  />
                </div>

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your file here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: PDF, DOC, DOCX (Max 10MB)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddDocument} disabled={!newDocument.name || !newDocument.type}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button variant="outline" onClick={() => setIsUploadingDocument(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Compliance Progress</span>
                    <span className="text-sm text-muted-foreground">{complianceScore}%</span>
                  </div>
                  <Progress value={complianceScore} className="h-2" />
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Status Summary</h4>
                  <div className="space-y-2">
                    {COMPLIANCE_STATUS_OPTIONS.map((option) => {
                      const count = Object.values(complianceStatus).filter(s => s === option.value).length;
                      return (
                        <div key={option.value} className="flex justify-between items-center">
                          <span className={`text-sm ${option.color}`}>{option.label}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {documents.length === 0 && (
                  <>
                    <Separator />
                    <div className="text-center">
                      <FileCheck className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload your first compliance document
                      </p>
                      <Button onClick={() => setIsUploadingDocument(true)} size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Get Started
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Step 5 of 8 • {complianceScore}% compliance achieved
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}