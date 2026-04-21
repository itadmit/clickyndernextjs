import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CardSkeleton } from '@/components/ui/Skeleton';

export default function RecurringDetailLoading() {
  return (
    <div>
      <DashboardHeader
        title="פרטי תור חוזר"
        subtitle="טוען..."
      />
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
