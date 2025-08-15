'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Target, Lightbulb, CheckCircle, Plus, Trash2, 
  FileText, Image, Mic, Video, Database, Bot, 
  Search, Shield, Zap, TrendingUp, Eye, MessageSquare 
} from 'lucide-react';
import { CustomerOrganizationOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface RequirementsStepProps {
  data: Partial<CustomerOrganizationOnboarding>;
  onUpdate: (data: Partial<CustomerOrganizationOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const AI_CATEGORIES = [
  {
    id: 'nlp',
    name: 'Natural Language Processing',
    description: 'Text analysis, chatbots, language understanding',
    icon: <FileText className="w-5 h-5" />,
    useCases: [
      'Document analysis and extraction',
      'Chatbots and virtual assistants',
      'Sentiment analysis',
      'Language translation',
      'Content generation',
      'Legal document review'
    ]
  },
  {
    id: 'computer_vision',
    name: 'Computer Vision',
    description: 'Image and video analysis, object detection',
    icon: <Image className="w-5 h-5" />,
    useCases: [
      'Image classification and tagging',
      'Object detection and tracking',
      'Facial recognition',
      'Quality control and inspection',
      'Medical image analysis',
      'Autonomous vehicle systems'
    ]
  },
  {
    id: 'speech_ai',
    name: 'Speech & Audio AI',
    description: 'Voice recognition, audio processing',
    icon: <Mic className="w-5 h-5" />,
    useCases: [
      'Speech-to-text transcription',
      'Voice assistants',
      'Audio classification',
      'Speaker identification',
      'Voice biometrics',
      'Real-time translation'
    ]
  },
  {
    id: 'predictive_analytics',
    name: 'Predictive Analytics',
    description: 'Forecasting, trend analysis, ML models',
    icon: <TrendingUp className="w-5 h-5" />,
    useCases: [
      'Sales forecasting',
      'Demand prediction',
      'Risk assessment',
      'Customer churn prediction',
      'Maintenance scheduling',
      'Market trend analysis'
    ]
  },
  {
    id: 'recommendation',
    name: 'Recommendation Systems',
    description: 'Personalization, content suggestions',
    icon: <Target className="w-5 h-5" />,
    useCases: [
      'Product recommendations',
      'Content personalization',
      'Search optimization',
      'Customer segmentation',
      'Dynamic pricing',
      'Targeted marketing'
    ]
  },
  {
    id: 'automation',
    name: 'Process Automation',
    description: 'Workflow automation, RPA, intelligent automation',
    icon: <Zap className="w-5 h-5" />,
    useCases: [
      'Document processing',
      'Data entry automation',
      'Invoice processing',
      'Customer service automation',
      'Compliance monitoring',
      'Report generation'
    ]
  }
];

const BUSINESS_OBJECTIVES = [
  { id: 'cost_reduction', label: 'Cost Reduction', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'efficiency', label: 'Operational Efficiency', icon: <Zap className="w-4 h-4" /> },
  { id: 'customer_experience', label: 'Customer Experience', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'innovation', label: 'Innovation & Competitive Advantage', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'compliance', label: 'Regulatory Compliance', icon: <Shield className="w-4 h-4" /> },
  { id: 'data_insights', label: 'Data-Driven Insights', icon: <Database className="w-4 h-4" /> },
  { id: 'automation', label: 'Process Automation', icon: <Bot className="w-4 h-4" /> },
  { id: 'risk_management', label: 'Risk Management', icon: <Shield className="w-4 h-4" /> },
];

export function RequirementsStep({ data, onUpdate, onNext, onPrevious, onSkip, isSubmitting }: RequirementsStepProps) {
  const { trackEvent } = useAnalytics();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedUseCases, setSelectedUseCases] = useState<Record<string, string[]>>({});
  const [businessObjectives, setBusinessObjectives] = useState<string[]>([]);
  const [customRequirements, setCustomRequirements] = useState<string[]>(['']);
  const [currentChallenges, setCurrentChallenges] = useState('');
  const [successMetrics, setSuccessMetrics] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('');

  const requirements = data.requirements || {};

  useEffect(() => {
    trackEvent('customer_onboarding_step_viewed', {
      step: 'requirements',
      stepNumber: 2
    });

    // Initialize with existing data
    if (requirements.aiCategories) {
      setSelectedCategories(requirements.aiCategories);
    }
    if (requirements.useCases) {
      setSelectedUseCases(requirements.useCases);
    }
    if (requirements.businessObjectives) {
      setBusinessObjectives(requirements.businessObjectives);
    }
    if (requirements.customRequirements) {
      setCustomRequirements(requirements.customRequirements);
    }
    if (requirements.currentChallenges) {
      setCurrentChallenges(requirements.currentChallenges);
    }
    if (requirements.successMetrics) {
      setSuccessMetrics(requirements.successMetrics);
    }
    if (requirements.priorityLevel) {
      setPriorityLevel(requirements.priorityLevel);
    }
  }, [trackEvent, requirements]);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const newCategories = checked 
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter(id => id !== categoryId);
    
    setSelectedCategories(newCategories);
    
    // Clear use cases for unchecked categories
    if (!checked && selectedUseCases[categoryId]) {
      const newUseCases = { ...selectedUseCases };
      delete newUseCases[categoryId];
      setSelectedUseCases(newUseCases);
    }
    
    updateData({
      aiCategories: newCategories,
      useCases: checked ? selectedUseCases : { ...selectedUseCases }
    });
  };

  const handleUseCaseToggle = (categoryId: string, useCase: string, checked: boolean) => {
    const categoryUseCases = selectedUseCases[categoryId] || [];
    const newUseCases = checked
      ? [...categoryUseCases, useCase]
      : categoryUseCases.filter(uc => uc !== useCase);
    
    const updatedUseCases = {
      ...selectedUseCases,
      [categoryId]: newUseCases
    };
    
    setSelectedUseCases(updatedUseCases);
    updateData({ useCases: updatedUseCases });
  };

  const handleObjectiveToggle = (objectiveId: string, checked: boolean) => {
    const newObjectives = checked
      ? [...businessObjectives, objectiveId]
      : businessObjectives.filter(id => id !== objectiveId);
    
    setBusinessObjectives(newObjectives);
    updateData({ businessObjectives: newObjectives });
  };

  const handleCustomRequirementChange = (index: number, value: string) => {
    const newRequirements = [...customRequirements];
    newRequirements[index] = value;
    setCustomRequirements(newRequirements);
    updateData({ customRequirements: newRequirements.filter(req => req.trim()) });
  };

  const addCustomRequirement = () => {
    setCustomRequirements([...customRequirements, '']);
  };

  const removeCustomRequirement = (index: number) => {
    const newRequirements = customRequirements.filter((_, i) => i !== index);
    setCustomRequirements(newRequirements);
    updateData({ customRequirements: newRequirements.filter(req => req.trim()) });
  };

  const updateData = (updates: Partial<CustomerOrganizationOnboarding['requirements']>) => {
    onUpdate({
      ...data,
      requirements: {
        ...requirements,
        ...updates,
        currentChallenges,
        successMetrics,
        priorityLevel
      }
    });
  };

  const handleNext = () => {
    updateData({
      currentChallenges,
      successMetrics,
      priorityLevel
    });

    trackEvent('customer_onboarding_step_completed', {
      step: 'requirements',
      stepNumber: 2,
      selectedCategories: selectedCategories.length,
      businessObjectives: businessObjectives.length,
      priorityLevel
    });

    onNext();
  };

  const handleSkip = () => {
    trackEvent('customer_onboarding_step_skipped', {
      step: 'requirements',
      stepNumber: 2
    });

    onSkip();
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Brain className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="font-medium">AI Requirements & Use Cases</h3>
          <p className="text-sm text-muted-foreground">
            Define your AI needs and business objectives (Optional - can be refined later)
          </p>
        </div>
      </div>

      {/* AI Categories Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Categories of Interest
          </CardTitle>
          <CardDescription>
            Select the AI technologies that align with your business needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AI_CATEGORIES.map((category) => (
              <div
                key={category.id}
                className={`p-4 border rounded-lg transition-all ${
                  selectedCategories.includes(category.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {category.icon}
                      <h3 className="font-medium">{category.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {category.description}
                    </p>
                    
                    {selectedCategories.includes(category.id) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Specific Use Cases:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {category.useCases.map((useCase) => (
                            <div key={useCase} className="flex items-center gap-2">
                              <Checkbox
                                size="sm"
                                checked={selectedUseCases[category.id]?.includes(useCase) || false}
                                onCheckedChange={(checked) => 
                                  handleUseCaseToggle(category.id, useCase, checked as boolean)
                                }
                              />
                              <label className="text-xs text-muted-foreground cursor-pointer">
                                {useCase}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Business Objectives
          </CardTitle>
          <CardDescription>
            What are your primary business goals for implementing AI?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {BUSINESS_OBJECTIVES.map((objective) => (
              <div
                key={objective.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  businessObjectives.includes(objective.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => handleObjectiveToggle(objective.id, !businessObjectives.includes(objective.id))}
              >
                <Checkbox
                  checked={businessObjectives.includes(objective.id)}
                  readOnly
                />
                {objective.icon}
                <span className="text-sm font-medium">{objective.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Current Challenges
          </CardTitle>
          <CardDescription>
            Describe the main challenges you're trying to solve with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={currentChallenges}
              onChange={(e) => setCurrentChallenges(e.target.value)}
              placeholder="Describe your current pain points, inefficiencies, or challenges that AI could help address..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priorityLevel">Priority Level</Label>
              <select
                id="priorityLevel"
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select priority</option>
                <option value="low">Low - Exploratory</option>
                <option value="medium">Medium - Important but not urgent</option>
                <option value="high">High - Critical business need</option>
                <option value="urgent">Urgent - Immediate implementation required</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="successMetrics">Success Metrics</Label>
              <Input
                id="successMetrics"
                value={successMetrics}
                onChange={(e) => setSuccessMetrics(e.target.value)}
                placeholder="How will you measure success?"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Additional Requirements
          </CardTitle>
          <CardDescription>
            Any specific requirements or constraints we should know about?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {customRequirements.map((requirement, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={requirement}
                onChange={(e) => handleCustomRequirementChange(index, e.target.value)}
                placeholder="Enter a specific requirement..."
                className="flex-1"
              />
              {customRequirements.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeCustomRequirement(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={addCustomRequirement} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Requirement
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      {(selectedCategories.length > 0 || businessObjectives.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Requirements Summary
            </CardTitle>
            <CardDescription>
              Review your AI requirements and objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Brain className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{selectedCategories.length}</div>
                <div className="text-sm text-muted-foreground">AI Categories</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Target className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{businessObjectives.length}</div>
                <div className="text-sm text-muted-foreground">Business Objectives</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Lightbulb className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(selectedUseCases).flat().length}
                </div>
                <div className="text-sm text-muted-foreground">Use Cases</div>
              </div>
            </div>

            {selectedCategories.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Selected AI Categories:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((categoryId) => {
                    const category = AI_CATEGORIES.find(c => c.id === categoryId);
                    return (
                      <Badge key={categoryId} variant="secondary">
                        {category?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {businessObjectives.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Business Objectives:</h4>
                <div className="flex flex-wrap gap-2">
                  {businessObjectives.map((objectiveId) => {
                    const objective = BUSINESS_OBJECTIVES.find(o => o.id === objectiveId);
                    return (
                      <Badge key={objectiveId} variant="outline">
                        {objective?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
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
            Step 2 of 6 • Optional - can be refined later
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