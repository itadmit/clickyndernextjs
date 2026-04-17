import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // בדיקה אם המשתמש הוא Super Admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  });

  // אם זה Super Admin ואין לו עסק, נתב לדשבורד אדמין
  if (user?.isSuperAdmin) {
    const business = await prisma.business.findFirst({
      where: { ownerUserId: session.user.id },
    });
    
    if (!business) {
      redirect('/admin');
    }
  }

  // שליפת העסק של המשתמש
  const business = await prisma.business.findFirst({
    where: {
      ownerUserId: session.user.id,
    },
    include: {
      _count: {
        select: {
          staff: true,
          services: true,
          branches: true,
          customers: true,
        },
      },
    },
  });

  if (!business) {
    return <div>לא נמצא עסק</div>;
  }

  // Today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Tomorrow
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  // This week end
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Parallel queries for performance
  const [todayAppointments, tomorrowAppointments, weekAppointments, recentAppointments, upcomingCount] = await Promise.all([
    // Today's appointments
    prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startAt: { gte: todayStart, lte: todayEnd },
        status: { not: 'canceled' },
      },
      include: {
        customer: true,
        service: true,
        staff: true,
        branch: true,
      },
      orderBy: { startAt: 'asc' },
    }),
    // Tomorrow's appointments
    prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startAt: { gte: tomorrowStart, lte: tomorrowEnd },
        status: { not: 'canceled' },
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
      orderBy: { startAt: 'asc' },
    }),
    // This week total
    prisma.appointment.count({
      where: {
        businessId: business.id,
        startAt: { gte: todayStart, lte: weekEnd },
        status: { not: 'canceled' },
      },
    }),
    // Recent activity (last 5 bookings)
    prisma.appointment.findMany({
      where: {
        businessId: business.id,
        status: { not: 'canceled' },
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    // Total upcoming
    prisma.appointment.count({
      where: {
        businessId: business.id,
        startAt: { gte: new Date() },
        status: { not: 'canceled' },
      },
    }),
  ]);

  const hasRequiredSetup = 
    business._count.services > 0 && 
    business._count.staff > 0 && 
    business._count.branches > 0;

  return (
    <>
      <DashboardClient
        businessSlug={business.slug}
        staffCount={business._count.staff}
        servicesCount={business._count.services}
      />
      
      <DashboardHeader
        title={`שלום, ${session.user.name}`}
        subtitle={business.name}
      />

      <DashboardHome
        business={{
          id: business.id,
          name: business.name,
          slug: business.slug,
          _count: business._count,
        }}
        userName={session.user.name || 'משתמש'}
        hasRequiredSetup={hasRequiredSetup}
        todayAppointments={JSON.parse(JSON.stringify(todayAppointments))}
        tomorrowAppointments={JSON.parse(JSON.stringify(tomorrowAppointments))}
        weekAppointmentsCount={weekAppointments}
        recentAppointments={JSON.parse(JSON.stringify(recentAppointments))}
        upcomingCount={upcomingCount}
      />
    </>
  );
}
