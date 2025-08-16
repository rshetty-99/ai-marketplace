'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickFilterCombo {
  id: string;
  label: string;
  icon: string;
  description: string;
  filters: {
    category?: string;
    providerType?: string;
    priceRange?: { min: number; max: number | null };
    features?: string[];
    industries?: string[];
    compliance?: string[];
    billingCycle?: string;
    complexity?: string;
    deploymentOptions?: string[];
  };
}

interface QuickFilterCombosProps {
  combos: QuickFilterCombo[];
  onSelectCombo: (combo: QuickFilterCombo) => void;
  className?: string;
}

export function QuickFilterCombos({ 
  combos, 
  onSelectCombo,
  className 
}: QuickFilterCombosProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-yellow-500" />
        <h3 className="text-sm font-semibold">Quick Filters</h3>
        <Badge variant="secondary" className="text-xs">Popular</Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
        {combos.map((combo) => (
          <Card
            key={combo.id}
            className="p-3 cursor-pointer hover:shadow-md transition-all hover:scale-105 border-2 hover:border-blue-500"
            onClick={() => onSelectCombo(combo)}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl">{combo.icon}</div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold line-clamp-2">{combo.label}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{combo.description}</p>
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {combo.filters.category && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {combo.filters.category.replace('_', ' ')}
                  </Badge>
                )}
                {combo.filters.priceRange && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    ${combo.filters.priceRange.min}+
                  </Badge>
                )}
                {combo.filters.industries?.slice(0, 1).map(industry => (
                  <Badge key={industry} variant="outline" className="text-xs px-1 py-0">
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Compact version for mobile
export function QuickFilterCombosCompact({ 
  combos, 
  onSelectCombo,
  className 
}: QuickFilterCombosProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <span className="text-xs font-medium">Quick Filters:</span>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {combos.map((combo) => (
          <Button
            key={combo.id}
            variant="outline"
            size="sm"
            onClick={() => onSelectCombo(combo)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-base">{combo.icon}</span>
            <span className="text-xs">{combo.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}