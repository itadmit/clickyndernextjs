import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ServicesList } from '@/components/services/ServicesList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function ServicesPage() {
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

  const services = await prisma.service.findMany({
    where: {
      businessId: business.id,
      deletedAt: null,
    },
    include: {
      category: true,
      serviceStaff: {
        include: {
          staff: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const categories = await prisma.serviceCategory.findMany({
    where: {
      businessId: business.id,
    },
    orderBy: {
      position: 'asc',
    },
  });

  return (
    <div>
      <DashboardHeader
        title="שירותים"
        subtitle="נהל את השירותים שהעסק שלך מציע"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            סה"כ {services.length} שירותים
          </p>
          <Link
            href="/dashboard/services/new"
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>הוספת שירות חדש</span>
          </Link>
        </div>

        {/* Services List */}
        <ServicesList
          services={services}
          categories={categories}
          businessId={business.id}
          currency={business.currency}
        />
      </div>
    </div>
  );
}

