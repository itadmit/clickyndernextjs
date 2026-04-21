import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { HelpModal } from '@/components/dashboard/HelpModal';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { ExpiredTrialGuard } from '@/components/subscription/ExpiredTrialGuard';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const business = await prisma.business.findFirst({
    where: {
      ownerUserId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      slug: true,
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!business) {
    redirect('/auth/register');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  });

  const sub = business?.subscription;
  const isTrialExpired =
    sub?.status === 'trial' &&
    sub.currentPeriodEnd != null &&
    new Date(sub.currentPeriodEnd) < new Date();

  return (
    <BusinessProvider business={{ name: business?.name, logoUrl: business?.logoUrl, slug: business?.slug }}>
      <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
        <Sidebar businessName={business?.name} businessLogo={business?.logoUrl} isSuperAdmin={currentUser?.isSuperAdmin || false} />

        <main className="flex-1 min-w-0 lg:mr-64 w-full flex flex-col">
          <div className="flex-1">
            <ExpiredTrialGuard isTrialExpired={!!isTrialExpired}>
              {children}
            </ExpiredTrialGuard>
          </div>
          <DashboardFooter />
        </main>

        <HelpModal />
      </div>
    </BusinessProvider>
  );
}

