import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { formatPrice } from '@/lib/utils';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default async function AnalyticsPage() {
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

  // Get date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Current month stats
  const [
    totalAppointments,
    completedAppointments,
    canceledAppointments,
    pendingAppointments,
    totalRevenue,
    uniqueCustomers,
  ] = await Promise.all([
    // Total appointments this month
    prisma.appointment.count({
      where: {
        businessId: business.id,
        startAt: { gte: startOfMonth },
      },
    }),
    // Completed appointments
    prisma.appointment.count({
      where: {
        businessId: business.id,
        startAt: { gte: startOfMonth },
        status: 'completed',
      },
    }),
    // Canceled appointments
    prisma.appointment.count({
      where: {
        businessId: business.id,
        startAt: { gte: startOfMonth },
        status: 'canceled',
      },
    }),
    // Pending appointments
    prisma.appointment.count({
      where: {
        businessId: business.id,
        startAt: { gte: startOfMonth },
        status: { in: ['pending', 'confirmed'] },
      },
    }),
    // Total revenue
    prisma.appointment.aggregate({
      where: {
        businessId: business.id,
        startAt: { gte: startOfMonth },
        status: 'completed',
      },
      _sum: {
        priceCents: true,
      },
    }),
    // Unique customers
    prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startAt: { gte: startOfMonth },
      },
      select: {
        customerId: true,
      },
      distinct: ['customerId'],
    }),
  ]);

  // Last month stats for comparison
  const [lastMonthAppointments, lastMonthRevenue] = await Promise.all([
    prisma.appointment.count({
      where: {
        businessId: business.id,
        startAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    }),
    prisma.appointment.aggregate({
      where: {
        businessId: business.id,
        startAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        status: 'completed',
      },
      _sum: {
        priceCents: true,
      },
    }),
  ]);

  // Calculate percentages
  const appointmentsGrowth =
    lastMonthAppointments > 0
      ? ((totalAppointments - lastMonthAppointments) / lastMonthAppointments) * 100
      : 0;

  const revenueGrowth =
    (lastMonthRevenue._sum.priceCents || 0) > 0
      ? (((totalRevenue._sum.priceCents || 0) - (lastMonthRevenue._sum.priceCents || 0)) /
          (lastMonthRevenue._sum.priceCents || 0)) *
        100
      : 0;

  const completionRate =
    totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

  // Top services
  const topServices = await prisma.appointment.groupBy({
    by: ['serviceId'],
    where: {
      businessId: business.id,
      startAt: { gte: startOfMonth },
    },
    _count: {
      serviceId: true,
    },
    orderBy: {
      _count: {
        serviceId: 'desc',
      },
    },
    take: 5,
  });

  const servicesWithNames = await prisma.service.findMany({
    where: {
      id: {
        in: topServices.map((s) => s.serviceId),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const topServicesData = topServices.map((s) => ({
    name: servicesWithNames.find((sn) => sn.id === s.serviceId)?.name || 'לא ידוע',
    count: s._count.serviceId,
  }));

  const stats = [
    {
      title: 'סה"כ תורים החודש',
      value: totalAppointments,
      change: appointmentsGrowth,
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'הכנסות החודש',
      value: formatPrice(totalRevenue._sum.priceCents || 0, business.currency),
      change: revenueGrowth,
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'לקוחות ייחודיים',
      value: uniqueCustomers.length,
      change: null,
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'אחוז השלמה',
      value: `${completionRate.toFixed(0)}%`,
      change: null,
      icon: TrendingUp,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div>
      <DashboardHeader
        title="סטטיסטיקות ואנליטיקס"
        subtitle="מעקב אחר ביצועי העסק שלך"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
                  <div className={`${stat.iconBg} rounded-lg p-2`}>
                    <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                {stat.change !== null && (
                  <p className={`text-xs flex items-center gap-1 ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change).toFixed(1)}% מהחודש שעבר
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">פילוח סטטוס תורים</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-sm text-emerald-900">הושלמו</p>
                    <p className="text-xs text-emerald-600">{completionRate.toFixed(0)}% מהתורים</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-emerald-900">{completedAppointments}</p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-blue-900">ממתינים/מאושרים</p>
                    <p className="text-xs text-blue-600">תורים פעילים</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-blue-900">{pendingAppointments}</p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-sm text-red-900">בוטלו</p>
                    <p className="text-xs text-red-600">
                      {totalAppointments > 0 ? ((canceledAppointments / totalAppointments) * 100).toFixed(0) : 0}% מהתורים
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-red-900">{canceledAppointments}</p>
              </div>
            </div>
          </div>

          {/* Top Services */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">השירותים הפופולריים</h2>
            </div>
            {topServicesData.length === 0 ? (
              <div className="text-center py-8 px-5">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">אין עדיין נתונים להצגה</p>
              </div>
            ) : (
              <div className="p-5 space-y-2">
                {topServicesData.map((service, index) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    </div>
                    <p className="text-sm font-bold text-primary-600">{service.count}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-sm text-blue-900 mb-0.5">
                הסטטיסטיקות מתעדכנות בזמן אמת
              </h3>
              <p className="text-blue-700 text-xs">
                כל הנתונים מתייחסים לחודש הנוכחי (
                {new Intl.DateTimeFormat('he-IL', {
                  month: 'long',
                  year: 'numeric',
                }).format(now)}
                ) ומושווים לחודש הקודם.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

