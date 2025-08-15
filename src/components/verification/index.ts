// Verification System Components
// Main entry point for all verification-related components

export { DocumentUpload } from './document-upload';
export { SkillsAssessment } from './skills-assessment';
export { VerificationStatus } from './verification-status';
export { VerificationCenter } from './verification-center';

// Types and schemas
export type {
  IdentityVerification,
  SkillAssessment,
  BackgroundCheck,
  VerificationStatus as IVerificationStatus,
  DocumentType,
  SkillCategory,
  AssessmentType,
  AssessmentStatus,
  SkillLevel
} from '@/lib/firebase/verification-schema';

// Re-export useful constants
export {
  AI_ML_SKILLS,
  DATA_SCIENCE_SKILLS,
  SOFTWARE_DEV_SKILLS,
  VERIFICATION_REQUIREMENTS,
  ASSESSMENT_CONFIG,
  VERIFICATION_COSTS
} from '@/lib/firebase/verification-schema';