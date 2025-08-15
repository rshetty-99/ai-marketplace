'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, DollarSign, Calendar, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { CustomerOrganizationOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface BudgetTimelineStepProps {
  data: Partial<CustomerOrganizationOnboarding>;
  onUpdate: (data: Partial<CustomerOrganizationOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const BUDGET_RANGES = [
  { value: 'under_10k', label: 'Under $10,000', min: 0, max: 10000 },
  { value: '10k_50k', label: '$10,000 - $50,000', min: 10000, max: 50000 },
  { value: '50k_100k', label: '$50,000 - $100,000', min: 50000, max: 100000 },
  { value: '100k_250k', label: '$100,000 - $250,000', min: 100000, max: 250000 },
  { value: '250k_500k', label: '$250,000 - $500,000', min: 250000, max: 500000 },
  { value: 'over_500k', label: 'Over $500,000', min: 500000, max: 1000000 },
  { value: 'custom', label: 'Custom Range', min: 0, max: 0 }
];

const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (1-2 weeks)', weeks: 1.5 },
  { value: 'short', label: 'Short-term (1-3 months)', weeks: 8 },
  { value: 'medium', label: 'Medium-term (3-6 months)', weeks: 20 },
  { value: 'long', label: 'Long-term (6-12 months)', weeks: 40 },
  { value: 'extended', label: 'Extended (12+ months)', weeks: 60 }
];

const PROJECT_PHASES = [
  { id: 'discovery', name: 'Discovery & Planning', description: 'Requirements analysis and solution design' },
  { id: 'pilot', name: 'Pilot/Proof of Concept', description: 'Small-scale implementation to validate approach' },
  { id: 'development', name: 'Development & Integration', description: 'Full-scale development and system integration' },
  { id: 'testing', name: 'Testing & Validation', description: 'Comprehensive testing and quality assurance' },
  { id: 'deployment', name: 'Deployment & Launch', description: 'Production deployment and go-live' },
  { id: 'support', name: 'Support & Optimization', description: 'Ongoing support and performance optimization' }
];

