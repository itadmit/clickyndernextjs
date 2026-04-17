'use client';

import { Business, Subscription, Package, UsageCounter } from '@prisma/client';
import { Calendar, Users, Building2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type SubscriptionWithPackage = Subscription & {
  package: Package;
};

type BusinessWithSubscription = Business & {
  subscription: SubscriptionWithPackage | null;
  _count?: {
    staff?: number;
    branches?: number;
  };
};

interface SubscriptionCardProps {
  subscription: SubscriptionWithPackage;
  usage: UsageCounter | null;
  business: BusinessWithSubscription;
}

export function SubscriptionCard({ subscription, usage, business }: SubscriptionCardProps) {
  const pkg = subscription.package;
  const appointmentsUsage = usage?.appointmentsCount || 0;
  const appointmentsCap = pkg.monthlyAppointmentsCap === 999999 ? Infinity : pkg.monthlyAppointmentsCap;
  const appointmentsPercentage = appointmentsCap === Infinity ? 0 : (appointmentsUsage / appointmentsCap) * 100;

  const stats = [
    {
      label: 'תורים בחודש',
      value: appointmentsCap === Infinity ? `${appointmentsUsage}` : `${appointmentsUsage} / ${appointmentsCap}`,
      subtext: appointmentsCap === Infinity ? 'ללא הגבלה' : undefined,
      icon: Calendar,
      percentage: appointmentsCap === Infinity ? undefined : appointmentsPercentage,
    },
    {
      label: 'עובדים',
      value: `${business._count?.staff || 0} / ${pkg.maxStaff === 999 ? '∞' : pkg.maxStaff}`,
      icon: Users,
    },
    {
      label: 'סניפים',
      value: `${business._count?.branches || 0} / ${pkg.maxBranches === 999 ? '∞' : pkg.maxBranches}`,
      icon: Building2,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-l from-primary-600 to-primary-700 text-white px-5 py-5 md:px-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{pkg.name}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20">
                {subscription.status === 'trial' ? 'תקופת ניסיון' : 'פעיל'}
              </span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold">{formatPrice(pkg.priceCents)}</p>
            <p className="text-primary-200 text-xs">לחודש</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-4 md:p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              {stat.subtext && (
                <p className="text-xs text-gray-500 mt-0.5">{stat.subtext}</p>
              )}
              {stat.percentage !== undefined && (
                <div className="mt-2">
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`rounded-full h-1.5 transition-all ${
                        stat.percentage > 90 ? 'bg-red-500' : stat.percentage > 70 ? 'bg-amber-500' : 'bg-primary-500'
                      }`}
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trial warning */}
      {subscription.status === 'trial' && (
        <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-sm text-amber-800">
            <strong>תקופת הניסיון מסתיימת ב:</strong>{' '}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString('he-IL')}
          </p>
        </div>
      )}
    </div>
  );
}
