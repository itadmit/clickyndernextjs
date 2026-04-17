import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AppointmentsCalendar } from '@/components/appointments/AppointmentsCalendar';
import { AppointmentsList } from '@/components/appointments/AppointmentsList';
import { MonthlyCalendar } from '@/components/appointments/MonthlyCalendar';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const business = await prisma.business.findFirst({
    where: {
      ownerUserId: session.user.id,
    },
  });

  if (!business) {
    return <div>לא נמצא עסק</div>;
  }

  // Get this month's appointments for calendar
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      startAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      customer: true,
      service: true,
      staff: true,
      branch: true,
    },
    orderBy: {
      startAt: 'asc',
    },
  });

  // Get today's appointments for list
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.startAt);
    return aptDate >= startOfDay && aptDate <= endOfDay;
  });

  const staff = await prisma.staff.findMany({
    where: {
      businessId: business.id,
      active: true,
      deletedAt: null,
    },
  });

  const services = await prisma.service.findMany({
    where: {
      businessId: business.id,
      active: true,
      deletedAt: null,
    },
  });

  const branches = await prisma.branch.findMany({
    where: {
      businessId: business.id,
      active: true,
      deletedAt: null,
    },
  });

  return (
    <div>
      <DashboardHeader
        title="תורים"
        subtitle="נהל את התורים והפגישות שלך"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {todayAppointments.length} תורים להיום
          </p>
          <Link
            href="/dashboard/appointments/new"
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">יצירת תור חדש</span>
            <span className="md:hidden">תור חדש</span>
          </Link>
        </div>

        {/* Mobile Calendar View - Monthly with selected day list */}
        <div className="block md:hidden">
          <MonthlyCalendar appointments={appointments} />
        </div>

        {/* Desktop Calendar View - Weekly */}
        <div className="hidden md:block">
          <AppointmentsCalendar
            businessId={business.id}
            initialAppointments={appointments}
            staff={staff}
            services={services}
            branches={branches}
          />
        </div>

        {/* Today's Appointments List - Desktop only */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">תורים להיום</h2>
          </div>
          <div className="p-5">
            <AppointmentsList appointments={todayAppointments} />
          </div>
        </div>
      </div>
    </div>
  );
}

