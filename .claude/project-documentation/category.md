**CATEGORY, SUBCATEGORY & DOMAIN ARCHITECTURE**

**1\. HIERARCHICAL TAXONOMY STRUCTURE**

**Core Structure**

typescript

interface CategoryStructure {

category: string; _// Main category_

subcategories: Subcategory\[\];

domains: Domain\[\]; _// Industry/sector specific_

specializations: string\[\]; _// Deep expertise areas_

skills: Skill\[\]; _// Specific technical skills_

tools: string\[\]; _// Software/platforms_

certifications?: string\[\]; _// Relevant certifications_

deliverables: string\[\]; _// Common output types_

}

**2\. COMPLETE CATEGORY HIERARCHY**

**2.1 TECHNOLOGY & DEVELOPMENT**

typescript

const TechnologyCategory = {

category: "Technology & Development",

icon: "💻",

subcategories: \[

{

name: "Web Development",

domains: \[

"E-commerce", "SaaS", "Marketplace", "Portal", "CMS",

"Progressive Web Apps", "Static Sites", "Web Applications"

\],

specializations: \[

"Frontend Development",

"Backend Development",

"Full-Stack Development",

"API Development",

"Microservices",

"Serverless Architecture"

\],

skills: \[

_// Frontend_

"React", "Vue.js", "Angular", "Next.js", "Nuxt.js", "Svelte",

"TypeScript", "JavaScript", "HTML5", "CSS3", "Sass", "Tailwind",

_// Backend_

"Node.js", "Python", "Ruby", "PHP", "Java", "C#", ".NET",

"Go", "Rust", "Elixir", "Scala",

_// Databases_

"PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",

"Firebase", "Supabase", "DynamoDB"

\],

tools: \[

"VS Code", "Git", "Docker", "Kubernetes", "Jenkins", "AWS",

"Google Cloud", "Azure", "Vercel", "Netlify", "Webpack"

\],

deliverables: \[

"Web Application", "REST API", "GraphQL API", "Admin Dashboard",

"Landing Page", "E-commerce Site", "Portal", "CMS Implementation"

\]

},

{

name: "Mobile Development",

domains: \[

"iOS", "Android", "Cross-Platform", "Tablet", "Wearables",

"Gaming", "Enterprise Mobile", "Consumer Apps"

\],

specializations: \[

"Native iOS", "Native Android", "React Native", "Flutter",

"Xamarin", "Ionic", "PWA Mobile", "Mobile Games"

\],

skills: \[

"Swift", "Objective-C", "Kotlin", "Java", "Dart",

"React Native", "Flutter", "SwiftUI", "Jetpack Compose"

\],

tools: \[

"Xcode", "Android Studio", "Expo", "Firebase", "AppCenter",

"TestFlight", "Play Console", "Fastlane"

\],

deliverables: \[

"iOS App", "Android App", "Cross-Platform App", "App Prototype",

"App Store Deployment", "Mobile API", "Push Notification System"

\]

},

{

name: "AI/ML & Data Science",

domains: \[

"Computer Vision", "NLP", "Predictive Analytics", "Recommendation Systems",

"Time Series", "Anomaly Detection", "GenAI", "MLOps"

\],

specializations: \[

"Machine Learning Engineering", "Deep Learning", "Data Engineering",

"LLM Fine-tuning", "Computer Vision", "NLP Engineering",

"Reinforcement Learning", "AutoML"

\],

skills: \[

"Python", "TensorFlow", "PyTorch", "Scikit-learn", "Keras",

"Hugging Face", "LangChain", "OpenAI API", "Pandas", "NumPy",

"R", "Julia", "Spark", "SQL", "CUDA"

\],

tools: \[

"Jupyter", "Google Colab", "MLflow", "Weights & Biases",

"DataBricks", "SageMaker", "Vertex AI", "Azure ML"

\],

deliverables: \[

"ML Model", "Data Pipeline", "AI API", "Training Dataset",

"Model Documentation", "Performance Report", "LLM Application"

\]

},

{

name: "Blockchain & Web3",

domains: \[

"DeFi", "NFT", "Smart Contracts", "Cryptocurrency", "DAOs",

"Supply Chain", "Gaming", "Identity Management"

\],

specializations: \[

"Smart Contract Development", "DApp Development", "Protocol Design",

"Tokenomics", "Cross-chain Development", "Layer 2 Solutions"

\],

skills: \[

"Solidity", "Rust", "Web3.js", "Ethers.js", "Hardhat", "Truffle",

"Move", "Cairo", "Vyper", "Substrate"

\],

tools: \[

"Remix", "MetaMask", "Ganache", "OpenZeppelin", "Chainlink",

"The Graph", "IPFS", "Alchemy", "Infura"

\],

deliverables: \[

"Smart Contract", "DApp", "Token Contract", "NFT Collection",

"Audit Report", "Whitepaper", "Protocol Implementation"

\]

},

{

name: "DevOps & Cloud",

domains: \[

"AWS", "Google Cloud", "Azure", "Multi-Cloud", "Hybrid Cloud",

"Edge Computing", "Serverless", "Kubernetes"

\],

specializations: \[

"Cloud Architecture", "CI/CD", "Infrastructure as Code",

"Container Orchestration", "Site Reliability", "Security Engineering"

\],

skills: \[

"Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins",

"GitLab CI", "GitHub Actions", "Prometheus", "Grafana", "ELK Stack"

\],

tools: \[

"AWS Console", "GCP Console", "Azure Portal", "Terraform Cloud",

"DataDog", "New Relic", "PagerDuty", "Vault"

\],

deliverables: \[

"CI/CD Pipeline", "Infrastructure Setup", "Monitoring Dashboard",

"Disaster Recovery Plan", "Security Audit", "Cost Optimization Report"

\]

},

{

name: "Cybersecurity",

domains: \[

"Application Security", "Network Security", "Cloud Security",

"Compliance", "Incident Response", "Penetration Testing"

\],

specializations: \[

"Security Architecture", "Ethical Hacking", "Security Auditing",

"Compliance Management", "Forensics", "Zero Trust Implementation"

\],

skills: \[

"Penetration Testing", "SIEM", "Vulnerability Assessment",

"Security Auditing", "Cryptography", "Security Frameworks"

\],

tools: \[

"Metasploit", "Burp Suite", "Nmap", "Wireshark", "Kali Linux",

"Splunk", "CrowdStrike", "Qualys"

\],

deliverables: \[

"Security Audit Report", "Penetration Test Report", "Compliance Documentation",

"Incident Response Plan", "Security Policy", "Risk Assessment"

\]

},

{

name: "Game Development",

domains: \[

"Mobile Games", "PC Games", "Console Games", "VR/AR Games",

"Web Games", "Multiplayer", "Casual Games", "AAA Games"

\],

specializations: \[

"Game Programming", "Game Design", "Level Design", "Game Art",

"Game Audio", "Multiplayer Systems", "Game Economics"

\],

skills: \[

"Unity", "Unreal Engine", "C++", "C#", "Godot", "Phaser",

"Three.js", "WebGL", "Shader Programming", "Physics Engines"

\],

tools: \[

"Unity", "Unreal Engine", "Blender", "Maya", "Substance Painter",

"Photon", "Mirror", "Steam SDK", "PlayFab"

\],

deliverables: \[

"Game Prototype", "Full Game", "Game Assets", "Level Design",

"Multiplayer System", "Game Documentation", "Publishing Support"

\]

},

{

name: "IoT & Embedded Systems",

domains: \[

"Smart Home", "Industrial IoT", "Automotive", "Healthcare",

"Agriculture", "Wearables", "Smart Cities", "Robotics"

\],

specializations: \[

"Firmware Development", "Hardware Design", "Sensor Integration",

"Edge Computing", "RTOS Development", "Protocol Implementation"

\],

skills: \[

"C", "C++", "Python", "Arduino", "Raspberry Pi", "ESP32",

"MQTT", "LoRaWAN", "Zigbee", "BLE", "FreeRTOS"

\],

tools: \[

"Arduino IDE", "PlatformIO", "KiCad", "Eagle", "Altium",

"Logic Analyzers", "Oscilloscopes", "JTAG Debuggers"

\],

deliverables: \[

"Firmware", "PCB Design", "Prototype Device", "Integration Code",

"Technical Documentation", "Testing Reports"

\]

},

{

name: "QA & Testing",

domains: \[

"Web Testing", "Mobile Testing", "API Testing", "Performance Testing",

"Security Testing", "Automation Testing", "Game Testing"

\],

specializations: \[

"Test Automation", "Manual Testing", "Performance Engineering",

"Test Architecture", "Accessibility Testing", "Localization Testing"

\],

skills: \[

"Selenium", "Cypress", "Playwright", "Jest", "Pytest",

"JMeter", "Postman", "Appium", "TestNG", "Robot Framework"

\],

tools: \[

"Jira", "TestRail", "BrowserStack", "Sauce Labs", "Jenkins",

"GitLab CI", "Katalon", "LoadRunner"

\],

deliverables: \[

"Test Plan", "Test Cases", "Automation Scripts", "Bug Reports",

"Test Report", "Performance Report", "Coverage Report"

\]

},

{

name: "Database & Big Data",

domains: \[

"Data Warehousing", "Real-time Analytics", "Data Lakes",

"ETL/ELT", "Data Migration", "Database Optimization"

\],

specializations: \[

"Database Administration", "Data Architecture", "Data Engineering",

"Business Intelligence", "Data Modeling", "NoSQL Expertise"

\],

skills: \[

"SQL", "NoSQL", "PostgreSQL", "MongoDB", "Cassandra",

"Snowflake", "BigQuery", "Redshift", "Spark", "Kafka"

\],

tools: \[

"DBT", "Airflow", "Tableau", "Power BI", "Looker",

"DataGrip", "Apache Nifi", "Talend"

\],

deliverables: \[

"Database Schema", "Data Pipeline", "ETL Process", "Data Model",

"Migration Script", "Performance Report", "BI Dashboard"

\]

}

\]

};

