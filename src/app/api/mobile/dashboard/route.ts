/**
 * Mobile Dashboard API
 * GET /api/mobile/dashboard - Get dashboard stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // סטטיסטיקות במקביל
    const [
      todayCount,
      weekCount,
      monthCount,
      upcomingAppointments,
      unreadNotifications,
      totalCustomers,
      staffCount,
      servicesCount,
    ] = await Promise.all([
      // תורים היום
      prisma.appointment.count({
        where: {
          businessId: business.id,
          startAt: { gte: todayStart, lt: todayEnd },
          status: { not: 'canceled' },
        },
      }),
      // תורים השבוע
      prisma.appointment.count({
        where: {
          businessId: business.id,
          startAt: { gte: weekStart, lt: weekEnd },
          status: { not: 'canceled' },
        },
      }),
      // תורים החודש
      prisma.appointment.count({
        where: {
          businessId: business.id,
          startAt: { gte: monthStart, lt: monthEnd },
          status: { not: 'canceled' },
        },
      }),
      // 5 תורים קרובים
      prisma.appointment.findMany({
        where: {
          businessId: business.id,
          startAt: { gte: now },
          status: { not: 'canceled' },
        },
        include: {
          customer: true,
          service: true,
          staff: true,
          branch: true,
        },
        orderBy: { startAt: 'asc' },
        take: 5,
      }),
      // התראות שלא נקראו
      prisma.dashboardNotification.count({
        where: {
          businessId: business.id,
          read: false,
        },
      }),
      // סה"כ לקוחות
      prisma.customer.count({
        where: { businessId: business.id },
      }),
      // עובדים
      prisma.staff.count({
        where: { businessId: business.id, active: true },
      }),
      // שירותים
      prisma.service.count({
        where: { businessId: business.id, active: true },
      }),
    ]);

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        logoUrl: business.logoUrl,
      },
      stats: {
        todayAppointments: todayCount,
        weekAppointments: weekCount,
        monthAppointments: monthCount,
        totalCustomers,
        staffCount,
        servicesCount,
        unreadNotifications,
      },
      upcomingAppointments: upcomingAppointments.map((apt) => ({
        id: apt.id,
        startAt: apt.startAt,
        endAt: apt.endAt,
        status: apt.status,
        confirmationCode: apt.confirmationCode,
        customer: {
          id: apt.customer.id,
          firstName: apt.customer.firstName,
          lastName: apt.customer.lastName,
          phone: apt.customer.phone,
        },
        service: {
          id: apt.service.id,
          name: apt.service.name,
          durationMin: apt.service.durationMin,
          color: apt.service.color,
        },
        staff: apt.staff ? {
          id: apt.staff.id,
          name: apt.staff.name,
        } : null,
        branch: apt.branch ? {
          id: apt.branch.id,
          name: apt.branch.name,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching mobile dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
