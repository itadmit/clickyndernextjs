'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ExpiredTrialGuardProps {
  isTrialExpired: boolean;
  children: React.ReactNode;
}

export function ExpiredTrialGuard({ isTrialExpired, children }: ExpiredTrialGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isSubscriptionPage = pathname === '/dashboard/subscription';

  useEffect(() => {
    if (isTrialExpired && !isSubscriptionPage) {
      router.replace('/dashboard/subscription?trial_expired=1');
    }
  }, [isTrialExpired, isSubscriptionPage, router]);

  if (isTrialExpired && !isSubscriptionPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-6xl">⏰</div>
          <h2 className="text-xl font-bold text-gray-900">תקופת הניסיון הסתיימה</h2>
          <p className="text-gray-600">מעביר אותך לדף המנויים...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