**2.2 CREATIVE & DESIGN**

typescript

const CreativeDesignCategory = {

category: "Creative & Design",

icon: "🎨",

subcategories: \[

{

name: "UI/UX Design",

domains: \[

"Web Design", "Mobile Design", "SaaS Design", "E-commerce Design",

"Dashboard Design", "Design Systems", "Accessibility Design"

\],

specializations: \[

"User Research", "Information Architecture", "Interaction Design",

"Visual Design", "Prototyping", "Usability Testing", "Design Systems"

\],

skills: \[

"Figma", "Sketch", "Adobe XD", "Framer", "Principle",

"InVision", "Maze", "Hotjar", "Wireframing", "Prototyping"

\],

tools: \[

"Figma", "Sketch", "Adobe Creative Suite", "Miro", "FigJam",

"Notion", "Zeplin", "Abstract", "Overflow"

\],

deliverables: \[

"UI Design", "UX Research Report", "Wireframes", "Prototypes",

"Design System", "Style Guide", "User Journey Maps", "Personas"

\]

},

{

name: "Graphic Design",

domains: \[

"Brand Identity", "Marketing Design", "Print Design", "Packaging",

"Publication Design", "Environmental Design", "Digital Design"

\],

specializations: \[

"Logo Design", "Brand Guidelines", "Marketing Materials",

"Social Media Graphics", "Infographics", "Presentation Design"

\],

skills: \[

"Adobe Photoshop", "Illustrator", "InDesign", "CorelDRAW",

"Canva", "Affinity Designer", "Typography", "Color Theory"

\],

tools: \[

"Adobe Creative Cloud", "Affinity Suite", "Canva Pro",

"Procreate", "Clip Studio Paint"

\],

deliverables: \[

"Logo Design", "Brand Guidelines", "Business Cards", "Brochures",

"Social Media Templates", "Packaging Design", "Marketing Materials"

\]

},

{

name: "Video & Animation",

domains: \[

"Explainer Videos", "Motion Graphics", "3D Animation", "2D Animation",

"Video Editing", "VFX", "Product Videos", "Social Media Videos"

\],

specializations: \[

"Motion Design", "Character Animation", "Video Editing",

"Color Grading", "Sound Design", "Compositing", "Storyboarding"

\],

skills: \[

"After Effects", "Premiere Pro", "Final Cut Pro", "DaVinci Resolve",

"Cinema 4D", "Blender", "Maya", "Lottie Animations"

\],

tools: \[

"Adobe After Effects", "Premiere Pro", "Final Cut Pro",

"DaVinci Resolve", "Cinema 4D", "Blender", "Nuke"

\],

deliverables: \[

"Animated Video", "Motion Graphics", "Video Edit", "VFX Shots",

"Storyboard", "Animation Assets", "Video Templates"

\]

},

{

name: "3D Design & Modeling",

domains: \[

"Product Visualization", "Architectural Visualization", "Game Assets",

"3D Printing", "VR/AR Assets", "Character Modeling", "Industrial Design"

\],

specializations: \[

"3D Modeling", "Texturing", "Rigging", "Lighting", "Rendering",

"Sculpting", "CAD Design", "Parametric Design"

\],

skills: \[

"Blender", "Maya", "3ds Max", "ZBrush", "Substance Painter",

"AutoCAD", "SolidWorks", "Rhino", "Fusion 360"

\],

tools: \[

"Blender", "Maya", "3ds Max", "ZBrush", "Substance Suite",

"KeyShot", "V-Ray", "Octane", "Marmoset"

\],

deliverables: \[

"3D Model", "Rendered Images", "Animation", "CAD Files",

"3D Print Files", "Texture Maps", "Technical Drawings"

\]

},

{

name: "Photography & Image Editing",

domains: \[

"Product Photography", "Fashion", "Real Estate", "Food",

"Event Photography", "Portrait", "Commercial", "Editorial"

\],

specializations: \[

"Photo Retouching", "Color Correction", "Compositing",

"Product Photography", "Photo Manipulation", "RAW Processing"

\],

skills: \[

"Adobe Photoshop", "Lightroom", "Capture One", "Photo Editing",

"Color Grading", "Retouching", "Compositing"

\],

tools: \[

"Adobe Photoshop", "Lightroom", "Capture One", "Affinity Photo",

"DxO PhotoLab", "Luminar"

\],

deliverables: \[

"Edited Photos", "Product Shots", "Photo Composites",

"Color Graded Images", "Photo Albums", "RAW Processing"

\]

},

{

name: "Audio & Music Production",

domains: \[

"Music Production", "Podcast Editing", "Sound Design", "Voiceover",

"Audio Mixing", "Jingles", "Audiobooks", "Game Audio"

\],

specializations: \[

"Music Composition", "Audio Engineering", "Mixing & Mastering",

"Sound Effects", "Voice Processing", "Podcast Production"

\],

skills: \[

"Pro Tools", "Logic Pro", "Ableton Live", "FL Studio",

"Audio Mixing", "Mastering", "Sound Design", "MIDI"

\],

tools: \[

"Pro Tools", "Logic Pro", "Ableton Live", "FL Studio",

"Reaper", "Audacity", "Adobe Audition", "iZotope"

\],

deliverables: \[

"Music Track", "Podcast Episode", "Sound Effects", "Voiceover",

"Audio Mix", "Master Track", "Jingle", "Audio Logo"

\]

},

{

name: "Fashion & Jewelry Design",

domains: \[

"Apparel Design", "Accessories", "Jewelry", "Footwear",

"Textile Design", "Pattern Making", "Tech Packs"

\],

specializations: \[

"Fashion Illustration", "Pattern Design", "3D Fashion",

"Technical Design", "Trend Forecasting", "Sustainable Design"

\],

skills: \[

"Adobe Illustrator", "CLO 3D", "Browzwear", "CAD",

"Pattern Making", "Draping", "Technical Flats"

\],

tools: \[

"Adobe Illustrator", "CLO 3D", "Browzwear", "Optitex",

"Lectra", "Gerber", "RhinoGold"

\],

deliverables: \[

"Fashion Designs", "Tech Packs", "Patterns", "3D Garments",

"Fashion Illustrations", "Mood Boards", "Spec Sheets"

\]

}

\]

};

**2.3 BUSINESS & CONSULTING**

typescript

