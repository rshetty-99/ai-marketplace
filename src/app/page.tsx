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

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-20 text-center space-y-8">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <Zap className="mr-2 h-4 w-4" />
              Trusted by 500+ Organizations
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Enterprise{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Marketplace
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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
            <Button size="lg" asChild className="h-12 px-8">
              <Link href="/catalog">
                Explore AI Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8">
              <Link href="/providers">Browse Providers</Link>
            </Button>
          </div>

          <div className="flex justify-center gap-8 text-sm text-muted-foreground flex-wrap">
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              Why Choose Our AI Marketplace?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access enterprise-grade AI solutions with confidence, security,
              and transparency
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
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

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
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

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
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

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">
              AI Service Categories
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover specialized AI solutions across key technology domains
              and industry verticals
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* TODO: Replace with actual AI service categories from data */}
            {[
              {
                id: "computer_vision",
                name: "Computer Vision",
                description:
                  "Image recognition, object detection, and visual AI solutions",
                icon: "👁️",
                serviceCount: 150,
              },
              {
                id: "nlp",
                name: "Natural Language Processing",
                description:
                  "Text analysis, chatbots, and language understanding services",
                icon: "💬",
                serviceCount: 200,
              },
              {
                id: "machine_learning",
                name: "Machine Learning",
                description:
                  "Predictive analytics, classification, and ML model development",
                icon: "🤖",
                serviceCount: 180,
              },
              {
                id: "deep_learning",
                name: "Deep Learning",
                description:
                  "Neural networks, deep learning architectures, and advanced AI",
                icon: "🧠",
                serviceCount: 120,
              },
              {
                id: "data_science",
                name: "Data Science",
                description:
                  "Data analysis, visualization, and business intelligence",
                icon: "📊",
                serviceCount: 160,
              },
              {
                id: "robotics",
                name: "Robotics & Automation",
                description:
                  "Robotic solutions, automation, and intelligent systems",
                icon: "🤖",
                serviceCount: 85,
              },
              {
                id: "ai_consulting",
                name: "AI Strategy & Consulting",
                description:
                  "AI transformation, strategy development, and implementation guidance",
                icon: "💡",
                serviceCount: 95,
              },
              {
                id: "custom_ai",
                name: "Custom AI Development",
                description:
                  "Bespoke AI solutions tailored to specific business requirements",
                icon: "⚡",
                serviceCount: 110,
              },
            ].map((category) => (
              <Link key={category.id} href={`/catalog?category=${category.id}`}>
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-0 shadow-md hover:scale-105">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{category.icon}</div>
                      <Badge variant="secondary" className="text-xs">
                        {category.serviceCount} services
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                      {category.description}
                    </CardDescription>
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

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] -z-0" />
        <div className="container mx-auto px-4 text-center space-y-8 relative z-10">
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
              className="h-14 px-8 text-lg font-semibold bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-700"
            >
              <Link href="/auth/sign-up">Create Free Account</Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-12 border-t border-white/20">
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
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
      </section>

      <Footer />
    </div>
  );
}
