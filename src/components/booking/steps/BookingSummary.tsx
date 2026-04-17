'use client';

import { useState } from 'react';
import { Business, Branch, Service, Staff, ServiceStaff } from '@prisma/client';
import { ArrowRight, Calendar, Clock, User, MapPin, Scissors, Check, ClipboardList, ShieldCheck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type StaffWithServices = Staff & {
  serviceStaff: (ServiceStaff & {
    service: Service;
  })[];
};

interface BookingSummaryProps {
  business: Business;
  bookingData: any;
  branches: Branch[];
  services: Service[];
  staff: StaffWithServices[];
  onConfirm: () => void;
  onBack: () => void;
}

export function BookingSummary({
  business,
  bookingData,
  branches,
  services,
  staff,
  onConfirm,
  onBack,
}: BookingSummaryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const selectedBranch = branches.find((b) => b.id === bookingData.branchId);
  const selectedService = services.find((s) => s.id === bookingData.serviceId);
  const selectedStaff = staff.find((s) => s.id === bookingData.staffId);

  const handleConfirm = async () => {
    if (!agreedToTerms) {
      alert('יש לאשר את תנאי השימוש');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
          <ClipboardList className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">סיכום ההזמנה</h2>
        <p className="mt-1 text-sm text-gray-400">נא לוודא שהפרטים נכונים</p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100 mb-5">
        {selectedService && (
          <div className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
              <Scissors className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">שירות</p>
              <p className="text-sm font-bold text-gray-800">{selectedService.name}</p>
              <p className="text-xs text-gray-400">{selectedService.durationMin} דקות</p>
            </div>
            {selectedService.priceCents != null && selectedService.priceCents > 0 && (
              <p className="text-lg font-black text-primary-600">
                {formatPrice(selectedService.priceCents, business.currency)}
              </p>
            )}
          </div>
        )}

        {selectedStaff && (
          <div className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">עובד</p>
              <p className="text-sm font-bold text-gray-800">{selectedStaff.name}</p>
            </div>
          </div>
        )}

        {selectedBranch && (
          <div className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
              <MapPin className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">סניף</p>
              <p className="text-sm font-bold text-gray-800">{selectedBranch.name}</p>
              {selectedBranch.address && (
                <p className="text-xs text-gray-400">{selectedBranch.address}</p>
              )}
            </div>
          </div>
        )}

        <div className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
            <Calendar className="w-4 h-4 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-gray-400">תאריך ושעה</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-800">
                {bookingData.date
                  ? bookingData.date.split('-').reverse().map((p: string, i: number) => i === 2 ? p.slice(2) : p).join('-')
                  : ''}
              </p>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-sm font-bold text-gray-800">{bookingData.time}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-[11px] text-gray-400 mb-1.5">פרטי הלקוח</p>
          <p className="text-sm font-bold text-gray-800">{bookingData.customerName}</p>
          <p className="text-xs text-gray-500">{bookingData.customerPhone}</p>
          {bookingData.customerEmail && (
            <p className="text-xs text-gray-500">{bookingData.customerEmail}</p>
          )}
        </div>

        {bookingData.notes && (
          <div className="p-4">
            <p className="text-[11px] text-gray-400 mb-0.5">הערות</p>
            <p className="text-xs text-gray-600">{bookingData.notes}</p>
          </div>
        )}
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer mb-5 transition-all hover:border-primary-200">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
        />
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-gray-500 leading-relaxed">
            אני מאשר/ת את תנאי השימוש ומדיניות הפרטיות של העסק
          </span>
        </div>
      </label>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="btn btn-secondary flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה</span>
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting || !agreedToTerms}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>מאשר...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={3} />
              <span>אישור וקביעת תור</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
