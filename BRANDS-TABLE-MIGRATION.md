# Brands Table Migration Guide

## Overview

This migration adds a normalized `brands` table to the database and extends support for a new brand 'nbi'. The brands table provides better data integrity through foreign key constraints and allows for easier brand management.

## Changes Made

### 1. Database Schema

**New Table: `brands`**
- Created `migrations/001_create_brands_table.sql`
- Table includes: id, name, full_name, description, slug, logos, colors, contact info, and settings
- Pre-populated with three brands: `ccbi`, `zts`, and `nbi`
- Added foreign key constraints on `users.brand_id` and `classes.brand_id`
- Added indexes for performance

### 2. TypeScript Types

**Updated `src/types/db.ts`:**
- Extended `BrandId` type to include `'nbi'`: `'ccbi' | 'zts' | 'nbi'`
- Added `BrandType.NBI` enum value
- Created new `Brand` interface matching the brands table schema
- Updated comments to reference `brands.id` instead of hardcoded values

### 3. Brand Configuration

**Updated `src/lib/brand.ts`:**
- Added complete `nbi` brand configuration with:
  - Basic info (name, slug, full name, description)
  - Visual identity (logos, colors)
  - Contact information
  - Feature flags
  - Default settings
- Added `isNBI()` helper function

### 4. Build Scripts

**Updated `package.json`:**
- Added `dev:nbi` script for development
- Added `build:nbi` script for production builds

## Migration Steps

### Step 1: Run the Database Migration

Execute the SQL migration in your Supabase SQL editor or via CLI:

```sql
-- Run migrations/001_create_brands_table.sql
```

This will:
1. Create the `brands` table
2. Insert the three brand records (ccbi, zts, nbi)
3. Add foreign key constraints (if they don't already exist)
4. Create indexes for performance

### Step 2: Update Existing Data (if needed)

If you have existing data with `brand_id` values that don't match the brands table:

```sql
-- Ensure all brand_id values reference valid brands
UPDATE users SET brand_id = 'ccbi' WHERE brand_id NOT IN ('ccbi', 'zts', 'nbi');
UPDATE classes SET brand_id = 'ccbi' WHERE brand_id NOT IN ('ccbi', 'zts', 'nbi');
```

### Step 3: Customize NBI Brand Configuration

Update the NBI brand configuration in:
- **Database**: Update the `brands` table record for `id = 'nbi'`
- **Code**: Update `src/lib/brand.ts` - the `nbi` configuration object
- **Assets**: Add logo files to `public/logos/`:
  - `nbi.svg`
  - `nbi-white.svg`

### Step 4: Test the New Brand

```bash
# Development
npm run dev:nbi

# Production build
npm run build:nbi
```

## Benefits of the Brands Table

1. **Data Integrity**: Foreign key constraints ensure only valid brand IDs exist
2. **Centralized Management**: Brand information stored in one place
3. **Extensibility**: Easy to add new brands without code changes (if you build runtime brand loading)
4. **Custom Values**: Each brand can have custom fields stored in the database
5. **Query Flexibility**: Can join with brands table to get brand details

## Current Architecture

The system uses a **hybrid approach**:

- **Build-time configuration** (`src/lib/brand.ts`): Used for performance-critical styling and feature flags
- **Database table** (`brands`): Used for data integrity and foreign key relationships

This provides:
- Fast build-time brand switching
- Database-level data validation
- Future flexibility for runtime brand configuration

## Adding New Brands in the Future

1. **Add to database**:
   ```sql
   INSERT INTO brands (id, name, slug, ...) VALUES ('newbrand', 'New Brand', 'newbrand', ...);
   ```

2. **Add to TypeScript types**:
   ```typescript
   export type BrandId = 'ccbi' | 'zts' | 'nbi' | 'newbrand';
   ```

3. **Add to brand config**:
   ```typescript
   const BRAND_CONFIGS = {
     // ... existing brands
     newbrand: { /* config */ }
   }
   ```

4. **Add build scripts** (optional):
   ```json
   "dev:newbrand": "NEXT_PUBLIC_BRAND_ID=newbrand npm run dev"
   ```

## Notes

- The NBI brand configuration uses placeholder values - customize as needed
- Logo files need to be added to `public/logos/` directory
- The brands table supports additional custom fields that can be added as needed
- Foreign key constraints ensure referential integrity between users/classes and brands

