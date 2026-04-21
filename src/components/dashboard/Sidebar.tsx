'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Scissors,
  Calendar,
  Settings,
  CreditCard,
  BarChart3,
  LogOut,
  UserCircle,
  User,
  Menu,
  X,
  Clock,
  Repeat,
  Shield,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'דשבורד',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'עובדים',
    href: '/dashboard/staff',
    icon: Users,
  },
  {
    title: 'סניפים',
    href: '/dashboard/branches',
    icon: Building2,
  },
  {
    title: 'שירותים',
    href: '/dashboard/services',
    icon: Scissors,
  },
  {
    title: 'שיעורים קבוצתיים',
    href: '/dashboard/group-sessions',
    icon: Users,
  },
  {
    title: 'תורים',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    title: 'רשימת המתנה',
    href: '/dashboard/waitlist',
    icon: Clock,
  },
  {
    title: 'תורים חוזרים',
    href: '/dashboard/recurring',
    icon: Repeat,
  },
  {
    title: 'לקוחות',
    href: '/dashboard/customers',
    icon: UserCircle,
  },
  {
    title: 'סטטיסטיקות',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'הגדרות',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    title: 'חבילה ומנוי',
    href: '/dashboard/subscription',
    icon: CreditCard,
  },
];

interface SidebarProps {
  onToggle?: () => void;
  businessName?: string;
  businessLogo?: string | null;
  isSuperAdmin?: boolean;
}

export function Sidebar({ onToggle, businessName, businessLogo, isSuperAdmin }: SidebarProps = {}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleOpen = () => {
    setIsOpen(true);
    onToggle?.();
  };

  // Expose open function through custom event
  useEffect(() => {
    const handleOpenSidebar = () => setIsOpen(true);
    window.addEventListener('openSidebar', handleOpenSidebar);
    return () => window.removeEventListener('openSidebar', handleOpenSidebar);
  }, []);

  // Listen for highlight events from onboarding tour
  useEffect(() => {
    const handleHighlight = (event: any) => {
      console.log('Sidebar received highlight event:', event.detail.path); // Debug
      setHighlightedPath(event.detail.path);
    };
    window.addEventListener('highlightSidebarItem', handleHighlight);
    return () => window.removeEventListener('highlightSidebarItem', handleHighlight);
  }, []);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay for mobile menu */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Highlight overlay - dims everything except sidebar */}
      {highlightedPath && (
        <div className="fixed inset-0 bg-black/60 z-30 pointer-events-none" />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 h-screen w-64 bg-white border-l border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-in-out',
          // Desktop: always visible on the right
          'lg:right-0 lg:translate-x-0',
          // Mobile: slide from right
          'right-0',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
      {/* Logo */}
      <div className="p-4 lg:p-5 border-b border-gray-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex-1 min-w-0 flex items-center justify-center gap-2">
          <img 
            src="/assets/logo.png" 
            alt="Clickinder" 
            className="h-8 lg:h-9 w-auto object-contain" 
          />
        </Link>
        {/* Close button for mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 hover:bg-gray-50 rounded-xl transition-colors"
          aria-label="סגור תפריט"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Special handling for dashboard root - should only be active on exact match
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname?.startsWith(item.href + '/');
            
            const isHighlighted = highlightedPath === item.href;

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative text-sm',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    isHighlighted && 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 z-10 shadow-lg'
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{item.title}</span>
                  {isHighlighted && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Super Admin + Logout */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {isSuperAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full text-sm',
              pathname === '/admin'
                ? 'bg-purple-50 text-purple-700 font-medium'
                : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
            )}
          >
            <Shield className="w-[18px] h-[18px]" />
            <span>ניהול מערכת</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all w-full text-sm"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>התנתק</span>
        </button>
      </div>
    </aside>
    </>
  );
}