const BusinessConsultingCategory = {

category: "Business & Consulting",

icon: "💼",

subcategories: \[

{

name: "Strategy Consulting",

domains: \[

"Business Strategy", "Digital Transformation", "Market Entry",

"Growth Strategy", "Turnaround", "M&A Advisory", "Innovation"

\],

specializations: \[

"Strategic Planning", "Competitive Analysis", "Business Model Design",

"Change Management", "Digital Strategy", "Scenario Planning"

\],

skills: \[

"Strategic Analysis", "Financial Modeling", "Market Research",

"SWOT Analysis", "Porter's Five Forces", "BCG Matrix", "McKinsey 7S"

\],

tools: \[

"PowerPoint", "Excel", "Tableau", "Miro", "Monday.com",

"Slack", "Teams", "Notion"

\],

deliverables: \[

"Strategy Document", "Business Plan", "Market Analysis",

"Competitor Analysis", "Roadmap", "Executive Presentation"

\]

},

{

name: "Financial Consulting",

domains: \[

"CFO Services", "Financial Planning", "Valuation", "Due Diligence",

"Risk Management", "Treasury", "FP&A", "Restructuring"

\],

specializations: \[

"Financial Modeling", "Valuation", "Budgeting", "Forecasting",

"Cash Flow Management", "Investment Analysis", "Cost Optimization"

\],

skills: \[

"Excel", "Financial Modeling", "DCF Analysis", "Monte Carlo",

"VBA", "Python", "SQL", "Power BI", "QuickBooks", "SAP"

\],

tools: \[

"Excel", "Power BI", "Tableau", "QuickBooks", "NetSuite",

"SAP", "Oracle", "Anaplan", "Adaptive Insights"

\],

deliverables: \[

"Financial Model", "Valuation Report", "Budget Template",

"Cash Flow Forecast", "Investment Memo", "Due Diligence Report"

\]

},

{

name: "Operations Consulting",

domains: \[

"Supply Chain", "Lean Six Sigma", "Process Improvement",

"Quality Management", "Logistics", "Manufacturing", "Procurement"

\],

specializations: \[

"Process Optimization", "Supply Chain Design", "Inventory Management",

"Lean Implementation", "Quality Systems", "ERP Implementation"

\],

skills: \[

"Lean Six Sigma", "Process Mapping", "Value Stream Mapping",

"Statistical Analysis", "Project Management", "Change Management"

\],

tools: \[

"Visio", "Lucidchart", "Minitab", "JMP", "SAP", "Oracle SCM",

"Tableau", "Power BI", "Monday.com"

\],

deliverables: \[

"Process Map", "Improvement Plan", "SOPs", "KPI Dashboard",

"Implementation Roadmap", "Training Materials"

\]

},

{

name: "HR Consulting",

domains: \[

"Talent Strategy", "Organizational Design", "Compensation",

"Performance Management", "Culture Change", "HR Tech", "Recruitment"

\],

specializations: \[

"Talent Acquisition", "Leadership Development", "Compensation Design",

"Employee Engagement", "HR Analytics", "Succession Planning"

\],

skills: \[

"HR Strategy", "Organizational Development", "Talent Management",

"HRIS", "People Analytics", "Employment Law", "Coaching"

\],

tools: \[

"Workday", "BambooHR", "ADP", "SuccessFactors", "Greenhouse",

"Culture Amp", "15Five", "Lattice"

\],

deliverables: \[

"HR Strategy", "Org Chart", "Compensation Framework", "Job Descriptions",

"Employee Handbook", "Performance System", "Culture Assessment"

\]

},

{

name: "Management Consulting",

domains: \[

"Project Management", "Program Management", "PMO Setup",

"Agile Transformation", "Portfolio Management", "Risk Management"

\],

specializations: \[

"Agile Coaching", "Scrum Master", "PMP", "Change Management",

"Stakeholder Management", "Resource Planning"

\],

skills: \[

"PMP", "Agile", "Scrum", "Kanban", "SAFe", "Prince2",

"Risk Management", "Stakeholder Management"

\],

tools: \[

"Jira", "Asana", "Monday.com", "MS Project", "Smartsheet",

"Confluence", "Slack", "Miro"

\],

deliverables: \[

"Project Plan", "Risk Register", "Status Reports", "PMO Framework",

"Agile Playbook", "Training Materials", "Templates"

\]

},

{

name: "Sustainability Consulting",

domains: \[

"ESG Strategy", "Carbon Footprint", "Circular Economy",

"Sustainable Supply Chain", "Impact Assessment", "CSR"

\],

specializations: \[

"ESG Reporting", "Carbon Accounting", "Life Cycle Assessment",

"Sustainable Design", "Impact Measurement", "B Corp Certification"

\],

skills: \[

"ESG Frameworks", "Carbon Accounting", "LCA", "GRI Standards",

"TCFD", "Science Based Targets", "Materiality Assessment"

\],

tools: \[

"SimaPro", "GaBi", "Sphera", "Enablon", "EcoVadis",

"CDP Platform", "Excel", "Power BI"

\],

deliverables: \[

"ESG Report", "Carbon Footprint Analysis", "Sustainability Strategy",

"Impact Report", "Materiality Matrix", "Implementation Roadmap"

\]

}

\]

};

**2.4 MARKETING & SALES**

typescript

const MarketingSalesCategory = {

category: "Marketing & Sales",

icon: "📈",

subcategories: \[

{

name: "Digital Marketing",

domains: \[

"SEO", "SEM", "Social Media", "Content Marketing", "Email Marketing",

"Marketing Automation", "Conversion Optimization", "Analytics"

\],

specializations: \[

"SEO Strategy", "PPC Management", "Social Media Strategy",

"Content Strategy", "Email Automation", "Growth Hacking"

\],

skills: \[

"Google Ads", "Facebook Ads", "SEO", "Google Analytics",

"HubSpot", "Mailchimp", "Hootsuite", "Semrush", "Ahrefs"

\],

tools: \[

"Google Ads", "Meta Business Suite", "Google Analytics 4",

"Semrush", "Ahrefs", "HubSpot", "Marketo", "Klaviyo"

\],

deliverables: \[

"Marketing Strategy", "SEO Audit", "PPC Campaign", "Content Calendar",

"Email Campaign", "Analytics Report", "Conversion Funnel"

\]

},

{

name: "Content Marketing",

domains: \[

"Blog Writing", "Video Content", "Podcasting", "Infographics",

"White Papers", "Case Studies", "Social Content", "Email Content"

\],

specializations: \[

"Content Strategy", "SEO Writing", "Technical Writing",

"Copywriting", "Video Scripts", "Content Distribution"

\],

skills: \[

"Content Writing", "SEO", "Content Strategy", "Storytelling",

"Research", "Editing", "Content Planning", "Analytics"

\],

tools: \[

"WordPress", "Contentful", "Canva", "Grammarly", "Hemingway",

"BuzzSumo", "CoSchedule", "Buffer"

\],

deliverables: \[

"Content Strategy", "Blog Posts", "White Papers", "Case Studies",

"Content Calendar", "Style Guide", "Performance Report"

\]

},

{

name: "Brand Marketing",

domains: \[

"Brand Strategy", "Brand Positioning", "Brand Identity",

"Rebranding", "Brand Guidelines", "Brand Storytelling"

\],

specializations: \[

"Brand Development", "Brand Architecture", "Visual Identity",

"Verbal Identity", "Brand Experience", "Brand Activation"

\],

skills: \[

"Brand Strategy", "Market Research", "Consumer Insights",

"Creative Direction", "Storytelling", "Design Thinking"

\],

tools: \[

"Adobe Creative Suite", "Figma", "Miro", "Brandpad",

"Frontify", "Brandfolder", "Survey Tools"

\],

deliverables: \[

"Brand Strategy", "Brand Guidelines", "Brand Book", "Messaging Framework",

"Visual Identity", "Brand Audit", "Launch Plan"

\]

},

{

name: "Sales & Lead Generation",

domains: \[

"B2B Sales", "B2C Sales", "Lead Generation", "Sales Enablement",

"Account Management", "Business Development", "Channel Sales"

\],

specializations: \[

"Outbound Sales", "Inbound Sales", "Sales Operations",

"Sales Training", "CRM Management", "Pipeline Management"

\],

skills: \[

"Salesforce", "HubSpot CRM", "Cold Calling", "Email Outreach",

"LinkedIn Sales Navigator", "Negotiation", "Closing"

\],

tools: \[

"Salesforce", "HubSpot", "Pipedrive", "Outreach", "SalesLoft",

"LinkedIn Sales Navigator", "ZoomInfo", "Apollo"

\],

deliverables: \[

"Sales Strategy", "Lead List", "Sales Playbook", "Email Templates",

"CRM Setup", "Sales Training", "Pipeline Report"

\]

},

{

name: "Public Relations",

domains: \[

"Media Relations", "Crisis Management", "Corporate Communications",

"Influencer Relations", "Event PR", "Product Launch PR"

\],

specializations: \[

"Press Release Writing", "Media Pitching", "Crisis Communications",

"Thought Leadership", "Media Training", "PR Strategy"

\],

skills: \[

"Press Release Writing", "Media Relations", "Crisis Management",

"Storytelling", "Media Training", "Event Planning"

\],

tools: \[

"Cision", "Meltwater", "HARO", "PR Newswire", "Muck Rack",

"Google Alerts", "Mention", "Brand24"

\],

deliverables: \[

"PR Strategy", "Press Release", "Media Kit", "Media List",

"Crisis Plan", "Coverage Report", "Messaging Document"

\]

},

{

name: "Market Research",

domains: \[

"Consumer Research", "Competitive Intelligence", "Market Analysis",

"User Research", "Brand Research", "Product Research"

\],

specializations: \[

"Quantitative Research", "Qualitative Research", "Survey Design",

"Focus Groups", "Data Analysis", "Insights Generation"

\],

skills: \[

"Survey Design", "Statistical Analysis", "SPSS", "R",

"Interview Skills", "Data Visualization", "Report Writing"

\],

tools: \[

"Qualtrics", "SurveyMonkey", "Typeform", "SPSS", "Tableau",

"UserVoice", "Hotjar", "Google Forms"

\],

deliverables: \[

"Research Report", "Survey Results", "Competitor Analysis",

"Market Sizing", "Persona Development", "Insights Presentation"

\]

}

\]

};

**2.5 WRITING & CONTENT**

typescript

