'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "@/components/shared/search/global-search";
import { Header } from "@/components/shared/navigation/header";
//Temporary: Uncomment the line below and comment the line above if Clerk is having issues
//import { SimpleHeader as Header } from "@/components/shared/navigation/header-simple";
import { Footer } from "@/components/shared/navigation/footer";
import { FeaturedServicesCarousel } from "@/components/features/homepage/featured-services-carousel";
import { SuccessStories } from "@/components/features/homepage/success-stories";
import {
  ArrowRight,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Brain,
  Cpu,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { MAIN_CATEGORIES } from "@/lib/categories/data";
import { SERVICE_CATEGORIES } from "@/lib/data/featured-categories";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/structured-data";
import Script from "next/script";
import { useAnalytics } from "@/components/providers/analytics-provider";

export default function Home() {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();
  const { trackEvent } = useAnalytics();

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    trackEvent('category_selected', {
      category_id: categoryId,
      category_name: categoryName,
      location: 'homepage_categories',
    });
  };

  const handleCTAClick = (ctaType: string, destination: string) => {
    trackEvent('cta_clicked', {
      cta_type: ctaType,
      destination: destination,
      location: 'homepage',
    });
  };

  const handleFeaturedServiceClick = (service: any) => {
    trackEvent('featured_service_clicked', {
      service_id: service.id,
      service_name: service.name,
      provider: service.provider.name,
      location: 'homepage_carousel',
    });
  };

  return (
    <div className="min-h-screen">
      {/* Structured Data for SEO */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 text-center space-y-8">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
              <Zap className="mr-2 h-4 w-4" />
              Trusted by 500+ Organizations
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight dark:text-white">
              Enterprise{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                AI Marketplace
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Connect with leading AI service providers. Discover machine
              learning solutions, AI consulting, and custom development services
              for your enterprise transformation.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <Search />
          </div>

          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Button 
              size="lg" 
              asChild 
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white shadow-lg border-0"
              onClick={() => handleCTAClick('explore_services', '/catalog')}
            >
              <Link href="/catalog">
                Explore AI Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="h-12 px-8 bg-white dark:bg-gray-900 border-2 border-gradient-to-r from-blue-600 to-purple-600 hover:bg-gradient-to-r hover:from-blue-600/10 hover:to-purple-600/10 dark:hover:from-blue-500/10 dark:hover:to-purple-500/10 text-gray-900 dark:text-white transition-all"
              style={{
                borderImage: 'linear-gradient(to right, rgb(37, 99, 235), rgb(147, 51, 234)) 1',
              }}
              onClick={() => handleCTAClick('browse_providers', '/providers')}
            >
              <Link href="/providers">Browse Providers</Link>
            </Button>
          </div>

          <div className="flex justify-center gap-8 text-sm text-muted-foreground dark:text-gray-400 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Verified AI Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>Enterprise-Grade Solutions</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>GDPR & SOC2 Compliant</span>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-600/10 dark:to-purple-600/10 rounded-full blur-3xl" />
      </section>

      {/* Featured Services Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending Now
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold dark:text-white">
              Featured AI Services
            </h2>
            <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
              Discover top-rated AI solutions trusted by leading enterprises
            </p>
          </div>

          <FeaturedServicesCarousel onServiceClick={handleFeaturedServiceClick} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold dark:text-white">
              Why Choose Our AI Marketplace?
            </h2>
            <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
              Access enterprise-grade AI solutions with confidence, security,
              and transparency
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-700">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Intelligent Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Advanced AI algorithms match your specific requirements with
                  the most suitable service providers and solutions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-700">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  GDPR, HIPAA, and SOC2 compliant platform with multi-tenant
                  security architecture and comprehensive audit trails.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-700">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Cpu className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Verified Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Thoroughly vetted AI service providers with proven track
                  records, certifications, and transparent reviews.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-700">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Success Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Real-time project analytics, success metrics, and ROI tracking
                  to maximize your AI investment returns.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold dark:text-white">
              AI Service Categories
            </h2>
            <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
              Discover specialized AI solutions across key technology domains
              and industry verticals
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
            {SERVICE_CATEGORIES.map((category) => (
              <Link 
                key={category.id} 
                href={`/catalog?category=${category.id}`}
                onClick={() => handleCategoryClick(category.id, category.name)}
              >
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-0 shadow-md hover:scale-105 group dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-3xl">{category.emoji}</div>
                      <div className="flex items-center gap-2">
                        {category.trending && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {category.serviceCount} services
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold mb-2">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Popular Use Cases:</p>
                        <ul className="text-xs text-muted-foreground dark:text-gray-400 space-y-1">
                          {category.useCases.slice(0, 3).map((useCase, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 dark:text-blue-400 mr-1">•</span>
                              <span className="line-clamp-1">{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                        >
                          Explore {category.name}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild className="h-12 px-8">
              <Link href="/catalog">Explore All AI Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <SuccessStories />

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 dark:from-blue-800 dark:via-blue-900 dark:to-purple-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] dark:bg-grid-white/[0.02] -z-0" />
        <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold">
              Transform Your Business with AI
            </h2>
            <p className="text-xl md:text-2xl opacity-90 max-w-4xl mx-auto leading-relaxed">
              Join 500+ organizations already accelerating their AI
              transformation through our marketplace. Connect with verified
              providers and unlock the power of enterprise AI solutions.
            </p>
          </div>

          <div className="flex gap-6 justify-center flex-col sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="h-14 px-8 text-lg font-semibold"
            >
              <Link href="/catalog" className="flex items-center gap-2">
                Start Exploring
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-700 dark:hover:bg-gray-100 dark:hover:text-blue-800"
            >
              <Link href="/auth/sign-up">Create Free Account</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-12 border-t border-white/20 dark:border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center opacity-80">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm">Organizations</div>
              </div>
              <div>
                <div className="text-3xl font-bold">150+</div>
                <div className="text-sm">AI Providers</div>
              </div>
              <div>
                <div className="text-3xl font-bold">$50M+</div>
                <div className="text-sm">Projects Value</div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl" />
      </section>

      <Footer />
    </div>
  );
}
