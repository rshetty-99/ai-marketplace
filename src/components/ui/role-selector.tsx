/**
 * Dynamic Role Selector Component
 * Fetches roles from Firestore collections instead of hard-coding
 * Provides organized, searchable role selection with descriptions
 */

import React, { useState } from 'react';
import { ChevronDown, Search, Users, Shield, Building, User } from 'lucide-react';
import { useRoleOptions } from '../../hooks/use-rbac-data';
import { cn } from '../../lib/utils';

export interface RoleSelectorProps {
  value?: string;
  onChange: (roleId: string) => void;
  userType?: 'platform' | 'freelancer' | 'vendor' | 'customer';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showDescriptions?: boolean;
  showCategories?: boolean;
  error?: string;
}

const USER_TYPE_ICONS = {
  platform: Shield,
  freelancer: User,
  vendor: Building,
  customer: Users
};

const CATEGORY_LABELS = {
  platform_admin: 'Platform Administration',
  platform_ops: 'Platform Operations', 
  platform_support: 'Platform Support',
  freelancer: 'Independent Providers',
  vendor_admin: 'Vendor Administration',
  vendor_ops: 'Vendor Operations',
  vendor_specialist: 'Vendor Specialists',
  customer_admin: 'Customer Administration',
  customer_ops: 'Customer Operations'
};

export function RoleSelector({
  value,
  onChange,
  userType,
  placeholder = 'Select a role...',
  disabled = false,
  className,
  showDescriptions = true,
  showCategories = true,
  error
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { roleOptions, groupedRoleOptions, isLoading, error: fetchError } = useRoleOptions(userType);

  // Filter options based on search term
  const filteredOptions = roleOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter grouped options based on search term
  const filteredGroupedOptions = Object.entries(groupedRoleOptions).reduce((acc, [category, options]) => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof roleOptions>);

  const selectedRole = roleOptions.find(option => option.value === value);
  const UserTypeIcon = userType ? USER_TYPE_ICONS[userType] : Users;

  const handleSelect = (roleId: string) => {
    onChange(roleId);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className={cn('relative', className)}>
        <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
          <span className="text-muted-foreground">Loading roles...</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={cn('relative', className)}>
        <div className="flex h-10 w-full items-center justify-between rounded-md border border-destructive bg-background px-3 py-2 text-sm ring-offset-background">
          <span className="text-destructive">Error loading roles</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
        <p className="mt-1 text-sm text-destructive">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive',
          className
        )}
      >
        <div className="flex items-center gap-2">
          {userType && <UserTypeIcon className="h-4 w-4 text-muted-foreground" />}
          <span className={selectedRole ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedRole ? selectedRole.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-0 text-popover-foreground shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-2 text-sm bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {showCategories ? (
              // Grouped display by category
              Object.entries(filteredGroupedOptions).map(([category, options]) => (
                <div key={category}>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
                  </div>
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground border-b border-border/50 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        {option.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      {showDescriptions && (
                        <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              // Simple list display
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground border-b border-border/50 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {option.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {showDescriptions && (
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  )}
                </button>
              ))
            )}

            {filteredOptions.length === 0 && searchTerm && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No roles found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Convenience components for specific user types
export function PlatformRoleSelector(props: Omit<RoleSelectorProps, 'userType'>) {
  return <RoleSelector {...props} userType="platform" />;
}

export function VendorRoleSelector(props: Omit<RoleSelectorProps, 'userType'>) {
  return <RoleSelector {...props} userType="vendor" />;
}

export function CustomerRoleSelector(props: Omit<RoleSelectorProps, 'userType'>) {
  return <RoleSelector {...props} userType="customer" />;
}

export function FreelancerRoleSelector(props: Omit<RoleSelectorProps, 'userType'>) {
  return <RoleSelector {...props} userType="freelancer" />;
}