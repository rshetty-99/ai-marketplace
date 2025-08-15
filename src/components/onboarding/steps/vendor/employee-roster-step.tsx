'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, Plus, Trash2, Mail, Phone, MapPin, Calendar, 
  UserPlus, Building, CheckCircle, AlertCircle, Edit2 
} from 'lucide-react';
import { VendorCompanyOnboarding, EmployeeInfo } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface EmployeeRosterStepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const DEPARTMENTS = [
  'Engineering',
  'Product Management',
  'Design',
  'Sales',
  'Marketing',
  'Customer Success',
  'Operations',
  'Finance',
  'Human Resources',
  'Legal',
  'Data Science',
  'Quality Assurance',
  'DevOps',
  'Security',
  'Research & Development',
  'Other'
];

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'intern', label: 'Intern' }
];

const SENIORITY_LEVELS = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
  { value: 'director', label: 'Director' },
  { value: 'vp', label: 'VP' },
  { value: 'c_level', label: 'C-Level' }
];

export function EmployeeRosterStep({ data, onUpdate, onNext, onPrevious, isSubmitting }: EmployeeRosterStepProps) {
  const { trackEvent } = useAnalytics();
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<EmployeeInfo>>({
    name: '',
    email: '',
    jobTitle: '',
    department: '',
    employmentType: 'full_time',
    seniorityLevel: 'mid',
    startDate: '',
    phone: '',
    location: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const employeeRoster = data.employeeRoster || {};

  useEffect(() => {
    trackEvent('vendor_onboarding_step_viewed', {
      step: 'employee_roster',
      stepNumber: 3
    });

    // Initialize with existing employees
    if (employeeRoster.employees && employeeRoster.employees.length > 0) {
      setEmployees(employeeRoster.employees);
    }
  }, [trackEvent, employeeRoster.employees]);

  const handleAddEmployee = () => {
    if (validateEmployee(newEmployee)) {
      const employee: EmployeeInfo = {
        id: `emp_${Date.now()}`,
        name: newEmployee.name!,
        email: newEmployee.email!,
        jobTitle: newEmployee.jobTitle!,
        department: newEmployee.department!,
        employmentType: newEmployee.employmentType as any,
        seniorityLevel: newEmployee.seniorityLevel as any,
        startDate: newEmployee.startDate!,
        phone: newEmployee.phone,
        location: newEmployee.location,
        isActive: true,
        invitationSent: false,
        roleAssigned: false
      };

      const updatedEmployees = [...employees, employee];
      setEmployees(updatedEmployees);
      updateData({ employees: updatedEmployees });

      // Reset form
      setNewEmployee({
        name: '',
        email: '',
        jobTitle: '',
        department: '',
        employmentType: 'full_time',
        seniorityLevel: 'mid',
        startDate: '',
        phone: '',
        location: ''
      });
      setIsAddingEmployee(false);
      setErrors({});

      trackEvent('vendor_employee_added', {
        department: employee.department,
        employmentType: employee.employmentType,
        seniorityLevel: employee.seniorityLevel
      });
    }
  };

  const handleUpdateEmployee = (employeeId: string, updates: Partial<EmployeeInfo>) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === employeeId ? { ...emp, ...updates } : emp
    );
    setEmployees(updatedEmployees);
    updateData({ employees: updatedEmployees });
  };

  const handleDeleteEmployee = (employeeId: string) => {
    const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
    setEmployees(updatedEmployees);
    updateData({ employees: updatedEmployees });

    trackEvent('vendor_employee_removed', {
      totalEmployees: updatedEmployees.length
    });
  };

  const validateEmployee = (employee: Partial<EmployeeInfo>): boolean => {
    const newErrors: Record<string, string> = {};

    if (!employee.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!employee.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      newErrors.email = 'Invalid email format';
    } else if (employees.some(emp => emp.email === employee.email)) {
      newErrors.email = 'Email already exists';
    }

    if (!employee.jobTitle?.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!employee.department?.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!employee.startDate?.trim()) {
      newErrors.startDate = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateData = (updates: Partial<VendorCompanyOnboarding['employeeRoster']>) => {
    onUpdate({
      ...data,
      employeeRoster: {
        ...employeeRoster,
        ...updates,
        totalCount: employees.length + (updates.employees ? updates.employees.length - employees.length : 0),
        departmentBreakdown: calculateDepartmentBreakdown(updates.employees || employees)
      }
    });
  };

  const calculateDepartmentBreakdown = (employeeList: EmployeeInfo[]) => {
    const breakdown: Record<string, number> = {};
    employeeList.forEach(emp => {
      breakdown[emp.department] = (breakdown[emp.department] || 0) + 1;
    });
    return breakdown;
  };

  const handleNext = () => {
    trackEvent('vendor_onboarding_step_completed', {
      step: 'employee_roster',
      stepNumber: 3,
      employeeCount: employees.length,
      departmentCount: Object.keys(calculateDepartmentBreakdown(employees)).length
    });

    onNext();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Engineering': 'bg-blue-100 text-blue-800',
      'Product Management': 'bg-purple-100 text-purple-800',
      'Design': 'bg-pink-100 text-pink-800',
      'Sales': 'bg-green-100 text-green-800',
      'Marketing': 'bg-orange-100 text-orange-800',
      'Customer Success': 'bg-cyan-100 text-cyan-800',
      'Operations': 'bg-gray-100 text-gray-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Human Resources': 'bg-red-100 text-red-800',
      'Legal': 'bg-indigo-100 text-indigo-800',
      'Data Science': 'bg-emerald-100 text-emerald-800',
      'Quality Assurance': 'bg-violet-100 text-violet-800',
      'DevOps': 'bg-slate-100 text-slate-800',
      'Security': 'bg-rose-100 text-rose-800',
      'Research & Development': 'bg-teal-100 text-teal-800',
      'Other': 'bg-neutral-100 text-neutral-800'
    };
    return colors[department as keyof typeof colors] || colors['Other'];
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Users className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-medium">Employee Roster</h3>
          <p className="text-sm text-muted-foreground">
            Add your team members and define the organizational structure
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team Members ({employees.length})
                  </CardTitle>
                  <CardDescription>
                    Manage your company's employee roster
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingEmployee(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {employees.length > 0 ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary/10">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.jobTitle}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getDepartmentColor(employee.department)}`}
                              >
                                {employee.department}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {EMPLOYMENT_TYPES.find(t => t.value === employee.employmentType)?.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {employee.email}
                            </div>
                            {employee.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {employee.phone}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">No Employees Added</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start building your team roster by adding employees
                  </p>
                  <Button onClick={() => setIsAddingEmployee(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Employee
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Employee Form / Statistics */}
        <div className="space-y-6">
          {isAddingEmployee ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Employee
                </CardTitle>
                <CardDescription>
                  Enter employee information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newEmployee.name || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@company.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={newEmployee.jobTitle || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="Senior Software Engineer"
                    className={errors.jobTitle ? 'border-red-500' : ''}
                  />
                  {errors.jobTitle && (
                    <p className="text-sm text-red-500">{errors.jobTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={newEmployee.department || ''}
                    onValueChange={(value) => setNewEmployee(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-red-500">{errors.department}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={newEmployee.employmentType || 'full_time'}
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, employmentType: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seniorityLevel">Seniority Level</Label>
                    <Select
                      value={newEmployee.seniorityLevel || 'mid'}
                      onValueChange={(value) => setNewEmployee(prev => ({ ...prev, seniorityLevel: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SENIORITY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newEmployee.startDate || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, startDate: e.target.value }))}
                    className={errors.startDate ? 'border-red-500' : ''}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newEmployee.phone || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={newEmployee.location || ''}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddEmployee} className="flex-1">
                    Add Employee
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddingEmployee(false);
                      setErrors({});
                      setNewEmployee({
                        name: '',
                        email: '',
                        jobTitle: '',
                        department: '',
                        employmentType: 'full_time',
                        seniorityLevel: 'mid',
                        startDate: '',
                        phone: '',
                        location: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Team Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
                      <div className="text-sm text-muted-foreground">Total Employees</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Object.keys(calculateDepartmentBreakdown(employees)).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Departments</div>
                    </div>
                  </div>

                  {employees.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Department Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(calculateDepartmentBreakdown(employees)).map(([dept, count]) => (
                            <div key={dept} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">{dept}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {employees.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-muted-foreground mb-2">Build Your Team</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add employees to get started with your organizational structure
                    </p>
                    <Button onClick={() => setIsAddingEmployee(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Employee
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
            Step 3 of 8 • {employees.length} employees added
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}