const WritingContentCategory = {

category: "Writing & Content",

icon: "✍️",

subcategories: \[

{

name: "Technical Writing",

domains: \[

"API Documentation", "User Manuals", "Software Documentation",

"White Papers", "Technical Guides", "Release Notes", "SDK Docs"

\],

specializations: \[

"API Documentation", "Developer Docs", "User Guides",

"System Documentation", "Process Documentation", "Training Materials"

\],

skills: \[

"Technical Writing", "Markdown", "Git", "API Documentation",

"DITA", "XML", "Screenshots", "Diagramming"

\],

tools: \[

"Confluence", "GitHub", "Swagger", "Postman", "MadCap Flare",

"Adobe FrameMaker", "Snagit", "Draw.io"

\],

deliverables: \[

"API Documentation", "User Manual", "Technical Guide", "FAQ",

"Knowledge Base", "Release Notes", "Training Materials"

\]

},

{

name: "Copywriting",

domains: \[

"Web Copy", "Ad Copy", "Email Copy", "Sales Pages", "Landing Pages",

"Product Descriptions", "Social Media Copy", "Scripts"

\],

specializations: \[

"Direct Response", "Brand Copy", "SEO Copy", "Conversion Copy",

"Email Marketing", "Social Media", "Video Scripts"

\],

skills: \[

"Persuasive Writing", "SEO", "A/B Testing", "Headlines",

"Call-to-Action", "Storytelling", "Brand Voice"

\],

tools: \[

"Google Docs", "Grammarly", "Hemingway", "CoSchedule Headline Analyzer",

"Copy.ai", "Jasper", "Unbounce"

\],

deliverables: \[

"Sales Copy", "Landing Page Copy", "Email Sequence", "Ad Copy",

"Product Descriptions", "Website Copy", "Brand Messaging"

\]

},

{

name: "Content Writing",

domains: \[

"Blog Writing", "Articles", "Newsletters", "eBooks", "Guides",

"Case Studies", "Thought Leadership", "Guest Posts"

\],

specializations: \[

"SEO Content", "Long-form Content", "B2B Content", "B2C Content",

"Educational Content", "Entertainment Content"

\],

skills: \[

"Research", "SEO Writing", "Storytelling", "Editing",

"Fact-checking", "Interview Skills", "Content Planning"

\],

tools: \[

"WordPress", "Google Docs", "Grammarly", "Yoast SEO",

"Surfer SEO", "MarketMuse", "Clearscope"

\],

deliverables: \[

"Blog Posts", "Articles", "eBook", "Newsletter", "Case Study",

"White Paper", "Content Strategy", "Editorial Calendar"

\]

},

{

name: "Creative Writing",

domains: \[

"Fiction", "Non-fiction", "Poetry", "Screenwriting", "Playwriting",

"Children's Books", "Comics", "Game Narrative"

\],

specializations: \[

"Novel Writing", "Short Stories", "Screenplay", "Creative Non-fiction",

"Memoir", "Biography", "World Building"

\],

skills: \[

"Creative Writing", "Character Development", "Plot Structure",

"Dialogue", "World Building", "Editing", "Proofreading"

\],

tools: \[

"Scrivener", "Final Draft", "Google Docs", "Ulysses",

"Highland", "WriterDuet", "Celtx"

\],

deliverables: \[

"Manuscript", "Screenplay", "Short Story", "Book Outline",

"Character Profiles", "Story Bible", "Treatment"

\]

},

{

name: "Translation & Localization",

domains: \[

"Document Translation", "Website Localization", "App Localization",

"Video Subtitles", "Legal Translation", "Medical Translation"

\],

specializations: \[

"Technical Translation", "Literary Translation", "Legal Translation",

"Medical Translation", "Marketing Translation", "Certified Translation"

\],

skills: \[

"Translation", "Localization", "Cultural Adaptation", "Proofreading",

"CAT Tools", "Terminology Management", "Quality Assurance"

\],

tools: \[

"SDL Trados", "MemoQ", "Smartcat", "Phrase", "Lokalise",

"Crowdin", "Google Translate Toolkit", "DeepL"

\],

deliverables: \[

"Translated Document", "Localized Website", "Subtitles", "Glossary",

"Style Guide", "Quality Report", "Certified Translation"

\]

},

{

name: "Academic Writing",

domains: \[

"Research Papers", "Dissertations", "Literature Reviews",

"Grant Proposals", "Journal Articles", "Conference Papers"

\],

specializations: \[

"Research Writing", "Citation Management", "Statistical Analysis",

"Literature Review", "Grant Writing", "Peer Review"

\],

skills: \[

"Academic Writing", "Research", "Citation Styles", "Statistical Analysis",

"Critical Analysis", "Literature Review", "Abstract Writing"

\],

tools: \[

"LaTeX", "Mendeley", "Zotero", "EndNote", "SPSS", "R",

"Google Scholar", "Turnitin"

\],

deliverables: \[

"Research Paper", "Literature Review", "Grant Proposal", "Abstract",

"Dissertation Chapter", "Data Analysis", "Bibliography"

\]

}

\]

};

**2.6 OPERATIONS & ADMIN**

typescript

const OperationsAdminCategory = {

category: "Operations & Admin",

icon: "⚙️",

subcategories: \[

{

name: "Virtual Assistance",

domains: \[

"Executive Assistance", "Administrative Support", "Personal Assistance",

"Project Coordination", "Travel Planning", "Research", "Scheduling"

\],

specializations: \[

"Calendar Management", "Email Management", "Travel Coordination",

"Document Management", "CRM Management", "Event Planning"

\],

skills: \[

"Microsoft Office", "Google Workspace", "Calendar Management",

"Email Management", "Data Entry", "Research", "Communication"

\],

tools: \[

"Microsoft Office", "Google Workspace", "Calendly", "Zoom",

"Slack", "Asana", "Trello", "Notion"

\],

deliverables: \[

"Organized Calendar", "Email Management", "Travel Itinerary",

"Meeting Notes", "Research Report", "Database Updates"

\]

},

{

name: "Data Entry & Processing",

domains: \[

"Data Entry", "Data Cleaning", "Data Migration", "Database Management",

"Spreadsheet Management", "Form Processing", "Transcription"

\],

specializations: \[

"Excel Expert", "Database Management", "Data Cleaning",

"Web Scraping", "OCR Processing", "Audio Transcription"

\],

skills: \[

"Excel", "Google Sheets", "Data Entry", "10-key", "Accuracy",

"SQL Basics", "Data Validation", "Quality Control"

\],

tools: \[

"Excel", "Google Sheets", "Access", "Airtable", "MySQL",

"OCR Software", "Express Scribe", "Data Scraping Tools"

\],

deliverables: \[

"Clean Database", "Spreadsheet", "Data Report", "Transcription",

"Migration Report", "Quality Report", "Data Dashboard"

\]

},

{

name: "Customer Support",

domains: \[

"Email Support", "Chat Support", "Phone Support", "Technical Support",

"Social Media Support", "Help Desk", "Community Management"

\],

specializations: \[

"Technical Support", "Customer Success", "Live Chat", "Ticketing",

"Knowledge Base", "Community Moderation", "Support Training"

\],

skills: \[

"Customer Service", "Communication", "Problem Solving", "Empathy",

"Product Knowledge", "Ticketing Systems", "De-escalation"

\],

tools: \[

"Zendesk", "Intercom", "Freshdesk", "Help Scout", "LiveChat",

"Slack", "Discord", "Salesforce Service Cloud"

\],

deliverables: \[

"Support Documentation", "FAQ", "Response Templates", "Training Guide",

"Support Metrics", "Customer Feedback Report", "Knowledge Base"

\]

},

{

name: "Bookkeeping & Accounting",

domains: \[

"Bookkeeping", "Accounts Payable", "Accounts Receivable", "Payroll",

"Financial Reporting", "Tax Preparation", "Expense Management"

\],

specializations: \[

"QuickBooks Expert", "Xero Specialist", "Payroll Processing",

"Financial Reporting", "Tax Preparation", "Audit Support"

\],

skills: \[

"QuickBooks", "Xero", "Excel", "Bookkeeping", "Reconciliation",

"Financial Reporting", "Tax Knowledge", "Attention to Detail"

\],

tools: \[

"QuickBooks", "Xero", "Wave", "FreshBooks", "Excel",

"Expensify", "Bill.com", "Gusto"

\],

deliverables: \[

"Financial Statements", "Bank Reconciliation", "Expense Report",

"Payroll Report", "Tax Documents", "Budget Report", "Invoice Management"

\]

},

{

name: "Project Coordination",

domains: \[

"Project Administration", "Resource Coordination", "Timeline Management",

"Documentation", "Meeting Coordination", "Vendor Management"

\],

specializations: \[

"Agile Support", "PMO Support", "Resource Planning", "Risk Tracking",

"Status Reporting", "Stakeholder Communication"

\],

skills: \[

"Project Management", "Organization", "Communication", "MS Project",

"Risk Management", "Documentation", "Scheduling"

\],

tools: \[

"Asana", "Trello", "Monday.com", "MS Project", "Jira",

"Basecamp", "ClickUp", "Smartsheet"

\],

deliverables: \[

"Project Plan", "Status Reports", "Meeting Minutes", "Risk Log",

"Resource Plan", "Timeline", "Documentation"

\]

},

{

name: "Supply Chain & Procurement",

domains: \[

"Vendor Management", "Purchasing", "Inventory Management",

"Logistics Coordination", "Sourcing", "Contract Management"

\],

specializations: \[

"Strategic Sourcing", "Vendor Negotiation", "Inventory Optimization",

"Supply Chain Analytics", "Procurement Process", "Cost Reduction"

\],

skills: \[

"Negotiation", "Vendor Management", "Excel", "ERP Systems",

"Supply Chain Management", "Cost Analysis", "Contract Management"

\],

tools: \[

"SAP", "Oracle", "Coupa", "Ariba", "Excel", "Power BI",

"Tableau", "EDI Systems"

\],

deliverables: \[

"Vendor Analysis", "RFQ/RFP", "Purchase Orders", "Cost Analysis",

"Supplier Scorecard", "Inventory Report", "Savings Report"

\]

}

\]

};

