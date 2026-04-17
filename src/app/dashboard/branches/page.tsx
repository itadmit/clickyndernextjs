import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BranchesList } from '@/components/branches/BranchesList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function BranchesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const business = await prisma.business.findFirst({
    where: {
      ownerUserId: session.user.id,
    },
    include: {
      subscription: {
        include: {
          package: true,
        },
      },
    },
  });

  if (!business) {
    return <div>לא נמצא עסק</div>;
  }

  const branches = await prisma.branch.findMany({
    where: {
      businessId: business.id,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          staff: {
            where: {
              active: true,
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Check package limits
  const maxBranches = business.subscription?.package.maxBranches || 1;
  const canAddMore = branches.length < maxBranches;

  return (
    <div>
      <DashboardHeader
        title="סניפים"
        subtitle="נהל את המיקומים השונים של העסק שלך"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {branches.length} מתוך {maxBranches} סניפים
          </p>
          {canAddMore ? (
            <Link
              href="/dashboard/branches/new"
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>הוספת סניף חדש</span>
            </Link>
          ) : (
            <div className="text-sm text-gray-500">
              הגעת למכסת הסניפים.{' '}
              <Link href="/dashboard/subscription" className="text-primary-600 hover:text-primary-700 font-medium">
                שדרג חבילה
              </Link>
            </div>
          )}
        </div>

        {/* Branches List */}
        <BranchesList branches={branches} businessId={business.id} />
      </div>
    </div>
  );
}

