import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { PackageComparison } from '@/components/subscription/PackageComparison';
import { PaymentResultBanner } from '@/components/subscription/PaymentResultBanner';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { Check } from 'lucide-react';

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; trial_expired?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

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

  const packages = await prisma.package.findMany({
    orderBy: {
      priceCents: 'asc',
    },
  });

  const currentDate = new Date();
  const periodMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const usage = await prisma.usageCounter.findUnique({
    where: {
      businessId_periodMonth: {
        businessId: business.id,
        periodMonth,
      },
    },
  });

  const subscription = business.subscription;
  const isTrial = subscription?.status === 'trial';
  const trialDaysLeft = isTrial && subscription?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div>
      <DashboardHeader
        title="חבילה ומנוי"
        subtitle="נהל את המנוי והחבילה שלך"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {params.payment === 'success' && <PaymentResultBanner type="success" />}
        {params.payment === 'failed' && <PaymentResultBanner type="failed" />}
        {params.trial_expired === '1' && <PaymentResultBanner type="trial_expired" />}

        {isTrial && trialDaysLeft !== null && trialDaysLeft <= 7 && (
          <TrialBanner daysLeft={trialDaysLeft} />
        )}

        {business.subscription && (
          <SubscriptionCard
            subscription={business.subscription}
            usage={usage}
            business={business}
          />
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">בחר את החבילה המתאימה לך</h2>
          <PackageComparison
            packages={packages}
            currentPackageId={business.subscription?.packageId}
          />
        </div>

        {/* Features Matrix */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">השוואת תכונות</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">תכונה</th>
                  {packages.map((pkg) => (
                    <th key={pkg.id} className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {pkg.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-5 text-sm text-gray-700">עובדים</td>
                  {packages.map((pkg) => (
                    <td key={pkg.id} className="text-center py-3 px-5 text-sm text-gray-900">
                      {pkg.maxStaff === 999 ? 'ללא הגבלה' : pkg.maxStaff}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-5 text-sm text-gray-700">סניפים</td>
                  {packages.map((pkg) => (
                    <td key={pkg.id} className="text-center py-3 px-5 text-sm text-gray-900">
                      {pkg.maxBranches === 999 ? 'ללא הגבלה' : pkg.maxBranches}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-5 text-sm text-gray-700">תורים בחודש</td>
                  {packages.map((pkg) => (
                    <td key={pkg.id} className="text-center py-3 px-5 text-sm text-gray-900">
                      {pkg.monthlyAppointmentsCap === 999999 ? 'ללא הגבלה' : pkg.monthlyAppointmentsCap}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-5 text-sm text-gray-700">התראות WhatsApp</td>
                  {packages.map((pkg) => (
                    <td key={pkg.id} className="text-center py-3 px-5">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-5 text-sm text-gray-700">אינטגרציות יומן</td>
                  {packages.map((pkg, index) => (
                    <td key={pkg.id} className="text-center py-3 px-5">
                      {index > 0 ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

