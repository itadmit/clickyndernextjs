/**
 * Mobile Appointments List API
 * GET /api/mobile/appointments - List appointments with filters
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

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'today'; // today, week, month, all
    const dateParam = searchParams.get('date'); // specific date: YYYY-MM-DD
    const status = searchParams.get('status'); // confirmed, pending, canceled, completed
    const staffId = searchParams.get('staffId');
    const branchId = searchParams.get('branchId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let dateFilter: any = {};

    if (dateParam) {
      const [y, m, d] = dateParam.split('-').map(Number);
      const dayStart = new Date(y, m - 1, d, 0, 0, 0);
      const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
      dateFilter = { gte: dayStart, lte: dayEnd };
    } else {
      switch (filter) {
        case 'today': {
          const todayEnd = new Date(todayStart);
          todayEnd.setDate(todayEnd.getDate() + 1);
          dateFilter = { gte: todayStart, lt: todayEnd };
          break;
        }
        case 'week': {
          const weekStart = new Date(todayStart);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          dateFilter = { gte: weekStart, lt: weekEnd };
          break;
        }
        case 'month': {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          dateFilter = { gte: monthStart, lt: monthEnd };
          break;
        }
        case 'upcoming': {
          dateFilter = { gte: now };
          break;
        }
        // all - ללא פילטר תאריך
      }
    }

    const where: any = {
      businessId: business.id,
      ...(Object.keys(dateFilter).length > 0 && { startAt: dateFilter }),
      ...(status && { status: status.includes(',') ? { in: status.split(',') } : status }),
      ...(staffId && { staffId }),
      ...(branchId && { branchId }),
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: true,
          service: true,
          staff: true,
          branch: true,
        },
        orderBy: { startAt: filter === 'all' ? 'desc' : 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments: appointments.map((apt) => ({
        id: apt.id,
        startAt: apt.startAt,
        endAt: apt.endAt,
        status: apt.status,
        confirmationCode: apt.confirmationCode,
        priceCents: apt.priceCents,
        notesInternal: apt.notesInternal,
        notesCustomer: apt.notesCustomer,
        source: apt.source,
        createdAt: apt.createdAt,
        canceledAt: apt.canceledAt,
        customer: {
          id: apt.customer.id,
          firstName: apt.customer.firstName,
          lastName: apt.customer.lastName,
          phone: apt.customer.phone,
          email: apt.customer.email,
        },
        service: {
          id: apt.service.id,
          name: apt.service.name,
          durationMin: apt.service.durationMin,
          priceCents: apt.service.priceCents,
          color: apt.service.color,
        },
        staff: apt.staff ? {
          id: apt.staff.id,
          name: apt.staff.name,
          calendarColor: apt.staff.calendarColor,
        } : null,
        branch: apt.branch ? {
          id: apt.branch.id,
          name: apt.branch.name,
        } : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching mobile appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/appointments - Create a new appointment (from business owner)
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { serviceId, customerId, newCustomer, staffId, startAt, endAt, notesInternal } = body;

    if (!serviceId || !startAt || !endAt) {
      return NextResponse.json({ error: 'Missing required fields: serviceId, startAt, endAt' }, { status: 400 });
    }

    if (!customerId && !newCustomer) {
      return NextResponse.json({ error: 'Missing customer: provide customerId or newCustomer' }, { status: 400 });
    }

    // Verify service belongs to business
    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId: business.id, deletedAt: null },
    });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Resolve customer
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && newCustomer) {
      // Check if customer with this phone already exists
      let customer = await prisma.customer.findFirst({
        where: { businessId: business.id, phone: newCustomer.phone },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            businessId: business.id,
            firstName: newCustomer.firstName || '',
            lastName: newCustomer.lastName || '',
            phone: newCustomer.phone,
          },
        });
      }
      resolvedCustomerId = customer.id;
    }

    // Verify customer belongs to business
    const customer = await prisma.customer.findFirst({
      where: { id: resolvedCustomerId, businessId: business.id },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Generate confirmation code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let confirmationCode = '';
    for (let i = 0; i < 6; i++) {
      confirmationCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId,
        customerId: resolvedCustomerId,
        staffId: staffId || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        status: 'confirmed',
        priceCents: service.priceCents,
        paymentStatus: 'not_required',
        confirmationCode,
        notesInternal: notesInternal || null,
        source: 'admin',
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
    });

    // Update usage counter
    const periodMonth = new Date(appointment.startAt.getFullYear(), appointment.startAt.getMonth(), 1);
    await prisma.usageCounter.upsert({
      where: {
        businessId_periodMonth: {
          businessId: business.id,
          periodMonth,
        },
      },
      create: {
        businessId: business.id,
        periodMonth,
        appointmentsCount: 1,
      },
      update: {
        appointmentsCount: { increment: 1 },
      },
    });

    // Create notification
    const customerName = customer.firstName + ' ' + customer.lastName;
    const startDate = new Date(startAt);
    await prisma.dashboardNotification.create({
      data: {
        businessId: business.id,
        appointmentId: appointment.id,
        customerId: resolvedCustomerId,
        type: 'new_appointment',
        title: 'תור חדש נוצר',
        message: customerName + ' - ' + service.name + ' בתאריך ' + startDate.toLocaleDateString('he-IL') + ' בשעה ' + startDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        confirmationCode: appointment.confirmationCode,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        status: appointment.status,
        customer: {
          id: appointment.customer.id,
          firstName: appointment.customer.firstName,
          lastName: appointment.customer.lastName,
        },
        service: {
          id: appointment.service.id,
          name: appointment.service.name,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating mobile appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
