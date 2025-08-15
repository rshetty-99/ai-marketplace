// Identity Verification and Skills Assessment Schema
// Comprehensive system for user verification and skill validation

export interface IdentityVerification {
  id: string;
  userId: string;
  status: VerificationStatus;
  verificationMethod: 'document' | 'video_call' | 'third_party' | 'manual';
  documentType?: DocumentType;
  documentUrl?: string;
  documentBackUrl?: string; // For ID cards with back side
  selfieUrl?: string; // Selfie for identity matching
  videoCallScheduledAt?: Date;
  videoCallCompletedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin user ID who verified
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country: string;
      region: string;
      city: string;
    };
    deviceFingerprint?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillAssessment {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  skillCategory: SkillCategory;
  assessmentType: AssessmentType;
  status: AssessmentStatus;
  score?: number; // 0-100
  level: SkillLevel;
  certificateUrl?: string;
  assessmentData: {
    questions?: QuestionResponse[];
    projectSubmission?: ProjectSubmission;
    codeChallenge?: CodeChallenge;
    portfolioReview?: PortfolioReview;
  };
  attemptCount: number;
  maxAttempts: number;
  timeSpentMinutes?: number;
  passedAt?: Date;
  expiresAt?: Date; // Some certifications expire
  verifiedBy?: string; // For manual reviews
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackgroundCheck {
  id: string;
  userId: string;
  provider: 'checkr' | 'sterling' | 'hireright' | 'manual';
  status: VerificationStatus;
  reportId?: string; // Provider's report ID
  reportUrl?: string;
  checkTypes: BackgroundCheckType[];
  results: {
    criminalHistory?: CheckResult;
    employmentVerification?: CheckResult;
    educationVerification?: CheckResult;
    references?: CheckResult;
    creditCheck?: CheckResult;
  };
  completedAt?: Date;
  expiresAt?: Date;
  cost?: number;
  currency?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Supporting Types
export enum VerificationStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REQUIRES_RESUBMISSION = 'requires_resubmission'
}

export enum DocumentType {
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  NATIONAL_ID = 'national_id',
  RESIDENCE_PERMIT = 'residence_permit',
  WORK_PERMIT = 'work_permit',
  UTILITY_BILL = 'utility_bill',
  BANK_STATEMENT = 'bank_statement',
  TAX_DOCUMENT = 'tax_document'
}

export enum SkillCategory {
  AI_ML = 'ai_ml',
  DATA_SCIENCE = 'data_science',
  SOFTWARE_DEVELOPMENT = 'software_development',
  CLOUD_INFRASTRUCTURE = 'cloud_infrastructure',
  CYBERSECURITY = 'cybersecurity',
  UI_UX_DESIGN = 'ui_ux_design',
  PROJECT_MANAGEMENT = 'project_management',
  BUSINESS_ANALYSIS = 'business_analysis',
  DIGITAL_MARKETING = 'digital_marketing',
  CONSULTING = 'consulting'
}

export enum AssessmentType {
  MULTIPLE_CHOICE = 'multiple_choice',
  CODING_CHALLENGE = 'coding_challenge',
  PROJECT_SUBMISSION = 'project_submission',
  PORTFOLIO_REVIEW = 'portfolio_review',
  LIVE_INTERVIEW = 'live_interview',
  CERTIFICATION_UPLOAD = 'certification_upload',
  PEER_REVIEW = 'peer_review'
}

export enum AssessmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PASSED = 'passed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum BackgroundCheckType {
  CRIMINAL_HISTORY = 'criminal_history',
  EMPLOYMENT_VERIFICATION = 'employment_verification',
  EDUCATION_VERIFICATION = 'education_verification',
  PROFESSIONAL_REFERENCES = 'professional_references',
  CREDIT_CHECK = 'credit_check',
  DRUG_SCREENING = 'drug_screening',
  DRIVING_RECORD = 'driving_record'
}

