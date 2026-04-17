'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Repeat,
  Calendar,
  User,
  ChevronLeft,
  Scissors,
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

export default function RecurringPage() {
  const [seriesList, setSeriesList] = useState<RecurringSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const response = await fetch('/api/recurring');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSeriesList(data.series || []);
    } catch (error) {
      toast.error('שגיאה בטעינת התורים החוזרים');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getNextAppointment = (series: RecurringSeries) => {
    const now = new Date();
    const future = series.appointments.find(
      (a) => new Date(a.startAt) > now && a.status !== 'canceled'
    );
    return future;
  };

  return (
    <div>
      <DashboardHeader
        title="תורים חוזרים"
        subtitle="נהל סדרות תורים חוזרים"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {seriesList.length} סדרות
          </p>
        </div>

        {/* Series List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-12 px-5">
              <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600 mb-1">אין תורים חוזרים</h3>
              <p className="text-sm text-gray-500">
                תורים חוזרים יופיעו כאן כשייווצרו
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden divide-y divide-gray-100">
                {seriesList.map((series) => {
                  const firstApt = series.appointments[0];
                  const nextApt = getNextAppointment(series);
                  return (
                    <Link
                      key={series.id}
                      href={`/dashboard/recurring/${series.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Repeat className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {firstApt?.service?.name || 'שירות'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {firstApt?.customer?.firstName} {firstApt?.customer?.lastName} · {parseRecurrenceRule(series.recurrenceRule)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {series.appointments.length} תורים
                          {nextApt && ` · הבא: ${formatDate(nextApt.startAt)}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {getStatusBadge(series.status)}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">שירות</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">לקוח</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">חזרה</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">תאריך התחלה</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">תור הבא</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">סטטוס</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {seriesList.map((series) => {
                      const firstApt = series.appointments[0];
                      const nextApt = getNextAppointment(series);
                      return (
                        <tr key={series.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <Scissors className="w-4 h-4 text-indigo-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {firstApt?.service?.name || 'שירות'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {firstApt?.customer?.firstName} {firstApt?.customer?.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Repeat className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {parseRecurrenceRule(series.recurrenceRule)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(series.startDate)}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                            {nextApt ? (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {formatDate(nextApt.startAt)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {getStatusBadge(series.status)}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Link
                              href={`/dashboard/recurring/${series.id}`}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              פרטים
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
