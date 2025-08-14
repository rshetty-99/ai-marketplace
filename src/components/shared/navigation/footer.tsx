import Link from 'next/link';
import { 
  Brain, 
  Twitter, 
  Linkedin, 
  Github, 
  Mail,
  MapPin,
  Phone,
  Shield,
  Users,
  BookOpen,
  BarChart3
} from 'lucide-react';

const footerNavigation = {
  services: [
    { name: 'Computer Vision', href: '/catalog?category=computer_vision' },
    { name: 'Natural Language Processing', href: '/catalog?category=nlp' },
    { name: 'Machine Learning', href: '/catalog?category=machine_learning' },
    { name: 'Data Science', href: '/catalog?category=data_science' },
    { name: 'All Services', href: '/catalog' },
  ],
  providers: [
    { name: 'Become a Provider', href: '/providers/join' },
    { name: 'Verified Partners', href: '/providers?verified=true' },
    { name: 'Enterprise Providers', href: '/providers?tier=enterprise' },
    { name: 'Provider Directory', href: '/providers' },
  ],
  resources: [
    { name: 'AI Buying Guide', href: '/resources/guide' },
    { name: 'Case Studies', href: '/resources/case-studies' },
    { name: 'Blog', href: '/resources/blog' },
    { name: 'Documentation', href: '/resources/docs' },
    { name: 'API Reference', href: '/resources/api' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Contact', href: '/contact' },
    { name: 'Partners', href: '/partners' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'Terms of Service', href: '/legal/terms' },
    { name: 'Cookie Policy', href: '/legal/cookies' },
    { name: 'Security', href: '/legal/security' },
    { name: 'Compliance', href: '/legal/compliance' },
  ],
};

const socialLinks = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/aimarketplace',
    icon: Twitter,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/ai-marketplace',
    icon: Linkedin,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/ai-marketplace',
    icon: Github,
  },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AI Marketplace</span>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              The leading enterprise AI marketplace connecting organizations with verified 
              AI service providers. Accelerate your AI transformation with confidence.
            </p>
            
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>San Francisco, CA & New York, NY</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href="mailto:hello@aimarketplace.com" className="hover:text-blue-400 transition-colors">
                  hello@aimarketplace.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href="tel:+1-555-AI-MARKET" className="hover:text-blue-400 transition-colors">
                  +1 (555) AI-MARKET
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-blue-400" />
              Services
            </h3>
            <ul className="space-y-3">
              {footerNavigation.services.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Providers */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              Providers
            </h3>
            <ul className="space-y-3">
              {footerNavigation.providers.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-400" />
              Resources
            </h3>
            <ul className="space-y-3">
              {footerNavigation.resources.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                Company
              </h3>
              <ul className="space-y-3">
                {footerNavigation.company.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                Legal
              </h3>
              <ul className="space-y-3">
                {footerNavigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>HIPAA Ready</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              Trusted by 500+ organizations worldwide
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>&copy; 2024 AI Marketplace Platform. All rights reserved.</span>
            </div>
            
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span>Made with ❤️ for the AI community</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}