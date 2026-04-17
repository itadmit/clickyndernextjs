import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { BusinessSettings } from '@/components/settings/BusinessSettings';
import { BookingPageDesign } from '@/components/settings/BookingPageDesign';
import { ContactSettings } from '@/components/settings/ContactSettings';
import { WorkingHours } from '@/components/settings/WorkingHours';
import { SlotSettings } from '@/components/settings/SlotSettings';
import { ReminderSettings } from '@/components/settings/ReminderSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { HolidaysSettings } from '@/components/settings/HolidaysSettings';
import { IntakeFormBuilder } from '@/components/intake-forms/IntakeFormBuilder';
import { PaymentSettings } from '@/components/settings/PaymentSettings';
import { CancellationSettings } from '@/components/settings/CancellationSettings';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const business = await prisma.business.findFirst({
    where: {
      ownerUserId: session.user.id,
    },
    include: {
      businessHours: {
        orderBy: {
          weekday: 'asc',
        },
      },
      slotPolicy: true,
    },
  });

  if (!business) {
    return <div>לא נמצא עסק</div>;
  }

  const notificationTemplates = await prisma.notificationTemplate.findMany({
    where: {
      businessId: business.id,
    },
  });

  const servicesForForms = await prisma.service.findMany({
    where: {
      businessId: business.id,
      active: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <DashboardHeader
        title="הגדרות"
        subtitle="נהל את הגדרות העסק והמערכת"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <SettingsTabs>
          {/* Tab 1: General Settings */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">הגדרות כלליות</h2>
            </div>
            <div className="p-5">
              <BusinessSettings business={business} />
            </div>
          </div>

          {/* Tab 2: Booking Page Design */}
          <BookingPageDesign business={business} />

          {/* Tab 3: Contact & Social */}
          <ContactSettings business={business} />

          {/* Tab 3: Working Hours */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">ימי ושעות עבודה</h2>
              </div>
              <div className="p-5">
                <WorkingHours
                  businessId={business.id}
                  businessHours={business.businessHours}
                />
              </div>
            </div>

            {/* Holidays */}
            <HolidaysSettings businessId={business.id} />
          </div>

          {/* Tab 4: Slot Policy */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">הגדרות זמני פגישות</h2>
            </div>
            <div className="p-5">
              <SlotSettings
                businessId={business.id}
                slotPolicy={business.slotPolicy}
              />
            </div>
          </div>

          {/* Tab 6: Intake Forms */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <IntakeFormBuilder
              businessId={business.id}
              services={servicesForForms}
            />
          </div>

          {/* Tab 7: Payment Settings */}
          <PaymentSettings business={business} />

          {/* Tab 8: Cancellation Policy */}
          <CancellationSettings business={business} />

          {/* Tab 9: Reminder Settings */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">תזכורות ואישורי הגעה</h2>
            </div>
            <div className="p-5">
              <ReminderSettings
                businessId={business.id}
                initialSettings={{
                  reminderEnabled: business.reminderEnabled,
                  reminderHoursBefore: business.reminderHoursBefore,
                  confirmationEnabled: business.confirmationEnabled,
                  confirmationHoursBefore: business.confirmationHoursBefore,
                }}
              />
            </div>
          </div>

          {/* Tab 6: Notification Templates */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">תבניות התראות</h2>
            </div>
            <div className="p-5">
              <NotificationSettings
                businessId={business.id}
                templates={notificationTemplates}
              />
            </div>
          </div>
        </SettingsTabs>
      </div>
    </div>
  );
}