**2.7 ENGINEERING & ARCHITECTURE**

typescript

const EngineeringArchitectureCategory = {

category: "Engineering & Architecture",

icon: "🏗️",

subcategories: \[

{

name: "Civil Engineering",

domains: \[

"Structural Engineering", "Transportation", "Water Resources",

"Geotechnical", "Environmental", "Construction Management"

\],

specializations: \[

"Structural Design", "Highway Design", "Bridge Design",

"Foundation Design", "Hydraulic Engineering", "Seismic Design"

\],

skills: \[

"AutoCAD", "Revit", "SAP2000", "ETABS", "Civil 3D",

"Structural Analysis", "BIM", "Project Management"

\],

tools: \[

"AutoCAD", "Revit", "Civil 3D", "SAP2000", "ETABS",

"STAAD.Pro", "Bentley", "Primavera"

\],

deliverables: \[

"Engineering Drawings", "Structural Calculations", "Design Report",

"Cost Estimate", "Project Schedule", "Technical Specifications"

\]

},

{

name: "Mechanical Engineering",

domains: \[

"Product Design", "HVAC", "Manufacturing", "Robotics",

"Automotive", "Aerospace", "Energy Systems"

\],

specializations: \[

"CAD Design", "FEA Analysis", "CFD Analysis", "Product Development",

"Thermal Design", "Mechatronics", "Quality Engineering"

\],

skills: \[

"SolidWorks", "CATIA", "Inventor", "ANSYS", "MATLAB",

"FEA", "CFD", "GD&T", "DFM", "Six Sigma"

\],

tools: \[

"SolidWorks", "CATIA", "Inventor", "Fusion 360", "ANSYS",

"COMSOL", "MATLAB", "Simulink", "KeyShot"

\],

deliverables: \[

"CAD Models", "Technical Drawings", "FEA Report", "Prototype",

"Manufacturing Drawings", "Assembly Instructions", "BOM"

\]

},

{

name: "Electrical Engineering",

domains: \[

"Circuit Design", "Power Systems", "Control Systems", "Electronics",

"Embedded Systems", "Telecommunications", "Renewable Energy"

\],

specializations: \[

"PCB Design", "Power Electronics", "Digital Design", "Analog Design",

"RF Design", "FPGA", "PLC Programming"

\],

skills: \[

"Circuit Design", "PCB Layout", "VHDL/Verilog", "PLC Programming",

"MATLAB", "LabVIEW", "Power Systems", "Control Theory"

\],

tools: \[

"Altium", "Eagle", "KiCad", "Cadence", "MATLAB", "Simulink",

"LabVIEW", "PSPICE", "Quartus"

\],

deliverables: \[

"Circuit Schematic", "PCB Layout", "BOM", "Test Report",

"Technical Documentation", "Firmware", "Control System Design"

\]

},

{

name: "Architecture",

domains: \[

"Residential", "Commercial", "Industrial", "Landscape",

"Interior Architecture", "Urban Planning", "Sustainable Design"

\],

specializations: \[

"Conceptual Design", "Schematic Design", "Design Development",

"Construction Documents", "3D Visualization", "BIM Coordination"

\],

skills: \[

"AutoCAD", "Revit", "SketchUp", "Rhino", "3ds Max",

"BIM", "Rendering", "Building Codes", "Sustainable Design"

\],

tools: \[

"AutoCAD", "Revit", "SketchUp", "Rhino", "ArchiCAD",

"Lumion", "V-Ray", "Enscape", "Grasshopper"

\],

deliverables: \[

"Floor Plans", "Elevations", "Sections", "3D Renderings",

"Construction Documents", "Design Presentation", "BIM Model"

\]

},

{

name: "Industrial Design",

domains: \[

"Product Design", "Consumer Electronics", "Furniture", "Medical Devices",

"Packaging", "Transportation Design", "User Experience"

\],

specializations: \[

"Concept Development", "User Research", "Prototyping", "CMF Design",

"Design for Manufacturing", "Ergonomics", "Sustainability"

\],

skills: \[

"Sketching", "3D Modeling", "Prototyping", "User Research",

"Materials Knowledge", "Manufacturing Processes", "Rendering"

\],

tools: \[

"SolidWorks", "Rhino", "KeyShot", "Fusion 360", "Alias",

"Adobe Creative Suite", "Gravity Sketch", "3D Printing"

\],

deliverables: \[

"Concept Sketches", "3D Models", "Renderings", "Prototype",

"Technical Drawings", "CMF Specification", "Design Documentation"

\]

},

{

name: "Environmental Engineering",

domains: \[

"Water Treatment", "Air Quality", "Waste Management", "Remediation",

"Environmental Impact", "Sustainability", "Climate Change"

\],

specializations: \[

"Water Resources", "Air Pollution Control", "Solid Waste",

"Environmental Assessment", "Remediation Design", "Compliance"

\],

skills: \[

"Environmental Modeling", "GIS", "Laboratory Analysis",

"Regulatory Compliance", "Impact Assessment", "Sustainability"

\],

tools: \[

"ArcGIS", "EPANET", "SWMM", "AERMOD", "AutoCAD",

"Excel", "R", "Python"

\],

deliverables: \[

"Environmental Impact Assessment", "Compliance Report", "Design Plans",

"Monitoring Report", "Remediation Plan", "Permit Applications"

\]

}

\]

};

**2.8 EDUCATION & TRAINING**

typescript

const EducationTrainingCategory = {

category: "Education & Training",

icon: "🎓",

subcategories: \[

{

name: "Online Course Creation",

domains: \[

"Video Courses", "Text-based Courses", "Interactive Courses",

"Certification Programs", "Microlearning", "Cohort-based Courses"

\],

specializations: \[

"Instructional Design", "Video Production", "Assessment Design",

"Learning Management", "Student Engagement", "Course Marketing"

\],

skills: \[

"Instructional Design", "Video Editing", "Screen Recording",

"Curriculum Development", "Assessment Creation", "LMS Management"

\],

tools: \[

"Camtasia", "OBS Studio", "Articulate", "Adobe Captivate",

"Teachable", "Thinkific", "Moodle", "Canvas"

\],

deliverables: \[

"Course Curriculum", "Video Lessons", "Course Materials",

"Assessments", "Certificates", "Student Resources", "LMS Setup"

\]

},

{

name: "Corporate Training",

domains: \[

"Leadership Development", "Sales Training", "Technical Training",

"Compliance Training", "Soft Skills", "Onboarding Programs"

\],

specializations: \[

"Training Needs Analysis", "Workshop Design", "E-learning Development",

"Train-the-Trainer", "Performance Improvement", "Change Management"

\],

skills: \[

"Training Design", "Facilitation", "Needs Assessment",

"Adult Learning", "Evaluation", "Workshop Delivery"

\],

tools: \[

"Articulate 360", "Adobe Captivate", "Vyond", "Mentimeter",

"Kahoot", "Miro", "MS Teams", "Zoom"

\],

deliverables: \[

"Training Program", "Workshop Materials", "E-learning Modules",

"Facilitator Guide", "Participant Workbook", "Assessment Tools"

\]

},

{

name: "Academic Tutoring",

domains: \[

"K-12 Tutoring", "College Tutoring", "Test Prep", "Language Learning",

"STEM Subjects", "Humanities", "Special Education"

\],

specializations: \[

"Math Tutoring", "Science Tutoring", "SAT/ACT Prep", "Language Arts",

"ESL/TEFL", "Special Needs", "Study Skills"

\],

skills: \[

"Subject Expertise", "Teaching Methods", "Assessment", "Patience",

"Communication", "Differentiated Instruction", "Online Teaching"

\],

tools: \[

"Zoom", "Google Meet", "Miro", "Khan Academy", "Desmos",

"Quizlet", "Padlet", "Nearpod"

\],

deliverables: \[

"Lesson Plans", "Practice Problems", "Study Guides", "Progress Reports",

"Test Prep Materials", "Homework Help", "Learning Resources"

\]

},

{

name: "Curriculum Development",

domains: \[

"K-12 Curriculum", "Higher Education", "Professional Development",

"Online Learning", "Competency-based", "Project-based Learning"

\],

specializations: \[

"Standards Alignment", "Assessment Design", "Learning Objectives",

"Scope and Sequence", "Educational Technology", "Differentiation"

\],

skills: \[

"Curriculum Design", "Standards Mapping", "Assessment Creation",

"Learning Theory", "Educational Research", "Project Management"

\],

tools: \[

"Google Workspace", "Microsoft Office", "Curriculum Mapping Tools",

"LMS Platforms", "Assessment Tools", "Collaboration Platforms"

\],

deliverables: \[

"Curriculum Map", "Lesson Plans", "Assessment Rubrics", "Standards Alignment",

"Teacher Guides", "Student Materials", "Resource Lists"

\]

},

{

name: "Educational Consulting",

domains: \[

"School Improvement", "EdTech Implementation", "Program Evaluation",

"Policy Development", "Grant Writing", "Accreditation"

\],

specializations: \[

"Strategic Planning", "Data Analysis", "Change Management",

"Professional Development", "Technology Integration", "Equity Initiatives"

\],

skills: \[

"Educational Leadership", "Data Analysis", "Strategic Planning",

"Grant Writing", "Program Evaluation", "Stakeholder Engagement"

\],

tools: \[

"Data Analysis Tools", "Survey Platforms", "Project Management Software",

"Presentation Tools", "Collaboration Platforms"

\],

deliverables: \[

"Needs Assessment", "Strategic Plan", "Implementation Guide",

"Evaluation Report", "Grant Proposal", "Professional Development Plan"

\]

}

\]

};

