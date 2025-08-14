import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Star, MapPin, Clock, DollarSign } from 'lucide-react';
import { generateSEO } from '@/lib/seo';
import { MAIN_CATEGORIES } from '@/lib/categories/data';

export const metadata: Metadata = generateSEO({
  title: 'Browse AI-Powered Freelancers',
  description: 'Discover and connect with verified AI-powered freelancers across all categories. Find the perfect match for your project with our intelligent matching system.',
  path: '/browse',
  keywords: 'browse freelancers, AI freelancers, hire talent, find experts, project matching',
});

export default function BrowsePage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Browse AI-Powered Freelancers</h1>
        <p className="text-muted-foreground max-w-2xl">
          Discover verified freelancers enhanced with AI capabilities. Use our intelligent matching 
          system to find the perfect talent for your project.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search skills, categories, or keywords..." 
              className="pl-10"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {MAIN_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id!}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-25">$0 - $25/hr</SelectItem>
              <SelectItem value="25-50">$25 - $50/hr</SelectItem>
              <SelectItem value="50-100">$50 - $100/hr</SelectItem>
              <SelectItem value="100+">$100+/hr</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Button className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Category Quick Filters */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Popular Categories</h3>
        <div className="flex flex-wrap gap-2">
          {MAIN_CATEGORIES.slice(0, 6).map((category) => (
            <Badge 
              key={category.id} 
              variant="secondary" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Sample freelancer cards */}
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Sarah Johnson</CardTitle>
                  <CardDescription>Full-Stack AI Developer</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">4.9</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>New York, NY</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>2 hrs response</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI-enhanced full-stack developer specializing in React, Node.js, and machine learning integration.
                10+ years experience building scalable applications.
              </p>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {['React', 'Node.js', 'Python', 'AI/ML'].map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">$85/hr</span>
                </div>
                <Button size="sm">View Profile</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center">
        <Button variant="outline" size="lg">
          Load More Results
        </Button>
      </div>
    </div>
  );
}