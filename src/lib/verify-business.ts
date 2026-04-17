import { prisma } from '@/lib/prisma';

/**
 * Verifies that the given businessId belongs to the authenticated user.
 * Returns the business if owned, null otherwise.
 */
export async function verifyBusinessOwnership(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      ownerUserId: userId,
    },
  });
  return business;
}

/**
 * Gets the user's business. Used when businessId is not provided by the client.
 */
export async function getUserBusiness(userId: string) {
  return prisma.business.findFirst({
    where: { ownerUserId: userId },
  });
}
