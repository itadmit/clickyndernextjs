'use client';

import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PaymentResultBannerProps {
  type: 'success' | 'failed' | 'trial_expired';
}

const config = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    textColor: 'text-emerald-800',
    title: 'התשלום בוצע בהצלחה!',
    message: 'המנוי שלך הופעל. תודה שבחרת ב-Clickinder!',
  },
  failed: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
    textColor: 'text-red-800',
    title: 'התשלום נכשל',
    message: 'לא הצלחנו לעבד את התשלום. אנא נסה שוב או פנה לתמיכה.',
  },
  trial_expired: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-800',
    title: 'תקופת הניסיון הסתיימה',
    message: 'בחר חבילה כדי להמשיך להשתמש במערכת.',
  },
};

export function PaymentResultBanner({ type }: PaymentResultBannerProps) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${c.bg}`}>
      <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${c.iconColor}`} />
      <div>
        <p className={`font-semibold ${c.textColor}`}>{c.title}</p>
        <p className={`text-sm mt-0.5 ${c.textColor} opacity-80`}>{c.message}</p>
      </div>
    </div>
  );
}
