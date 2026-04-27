/**
 * Audience computation for marketing campaigns.
 * Given a business and an audience definition, return the matching customer IDs.
 */

import { prisma } from '@/lib/prisma';

export type AudienceType = 'all' | 'inactive' | 'frequent';
export interface AudienceParams {
  inactiveDays?: number; // for 'inactive'
  minAppointments?: number; // for 'frequent'
}

export async function computeAudience(
  businessId: string,
  type: AudienceType,
  params: AudienceParams = {},
): Promise<{ customerIds: string[]; total: number }> {
  if (type === 'all') {
    const customers = await prisma.customer.findMany({
      where: { businessId, phone: { not: '' } },
      select: { id: true },
    });
    return { customerIds: customers.map((c) => c.id), total: customers.length };
  }

  if (type === 'inactive') {
    const days = Math.max(1, params.inactiveDays ?? 90);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    // Customers with NO appointment after cutoff
    const customers = await prisma.customer.findMany({
      where: {
        businessId,
        phone: { not: '' },
        appointments: { none: { startAt: { gte: cutoff }, status: { notIn: ['canceled'] } } },
      },
      select: { id: true },
    });
    return { customerIds: customers.map((c) => c.id), total: customers.length };
  }

  if (type === 'frequent') {
    const minCount = Math.max(1, params.minAppointments ?? 5);
    // Group appointments by customer where status='completed', count
    const grouped = await prisma.appointment.groupBy({
      by: ['customerId'],
      where: { businessId, status: 'completed' },
      _count: { id: true },
      having: { id: { _count: { gte: minCount } } },
    });
    const customerIds = grouped.map((g) => g.customerId);
    return { customerIds, total: customerIds.length };
  }

  return { customerIds: [], total: 0 };
}
