import { prisma } from '@/lib/prisma';
import { generateConfirmationCode } from '@/lib/utils';
import { createDefaultNotificationTemplates } from '@/lib/notifications/default-templates';

interface DefaultBusinessInput {
  name: string;
  email: string;
  phone?: string;
  city: string;
  businessAddress: string;
}

export async function createDefaultBusinessData(businessId: string, data: DefaultBusinessInput) {
  await prisma.slotPolicy.create({
    data: {
      businessId,
      defaultDurationMin: 30,
      defaultGapMin: 0,
      advanceWindowDays: 30,
      minimumAdvanceBookingHours: 2,
      sameDayBooking: true,
      roundingStrategy: 'continuous',
    },
  });

  const businessHours = [];
  for (let day = 0; day <= 4; day++) {
    businessHours.push({
      businessId,
      weekday: day,
      openTime: '08:00',
      closeTime: '17:00',
      active: true,
    });
  }
  businessHours.push({
    businessId,
    weekday: 5,
    openTime: null,
    closeTime: null,
    active: false,
  });
  businessHours.push({
    businessId,
    weekday: 6,
    openTime: null,
    closeTime: null,
    active: false,
  });

  await prisma.businessHours.createMany({ data: businessHours });

  const branch = await prisma.branch.create({
    data: {
      businessId,
      name: data.city,
      address: data.businessAddress,
      phone: data.phone || null,
      active: true,
    },
  });

  const staff = await prisma.staff.create({
    data: {
      businessId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      roleLabel: 'בעלים',
      active: true,
      calendarColor: '#0584c7',
    },
  });

  const service = await prisma.service.create({
    data: {
      businessId,
      name: 'שירות כללי',
      durationMin: 30,
      priceCents: 9900,
      bufferAfterMin: 0,
      active: true,
      color: '#0584c7',
    },
  });

  await prisma.serviceStaff.create({
    data: { serviceId: service.id, staffId: staff.id },
  });

  const customer = await prisma.customer.create({
    data: {
      businessId,
      firstName: 'ישראל',
      lastName: 'ישראלי',
      phone: '0541234567',
      email: 'israel@israeli.com',
    },
  });

  const appointmentTime = new Date();
  appointmentTime.setHours(appointmentTime.getHours() + 1);
  appointmentTime.setMinutes(0, 0, 0);

  const appointmentEndTime = new Date(appointmentTime);
  appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + service.durationMin);

  await prisma.appointment.create({
    data: {
      businessId,
      branchId: branch.id,
      serviceId: service.id,
      staffId: staff.id,
      customerId: customer.id,
      startAt: appointmentTime,
      endAt: appointmentEndTime,
      status: 'confirmed',
      priceCents: service.priceCents,
      paymentStatus: 'not_required',
      confirmationCode: generateConfirmationCode(),
      source: 'admin',
    },
  });

  const starterPackage = await prisma.package.findUnique({
    where: { code: 'starter' },
  });

  if (starterPackage) {
    await prisma.subscription.create({
      data: {
        businessId,
        packageId: starterPackage.id,
        status: 'trial',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });
  }

  await createDefaultNotificationTemplates(businessId);
}
