'use client';

import Image from 'next/image';
import { CURRENT_BRAND } from '@/lib/brand';

export default function SimpleFooter() {
  return (
    <footer className="bg-brand-gradient border-t mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full aspect-square w-24 h-24 flex items-center justify-center p-2">
              <Image
                src={CURRENT_BRAND.logoUrl}
                alt={`${CURRENT_BRAND.name} Logo`}
                width={80}
                height={80}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <span className="text-lg font-semibold text-white">{CURRENT_BRAND.name}</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-brand-accent">
              © {new Date().getFullYear()} {CURRENT_BRAND.name}. All rights reserved.
            </p>
            <p className="text-xs text-white/80 mt-1 italic">
              {CURRENT_BRAND.description}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