export interface CheckResult {
  status: 'clear' | 'consider' | 'failed' | 'pending';
  details?: string;
  completedAt?: Date;
}

// Assessment Question Types
export interface QuestionResponse {
  questionId: string;
  questionText: string;
  answerType: 'multiple_choice' | 'code' | 'essay' | 'file_upload';
  userAnswer: any;
  correctAnswer?: any;
  isCorrect?: boolean;
  pointsEarned: number;
  maxPoints: number;
  timeSpentSeconds: number;
}

export interface ProjectSubmission {
  title: string;
  description: string;
  repositoryUrl?: string;
  liveUrl?: string;
  documentationUrl?: string;
  files: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  technologies: string[];
  submittedAt: Date;
}

export interface CodeChallenge {
  challengeId: string;
  language: string;
  problemDescription: string;
  starterCode?: string;
  submittedCode: string;
  testResults: {
    passed: number;
    total: number;
    details: TestCase[];
  };
  executionTime: number;
  memoryUsage: number;
}

export interface TestCase {
  input: any;
  expectedOutput: any;
  actualOutput: any;
  passed: boolean;
  executionTime: number;
}

export interface PortfolioReview {
  portfolioUrl: string;
  projects: {
    title: string;
    description: string;
    url?: string;
    technologies: string[];
    rating: number; // 1-5
    feedback: string;
  }[];
  overallRating: number;
  strengths: string[];
  areasForImprovement: string[];
  reviewedBy: string;
  reviewedAt: Date;
}

// Predefined Skills for Assessment
export const AI_ML_SKILLS = [
  {
    id: 'python_ml',
    name: 'Python for Machine Learning',
    category: SkillCategory.AI_ML,
    description: 'Python programming with ML libraries like scikit-learn, pandas, numpy',
    assessmentTypes: [AssessmentType.CODING_CHALLENGE, AssessmentType.PROJECT_SUBMISSION],
    requiredLevel: SkillLevel.INTERMEDIATE
  },
  {
    id: 'tensorflow_keras',
    name: 'TensorFlow/Keras',
    category: SkillCategory.AI_ML,
    description: 'Deep learning with TensorFlow and Keras frameworks',
    assessmentTypes: [AssessmentType.PROJECT_SUBMISSION, AssessmentType.CODING_CHALLENGE],
    requiredLevel: SkillLevel.INTERMEDIATE
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    category: SkillCategory.AI_ML,
    description: 'Deep learning with PyTorch framework',
    assessmentTypes: [AssessmentType.PROJECT_SUBMISSION, AssessmentType.CODING_CHALLENGE],
    requiredLevel: SkillLevel.INTERMEDIATE
  },
  {
    id: 'nlp',
    name: 'Natural Language Processing',
    category: SkillCategory.AI_ML,
    description: 'Text processing, sentiment analysis, language models',
    assessmentTypes: [AssessmentType.PROJECT_SUBMISSION, AssessmentType.MULTIPLE_CHOICE],
    requiredLevel: SkillLevel.ADVANCED
  },
  {
    id: 'computer_vision',
    name: 'Computer Vision',
    category: SkillCategory.AI_ML,
    description: 'Image processing, object detection, CNN architectures',
    assessmentTypes: [AssessmentType.PROJECT_SUBMISSION, AssessmentType.CODING_CHALLENGE],
    requiredLevel: SkillLevel.ADVANCED
  }
];

