import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ListPageSkeleton } from '@/components/ui/Skeleton';

export default function WaitlistLoading() {
  return (
    <div>
      <DashboardHeader
        title="רשימת המתנה"
        subtitle="טוען..."
      />
      <ListPageSkeleton />
    </div>
  );
}
