'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowRight,
  Repeat,
  Calendar,
  Clock,
  User,
  Scissors,
  Trash2,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface RecurringSeries {
  id: string;
  recurrenceRule: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  createdAt: string;
  appointments: {
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
    };
    service: {
      id: string;
      name: string;
    };
    staff?: {
      id: string;
      name: string;
    } | null;
  }[];
}

export default function RecurringDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [series, setSeries] = useState<RecurringSeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchSeries();
  }, [id]);

  const fetchSeries = async () => {
    try {
      const response = await fetch(`/api/recurring/${id}`);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      setSeries(data.series);
    } catch (error) {
      toast.error('שגיאה בטעינת הסדרה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recurring/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to cancel');
      toast.success('הסדרה בוטלה בהצלחה');
      router.push('/dashboard/recurring');
    } catch (error) {
      toast.error('שגיאה בביטול הסדרה');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const parseRecurrenceRule = (rule: string): string => {
    if (rule.includes('WEEKLY')) return 'שבועי';
    if (rule.includes('DAILY') && rule.includes('INTERVAL=14')) return 'כל שבועיים';
    if (rule.includes('DAILY')) {
      const interval = rule.match(/INTERVAL=(\d+)/);
      if (interval) {
        const days = parseInt(interval[1]);
        if (days === 1) return 'יומי';
        return `כל ${days} ימים`;
      }
    }
    return rule;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">פעיל</span>;
      case 'paused':
        return <span className="badge badge-warning">מושהה</span>;
      case 'canceled':
        return <span className="badge badge-error">בוטל</span>;
      case 'completed':
        return <span className="badge badge-info">הושלם</span>;
      case 'confirmed':
        return <span className="badge badge-success">מאושר</span>;
      case 'noShow':
        return <span className="badge badge-warning">לא הגיע</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div>
        <DashboardHeader title="תור חוזר" subtitle="טוען..." />
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div>
        <DashboardHeader title="תור חוזר" subtitle="לא נמצא" />
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">הסדרה לא נמצאה</p>
            <Link href="/dashboard/recurring" className="btn btn-primary mt-4 inline-flex">
              חזרה לרשימה
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstApt = series.appointments[0];
  const now = new Date();
  const futureAppointments = series.appointments.filter(
    (a) => new Date(a.startAt) > now && a.status !== 'canceled'
  );
  const pastAppointments = series.appointments.filter(
    (a) => new Date(a.startAt) <= now || a.status === 'canceled'
  );

  return (
    <div>
      <DashboardHeader
        title={firstApt?.service?.name || 'תור חוזר'}
        subtitle="פרטי סדרה חוזרת"
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/recurring"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לתורים חוזרים
        </Link>

        {/* Series Info */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-indigo-600" />
              פרטי הסדרה
            </h2>
            {getStatusBadge(series.status)}
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">שירות</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-gray-400" />
                  {firstApt?.service?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">לקוח</p>
                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {firstApt?.customer?.firstName} {firstApt?.customer?.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">תדירות</p>
                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-gray-400" />
                  {parseRecurrenceRule(series.recurrenceRule)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">תאריך התחלה</p>
                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(series.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">סך הכל תורים</p>
                <p className="text-sm font-medium text-gray-900">{series.appointments.length}</p>
              </div>
              {firstApt?.staff && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">איש צוות</p>
                  <p className="text-sm text-gray-900">{firstApt.staff.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Future Appointments */}
        {futureAppointments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                תורים עתידיים ({futureAppointments.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {futureAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(apt.startAt)}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(apt.startAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(apt.status)}
                    <Link
                      href={`/dashboard/appointments/${apt.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-gray-500">
                תורים שעברו ({pastAppointments.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {pastAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between px-5 py-3 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        {formatDate(apt.startAt)}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(apt.startAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(apt.status)}
                    <Link
                      href={`/dashboard/appointments/${apt.id}`}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Series */}
        {series.status === 'active' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-5">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-secondary text-red-600 hover:bg-red-50 border-red-200 w-full justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ביטול סדרה</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        האם אתה בטוח שברצונך לבטל את הסדרה?
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        פעולה זו תבטל את כל התורים העתידיים בסדרה.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn btn-secondary"
                    >
                      חזור
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isDeleting}
                      className="btn bg-red-600 text-white hover:bg-red-700"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      <span>כן, בטל</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
