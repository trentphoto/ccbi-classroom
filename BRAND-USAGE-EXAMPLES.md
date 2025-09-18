# Brand Configuration Usage Examples

This document shows how to use the centralized brand configuration system.

## 🚀 **Quick Start**

```typescript
import { 
  getBrandConfig, 
  getBrandId, 
  isCCBI, 
  isZTS,
  getSupportEmail,
  getAdminEmail,
  isFeatureEnabled 
} from '@/lib/brand';

// Get the current brand configuration
const brand = getBrandConfig();
console.log(brand.name); // "CCBI Classroom" or "ZTS Classroom"

// Check which brand is active
if (isCCBI()) {
  console.log("This is CCBI");
} else if (isZTS()) {
  console.log("This is ZTS");
}

// Get brand-specific values
const supportEmail = getSupportEmail(); // support@ccbi.org or support@zts.edu
const adminEmail = getAdminEmail(); // admin@ccbi.org or admin@zts.edu

// Check feature flags
if (isFeatureEnabled('messaging')) {
  // Show messaging feature
}
```

## 🎨 **Using Brand Colors**

```typescript
import { BRAND_CSS_VARS, getBrandConfig } from '@/lib/brand';

// In your component
const brand = getBrandConfig();

// Use colors directly
<div style={{ backgroundColor: brand.primaryColor }}>
  Branded content
</div>

// Or use CSS variables
<div style={BRAND_CSS_VARS}>
  <h1>Branded heading</h1>
</div>
```

## 📧 **Dynamic Email Configuration**

```typescript
import { getSupportEmail, getAdminEmail } from '@/lib/brand';

// In your contact form
const ContactForm = () => {
  const supportEmail = getSupportEmail();
  
  return (
    <form>
      <p>Need help? Contact us at {supportEmail}</p>
      {/* form content */}
    </form>
  );
};
```

## 🔧 **Feature Flags**

```typescript
import { isFeatureEnabled } from '@/lib/brand';

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {isFeatureEnabled('messaging') && (
        <MessagingComponent />
      )}
      
      {isFeatureEnabled('videoLessons') && (
        <VideoPlayer />
      )}
      
      {isFeatureEnabled('fileSubmissions') && (
        <SubmissionForm />
      )}
    </div>
  );
};
```

## 📁 **File Upload Configuration**

```typescript
import { getMaxFileSize, getAllowedFileTypes } from '@/lib/brand';

const FileUpload = () => {
  const maxSize = getMaxFileSize(); // 10 MB
  const allowedTypes = getAllowedFileTypes(); // ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
  
  return (
    <input 
      type="file" 
      accept={allowedTypes.join(',')}
      // maxSize would be used in validation logic
    />
  );
};
```

## 🏗️ **Adding a New Brand**

To add a new brand, simply update `src/lib/brand.ts`:

```typescript
const BRAND_CONFIGS = {
  ccbi: { /* existing config */ },
  zts: { /* existing config */ },
  newbrand: {
    name: 'New Brand Classroom',
    slug: 'newbrand',
    fullName: 'New Brand Institute',
    description: 'New Brand Description',
    logoUrl: '/logos/newbrand.svg',
    primaryColor: '#ff0000',
    secondaryColor: '#00ff00',
    accentColor: '#0000ff',
    // ... other config
  }
} as const;
```

Then update the `BrandId` type in `src/types/db.ts`:

```typescript
export type BrandId = 'ccbi' | 'zts' | 'newbrand';
```

## 🔄 **Environment Variable**

The only environment variable needed:

```bash
# .env.local
NEXT_PUBLIC_BRAND_ID=ccbi  # or 'zts' or 'newbrand'
```

That's it! All other brand-specific settings are now in code.
