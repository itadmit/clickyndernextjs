'use client';

import { useState } from 'react';
import { Package } from '@prisma/client';
import { Check, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface PackageComparisonProps {
  packages: Package[];
  currentPackageId?: string;
}

export function PackageComparison({ packages, currentPackageId }: PackageComparisonProps) {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);

  async function handleChoosePackage(packageCode: string) {
    if (loadingCode) return;
    setLoadingCode(packageCode);

    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageCode }),
      });

      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert(data.error || 'שגיאה ביצירת קישור תשלום');
        setLoadingCode(null);
      }
    } catch {
      alert('שגיאה בחיבור לשרת');
      setLoadingCode(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {packages.map((pkg) => {
        const isCurrent = pkg.id === currentPackageId;
        const isFree = pkg.priceCents === 0;
        const isPopular = pkg.code === 'pro';
        const features = (pkg.featuresJson as any)?.features || [];
        const isLoading = loadingCode === pkg.code;

        return (
          <div
            key={pkg.id}
            className={`
              relative bg-white rounded-xl border p-5
              ${isPopular ? 'border-primary-300 ring-1 ring-primary-200' : 'border-gray-200'}
              ${isCurrent ? 'bg-primary-50/50' : ''}
            `}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-600 text-white shadow-sm">
                  מומלץ
                </span>
              </div>
            )}

            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">
                  החבילה שלך
                </span>
              </div>
            )}

            <div className="text-center mb-5 pt-1">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{pkg.name}</h3>
              <div>
                <span className="text-3xl font-bold text-gray-900">
                  {isFree ? 'חינם' : formatPrice(pkg.priceCents)}
                </span>
                {!isFree && (
                  <span className="text-gray-500 text-sm mr-1">/חודש</span>
                )}
              </div>
            </div>

            <div className="space-y-2.5 mb-5 pb-5 border-b border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">עובדים</span>
                <span className="font-medium text-gray-900">{pkg.maxStaff === 999 ? 'ללא הגבלה' : `עד ${pkg.maxStaff}`}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">סניפים</span>
                <span className="font-medium text-gray-900">{pkg.maxBranches === 999 ? 'ללא הגבלה' : `עד ${pkg.maxBranches}`}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">תורים בחודש</span>
                <span className="font-medium text-gray-900">
                  {pkg.monthlyAppointmentsCap === 999999 ? 'ללא הגבלה' : pkg.monthlyAppointmentsCap}
                </span>
              </div>
            </div>

            <ul className="space-y-2 mb-5">
              {features.map((feature: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`
                w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200
                ${isCurrent || isFree
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isPopular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
              disabled={isCurrent || isFree || isLoading}
              onClick={() => !isCurrent && !isFree && handleChoosePackage(pkg.code)}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעבד...
                </span>
              ) : isCurrent ? (
                'החבילה הנוכחית'
              ) : isFree ? (
                'חבילת ניסיון'
              ) : (
                'בחר חבילה'
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
