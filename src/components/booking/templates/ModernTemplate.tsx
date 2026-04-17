'use client';

import { Business, Branch, Service, Staff, BusinessHours, ServiceCategory } from '@prisma/client';
import { BookingFlow } from '../BookingFlow';
import { CustomCode } from '../CustomCode';
import type { StaffWithServices } from '../BookingFlow';

interface ModernTemplateProps {
  business: Business & {
    branches: Branch[];
    services: (Service & { category: ServiceCategory | null })[];
    staff: StaffWithServices[];
    businessHours: BusinessHours[];
  };
}

export function ModernTemplate({ business }: ModernTemplateProps) {
  const primaryColor = business.primaryColor || '#0284c7';

  return (
    <>
      {business.developerMode && (
        <CustomCode customCss={business.customCss} customJs={business.customJs} />
      )}
      
      <div 
        className="min-h-screen relative bg-gradient-to-b from-gray-50 to-blue-50/30"
        style={{ 
          fontFamily: business.font ? `'${business.font}', 'Noto Sans Hebrew', sans-serif` : "'Noto Sans Hebrew', sans-serif"
        }}
      >
      <header 
        className="py-3.5 px-4 sticky top-0 z-50 shadow-sm"
        style={{
          backgroundColor: primaryColor,
        }}
      >
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            {business.logoUrl && (
              <img 
                src={business.logoUrl} 
                alt={business.name}
                className="h-9 w-9 object-contain rounded-lg bg-white/90 p-1"
              />
            )}
            <h1 className="text-white text-base md:text-lg font-bold">{business.name}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6 md:py-8">
        <BookingFlow
          business={business}
          branches={business.branches}
          services={business.services}
          staff={business.staff}
        />
      </main>

      <footer className="relative z-10 py-8 px-4 mt-4 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur border border-gray-200/60 px-4 py-2 shadow-sm">
          <span className="text-xs text-gray-400">⚡ מופעל על ידי</span>
          <span className="text-xs font-bold" style={{ color: primaryColor }}>Clickinder</span>
          <span className="text-[10px] text-gray-300">✨</span>
        </div>
      </footer>
    </div>
    </>
  );
}
