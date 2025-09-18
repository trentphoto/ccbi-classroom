// Build-time brand configuration
// This file is evaluated at build time, not runtime

const BRAND_ID = process.env.NEXT_PUBLIC_BRAND_ID || 'ccbi';

const BRAND_CONFIGS = {
  ccbi: {
    name: 'CCBI Classroom',
    slug: 'ccbi',
    logoUrl: '/logos/ccbi.svg',
    primaryColor: '#072c68',
    secondaryColor: '#086623',
    accentColor: '#d2ac47',
    description: 'Equipping Believers for Every Good Work',
    domain: 'ccbi.yourdomain.com',
  },
  zts: {
    name: 'ZTS Classroom',
    slug: 'zts',
    logoUrl: '/logos/zts.png',
    primaryColor: '#1e40af',
    secondaryColor: '#059669',
    accentColor: '#f59e0b',
    description: 'Equipping Students for Success',
    domain: 'zts.yourdomain.com',
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
  '--brand-name': `"${BRAND_CONFIG.name}"`,
  '--brand-description': `"${BRAND_CONFIG.description}"`,
};
