import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ListPageSkeleton } from '@/components/ui/Skeleton';

export default function RecurringLoading() {
  return (
    <div>
      <DashboardHeader
        title="תורים חוזרים"
        subtitle="טוען..."
      />
      <ListPageSkeleton />
    </div>
  );
}
