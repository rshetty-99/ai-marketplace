export interface CategoryNavigation {
  id: string;
  name: string;
  href: string;
  description: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  href: string;
  domains: Domain[];
}

export interface Domain {
  id: string;
  name: string;
  href: string;
  description: string;
}

export const NAVIGATION_CATEGORIES: CategoryNavigation[] = [
  {
    id: "technology-development",
    name: "Technology & Development",
    href: "/catalog?category=technology-development",
    description: "Software development, AI/ML, blockchain, and technical services",
    icon: "💻",
    subcategories: [
      {
        id: "web-development",
        name: "Web Development",
        href: "/catalog?category=technology-development&subcategory=web-development",
        domains: [
          {
            id: "ecommerce",
            name: "E-commerce",
            href: "/catalog?category=technology-development&subcategory=web-development&domain=ecommerce",
            description: "Online stores and marketplaces"
          },
          {
            id: "saas",
            name: "SaaS",
            href: "/catalog?category=technology-development&subcategory=web-development&domain=saas",
            description: "Software as a Service applications"
          },
          {
            id: "web-applications",
            name: "Web Applications",
            href: "/catalog?category=technology-development&subcategory=web-development&domain=web-applications",
            description: "Custom web applications and portals"
          },
          {
            id: "progressive-web-apps",
            name: "Progressive Web Apps",
            href: "/catalog?category=technology-development&subcategory=web-development&domain=progressive-web-apps",
            description: "Modern web apps with native features"
          }
        ]
      },
      {
        id: "mobile-development",
        name: "Mobile Development",
        href: "/catalog?category=technology-development&subcategory=mobile-development",
        domains: [
          {
            id: "ios",
            name: "iOS",
            href: "/catalog?category=technology-development&subcategory=mobile-development&domain=ios",
            description: "iPhone and iPad applications"
          },
          {
            id: "android",
            name: "Android",
            href: "/catalog?category=technology-development&subcategory=mobile-development&domain=android",
            description: "Android mobile applications"
          },
          {
            id: "cross-platform",
            name: "Cross-Platform",
            href: "/catalog?category=technology-development&subcategory=mobile-development&domain=cross-platform",
            description: "React Native, Flutter apps"
          },
          {
            id: "mobile-games",
            name: "Mobile Games",
            href: "/catalog?category=technology-development&subcategory=mobile-development&domain=mobile-games",
            description: "Gaming applications for mobile"
          }
        ]
      },
      {
        id: "ai-ml-data-science",
        name: "AI/ML & Data Science",
        href: "/catalog?category=technology-development&subcategory=ai-ml-data-science",
        domains: [
          {
            id: "computer-vision",
            name: "Computer Vision",
            href: "/catalog?category=technology-development&subcategory=ai-ml-data-science&domain=computer-vision",
            description: "Image and video analysis"
          },
          {
            id: "nlp",
            name: "Natural Language Processing",
            href: "/catalog?category=technology-development&subcategory=ai-ml-data-science&domain=nlp",
            description: "Text analysis and chatbots"
          },
          {
            id: "predictive-analytics",
            name: "Predictive Analytics",
            href: "/catalog?category=technology-development&subcategory=ai-ml-data-science&domain=predictive-analytics",
            description: "Forecasting and insights"
          },
          {
            id: "genai",
            name: "GenAI",
            href: "/catalog?category=technology-development&subcategory=ai-ml-data-science&domain=genai",
            description: "Generative AI solutions"
          }
        ]
      },
      {
        id: "blockchain-web3",
        name: "Blockchain & Web3",
        href: "/catalog?category=technology-development&subcategory=blockchain-web3",
        domains: [
          {
            id: "defi",
            name: "DeFi",
            href: "/catalog?category=technology-development&subcategory=blockchain-web3&domain=defi",
            description: "Decentralized finance solutions"
          },
          {
            id: "nft",
            name: "NFT",
            href: "/catalog?category=technology-development&subcategory=blockchain-web3&domain=nft",
            description: "Non-fungible token projects"
          },
          {
            id: "smart-contracts",
            name: "Smart Contracts",
            href: "/catalog?category=technology-development&subcategory=blockchain-web3&domain=smart-contracts",
            description: "Blockchain contract development"
          },
          {
            id: "cryptocurrency",
            name: "Cryptocurrency",
            href: "/catalog?category=technology-development&subcategory=blockchain-web3&domain=cryptocurrency",
            description: "Digital currency solutions"
          }
        ]
      },
      {
        id: "devops-cloud",
        name: "DevOps & Cloud",
        href: "/catalog?category=technology-development&subcategory=devops-cloud",
        domains: [
          {
            id: "aws",
            name: "AWS",
            href: "/catalog?category=technology-development&subcategory=devops-cloud&domain=aws",
            description: "Amazon Web Services"
          },
          {
            id: "google-cloud",
            name: "Google Cloud",
            href: "/catalog?category=technology-development&subcategory=devops-cloud&domain=google-cloud",
            description: "Google Cloud Platform"
          },
          {
            id: "azure",
            name: "Azure",
            href: "/catalog?category=technology-development&subcategory=devops-cloud&domain=azure",
            description: "Microsoft Azure services"
          },
          {
            id: "kubernetes",
            name: "Kubernetes",
            href: "/catalog?category=technology-development&subcategory=devops-cloud&domain=kubernetes",
            description: "Container orchestration"
          }
        ]
      }
    ]
  },
  {
    id: "creative-design",
    name: "Creative & Design",
    href: "/catalog?category=creative-design",
    description: "UI/UX design, graphic design, video production, and creative services",
    icon: "🎨",
    subcategories: [
      {
        id: "ui-ux-design",
        name: "UI/UX Design",
        href: "/catalog?category=creative-design&subcategory=ui-ux-design",
        domains: [
          {
            id: "web-design",
            name: "Web Design",
            href: "/catalog?category=creative-design&subcategory=ui-ux-design&domain=web-design",
            description: "Website user interfaces"
          },
          {
            id: "mobile-design",
            name: "Mobile Design",
            href: "/catalog?category=creative-design&subcategory=ui-ux-design&domain=mobile-design",
            description: "Mobile app interfaces"
          },
          {
            id: "saas-design",
            name: "SaaS Design",
            href: "/catalog?category=creative-design&subcategory=ui-ux-design&domain=saas-design",
            description: "Software application design"
          },
          {
            id: "design-systems",
            name: "Design Systems",
            href: "/catalog?category=creative-design&subcategory=ui-ux-design&domain=design-systems",
            description: "Scalable design frameworks"
          }
        ]
      },
      {
        id: "graphic-design",
        name: "Graphic Design",
        href: "/catalog?category=creative-design&subcategory=graphic-design",
        domains: [
          {
            id: "brand-identity",
            name: "Brand Identity",
            href: "/catalog?category=creative-design&subcategory=graphic-design&domain=brand-identity",
            description: "Logo and brand design"
          },
          {
            id: "marketing-design",
            name: "Marketing Design",
            href: "/catalog?category=creative-design&subcategory=graphic-design&domain=marketing-design",
            description: "Promotional materials"
          },
          {
            id: "print-design",
            name: "Print Design",
            href: "/catalog?category=creative-design&subcategory=graphic-design&domain=print-design",
            description: "Physical media design"
          },
          {
            id: "packaging",
            name: "Packaging",
            href: "/catalog?category=creative-design&subcategory=graphic-design&domain=packaging",
            description: "Product packaging design"
          }
        ]
      },
      {
        id: "video-animation",
        name: "Video & Animation",
        href: "/catalog?category=creative-design&subcategory=video-animation",
        domains: [
          {
            id: "explainer-videos",
            name: "Explainer Videos",
            href: "/catalog?category=creative-design&subcategory=video-animation&domain=explainer-videos",
            description: "Educational video content"
          },
          {
            id: "motion-graphics",
            name: "Motion Graphics",
            href: "/catalog?category=creative-design&subcategory=video-animation&domain=motion-graphics",
            description: "Animated graphics and effects"
          },
          {
            id: "3d-animation",
            name: "3D Animation",
            href: "/catalog?category=creative-design&subcategory=video-animation&domain=3d-animation",
            description: "Three-dimensional animations"
          },
          {
            id: "social-media-videos",
            name: "Social Media Videos",
            href: "/catalog?category=creative-design&subcategory=video-animation&domain=social-media-videos",
            description: "Short-form video content"
          }
        ]
      }
    ]
  },
  {
    id: "business-consulting",
    name: "Business & Consulting",
    href: "/catalog?category=business-consulting",
    description: "Strategy, operations, finance, and management consulting",
    icon: "💼",
    subcategories: [
      {
        id: "strategy-consulting",
        name: "Strategy Consulting",
        href: "/catalog?category=business-consulting&subcategory=strategy-consulting",
        domains: [
          {
            id: "business-strategy",
            name: "Business Strategy",
            href: "/catalog?category=business-consulting&subcategory=strategy-consulting&domain=business-strategy",
            description: "Strategic planning and execution"
          },
          {
            id: "digital-transformation",
            name: "Digital Transformation",
            href: "/catalog?category=business-consulting&subcategory=strategy-consulting&domain=digital-transformation",
            description: "Technology adoption strategies"
          },
          {
            id: "market-entry",
            name: "Market Entry",
            href: "/catalog?category=business-consulting&subcategory=strategy-consulting&domain=market-entry",
            description: "New market expansion"
          },
          {
            id: "growth-strategy",
            name: "Growth Strategy",
            href: "/catalog?category=business-consulting&subcategory=strategy-consulting&domain=growth-strategy",
            description: "Business growth planning"
          }
        ]
      },
      {
        id: "financial-consulting",
        name: "Financial Consulting",
        href: "/catalog?category=business-consulting&subcategory=financial-consulting",
        domains: [
          {
            id: "cfo-services",
            name: "CFO Services",
            href: "/catalog?category=business-consulting&subcategory=financial-consulting&domain=cfo-services",
            description: "Chief Financial Officer services"
          },
          {
            id: "financial-planning",
            name: "Financial Planning",
            href: "/catalog?category=business-consulting&subcategory=financial-consulting&domain=financial-planning",
            description: "Financial strategy and planning"
          },
          {
            id: "valuation",
            name: "Valuation",
            href: "/catalog?category=business-consulting&subcategory=financial-consulting&domain=valuation",
            description: "Business valuation services"
          },
          {
            id: "risk-management",
            name: "Risk Management",
            href: "/catalog?category=business-consulting&subcategory=financial-consulting&domain=risk-management",
            description: "Financial risk assessment"
          }
        ]
      },
      {
        id: "operations-consulting",
        name: "Operations Consulting",
        href: "/catalog?category=business-consulting&subcategory=operations-consulting",
        domains: [
          {
            id: "supply-chain",
            name: "Supply Chain",
            href: "/catalog?category=business-consulting&subcategory=operations-consulting&domain=supply-chain",
            description: "Supply chain optimization"
          },
          {
            id: "lean-six-sigma",
            name: "Lean Six Sigma",
            href: "/catalog?category=business-consulting&subcategory=operations-consulting&domain=lean-six-sigma",
            description: "Process improvement methodologies"
          },
          {
            id: "quality-management",
            name: "Quality Management",
            href: "/catalog?category=business-consulting&subcategory=operations-consulting&domain=quality-management",
            description: "Quality assurance systems"
          },
          {
            id: "manufacturing",
            name: "Manufacturing",
            href: "/catalog?category=business-consulting&subcategory=operations-consulting&domain=manufacturing",
            description: "Manufacturing optimization"
          }
        ]
      }
    ]
  },
  {
    id: "marketing-sales",
    name: "Marketing & Sales",
    href: "/catalog?category=marketing-sales",
    description: "Digital marketing, content creation, sales, and brand management",
    icon: "📈",
    subcategories: [
      {
        id: "digital-marketing",
        name: "Digital Marketing",
        href: "/catalog?category=marketing-sales&subcategory=digital-marketing",
        domains: [
          {
            id: "seo",
            name: "SEO",
            href: "/catalog?category=marketing-sales&subcategory=digital-marketing&domain=seo",
            description: "Search engine optimization"
          },
          {
            id: "sem",
            name: "SEM",
            href: "/catalog?category=marketing-sales&subcategory=digital-marketing&domain=sem",
            description: "Search engine marketing"
          },
          {
            id: "social-media",
            name: "Social Media",
            href: "/catalog?category=marketing-sales&subcategory=digital-marketing&domain=social-media",
            description: "Social media marketing"
          },
          {
            id: "email-marketing",
            name: "Email Marketing",
            href: "/catalog?category=marketing-sales&subcategory=digital-marketing&domain=email-marketing",
            description: "Email campaign management"
          }
        ]
      },
      {
        id: "content-marketing",
        name: "Content Marketing",
        href: "/catalog?category=marketing-sales&subcategory=content-marketing",
        domains: [
          {
            id: "blog-writing",
            name: "Blog Writing",
            href: "/catalog?category=marketing-sales&subcategory=content-marketing&domain=blog-writing",
            description: "Blog content creation"
          },
          {
            id: "video-content",
            name: "Video Content",
            href: "/catalog?category=marketing-sales&subcategory=content-marketing&domain=video-content",
            description: "Video marketing content"
          },
          {
            id: "infographics",
            name: "Infographics",
            href: "/catalog?category=marketing-sales&subcategory=content-marketing&domain=infographics",
            description: "Visual content design"
          },
          {
            id: "white-papers",
            name: "White Papers",
            href: "/catalog?category=marketing-sales&subcategory=content-marketing&domain=white-papers",
            description: "In-depth research content"
          }
        ]
      },
      {
        id: "sales-lead-generation",
        name: "Sales & Lead Generation",
        href: "/catalog?category=marketing-sales&subcategory=sales-lead-generation",
        domains: [
          {
            id: "b2b-sales",
            name: "B2B Sales",
            href: "/catalog?category=marketing-sales&subcategory=sales-lead-generation&domain=b2b-sales",
            description: "Business-to-business sales"
          },
          {
            id: "lead-generation",
            name: "Lead Generation",
            href: "/catalog?category=marketing-sales&subcategory=sales-lead-generation&domain=lead-generation",
            description: "Prospect identification"
          },
          {
            id: "sales-enablement",
            name: "Sales Enablement",
            href: "/catalog?category=marketing-sales&subcategory=sales-lead-generation&domain=sales-enablement",
            description: "Sales process optimization"
          },
          {
            id: "business-development",
            name: "Business Development",
            href: "/catalog?category=marketing-sales&subcategory=sales-lead-generation&domain=business-development",
            description: "Partnership and growth"
          }
        ]
      }
    ]
  },
  {
    id: "writing-content",
    name: "Writing & Content",
    href: "/catalog?category=writing-content",
    description: "Technical writing, copywriting, content creation, and translation",
    icon: "✍️",
    subcategories: [
      {
        id: "technical-writing",
        name: "Technical Writing",
        href: "/catalog?category=writing-content&subcategory=technical-writing",
        domains: [
          {
            id: "api-documentation",
            name: "API Documentation",
            href: "/catalog?category=writing-content&subcategory=technical-writing&domain=api-documentation",
            description: "Developer documentation"
          },
          {
            id: "user-manuals",
            name: "User Manuals",
            href: "/catalog?category=writing-content&subcategory=technical-writing&domain=user-manuals",
            description: "Product user guides"
          },
          {
            id: "software-documentation",
            name: "Software Documentation",
            href: "/catalog?category=writing-content&subcategory=technical-writing&domain=software-documentation",
            description: "Software guides and specs"
          },
          {
            id: "technical-guides",
            name: "Technical Guides",
            href: "/catalog?category=writing-content&subcategory=technical-writing&domain=technical-guides",
            description: "How-to technical content"
          }
        ]
      },
      {
        id: "copywriting",
        name: "Copywriting",
        href: "/catalog?category=writing-content&subcategory=copywriting",
        domains: [
          {
            id: "web-copy",
            name: "Web Copy",
            href: "/catalog?category=writing-content&subcategory=copywriting&domain=web-copy",
            description: "Website content writing"
          },
          {
            id: "ad-copy",
            name: "Ad Copy",
            href: "/catalog?category=writing-content&subcategory=copywriting&domain=ad-copy",
            description: "Advertising copywriting"
          },
          {
            id: "sales-pages",
            name: "Sales Pages",
            href: "/catalog?category=writing-content&subcategory=copywriting&domain=sales-pages",
            description: "Conversion-focused copy"
          },
          {
            id: "product-descriptions",
            name: "Product Descriptions",
            href: "/catalog?category=writing-content&subcategory=copywriting&domain=product-descriptions",
            description: "E-commerce product copy"
          }
        ]
      },
      {
        id: "content-writing",
        name: "Content Writing",
        href: "/catalog?category=writing-content&subcategory=content-writing",
        domains: [
          {
            id: "blog-articles",
            name: "Blog Articles",
            href: "/catalog?category=writing-content&subcategory=content-writing&domain=blog-articles",
            description: "Blog and article writing"
          },
          {
            id: "case-studies",
            name: "Case Studies",
            href: "/catalog?category=writing-content&subcategory=content-writing&domain=case-studies",
            description: "Success story documentation"
          },
          {
            id: "newsletters",
            name: "Newsletters",
            href: "/catalog?category=writing-content&subcategory=content-writing&domain=newsletters",
            description: "Email newsletter content"
          },
          {
            id: "thought-leadership",
            name: "Thought Leadership",
            href: "/catalog?category=writing-content&subcategory=content-writing&domain=thought-leadership",
            description: "Industry expertise content"
          }
        ]
      }
    ]
  }
];