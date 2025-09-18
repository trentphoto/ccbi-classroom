'use client';

import Image from 'next/image';
import { CURRENT_BRAND } from '@/lib/brand';

interface SimpleHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  className?: string;
}

export default function SimpleHeader({ 
  title, 
  subtitle, 
  showLogo = true, 
  className = "" 
}: SimpleHeaderProps) {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {showLogo && (
        <div className="bg-white rounded-full aspect-square w-24 h-24 flex items-center justify-center p-2">
          <Image
            src={CURRENT_BRAND.logoUrl}
            alt={`${CURRENT_BRAND.name} Logo`}
            width={80}
            height={80}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {title || CURRENT_BRAND.name}
        </h1>
        {subtitle && (
          <p className="text-sm text-brand-accent">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
