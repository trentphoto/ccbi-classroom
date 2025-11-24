// Build-time brand configuration
// This file is evaluated at build time, not runtime
// Only BRAND_ID environment variable is needed - everything else is in code

import { BrandId } from '@/types/db';

const BRAND_ID = (process.env.NEXT_PUBLIC_BRAND_ID || 'ccbi') as BrandId;

const BRAND_CONFIGS = {
  ccbi: {
    // Basic Info
    name: 'CCBI Classroom',
    slug: 'ccbi',
    fullName: 'Calvary Chapel Bible Institute',
    description: 'Equipping Believers for Every Good Work',
    
    // Visual Identity
    logoUrl: '/logos/ccbi.svg',
    logoWhiteUrl: '/logos/ccbi-white.svg',
    favicon: '/favicon.ico',
    
    // Colors
    primaryColor: '#072c68',
    secondaryColor: '#086623',
    accentColor: '#d2ac47',
    backgroundColor: '#f8fafc',
    textColor: '#1f2937',
    
    // Branding
    tagline: 'Equipping Believers for Every Good Work',
    mission: 'To provide quality biblical education that equips believers for ministry and service.',
    
    // Contact & Support
    supportEmail: 'support@ccbi.org',
    adminEmail: 'admin@ccbi.org',
    website: 'https://ccbi.org',
    
    // Deployment
    domain: 'ccbi.yourdomain.com',
    
    // Default Settings
    defaultUserRole: 'student',
    allowSelfRegistration: true,
    maxFileUploadSize: 10, // MB
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    
    // Features
    features: {
      messaging: true,
      videoLessons: true,
      fileSubmissions: true,
      grading: true,
      progressTracking: true,
    }
  },
  zts: {
    // Basic Info
    name: 'ZTS Classroom',
    slug: 'zts',
    fullName: 'Zion Theological Seminary',
    description: 'Equipping Students for Success',
    
    // Visual Identity
    logoUrl: '/logos/zts.png',
    logoWhiteUrl: '/logos/zts-white.png',
    favicon: '/favicon.ico',
    
    // Colors
    primaryColor: '#1e40af',
    secondaryColor: '#059669',
    accentColor: '#f59e0b',
    backgroundColor: '#f8fafc',
    textColor: '#1f2937',
    
    // Branding
    tagline: 'Equipping Students for Success',
    mission: 'To provide comprehensive theological education that prepares students for effective ministry.',
    
    // Contact & Support
    supportEmail: 'support@zts.edu',
    adminEmail: 'admin@zts.edu',
    website: 'https://zts.edu',
    
    // Deployment
    domain: 'zts.yourdomain.com',
    
    // Default Settings
    defaultUserRole: 'student',
    allowSelfRegistration: true,
    maxFileUploadSize: 10, // MB
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    
    // Features
    features: {
      messaging: true,
      videoLessons: true,
      fileSubmissions: true,
      grading: true,
      progressTracking: true,
    }
  },
  nbi: {
    // Basic Info
    name: 'NBI Classroom',
    slug: 'nbi',
    fullName: 'National Bible Institute',
    description: 'The Nationally Accredited Bible Institute',
    
    // Visual Identity
    logoUrl: '/logos/nbi.svg',
    logoWhiteUrl: '/logos/nbi-white.svg',
    favicon: '/favicon.ico',
    
    // Colors
    primaryColor: '#000000',
    secondaryColor: '#666666',
    accentColor: '#999999',
    backgroundColor: '#f8fafc',
    textColor: '#1f2937',
    
    // Branding
    tagline: 'The Nationally Accredited Bible Institute',
    mission: 'To provide quality education and training.',
    
    // Contact & Support
    supportEmail: 'admin@nationalbibleinst.org',
    adminEmail: 'admin@nationalbibleinst.org',
    website: 'https://nationalbibleinst.org',
    
    // Deployment
    domain: 'nationalbibleinst.org',
    
    // Default Settings
    defaultUserRole: 'student',
    allowSelfRegistration: true,
    maxFileUploadSize: 10, // MB
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    
    // Features
    features: {
      messaging: true,
      videoLessons: true,
      fileSubmissions: true,
      grading: true,
      progressTracking: true,
    }
  }
} as const;

export const BRAND_CONFIG = BRAND_CONFIGS[BRAND_ID as keyof typeof BRAND_CONFIGS] || BRAND_CONFIGS.ccbi;

// Export the current brand configuration
export const CURRENT_BRAND = BRAND_CONFIG;
export const CURRENT_BRAND_ID = BRAND_ID;

// Brand-specific CSS variables for dynamic theming
export const BRAND_CSS_VARS = {
  '--brand-primary': BRAND_CONFIG.primaryColor,
  '--brand-secondary': BRAND_CONFIG.secondaryColor,
  '--brand-accent': BRAND_CONFIG.accentColor,
  '--brand-background': BRAND_CONFIG.backgroundColor,
  '--brand-text': BRAND_CONFIG.textColor,
  '--brand-name': `"${BRAND_CONFIG.name}"`,
  '--brand-description': `"${BRAND_CONFIG.description}"`,
  '--brand-tagline': `"${BRAND_CONFIG.tagline}"`,
};

// Utility functions for brand-specific operations
export const getBrandConfig = () => BRAND_CONFIG;
export const getBrandId = () => BRAND_ID;
export const isCCBI = () => BRAND_ID === 'ccbi';
export const isZTS = () => BRAND_ID === 'zts';
export const isNBI = () => BRAND_ID === 'nbi';

// Brand-specific default values
export const getDefaultBrandId = () => BRAND_CONFIG.slug;
export const getSupportEmail = () => BRAND_CONFIG.supportEmail;
export const getAdminEmail = () => BRAND_CONFIG.adminEmail;
export const getWebsite = () => BRAND_CONFIG.website;
export const getMaxFileSize = () => BRAND_CONFIG.maxFileUploadSize;
export const getAllowedFileTypes = () => BRAND_CONFIG.allowedFileTypes;

// Feature flags
export const isFeatureEnabled = (feature: keyof typeof BRAND_CONFIG.features) => {
  return BRAND_CONFIG.features[feature];
};

// Type exports for TypeScript
export type BrandConfig = typeof BRAND_CONFIGS[BrandId];