**2.9 LEGAL & COMPLIANCE**

typescript

const LegalComplianceCategory = {

category: "Legal & Compliance",

icon: "⚖️",

subcategories: \[

{

name: "Legal Writing & Research",

domains: \[

"Contract Drafting", "Legal Research", "Brief Writing", "Patent Filing",

"Trademark Registration", "Legal Documentation", "Compliance Documents"

\],

specializations: \[

"Contract Law", "Intellectual Property", "Corporate Law",

"Employment Law", "Real Estate Law", "Privacy Law"

\],

skills: \[

"Legal Research", "Legal Writing", "Contract Review", "Due Diligence",

"Regulatory Compliance", "Risk Assessment"

\],

tools: \[

"Westlaw", "LexisNexis", "Contract Management Software",

"Document Automation", "E-discovery Tools"

\],

deliverables: \[

"Contracts", "Legal Briefs", "Patent Applications", "Compliance Policies",

"Terms of Service", "Privacy Policies", "Legal Opinions"

\]

},

{

name: "Compliance & Risk",

domains: \[

"GDPR Compliance", "HIPAA Compliance", "SOC 2", "ISO Certification",

"Financial Compliance", "Data Privacy", "AML/KYC"

\],

specializations: \[

"Data Protection", "Financial Regulations", "Healthcare Compliance",

"Cybersecurity Compliance", "Environmental Compliance"

\],

skills: \[

"Risk Assessment", "Policy Development", "Audit Management",

"Regulatory Research", "Training Development", "Incident Response"

\],

tools: \[

"GRC Platforms", "Compliance Software", "Audit Tools",

"Risk Management Systems", "Policy Management Tools"

\],

deliverables: \[

"Compliance Audit", "Risk Assessment", "Policy Documents",

"Training Materials", "Compliance Roadmap", "Incident Reports"

\]

}

\]

};

**2.10 HEALTH & WELLNESS**

typescript

const HealthWellnessCategory = {

category: "Health & Wellness",

icon: "🏥",

subcategories: \[

{

name: "Health & Medical Writing",

domains: \[

"Medical Writing", "Health Content", "Patient Education",

"Clinical Research", "Regulatory Writing", "Healthcare Marketing"

\],

specializations: \[

"Clinical Trial Documentation", "Medical Journalism", "Patient Materials",

"Regulatory Submissions", "Scientific Publications"

\],

skills: \[

"Medical Terminology", "Scientific Writing", "Research", "Data Analysis",

"Regulatory Knowledge", "Patient Communication"

\],

tools: \[

"PubMed", "EndNote", "Statistical Software", "Reference Managers",

"Medical Databases"

\],

deliverables: \[

"Clinical Study Reports", "Patient Information", "Medical Articles",

"Regulatory Documents", "Healthcare Content", "Research Papers"

\]

},

{

name: "Wellness & Fitness",

domains: \[

"Personal Training", "Nutrition Planning", "Yoga Instruction",

"Mental Health", "Corporate Wellness", "Health Coaching"

\],

specializations: \[

"Fitness Programming", "Nutrition Counseling", "Mindfulness Training",

"Stress Management", "Weight Management", "Sports Performance"

\],

skills: \[

"Program Design", "Nutritional Knowledge", "Coaching", "Motivation",

"Assessment", "Goal Setting", "Behavior Change"

\],

tools: \[

"Fitness Apps", "Nutrition Software", "Video Platforms",

"Tracking Tools", "Assessment Tools"

\],

deliverables: \[

"Workout Plans", "Meal Plans", "Coaching Sessions", "Wellness Programs",

"Progress Tracking", "Educational Content"

\]

}

\]

};

**3\. DOMAIN-SPECIFIC FILTERS**

**3.1 Industry Domains (Cross-Category)**

typescript

const IndustryDomains = \[

"Technology", "Healthcare", "Finance", "Retail", "Manufacturing",

"Education", "Government", "Non-profit", "Real Estate", "Entertainment",

"Hospitality", "Transportation", "Energy", "Agriculture", "Telecommunications",

"Pharmaceutical", "Automotive", "Aerospace", "Construction", "Media",

"Sports", "Fashion", "Food & Beverage", "Travel", "Insurance"

\];

**3.2 Project Size Domains**

typescript

const ProjectSizeDomains = \[

"Micro (<$500)",

"Small ($500-$5,000)",

"Medium ($5,000-$50,000)",

"Large ($50,000-$250,000)",

"Enterprise ($250,000+)"

\];

**3.3 Expertise Level Domains**

typescript

const ExpertiseLevels = \[

"Entry Level (0-2 years)",

"Intermediate (2-5 years)",

"Advanced (5-10 years)",

"Expert (10+ years)",

"Specialist (Deep expertise in specific area)"

\];

**4\. DYNAMIC SKILL TAGGING SYSTEM**

**4.1 Skill Tag Structure**

typescript

interface SkillTag {

id: string;

name: string;

category: string;

subcategory: string;

type: 'technical' | 'soft' | 'tool' | 'certification' | 'language';

proficiencyLevels: \['beginner', 'intermediate', 'advanced', 'expert'\];

verifiable: boolean;

decayRate: number; _// months before re-verification needed_

relatedSkills: string\[\];

industryRelevance: string\[\];

emergingTrend: boolean;

demandLevel: 'low' | 'medium' | 'high' | 'critical';

}

**4.2 Cross-Domain Skill Combinations**

typescript

const CrossDomainPackages = {

"Full-Stack Developer": {

required: \["Frontend Development", "Backend Development", "Database Design"\],

optional: \["DevOps", "UI/UX Design", "Project Management"\]

},

"Growth Hacker": {

required: \["Digital Marketing", "Data Analysis", "A/B Testing"\],

optional: \["Copywriting", "Basic Coding", "Product Management"\]

},

"Product Designer": {

required: \["UI/UX Design", "User Research", "Prototyping"\],

optional: \["Frontend Development", "Brand Design", "Motion Design"\]

},

"Data Scientist": {

required: \["Machine Learning", "Statistical Analysis", "Python"\],

optional: \["Data Engineering", "Business Intelligence", "Domain Expertise"\]

},

"Technical Writer": {

required: \["Technical Writing", "API Documentation", "Developer Experience"\],

optional: \["Basic Coding", "UI/UX Understanding", "Video Creation"\]

}

};

**5\. AI-POWERED CATEGORY MATCHING**

**5.1 Semantic Category Mapping**

typescript

interface CategoryMatcher {

_// Natural language project description to category mapping_

nlpToCategoryMapping: {

input: string; _// "I need someone to build a website with AI chatbot"_

primaryCategory: string; _// "Technology & Development"_

primarySubcategory: string; _// "Web Development"_

secondaryCategories: string\[\]; _// \["AI/ML & Data Science"\]_

suggestedSkills: string\[\]; _// \["React", "Node.js", "OpenAI API", "ChatGPT"\]_

estimatedBudgetRange: string; _// Based on category typical rates_

};

_// Multi-category project detection_

multiCategoryDetection: {

detected: boolean;

categories: CategoryWeight\[\];

suggestedTeamComposition: TeamMember\[\];

coordinationComplexity: 'low' | 'medium' | 'high';

};

}

interface CategoryWeight {

category: string;

weight: number; _// 0-1, representing portion of project_

criticalPath: boolean; _// If this category blocks others_

}

**5.2 Emerging Skills & Categories**

typescript

