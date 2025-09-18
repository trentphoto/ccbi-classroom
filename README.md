# Classroom Management System

A multi-brand classroom management system built with Next.js, supporting CCBI and ZTS brands with complete data isolation.

## 🚀 Quick Start

### Development
```bash
npm run dev:ccbi  # CCBI version
npm run dev:zts   # ZTS version
```

### Production Builds
```bash
npm run build:ccbi  # CCBI build
npm run build:zts   # ZTS build
```

## 📖 Documentation

See [MULTI-BRAND-SUMMARY.md](./MULTI-BRAND-SUMMARY.md) for complete setup and deployment instructions.

## 🔧 Setup

1. Copy `.env.example` to `.env.local`
2. Set your Supabase credentials
3. Set `NEXT_PUBLIC_BRAND_ID` to `ccbi` or `zts`
4. Run the appropriate dev command

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
