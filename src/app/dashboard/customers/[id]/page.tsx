'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Briefcase,
  ArrowRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  createdAt: string;
  business?: {
    currency: string;
  };
  appointments: Array<{
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    priceCents: number;
    confirmationCode: string;
    service: {
      name: string;
    };
    staff: {
      name: string;
    };
  }>;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      toast.error('שגיאה בטעינת הלקוח');
      router.push('/dashboard/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      pending: 'ממתין',
      confirmed: 'מאושר',
      completed: 'הושלם',
      canceled: 'בוטל',
      no_show: 'לא הגיע',
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700';
      case 'pending':
        return 'bg-amber-50 text-amber-700';
      case 'canceled':
        return 'bg-red-50 text-red-700';
      case 'completed':
        return 'bg-blue-50 text-blue-700';
      case 'no_show':
        return 'bg-gray-50 text-gray-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div>
        <DashboardHeader title="פרטי לקוח" subtitle="טוען..." />
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Customer Info Skeleton */}
            <div className="card animate-pulse">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-16 w-16 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-8 bg-gray-200 rounded w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Appointments Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-20 bg-gray-100 rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const totalSpent = customer.appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.priceCents, 0);

  const upcomingAppointments = customer.appointments.filter(
    (a) =>
      (a.status === 'confirmed' || a.status === 'pending') &&
      new Date(a.startAt) > new Date()
  );

  const pastAppointments = customer.appointments.filter(
    (a) =>
      a.status === 'completed' ||
      a.status === 'canceled' ||
      a.status === 'no_show' ||
      new Date(a.startAt) <= new Date()
  );

  return (
    <div>
      <DashboardHeader title="פרטי לקוח" subtitle={`${customer.firstName} ${customer.lastName}`} />

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{customer.firstName} {customer.lastName}</h2>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    <a href={`tel:${customer.phone}`} className="hover:text-primary-600">{customer.phone}</a>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="w-3.5 h-3.5" />
                      <a href={`mailto:${customer.email}`} className="hover:text-primary-600">{customer.email}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>לקוח מאז {formatDate(customer.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{customer.appointments.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">סה״כ תורים</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{upcomingAppointments.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">תורים קרובים</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{formatPrice(totalSpent, customer.business?.currency || 'ILS')}</p>
                <p className="text-xs text-gray-500 mt-0.5">סה״כ הוצאה</p>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900">תורים קרובים</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{appointment.service.name}</span>
                        <span className={`badge ${getStatusColor(appointment.status)}`}>{getStatusLabel(appointment.status)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(appointment.startAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(appointment.startAt)}</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{appointment.staff.name}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-primary-600">{formatPrice(appointment.priceCents, customer.business?.currency || 'ILS')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Appointments */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900">היסטוריית תורים</h3>
            </div>
            {pastAppointments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">אין היסטוריית תורים</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {pastAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {appointment.status === 'completed' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{appointment.service.name}</span>
                        <span className={`badge ${getStatusColor(appointment.status)}`}>{getStatusLabel(appointment.status)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(appointment.startAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(appointment.startAt)}</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{appointment.staff.name}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-500">{formatPrice(appointment.priceCents, customer.business?.currency || 'ILS')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/dashboard/customers')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>חזרה ללקוחות</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