const EmergingCategories = {

_// Automatically added based on market trends_

"AI Prompt Engineering": {

parent: "Technology & Development",

skills: \["Prompt Design", "LLM Fine-tuning", "Chain-of-Thought"\],

growth: "explosive"

},

"Metaverse Development": {

parent: "Technology & Development",

skills: \["Unity", "Unreal", "WebXR", "Blockchain"\],

growth: "high"

},

"Sustainability Consulting": {

parent: "Business & Consulting",

skills: \["ESG Reporting", "Carbon Accounting", "Circular Economy"\],

growth: "high"

},

"Creator Economy Support": {

parent: "Marketing & Sales",

skills: \["Content Strategy", "Monetization", "Community Building"\],

growth: "high"

}

};

**6\. CATEGORY-BASED PLATFORM FEATURES**

**6.1 Category-Specific Verification**

typescript

interface CategoryVerification {

"Technology & Development": {

codeReview: boolean;

githubIntegration: boolean;

liveCodeChallenge: boolean;

portfolioCodeAnalysis: boolean;

};

"Creative & Design": {

portfolioReview: boolean;

originalityCheck: boolean;

toolProficiency: boolean;

styleConsistency: boolean;

};

"Writing & Content": {

writingSample: boolean;

plagiarismCheck: boolean;

grammarAssessment: boolean;

subjectExpertise: boolean;

};

_// ... other categories_

}

**6.2 Category-Specific Pricing Models**

typescript

interface CategoryPricing {

defaultModel: 'hourly' | 'fixed' | 'milestone' | 'retainer';

typicalRates: {

entry: { min: number; max: number; currency: string };

intermediate: { min: number; max: number; currency: string };

expert: { min: number; max: number; currency: string };

};

commonPackages: Package\[\];

surgePricing: boolean; _// If category supports demand-based pricing_

}

RS

Continue

**7\. CATEGORY-BASED MATCHING ALGORITHM**

**7.1 Multi-Dimensional Matching**

typescript

interface CategoryMatchingEngine {

_// Weighted matching factors by category_

matchingWeights: {

"Technology & Development": {

technicalSkills: 0.35,

experience: 0.20,

portfolioQuality: 0.15,

availabilityMatch: 0.10,

rateMatch: 0.10,

communicationScore: 0.05,

culturalFit: 0.05

},

"Creative & Design": {

portfolioQuality: 0.30,

styleMatch: 0.25,

technicalSkills: 0.15,

experience: 0.10,

creativityScore: 0.10,

clientReviews: 0.10

},

"Business & Consulting": {

industryExperience: 0.30,

credentials: 0.20,

caseStudies: 0.20,

methodology: 0.15,

communicationScore: 0.10,

availability: 0.05

}

_// ... other categories_

};

_// Category-specific success predictors_

successPredictors: {

category: string;

criticalFactors: string\[\];

redFlags: string\[\];

optimalTeamSize: { min: number; max: number };

typicalDuration: string;

riskFactors: RiskFactor\[\];

};

}

interface RiskFactor {

factor: string;

impact: 'low' | 'medium' | 'high';

mitigation: string;

earlyWarningSignals: string\[\];

}

**7.2 Cross-Category Team Assembly**

typescript

interface TeamAssemblyEngine {

_// For multi-category projects_

assembleTeam(project: Project): TeamComposition {

return {

leadCategory: string, _// Primary category owner_

teamMembers: \[

{

category: "Technology & Development",

subcategory: "Backend Development",

role: "Technical Lead",

allocation: 0.4, _// 40% of project_

criticalPath: true

},

{

category: "Creative & Design",

subcategory: "UI/UX Design",

role: "Design Lead",

allocation: 0.3,

criticalPath: true

},

{

category: "Writing & Content",

subcategory: "Technical Writing",

role: "Documentation Specialist",

allocation: 0.2,

criticalPath: false

},

{

category: "Business & Consulting",

subcategory: "Project Management",

role: "Project Coordinator",

allocation: 0.1,

criticalPath: false

}

\],

coordinationModel: 'hub-and-spoke' | 'collaborative' | 'sequential',

communicationChannels: string\[\],

deliverableDependencies: DependencyMap

};

}

}

**8\. CATEGORY EVOLUTION & GOVERNANCE**

**8.1 Category Lifecycle Management**

typescript

interface CategoryLifecycle {

stages: {

emerging: {

criteria: "Less than 100 active freelancers",

features: "Experimental, limited verification",

feeReduction: 0.5 _// 50% platform fee reduction_

},

growing: {

criteria: "100-1000 active freelancers",

features: "Standard verification, basic templates",

feeReduction: 0.25

},

mature: {

criteria: "1000+ active freelancers",

features: "Full verification, AI matching, templates",

feeReduction: 0

},

declining: {

criteria: "Decreasing demand for 6 months",

features: "Maintenance mode, merge recommendations",

action: "Consider merging with related categories"

}

};

_// Automatic category creation_

autoCreateTriggers: {

searchVolume: 1000, _// Monthly searches for non-existent category_

freelancerRequests: 50, _// Direct requests to add category_

projectsUnmatched: 100 _// Projects that don't fit existing categories_

};

_// Category merging rules_

mergingRules: {

similarityThreshold: 0.8, _// Skill overlap percentage_

volumeThreshold: 50, _// Monthly projects minimum_

approvalRequired: "community_vote" | "platform_decision"

};

}

**8.2 Community-Driven Category Management**

typescript

interface CategoryGovernance {

_// Freelancer guild management_

guildStructure: {

minimumMembers: 10,

leadershipRoles: \["Guild Master", "Skill Validators", "Mentors"\],

responsibilities: \[

"Skill verification standards",

"Template creation",

"Pricing guidance",

"Quality standards",

"Dispute mediation"

\],

benefits: \[

"Reduced platform fees",

"Priority in matching",

"Access to exclusive projects",

"Training resources"

\]

};

_// Category-specific standards_

qualityStandards: {

category: string;

minimumDeliverables: string\[\];

requiredDocumentation: string\[\];

communicationStandards: string\[\];

revisionPolicy: string;

qualityMetrics: QualityMetric\[\];

};

_// Voting mechanism_

votingSystem: {

proposalTypes: \[

"Add new subcategory",

"Modify skill requirements",

"Update pricing guidelines",

"Change verification methods"

\],

votingEligibility: "Active members with 5+ completed projects",

passingThreshold: 0.66, _// 66% approval needed_

implementationPeriod: "30 days after approval"

};

}

**9\. CATEGORY-SPECIFIC AI FEATURES**

**9.1 AI Assistants by Category**

typescript

interface CategoryAIAssistants {

"Technology & Development": {

codeReviewer: {

functions: \["Security scan", "Performance analysis", "Best practices check"\],

languages: \["All major programming languages"\],

integration: \["GitHub", "GitLab", "Bitbucket"\]

},

architectureAdvisor: {

functions: \["System design review", "Scalability assessment", "Cost optimization"\],

frameworks: \["Microservices", "Serverless", "Monolithic", "Event-driven"\]

},

debuggingAssistant: {

functions: \["Error analysis", "Solution suggestions", "Stack trace interpretation"\],

realTime: true

}

},

"Creative & Design": {

designCritique: {

functions: \["Composition analysis", "Color harmony", "Accessibility check"\],

standards: \["WCAG", "Material Design", "iOS HIG"\]

},

inspirationEngine: {

functions: \["Mood board generation", "Style matching", "Trend analysis"\],

sources: \["Behance", "Dribbble", "Awards sites"\]

},

assetGenerator: {

functions: \["Icon suggestions", "Color palette", "Font pairing"\],

customization: true

}

},

"Writing & Content": {

grammarChecker: {

functions: \["Grammar", "Style", "Tone", "Plagiarism"\],

styles: \["Academic", "Business", "Creative", "Technical"\]

},

seoOptimizer: {

functions: \["Keyword analysis", "Readability", "Meta descriptions"\],

integration: \["Google Search Console", "SEMrush API"\]

},

researchAssistant: {

functions: \["Fact checking", "Source finding", "Citation formatting"\],

databases: \["Academic", "News", "Industry reports"\]

}

},

"Business & Consulting": {

dataAnalyst: {

functions: \["Trend analysis", "Forecasting", "Visualization"\],

tools: \["Excel automation", "SQL generation", "Dashboard creation"\]

},

frameworkAdvisor: {

functions: \["Framework selection", "Template provision", "Best practices"\],

frameworks: \["SWOT", "Porter's", "BCG", "McKinsey 7S", "PESTLE"\]

},

presentationEnhancer: {

functions: \["Slide design", "Data visualization", "Storytelling flow"\],

output: \["PowerPoint", "Google Slides", "Keynote"\]

}

}

};

**9.2 Category-Specific Automation**

typescript

