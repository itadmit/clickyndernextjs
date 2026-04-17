'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import {
  Clock,
  User,
  Phone,
  Scissors,
  Calendar,
  Send,
  Trash2,
  Loader2,
} from 'lucide-react';

interface WaitlistEntry {
  id: string;
  position: number;
  status: string;
  preferredDate?: string | null;
  preferredTimeRange?: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  service: {
    id: string;
    name: string;
  };
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'waiting' | 'all'>('waiting');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [filter]);

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'waiting') {
        params.append('status', 'waiting');
      }
      const response = await fetch(`/api/waitlist?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      toast.error('שגיאה בטעינת רשימת ההמתנה');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOffer = async (entryId: string) => {
    setActionLoading(entryId);
    try {
      const response = await fetch(`/api/waitlist/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'offered' }),
      });
      if (!response.ok) throw new Error('Failed to offer');
      toast.success('ההצעה נשלחה בהצלחה');
      fetchEntries();
    } catch (error) {
      toast.error('שגיאה בשליחת ההצעה');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (entryId: string) => {
    setActionLoading(entryId);
    try {
      const response = await fetch(`/api/waitlist/${entryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove');
      toast.success('הרשומה הוסרה מרשימת ההמתנה');
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (error) {
      toast.error('שגיאה בהסרה מרשימת ההמתנה');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <span className="badge badge-warning">ממתין</span>;
      case 'offered':
        return <span className="badge badge-info">הוצע</span>;
      case 'booked':
        return <span className="badge badge-success">הוזמן</span>;
      case 'canceled':
        return <span className="badge badge-error">בוטל</span>;
      case 'expired':
        return <span className="badge">פג תוקף</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <DashboardHeader
        title="רשימת המתנה"
        subtitle="נהל את רשימת ההמתנה לשירותים"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => {
                setIsLoading(true);
                setFilter(e.target.value as 'waiting' | 'all');
              }}
              className="form-input text-sm py-2"
            >
              <option value="waiting">ממתינים</option>
              <option value="all">הכל</option>
            </select>
            <p className="text-sm text-gray-500">
              {entries.length} רשומות
            </p>
          </div>
        </div>

        {/* Waitlist */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 px-5">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600 mb-1">רשימת ההמתנה ריקה</h3>
              <p className="text-sm text-gray-500">
                אין רשומות ברשימת ההמתנה כרגע
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden divide-y divide-gray-100">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-amber-600">#{entry.position}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {entry.customer.firstName} {entry.customer.lastName}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {entry.customer.phone}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(entry.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        {entry.service.name}
                      </span>
                      {entry.preferredDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(entry.preferredDate)}
                        </span>
                      )}
                    </div>
                    {entry.preferredTimeRange && (
                      <p className="text-xs text-gray-500">
                        העדפת שעות: {entry.preferredTimeRange}
                      </p>
                    )}
                    {entry.status === 'waiting' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOffer(entry.id)}
                          disabled={actionLoading === entry.id}
                          className="btn btn-primary text-xs flex-1"
                        >
                          {actionLoading === entry.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>הצע תור</span>
                        </button>
                        <button
                          onClick={() => handleRemove(entry.id)}
                          disabled={actionLoading === entry.id}
                          className="btn btn-secondary text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">מיקום</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">לקוח</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">שירות</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">העדפות</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">סטטוס</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">תאריך הצטרפות</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-amber-600">#{entry.position}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {entry.customer.firstName} {entry.customer.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{entry.customer.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                          {entry.service.name}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                          {entry.preferredDate ? (
                            <span>{formatDate(entry.preferredDate)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                          {entry.preferredTimeRange && (
                            <p className="text-xs text-gray-500">{entry.preferredTimeRange}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {getStatusBadge(entry.status)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {entry.status === 'waiting' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOffer(entry.id)}
                                disabled={actionLoading === entry.id}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                              >
                                {actionLoading === entry.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                הצע תור
                              </button>
                              <button
                                onClick={() => handleRemove(entry.id)}
                                disabled={actionLoading === entry.id}
                                className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                הסר
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
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
