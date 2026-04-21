import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { FormPageSkeleton } from '@/components/ui/Skeleton';

export default function NewGroupSessionLoading() {
  return (
    <div>
      <DashboardHeader
        title="יצירת שיעור קבוצתי"
        subtitle="טוען..."
      />
      <FormPageSkeleton />
    </div>
  );
}
