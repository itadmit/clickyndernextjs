import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ListPageSkeleton } from '@/components/ui/Skeleton';

export default function GroupSessionsLoading() {
  return (
    <div>
      <DashboardHeader
        title="שיעורים קבוצתיים"
        subtitle="טוען..."
      />
      <ListPageSkeleton />
    </div>
  );
}
