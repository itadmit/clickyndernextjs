'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import {
  ArrowRight,
  Save,
  Users,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  durationMin: number;
  isGroup: boolean;
  maxParticipants?: number;
}

interface Staff {
  id: string;
  name: string;
}

export default function NewGroupSessionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [businessId, setBusinessId] = useState('');

  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, staffRes, businessRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/staff'),
        fetch('/api/business'),
      ]);

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        const allServices = servicesData.services || servicesData;
        setServices(allServices.filter((s: Service) => s.isGroup));
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData.staff || staffData);
      }

      if (businessRes.ok) {
        const businessData = await businessRes.json();
        setBusinessId(businessData.id || businessData.business?.id || '');
      }
    } catch (error) {
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceId || !date || !time) {
      toast.error('יש למלא שירות, תאריך ושעה');
      return;
    }

    setIsSaving(true);
    try {
      const startAt = new Date(`${date}T${time}:00`).toISOString();

      const response = await fetch('/api/group-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          serviceId,
          staffId: staffId || null,
          startAt,
          maxParticipants,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create');
      }

      toast.success('השיעור הקבוצתי נוצר בהצלחה');
      router.push('/dashboard/group-sessions');
    } catch (error: any) {
      toast.error(error.message || 'שגיאה ביצירת השיעור');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <DashboardHeader title="שיעור קבוצתי חדש" subtitle="צור שיעור קבוצתי חדש" />
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader
        title="שיעור קבוצתי חדש"
        subtitle="צור שיעור קבוצתי חדש"
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/group-sessions"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לשיעורים קבוצתיים
        </Link>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              פרטי השיעור
            </h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                שירות קבוצתי *
              </label>
              {services.length === 0 ? (
                <p className="text-sm text-gray-500">
                  אין שירותים קבוצתיים. צור שירות קבוצתי תחילה.
                </p>
              ) : (
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">בחר שירות...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMin} דק&apos;)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Staff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                איש צוות (אופציונלי)
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="form-input"
              >
                <option value="">ללא</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  תאריך *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  שעה *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                מקסימום משתתפים
              </label>
              <input
                type="number"
                min={2}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="form-input"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                הערות
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                rows={3}
                placeholder="הערות נוספות..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/dashboard/group-sessions" className="btn btn-secondary">
              ביטול
            </Link>
            <button
              type="submit"
              disabled={isSaving || services.length === 0}
              className="btn btn-primary"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>שמור</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
