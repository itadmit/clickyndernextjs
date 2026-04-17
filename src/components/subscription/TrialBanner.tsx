'use client';

import { Clock } from 'lucide-react';

interface TrialBannerProps {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  const isUrgent = daysLeft <= 3;

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${
        isUrgent
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <Clock
        className={`w-5 h-5 flex-shrink-0 ${
          isUrgent ? 'text-red-600' : 'text-amber-600'
        }`}
      />
      <p
        className={`text-sm font-medium ${
          isUrgent ? 'text-red-800' : 'text-amber-800'
        }`}
      >
        {daysLeft === 0
          ? 'תקופת הניסיון מסתיימת היום! שדרגו עכשיו כדי להמשיך להשתמש במערכת.'
          : `תקופת הניסיון מסתיימת בעוד ${daysLeft} ${daysLeft === 1 ? 'יום' : 'ימים'} - שדרגו עכשיו`}
      </p>
    </div>
  );
}
