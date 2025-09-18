# Multi-Brand Classroom System

## 🎯 **Overview**

A secure, build-time multi-brand system supporting CCBI and ZTS brands with complete data isolation.

## 🚀 **Quick Start**

```bash
# Development
npm run dev:ccbi  # CCBI version
npm run dev:zts   # ZTS version

# Production builds
npm run build:ccbi  # CCBI build
npm run build:zts   # ZTS build
```

## 🔧 **Setup**

### **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_BRAND_ID=ccbi  # or 'zts' - ONLY brand-specific env var needed!
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

**Note**: All brand-specific settings (colors, logos, contact info, features, etc.) are now configured in code at `src/lib/brand.ts`. Only the `BRAND_ID` environment variable is needed to switch between brands.

### **Database Setup**
Add `brand_id` column to `users` and `classes` tables:
```sql
ALTER TABLE users ADD COLUMN brand_id TEXT NOT NULL DEFAULT 'ccbi';
ALTER TABLE classes ADD COLUMN brand_id TEXT NOT NULL DEFAULT 'ccbi';
```

## 🎨 **Brand Configuration**

All brand-specific settings are centralized in `src/lib/brand.ts` and include:

### **CCBI Brand**
- Name: "CCBI Classroom" (Calvary Chapel Bible Institute)
- Logo: `/logos/ccbi.svg`
- Colors: Blue (#072c68), Green (#086623), Gold (#d2ac47)
- Description: "Equipping Believers for Every Good Work"
- Contact: support@ccbi.org, admin@ccbi.org
- Website: https://ccbi.org

### **ZTS Brand**
- Name: "ZTS Classroom" (Zion Theological Seminary)
- Logo: `/logos/zts.png`
- Colors: Blue (#1e40af), Green (#059669), Amber (#f59e0b)
- Description: "Equipping Students for Success"
- Contact: support@zts.edu, admin@zts.edu
- Website: https://zts.edu

### **Centralized Configuration Features**
- **Visual Identity**: Logos, colors, branding
- **Contact Information**: Support emails, admin emails, websites
- **Feature Flags**: Enable/disable features per brand
- **Default Settings**: File upload limits, allowed file types
- **Utility Functions**: Easy access to brand-specific values

## 📁 **File Structure**

```
src/
├── lib/
│   └── brand.ts              # Build-time brand configuration
├── components/
│   ├── SimpleHeader.tsx      # Brand-aware header
│   └── SimpleFooter.tsx      # Brand-aware footer
└── app/
    ├── layout.tsx            # Build-time metadata
    └── login/page.tsx        # Build-time brand
```

## 🔒 **Security Features**

- **Build-Time Configuration**: Brand determined at compile time
- **Complete Isolation**: Each build is independent
- **Zero Brand Leakage**: Impossible to detect other brands
- **Data Isolation**: Database queries filtered by `brand_id`
- **No Runtime Detection**: No client-side brand logic

## 🚀 **Deployment**

### **Separate Deployments**
Each brand gets its own deployment:

1. **CCBI Deployment**
   ```bash
   NEXT_PUBLIC_BRAND_ID=ccbi npm run build
   # Deploy to ccbi.yourdomain.com
   ```

2. **ZTS Deployment**
   ```bash
   NEXT_PUBLIC_BRAND_ID=zts npm run build
   # Deploy to zts.yourdomain.com
   ```

## ✨ **Benefits**

1. **Maximum Security**: Zero risk of brand leakage
2. **Simplicity**: No complex context or provider systems
3. **Performance**: Smaller, faster builds
4. **Maintainability**: Easy to understand and modify
5. **Isolation**: Each brand is completely independent
6. **Minimal Environment Variables**: Only `BRAND_ID` needed - all other settings in code
7. **Centralized Configuration**: All brand settings in one place (`src/lib/brand.ts`)
8. **Type Safety**: Full TypeScript support with proper brand types
9. **Easy Customization**: Add new brands or modify existing ones in code
