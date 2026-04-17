'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  Plus,
  Users,
  Calendar,
  Clock,
  User,
  ChevronLeft,
} from 'lucide-react';

interface GroupSession {
  id: string;
  startAt: string;
  endAt: string;
  maxParticipants: number;
  currentCount: number;
  status: string;
  notes?: string;
  service: {
    id: string;
    name: string;
    durationMin: number;
  };
  staff?: {
    id: string;
    name: string;
  } | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  appointments: {
    id: string;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
    };
  }[];
}

export default function GroupSessionsPage() {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'open') {
        params.append('status', 'open');
      }
      const response = await fetch(`/api/group-sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSessions(data.groupSessions || []);
    } catch (error) {
      toast.error('שגיאה בטעינת השיעורים הקבוצתיים');
    } finally {
      setIsLoading(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="badge badge-success">פתוח</span>;
      case 'full':
        return <span className="badge badge-warning">מלא</span>;
      case 'canceled':
        return <span className="badge badge-error">בוטל</span>;
      case 'completed':
        return <span className="badge badge-info">הסתיים</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getOccupancyPercent = (session: GroupSession) => {
    const count = session.appointments?.length || session.currentCount || 0;
    return Math.round((count / session.maxParticipants) * 100);
  };

  return (
    <div>
      <DashboardHeader
        title="שיעורים קבוצתיים"
        subtitle="נהל את השיעורים והאירועים הקבוצתיים"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => {
                setIsLoading(true);
                setFilter(e.target.value as 'open' | 'all');
              }}
              className="form-input text-sm py-2"
            >
              <option value="open">פתוחים</option>
              <option value="all">הכל</option>
            </select>
            <p className="text-sm text-gray-500">
              {sessions.length} שיעורים
            </p>
          </div>
          <Link href="/dashboard/group-sessions/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            <span>שיעור חדש</span>
          </Link>
        </div>

        {/* Sessions List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 px-5">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600 mb-1">אין שיעורים קבוצתיים</h3>
              <p className="text-sm text-gray-500">
                צור שיעור קבוצתי חדש כדי להתחיל
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden divide-y divide-gray-100">
                {sessions.map((session) => {
                  const participantCount = session.appointments?.length || session.currentCount || 0;
                  const occupancy = getOccupancyPercent(session);
                  return (
                    <Link
                      key={session.id}
                      href={`/dashboard/group-sessions/${session.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {session.service.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(session.startAt)} · {formatTime(session.startAt)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className={`h-full rounded-full ${occupancy >= 100 ? 'bg-red-500' : occupancy >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(occupancy, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {participantCount}/{session.maxParticipants}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {getStatusBadge(session.status)}
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
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">תאריך ושעה</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">צוות</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">תפוסה</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">סטטוס</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map((session) => {
                      const participantCount = session.appointments?.length || session.currentCount || 0;
                      const occupancy = getOccupancyPercent(session);
                      return (
                        <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {session.service.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {formatDate(session.startAt)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {formatTime(session.startAt)} - {formatTime(session.endAt)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                            {session.staff ? (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                {session.staff.name}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${occupancy >= 100 ? 'bg-red-500' : occupancy >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">
                                {participantCount}/{session.maxParticipants}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {getStatusBadge(session.status)}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Link
                              href={`/dashboard/group-sessions/${session.id}`}
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