export function BudgetTimelineStep({ data, onUpdate, onNext, onPrevious, onSkip, isSubmitting }: BudgetTimelineStepProps) {
  const { trackEvent } = useAnalytics();
  const [budgetRange, setBudgetRange] = useState('');
  const [customBudget, setCustomBudget] = useState({ min: 0, max: 0 });
  const [timeline, setTimeline] = useState('');
  const [urgency, setUrgency] = useState('');
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [budgetAllocation, setBudgetAllocation] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [constraints, setConstraints] = useState('');

  const budgetTimeline = data.budgetTimeline || {};

  useEffect(() => {
    trackEvent('customer_onboarding_step_viewed', {
      step: 'budget_timeline',
      stepNumber: 3
    });

    // Initialize with existing data
    if (budgetTimeline.budgetRange) setBudgetRange(budgetTimeline.budgetRange);
    if (budgetTimeline.customBudget) setCustomBudget(budgetTimeline.customBudget);
    if (budgetTimeline.timeline) setTimeline(budgetTimeline.timeline);
    if (budgetTimeline.urgency) setUrgency(budgetTimeline.urgency);
    if (budgetTimeline.selectedPhases) setSelectedPhases(budgetTimeline.selectedPhases);
    if (budgetTimeline.budgetAllocation) setBudgetAllocation(budgetTimeline.budgetAllocation);
    if (budgetTimeline.fundingSource) setFundingSource(budgetTimeline.fundingSource);
    if (budgetTimeline.constraints) setConstraints(budgetTimeline.constraints);
  }, [trackEvent, budgetTimeline]);

  const handlePhaseToggle = (phaseId: string) => {
    const newPhases = selectedPhases.includes(phaseId)
      ? selectedPhases.filter(id => id !== phaseId)
      : [...selectedPhases, phaseId];
    setSelectedPhases(newPhases);
  };

  const updateData = () => {
    onUpdate({
      ...data,
      budgetTimeline: {
        budgetRange,
        customBudget: budgetRange === 'custom' ? customBudget : undefined,
        timeline,
        urgency,
        selectedPhases,
        budgetAllocation,
        fundingSource,
        constraints
      }
    });
  };

  const handleNext = () => {
    updateData();
    
    trackEvent('customer_onboarding_step_completed', {
      step: 'budget_timeline',
      stepNumber: 3,
      budgetRange,
      timeline,
      urgency,
      phaseCount: selectedPhases.length
    });

    onNext();
  };

  const handleSkip = () => {
    trackEvent('customer_onboarding_step_skipped', {
      step: 'budget_timeline',
      stepNumber: 3
    });

    onSkip();
  };

  const getBudgetDisplay = () => {
    if (budgetRange === 'custom') {
      return customBudget.min > 0 || customBudget.max > 0 
        ? `$${customBudget.min.toLocaleString()} - $${customBudget.max.toLocaleString()}`
        : 'Custom Range';
    }
    const range = BUDGET_RANGES.find(r => r.value === budgetRange);
    return range?.label || 'Not specified';
  };

  const getTimelineDisplay = () => {
    const timelineOption = TIMELINE_OPTIONS.find(t => t.value === timeline);
    return timelineOption?.label || 'Not specified';
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <DollarSign className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="font-medium">Budget & Timeline</h3>
          <p className="text-sm text-muted-foreground">
            Help us understand your project budget and timeline expectations (Optional)
          </p>
        </div>
      </div>

      {/* Budget Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Project Budget
          </CardTitle>
          <CardDescription>
            What is your estimated budget range for this AI implementation?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Budget Range</Label>
            <RadioGroup value={budgetRange} onValueChange={setBudgetRange}>
              {BUDGET_RANGES.map((range) => (
                <div key={range.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={range.value} id={range.value} />
                  <Label htmlFor={range.value} className="cursor-pointer">{range.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {budgetRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBudget">Minimum Budget</Label>
                <Input
                  id="minBudget"
                  type="number"
                  value={customBudget.min}
                  onChange={(e) => setCustomBudget(prev => ({ ...prev, min: Number(e.target.value) }))}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBudget">Maximum Budget</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  value={customBudget.max}
                  onChange={(e) => setCustomBudget(prev => ({ ...prev, max: Number(e.target.value) }))}
                  placeholder="100000"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetAllocation">Budget Allocation</Label>
              <Select value={budgetAllocation} onValueChange={setBudgetAllocation}>
                <SelectTrigger>
                  <SelectValue placeholder="How is budget allocated?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upfront">Upfront payment</SelectItem>
                  <SelectItem value="milestones">Milestone-based payments</SelectItem>
                  <SelectItem value="monthly">Monthly payments</SelectItem>
                  <SelectItem value="mixed">Mixed approach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundingSource">Funding Source</Label>
              <Select value={fundingSource} onValueChange={setFundingSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Where is funding coming from?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal budget</SelectItem>
                  <SelectItem value="dedicated">Dedicated AI/Innovation budget</SelectItem>
                  <SelectItem value="grant">Grant funding</SelectItem>
                  <SelectItem value="investment">Investment/Venture capital</SelectItem>
                  <SelectItem value="loan">Loan/Financing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Project Timeline
          </CardTitle>
          <CardDescription>
            When do you need this AI solution implemented?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Desired Timeline</Label>
            <RadioGroup value={timeline} onValueChange={setTimeline}>
              {TIMELINE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue placeholder="How urgent is this project?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Flexible timeline</SelectItem>
                <SelectItem value="medium">Medium - Preferred timeline</SelectItem>
                <SelectItem value="high">High - Fixed deadline</SelectItem>
                <SelectItem value="critical">Critical - Urgent business need</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Project Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Project Phases
          </CardTitle>
          <CardDescription>
            Which phases are you interested in including in the project?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PROJECT_PHASES.map((phase) => (
              <div
                key={phase.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedPhases.includes(phase.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => handlePhaseToggle(phase.id)}
              >
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={selectedPhases.includes(phase.id)}
                    onChange={() => handlePhaseToggle(phase.id)}
                    className="rounded border-border"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{phase.name}</h4>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Constraints & Considerations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Constraints & Considerations
          </CardTitle>
          <CardDescription>
            Any budget or timeline constraints we should be aware of?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="Describe any budget constraints, approval processes, deadline requirements, or other considerations..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {(budgetRange || timeline) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Budget & Timeline Summary
            </CardTitle>
            <CardDescription>
              Review your budget and timeline preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <DollarSign className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="font-medium">{getBudgetDisplay()}</div>
                <div className="text-sm text-muted-foreground">Budget Range</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Clock className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="font-medium">{getTimelineDisplay()}</div>
                <div className="text-sm text-muted-foreground">Timeline</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Calendar className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">{selectedPhases.length}</div>
                <div className="text-sm text-muted-foreground">Project Phases</div>
              </div>
            </div>

            {selectedPhases.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Selected Project Phases:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPhases.map((phaseId) => {
                    const phase = PROJECT_PHASES.find(p => p.id === phaseId);
                    return (
                      <Badge key={phaseId} variant="secondary">
                        {phase?.name}
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
            Step 3 of 6 • Optional information
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