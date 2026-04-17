'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Calendar, Clock, User, Scissors, MapPin, Loader2, AlertTriangle } from 'lucide-react';

interface AppointmentData {
  date: string;
  formattedDate: string;
  time: string;
  serviceName: string;
  staffName: string | null;
  branchName: string | null;
  customerName: string;
  businessName?: string;
}

interface BusinessData {
  name: string;
  primaryColor: string;
}

export default function ConfirmAttendancePage() {
  const params = useParams();
  const token = params.token as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [tokenStatus, setTokenStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    action?: string;
    message: string;
    appointment?: AppointmentData;
  } | null>(null);

  useEffect(() => {
    fetchAppointmentData();
  }, [token]);

  const fetchAppointmentData = async () => {
    try {
      const res = await fetch(`/api/appointments/confirm-attendance/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בטעינת הנתונים');
        return;
      }

      setAppointment(data.appointment);
      setBusiness(data.business);
      setTokenStatus(data.status);
    } catch {
      setError('שגיאת תקשורת עם השרת');
    } finally {
      setPageLoading(false);
    }
  };

  const handleAction = async (action: 'confirm' | 'cancel') => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/appointments/confirm-attendance/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ success: false, message: data.error || 'שגיאה בעיבוד הבקשה' });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ success: false, message: 'שגיאת תקשורת עם השרת' });
    } finally {
      setActionLoading(false);
    }
  };

  const primaryColor = business?.primaryColor || '#0284c7';

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">טוען פרטי תור...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">לא ניתן לטעון</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (tokenStatus !== 'pending') {
    const alreadyHandled = tokenStatus === 'confirmed' || tokenStatus === 'canceled';
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30" dir="rtl">
        <div className="text-white py-3.5 text-center shadow-sm" style={{ backgroundColor: primaryColor }}>
          <h1 className="text-base font-bold">{business?.name}</h1>
        </div>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className={`w-16 h-16 ${tokenStatus === 'confirmed' ? 'bg-green-50' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {tokenStatus === 'confirmed' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {tokenStatus === 'confirmed' ? 'כבר אישרת הגעה' : tokenStatus === 'canceled' ? 'התור בוטל' : 'פג תוקף'}
            </h2>
            <p className="text-sm text-gray-500">בקשת האישור כבר טופלה</p>
          </div>
        </div>
      </div>
    );
  }

  // Result screen after action
  if (result) {
    const isConfirm = result.action === 'confirmed';
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30" dir="rtl">
        <div className="text-white py-3.5 text-center shadow-sm" style={{ backgroundColor: primaryColor }}>
          <h1 className="text-base font-bold">{business?.name}</h1>
        </div>
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            {result.success ? (
              <>
                <div className={`w-20 h-20 ${isConfirm ? 'bg-green-50' : 'bg-red-50'} rounded-full flex items-center justify-center mx-auto mb-5`}>
                  {isConfirm ? (
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-500" />
                  )}
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-1">
                  {isConfirm ? 'תודה רבה!' : 'התור בוטל'}
                </h2>
                <p className="text-sm text-gray-500 mb-6">{result.message}</p>

                {result.appointment && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100 text-right">
                    <div className="p-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">תאריך ושעה</p>
                        <p className="text-sm font-bold text-gray-800">{result.appointment.formattedDate} · {result.appointment.time}</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Scissors className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">שירות</p>
                        <p className="text-sm font-bold text-gray-800">{result.appointment.serviceName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">אופס!</h2>
                <p className="text-sm text-gray-500">{result.message}</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main confirmation page
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50/30" dir="rtl">
      {/* Header */}
      <div className="text-white py-3.5 text-center shadow-sm" style={{ backgroundColor: primaryColor }}>
        <h1 className="text-base font-bold">{business?.name}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <Calendar className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">אישור הגעה לתור</h2>
          <p className="text-sm text-gray-400">שלום {appointment?.customerName}, נשמח לדעת אם את/ה מגיע/ה</p>
        </div>

        {/* Appointment details */}
        {appointment && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 divide-y divide-gray-100 m-1">
              <div className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">תאריך</p>
                  <p className="text-sm font-bold text-gray-800">{appointment.formattedDate}</p>
                </div>
              </div>

              <div className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">שעה</p>
                  <p className="text-sm font-bold text-gray-800">{appointment.time}</p>
                </div>
              </div>

              <div className="p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                  <Scissors className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">שירות</p>
                  <p className="text-sm font-bold text-gray-800">{appointment.serviceName}</p>
                </div>
              </div>

              {appointment.staffName && (
                <div className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <User className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">מטפל/ת</p>
                    <p className="text-sm font-bold text-gray-800">{appointment.staffName}</p>
                  </div>
                </div>
              )}

              {appointment.branchName && (
                <div className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">סניף</p>
                    <p className="text-sm font-bold text-gray-800">{appointment.branchName}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleAction('confirm')}
            disabled={actionLoading}
            className="w-full py-4 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-base flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                כן, אני מגיע/ה!
              </>
            )}
          </button>

          <button
            onClick={() => handleAction('cancel')}
            disabled={actionLoading}
            className="w-full py-4 px-6 bg-white text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all font-bold text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                צריך לבטל את התור
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          מופעל על ידי Clickinder
        </p>
      </div>
    </div>
  );
}