interface CategoryAutomation {

"Technology & Development": {

autoTesting: {

unitTests: "Generate from code",

integrationTests: "API endpoint testing",

e2eTests: "User flow testing",

performanceTests: "Load and stress testing"

},

cicdSetup: {

pipeline: "Auto-generate CI/CD configuration",

deployment: "One-click deployment setup",

monitoring: "Automatic monitoring integration"

},

documentation: {

apiDocs: "Generate from code comments",

readme: "Auto-generate from project structure",

changelog: "Generate from commit history"

}

},

"Creative & Design": {

assetExport: {

formats: "Auto-export to multiple formats",

sizes: "Responsive size generation",

optimization: "Automatic image optimization"

},

designSystem: {

components: "Extract reusable components",

styleguide: "Generate from designs",

tokens: "Design token extraction"

},

handoff: {

specs: "Auto-generate design specifications",

assets: "Organized asset delivery",

code: "CSS/Swift/Kotlin generation"

}

},

"Marketing & Sales": {

campaignAutomation: {

scheduling: "Multi-platform scheduling",

abTesting: "Automatic variant testing",

reporting: "Consolidated reporting"

},

leadGeneration: {

scraping: "Automated lead finding",

enrichment: "Contact information enrichment",

scoring: "Lead quality scoring"

},

contentDistribution: {

publishing: "Multi-channel publishing",

repurposing: "Content format conversion",

localization: "Automatic translation"

}

}

};

**10\. CATEGORY MARKETPLACE DYNAMICS**

**10.1 Supply-Demand Analytics**

typescript

interface CategoryMarketAnalytics {

realTimeMetrics: {

category: string;

subcategory: string;

metrics: {

activeFreelancers: number;

activeProjects: number;

averageRate: Money;

demandTrend: 'increasing' | 'stable' | 'decreasing';

supplyTrend: 'increasing' | 'stable' | 'decreasing';

averageProjectDuration: Duration;

successRate: number;

disputeRate: number;

};

};

pricingIntelligence: {

suggestedRates: {

percentile25: Money;

median: Money;

percentile75: Money;

factors: \["Experience", "Portfolio", "Reviews", "Certifications"\];

};

surgeIndicators: {

demandSpike: boolean;

seasonalTrend: boolean;

emergingSkill: boolean;

scarcityPremium: number; _// Multiplier for rare skills_

};

};

competitiveLandscape: {

topFreelancers: FreelancerProfile\[\];

emergingTalent: FreelancerProfile\[\];

skillGaps: string\[\]; _// In-demand skills with low supply_

trainingOpportunities: Course\[\]; _// Suggested upskilling_

};

}

**10.2 Category-Based Recommendations**

typescript

interface CategoryRecommendationEngine {

forFreelancers: {

categoryExpansion: {

current: string\[\];

recommended: string\[\];

reasoning: string;

requiredSkills: string\[\];

estimatedLearningTime: Duration;

potentialRevenueIncrease: number;

};

specializationSuggestions: {

niche: string;

demandLevel: 'high' | 'medium' | 'low';

competition: 'high' | 'medium' | 'low';

averagePremium: number; _// % above general category rate_

requiredInvestment: Money; _// Training, tools, certifications_

};

packageSuggestions: {

basePackage: ServicePackage;

upsells: ServicePackage\[\];

bundleOpportunities: string\[\];

pricingStrategy: 'premium' | 'competitive' | 'penetration';

};

};

forClients: {

categorySelection: {

projectDescription: string;

primaryCategory: CategoryMatch;

alternativeCategories: CategoryMatch\[\];

hybridApproach: TeamComposition;

budgetImplications: BudgetBreakdown;

};

talentPoolInsights: {

availability: 'immediate' | 'limited' | 'scarce';

leadTime: Duration;

alternativeLocations: string\[\]; _// Geographic arbitrage_

qualityTiers: TalentTier\[\];

};

};

}

**11\. CATEGORY PERFORMANCE TRACKING**

**11.1 Category Health Metrics**

typescript

interface CategoryHealthDashboard {

categoryScorecard: {

category: string;

healthScore: number; _// 0-100_

metrics: {

freelancerGrowth: Trend;

projectVolume: Trend;

averageRateTrend: Trend;

qualityScore: number;

innovationIndex: number; _// New skills/tools adoption_

communityEngagement: number;

disputeResolution: number;

clientSatisfaction: number;

};

alerts: {

type: 'warning' | 'critical' | 'opportunity';

message: string;

actionRequired: string;

deadline?: Date;

}\[\];

};

subcategoryAnalysis: {

topPerforming: Subcategory\[\];

declining: Subcategory\[\];

emerging: Subcategory\[\];

consolidationCandidates: Subcategory\[\]\[\]; _// Groups to merge_

};

competitivePosition: {

marketShare: number;

differentiators: string\[\];

weaknesses: string\[\];

opportunities: string\[\];

threats: string\[\];

};

}

**11.2 Quality Assurance by Category**

typescript

interface CategoryQualityFramework {

"Technology & Development": {

codeQuality: {

metrics: \["Test coverage", "Code complexity", "Documentation", "Security"\],

minimumScores: { test: 80, complexity: 'B', docs: 70, security: 'A' },

verificationMethod: "Automated scanning + peer review"

},

deliveryQuality: {

metrics: \["On-time", "Bug-free", "Performance", "Scalability"\],

sla: { onTime: 95, bugRate: '<5%', performance: '99.9%' }

}

},

"Creative & Design": {

designQuality: {

metrics: \["Originality", "Technical execution", "Brand alignment", "Usability"\],

reviewProcess: "AI analysis + expert review + client feedback",

revisionPolicy: "2 rounds included, additional charged"

},

fileQuality: {

requirements: \["Layered files", "Vector formats", "Color profiles", "Font files"\],

verification: "Automated check + manual review"

}

},

"Writing & Content": {

contentQuality: {

metrics: \["Originality", "Accuracy", "Readability", "SEO optimization"\],

tools: \["Plagiarism checker", "Fact checker", "Readability analyzer"\],

minimumScores: { originality: 95, accuracy: 100, readability: 60 }

},

deliveryStandards: {

formats: \["Google Docs", "Word", "Markdown", "HTML"\],

includes: \["Meta descriptions", "Image captions", "Internal links"\],

revisions: "1 major, 2 minor included"

}

}

_// ... other categories_

}

**12\. IMPLEMENTATION STRATEGY**

**12.1 Category Rollout Plan**

typescript

const CategoryRolloutPhases = {

phase1_MVP: {

categories: \[

"Technology & Development",

"Creative & Design",

"Writing & Content"

\],

subcategories: "Top 3 per category",

features: "Basic matching, escrow, messaging",

duration: "Months 1-3"

},

phase2_Expansion: {

categories: \[

"Business & Consulting",

"Marketing & Sales",

"Operations & Admin"

\],

subcategories: "All high-demand",

features: "AI matching, skill verification, analytics",

duration: "Months 4-6"

},

phase3_Specialization: {

categories: \[

"Engineering & Architecture",

"Education & Training",

"Legal & Compliance",

"Health & Wellness"

\],

subcategories: "Full taxonomy",

features: "AI assistants, automation, guilds",

duration: "Months 7-12"

},

phase4_Innovation: {

categories: "Emerging categories based on demand",

features: "Full AI automation, predictive analytics, meta-projects",

duration: "12+ months"

}

};

**12.2 Database Schema for Categories**

typescript

_// Firestore Collections Structure_

const CategorySchema = {

categories: {

id: "string",

name: "string",

icon: "string",

description: "string",

status: "active | emerging | declining",

freelancerCount: "number",

projectCount: "number",

averageRate: "Money",

createdAt: "timestamp",

updatedAt: "timestamp"

},

subcategories: {

id: "string",

categoryId: "string",

name: "string",

description: "string",

domains: "string\[\]",

specializations: "string\[\]",

skills: "string\[\]",

tools: "string\[\]",

deliverables: "string\[\]",

verificationMethods: "VerificationMethod\[\]",

pricingModel: "PricingModel",

qualityMetrics: "QualityMetric\[\]"

},

skills: {

id: "string",

name: "string",

categoryId: "string",

subcategoryId: "string",

type: "technical | soft | tool | certification",

proficiencyLevels: "Level\[\]",

verifiable: "boolean",

decayRate: "number", _// months_

demandLevel: "low | medium | high | critical",

relatedSkills: "string\[\]",

assessmentId: "string" _// Link to skill test_

},

categoryMatches: {

id: "string",

projectId: "string",

freelancerId: "string",

categoryId: "string",

subcategoryId: "string",

matchScore: "number",

factors: "MatchFactor\[\]",

timestamp: "timestamp"

},

categoryAnalytics: {

categoryId: "string",

date: "date",

metrics: {

activeFreelancers: "number",

newFreelancers: "number",

activeProjects: "number",

completedProjects: "number",

totalRevenue: "Money",

averageProjectSize: "Money",

averageRate: "Money",

successRate: "number",

averageDuration: "number"

}

}

};

This comprehensive Category, Subcategory, and Domain architecture provides:

1. **Complete taxonomy** covering all major freelance areas
2. **Flexible structure** allowing both hierarchical browsing and tag-based search
3. **AI-powered matching** that understands cross-category projects
4. **Dynamic evolution** with emerging categories and community governance
5. **Category-specific features** optimized for each type of work
6. **Quality frameworks** ensuring standards per category
7. **Market intelligence** providing real-time supply-demand insights
8. **Implementation roadmap** for phased rollout