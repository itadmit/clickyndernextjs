'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, Users, Scissors, Building2, Plus, Copy, Check,
  ChevronLeft, ExternalLink, AlertCircle, CalendarDays, TrendingUp,
  UserPlus, ArrowUpRight, Sparkles, Zap, Eye, Bell,
} from 'lucide-react';

interface AppointmentData {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  confirmationCode: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  service: {
    name: string;
    durationMin: number;
    color?: string | null;
  };
  staff: {
    name: string;
  };
  branch?: {
    name: string;
  } | null;
}

interface DashboardHomeProps {
  business: {
    id: string;
    name: string;
    slug: string;
    _count: {
      staff: number;
      services: number;
      branches: number;
      customers: number;
    };
  };
  userName: string;
  hasRequiredSetup: boolean;
  todayAppointments: AppointmentData[];
  tomorrowAppointments: AppointmentData[];
  weekAppointmentsCount: number;
  recentAppointments: AppointmentData[];
  upcomingCount: number;
}

export function DashboardHome({
  business,
  userName,
  hasRequiredSetup,
  todayAppointments,
  tomorrowAppointments,
  weekAppointmentsCount,
  recentAppointments,
  upcomingCount,
}: DashboardHomeProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clickynder.com';
  const bookingUrl = `${baseUrl}/${business.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const now = new Date();
  const nextAppointment = todayAppointments.find(
    (a) => new Date(a.startAt) > now
  );

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = now.getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'עכשיו';
    if (minutes < 60) return `לפני ${minutes} דק׳`;
    if (hours < 24) return `לפני ${hours} שע׳`;
    return `לפני ${days} ימים`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'מאושר', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'pending':
        return { label: 'ממתין', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
      case 'completed':
        return { label: 'הושלם', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
      default:
        return { label: status, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Setup Alert - Clean minimal */}
      {!hasRequiredSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 rounded-lg p-2 mt-0.5">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">השלם את הגדרת העסק</h3>
              <p className="text-sm text-amber-700 mb-4">כדי להתחיל לקבל תורים, יש להשלים כמה שלבים:</p>
              <div className="flex flex-wrap gap-2">
                {business._count.services === 0 && (
                  <Link
                    href="/dashboard/services/new"
                    className="inline-flex items-center gap-2 bg-white border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors"
                  >
                    <Scissors className="w-4 h-4" />
                    הוסף שירות
                  </Link>
                )}
                {business._count.branches === 0 && (
                  <Link
                    href="/dashboard/branches/new"
                    className="inline-flex items-center gap-2 bg-white border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    הוסף סניף
                  </Link>
                )}
                {business._count.staff === 0 && (
                  <Link
                    href="/dashboard/staff/new"
                    className="inline-flex items-center gap-2 bg-white border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    הוסף עובד
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Link Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <ExternalLink className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-gray-700">קישור ההזמנה שלך</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 min-w-0">
            <p className="text-sm text-gray-700 font-mono truncate" dir="ltr">
              clickynder.com/{business.slug}
            </p>
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 bg-white flex-shrink-0"
          >
            <Eye className="w-4 h-4" />
            צפייה
          </a>
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
              copied
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'הועתק!' : 'העתק'}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Today + Tomorrow (takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's Schedule */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">היום שלך</h2>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('he-IL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                  {todayAppointments.length} תורים
                </span>
                <Link
                  href="/dashboard/appointments"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-1">אין תורים להיום</p>
                <p className="text-sm text-gray-400">יום פנוי - זמן מצוין לתכנון</p>
                <Link
                  href="/dashboard/appointments/new"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  יצירת תור חדש
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayAppointments.map((apt, index) => {
                  const isPast = new Date(apt.endAt) < now;
                  const isNow =
                    new Date(apt.startAt) <= now && new Date(apt.endAt) > now;
                  const statusConfig = getStatusConfig(apt.status);

                  return (
                    <Link
                      key={apt.id}
                      href={`/dashboard/appointments/${apt.id}`}
                      className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group ${
                        isPast ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Time Column */}
                      <div className="flex flex-col items-center w-16 flex-shrink-0">
                        <span className={`text-sm font-semibold ${isNow ? 'text-primary-600' : 'text-gray-800'}`}>
                          {formatTime(apt.startAt)}
                        </span>
                        <span className="text-xs text-gray-400">{apt.service.durationMin} דק׳</span>
                      </div>

                      {/* Indicator Line */}
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            isNow
                              ? 'bg-primary-500 ring-4 ring-primary-100'
                              : isPast
                              ? 'bg-gray-300'
                              : statusConfig.dot
                          }`}
                        />
                        {index < todayAppointments.length - 1 && (
                          <div className="w-0.5 h-6 bg-gray-200" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {apt.customer.firstName} {apt.customer.lastName}
                          </span>
                          {isNow && (
                            <span className="text-[10px] font-semibold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded animate-pulse">
                              עכשיו
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {apt.service.name}
                          {apt.staff && <span className="mx-1">·</span>}
                          {apt.staff && apt.staff.name}
                        </p>
                      </div>

                      {/* Status */}
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        {statusConfig.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tomorrow Preview */}
          {tomorrowAppointments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-100 rounded-lg p-2">
                    <CalendarDays className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">מחר</h2>
                    <p className="text-xs text-gray-500">
                      {(() => {
                        const tmrw = new Date();
                        tmrw.setDate(tmrw.getDate() + 1);
                        return tmrw.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
                      })()}
                    </p>
                  </div>
                </div>
                <span className="bg-violet-50 text-violet-700 text-sm font-semibold px-3 py-1 rounded-full">
                  {tomorrowAppointments.length} תורים
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {tomorrowAppointments.slice(0, 4).map((apt) => {
                  const statusConfig = getStatusConfig(apt.status);
                  return (
                    <Link
                      key={apt.id}
                      href={`/dashboard/appointments/${apt.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700 w-14 flex-shrink-0">
                        {formatTime(apt.startAt)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 font-medium truncate block">
                          {apt.customer.firstName} {apt.customer.lastName}
                        </span>
                        <span className="text-xs text-gray-500">{apt.service.name}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </Link>
                  );
                })}
                {tomorrowAppointments.length > 4 && (
                  <div className="px-5 py-2.5 text-center">
                    <Link href="/dashboard/appointments" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      עוד {tomorrowAppointments.length - 4} תורים →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Stats + Quick Actions + Activity */}
        <div className="space-y-6">

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">סקירה מהירה</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/appointments" className="group">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {upcomingCount}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">תורים קרובים</div>
              </Link>
              <Link href="/dashboard/appointments" className="group">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {weekAppointmentsCount}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">השבוע</div>
              </Link>
              <Link href="/dashboard/customers" className="group">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {business._count.customers}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">לקוחות</div>
              </Link>
              <Link href="/dashboard/services" className="group">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {business._count.services}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">שירותים</div>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">פעולות מהירות</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/appointments/new"
                className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors group"
              >
                <div className="bg-primary-600 rounded-lg p-2 group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-primary-900">תור חדש</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-primary-400" />
              </Link>

              <Link
                href="/dashboard/staff/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="bg-gray-100 rounded-lg p-2 group-hover:bg-gray-200 transition-colors">
                  <UserPlus className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm text-gray-700 flex-1">הוספת עובד</span>
                <ChevronLeft className="w-4 h-4 text-gray-300" />
              </Link>

              <Link
                href="/dashboard/services/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="bg-gray-100 rounded-lg p-2 group-hover:bg-gray-200 transition-colors">
                  <Scissors className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm text-gray-700 flex-1">הוספת שירות</span>
                <ChevronLeft className="w-4 h-4 text-gray-300" />
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="bg-gray-100 rounded-lg p-2 group-hover:bg-gray-200 transition-colors">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm text-gray-700 flex-1">הגדרות העסק</span>
                <ChevronLeft className="w-4 h-4 text-gray-300" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          {recentAppointments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">פעילות אחרונה</h3>
                <Link
                  href="/dashboard/appointments"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  הכל
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/dashboard/appointments/${apt.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {apt.customer.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate">
                        {apt.customer.firstName} {apt.customer.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {apt.service.name} · {formatDate(apt.startAt)} {formatTime(apt.startAt)}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                      {getTimeAgo(apt.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

