'use client';

import { Appointment, Customer, Service, Staff, Branch } from '@prisma/client';
import { Clock, User, Scissors, MapPin, Phone, Mail } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type AppointmentWithRelations = Appointment & {
  customer: Customer;
  service: Service;
  staff: Staff | null;
  branch: Branch | null;
};

interface AppointmentsListProps {
  appointments: AppointmentWithRelations[];
}

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  const router = useRouter();

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>אין תורים להיום</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
          className="flex items-center gap-4 py-3.5 px-1 hover:bg-gray-50/50 transition-colors cursor-pointer rounded-lg -mx-1 px-2"
        >
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{
              backgroundColor: appointment.staff?.calendarColor || '#0ea5e9',
            }}
          >
            {appointment.customer.firstName.charAt(0)}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm text-gray-900 truncate">
                {appointment.customer.firstName} {appointment.customer.lastName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(appointment.startAt)}
              </span>
              <span className="flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" />
                {appointment.service.name}
              </span>
              {appointment.staff && (
                <span className="hidden md:flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {appointment.staff.name}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`badge flex-shrink-0 ${
              appointment.status === 'confirmed'
                ? 'badge-success'
                : appointment.status === 'canceled'
                ? 'badge-danger'
                : appointment.status === 'completed'
                ? 'badge-info'
                : 'badge-warning'
            }`}
          >
            {getStatusLabel(appointment.status)}
          </span>
        </div>
      ))}
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'ממתין',
    confirmed: 'מאושר',
    canceled: 'בוטל',
    no_show: 'לא הגיע',
    completed: 'הושלם',
  };
  return labels[status] || status;
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