export const DATA_SCIENCE_SKILLS = [
  {
    id: 'data_analysis',
    name: 'Data Analysis & Visualization',
    category: SkillCategory.DATA_SCIENCE,
    description: 'Statistical analysis, data visualization with matplotlib, seaborn, plotly',
    assessmentTypes: [AssessmentType.PROJECT_SUBMISSION, AssessmentType.CODING_CHALLENGE],
    requiredLevel: SkillLevel.INTERMEDIATE
  },
  {
    id: 'sql_databases',
    name: 'SQL & Database Management',
    category: SkillCategory.DATA_SCIENCE,
    description: 'Complex SQL queries, database design, optimization',
    assessmentTypes: [AssessmentType.CODING_CHALLENGE, AssessmentType.MULTIPLE_CHOICE],
    requiredLevel: SkillLevel.INTERMEDIATE
  },
  {
    id: 'statistical_modeling',
    name: 'Statistical Modeling',
    category: SkillCategory.DATA_SCIENCE,
    description: 'Regression, classification, hypothesis testing, A/B testing',
    assessmentTypes: [AssessmentType.PROJECT_SUBMISSION, AssessmentType.MULTIPLE_CHOICE],
    requiredLevel: SkillLevel.ADVANCED
  }
];

export const SOFTWARE_DEV_SKILLS = [
  {
    id: 'react_development',
    name: 'React Development',
    category: SkillCategory.SOFTWARE_DEVELOPMENT,
    description: 'React.js, hooks, state management, component architecture',
    assessmentTypes: [AssessmentType.CODING_CHALLENGE, AssessmentType.PROJECT_SUBMISSION],
    requiredLevel: SkillLevel.INTERMEDIATE
  },
  {
    id: 'node_backend',
    name: 'Node.js Backend Development',
    category: SkillCategory.SOFTWARE_DEVELOPMENT,
    description: 'Express.js, REST APIs, database integration, authentication',
    assessmentTypes: [AssessmentType.CODING_CHALLENGE, AssessmentType.PROJECT_SUBMISSION],
    requiredLevel: SkillLevel.INTERMEDIATE
  },
  {
    id: 'system_design',
    name: 'System Design & Architecture',
    category: SkillCategory.SOFTWARE_DEVELOPMENT,
    description: 'Scalable architecture, microservices, distributed systems',
    assessmentTypes: [AssessmentType.LIVE_INTERVIEW, AssessmentType.PROJECT_SUBMISSION],
    requiredLevel: SkillLevel.ADVANCED
  }
];

// Verification Requirements by User Type
export const VERIFICATION_REQUIREMENTS = {
  freelancer: {
    identity: true,
    backgroundCheck: false, // Optional but recommended
    skillAssessment: true,
    minimumSkills: 2,
    requiredDocuments: [DocumentType.PASSPORT, DocumentType.DRIVERS_LICENSE, DocumentType.NATIONAL_ID]
  },
  vendor: {
    identity: true,
    backgroundCheck: true,
    skillAssessment: false, // Company-level verification
    businessVerification: true,
    requiredDocuments: [DocumentType.PASSPORT, DocumentType.DRIVERS_LICENSE]
  },
  customer: {
    identity: false, // Optional
    backgroundCheck: false,
    skillAssessment: false,
    businessVerification: true, // For organizations
    requiredDocuments: []
  }
};

// Assessment Scoring Configuration
export const ASSESSMENT_CONFIG = {
  passingScore: 70, // Minimum score to pass
  maxAttempts: 3,
  timeouts: {
    [AssessmentType.MULTIPLE_CHOICE]: 60, // minutes
    [AssessmentType.CODING_CHALLENGE]: 120,
    [AssessmentType.PROJECT_SUBMISSION]: 7 * 24 * 60, // 1 week
    [AssessmentType.PORTFOLIO_REVIEW]: 3 * 24 * 60, // 3 days
    [AssessmentType.LIVE_INTERVIEW]: 60
  },
  retryDelay: 24 * 60, // 24 hours between attempts
  skillLevelThresholds: {
    [SkillLevel.BEGINNER]: 60,
    [SkillLevel.INTERMEDIATE]: 70,
    [SkillLevel.ADVANCED]: 80,
    [SkillLevel.EXPERT]: 90
  }
};

// Verification Cost Configuration
export const VERIFICATION_COSTS = {
  identityVerification: 0, // Free
  backgroundCheck: 29.99, // USD
  skillAssessment: 0, // Free
  expressVerification: 49.99, // 24-hour turnaround
  videoCallVerification: 19.99
};