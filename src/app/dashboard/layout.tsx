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

  // אם אין עסק, בדוק אם זה משתמש Google חדש
  if (!business) {
    // בדוק אם למשתמש יש Google account - רק משתמשי Google חדשים צריכים להשלים הרשמה
    const userWithAccounts = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          where: { provider: 'google' },
          select: { id: true }
        }
      }
    });

    // רק אם יש Google account (משתמש Google חדש) ונכנס דרך Google, הפנה להשלמה
    // משתמשים קיימים שהתחברו דרך credentials לא יועברו לדף ההשלמה
    if (userWithAccounts && userWithAccounts.accounts.length > 0) {
      redirect('/auth/register?complete=true');
    }
    // אם זה משתמש רגיל (credentials) בלי עסק, תן לו לגשת לדשבורד
    // (או אפשר להציג הודעה שהוא צריך ליצור עסק)
  }

  const sub = business?.subscription;
  const isTrialExpired =
    sub?.status === 'trial' &&
    sub.currentPeriodEnd != null &&
    new Date(sub.currentPeriodEnd) < new Date();

  return (
    <BusinessProvider business={{ name: business?.name, logoUrl: business?.logoUrl, slug: business?.slug }}>
      <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">
        <Sidebar businessName={business?.name} businessLogo={business?.logoUrl} />

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

