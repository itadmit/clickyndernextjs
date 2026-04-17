'use client';

import { useEffect } from 'react';
import { Business, Branch, Service, Staff } from '@prisma/client';
import { Calendar, FileText, Check, Scissors, User, MapPin, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SuccessScreenProps {
  business: Business;
  bookingData: any;
  branches: Branch[];
  services: Service[];
  staff: Staff[];
  onBookAnother: () => void;
}

export function SuccessScreen({ business, bookingData, branches, services, staff, onBookAnother }: SuccessScreenProps) {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const primaryColor = business.primaryColor || '#0284c7';

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const selectedBranch = branches.find(b => b.id === bookingData.branchId);
  const selectedService = services.find(s => s.id === bookingData.serviceId);
  const selectedStaff = staff.find(s => s.id === bookingData.staffId);

  return (
    <div
      className="min-h-screen w-full animate-fade-in bg-gradient-to-b from-gray-50 to-blue-50/30"
      style={{
        fontFamily: business.font ? `'${business.font}', 'Noto Sans Hebrew', sans-serif` : "'Noto Sans Hebrew', sans-serif"
      }}
    >
      {/* Header */}
      <div
        className="z-20 text-white py-3.5 text-center sticky top-0 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <h1 className="text-base md:text-lg font-bold">{business.name}</h1>
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl mx-auto px-4 py-8 md:py-10">
        {/* Success Badge */}
        <div className="text-center mb-6 animate-slide-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <Check className="h-6 w-6 text-white" strokeWidth={3} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">התור נקבע בהצלחה!</h2>
        </div>

        {/* Confirmation Code */}
        {bookingData.confirmationCode && (
          <div className="text-center mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs text-gray-400 mb-2">מספר אישור</p>
            <div className="inline-block rounded-xl bg-white px-6 py-2.5 shadow-sm border border-gray-100">
              <p
                className="text-xl md:text-2xl font-black tracking-widest"
                style={{ color: primaryColor }}
              >
                {bookingData.confirmationCode}
              </p>
            </div>
          </div>
        )}

        {/* Details Card */}
        <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
              פרטי התור שלך
            </h3>
          </div>

          <div className="divide-y divide-gray-50">
            {selectedService && (
              <div className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Scissors className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-gray-400">שירות</p>
                  <p className="text-sm font-bold text-gray-800">{selectedService.name}</p>
                </div>
              </div>
            )}

            <div className="px-5 py-3.5 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-400">תאריך ושעה</p>
                <p className="text-sm font-bold text-gray-800">
                  {formatDate(bookingData.date)} בשעה {bookingData.time}
                </p>
              </div>
            </div>

            {selectedStaff && (
              <div className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                  <User className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-gray-400">עובד</p>
                  <p className="text-sm font-bold text-gray-800">{selectedStaff.name}</p>
                </div>
              </div>
            )}

            {selectedBranch && (
              <div className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                  <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-gray-400">סניף</p>
                  <p className="text-sm font-bold text-gray-800">{selectedBranch.name}</p>
                  {selectedBranch.address && (
                    <p className="text-xs text-gray-400">{selectedBranch.address}</p>
                  )}
                </div>
              </div>
            )}

            <div className="px-5 py-3.5">
              <p className="text-[11px] text-gray-400 mb-1">לקוח</p>
              <p className="text-sm font-bold text-gray-800">{bookingData.customerName}</p>
              <p className="text-xs text-gray-400">{bookingData.customerPhone}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={onBookAnother}
            className="w-full text-white py-3.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            קבע תור נוסף
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                alert('הוספה ליומן - בקרוב!');
              }}
              className="bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 transition-all text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>הוסף ליומן</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 transition-all text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>הדפס</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur border border-gray-200/60 px-4 py-2 shadow-sm">
            <span className="text-xs text-gray-400">⚡ מופעל על ידי</span>
            <span className="text-xs font-bold" style={{ color: primaryColor }}>Clickinder</span>
            <span className="text-[10px] text-gray-300">✨</span>
          </div>
        </div>
      </div>
    </div>
  );
}
