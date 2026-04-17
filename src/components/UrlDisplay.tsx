'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function UrlDisplay() {
  const pathname = usePathname();
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [pathname]);

  return (
    <div className="bg-gray-800 text-white text-xs py-1 px-4 text-center" dir="ltr">
      <span className="font-mono break-all">{currentUrl}</span>
    </div>
  );
}

