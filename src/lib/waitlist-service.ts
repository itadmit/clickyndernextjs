/**
 * Waitlist Service
 * Auto-offer freed slots to waitlisted customers
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/notifications/rappelsend';

export async function checkAndOfferWaitlist(
  businessId: string,
  serviceId: string,
  staffId?: string | null
): Promise<void> {
  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service?.waitlistEnabled) return;

    const nextEntry = await prisma.waitlistEntry.findFirst({
      where: {
        businessId,
        serviceId,
        status: 'waiting',
        ...(staffId && { OR: [{ staffId }, { staffId: null }] }),
      },
      include: { customer: true, service: true },
      orderBy: { position: 'asc' },
    });

    if (!nextEntry) return;

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return;

    const message = `שלום ${nextEntry.customer.firstName}! התפנה מקום ל${nextEntry.service.name} ב${business.name}. היכנס/י לדף ההזמנות שלנו וקבע/י תור: https://clickynder.com/${business.slug}`;

    await sendWhatsAppMessage(nextEntry.customer.phone, message).catch(console.error);

    await prisma.waitlistEntry.update({
      where: { id: nextEntry.id },
      data: {
        status: 'offered',
        offeredAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    console.error('Error checking waitlist:', error);
  }
}
