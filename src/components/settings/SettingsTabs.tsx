'use client';

import { useState } from 'react';
import { Building2, Phone, Clock, Bell, Globe, BellRing, FileText, CreditCard, ShieldCheck } from 'lucide-react';

interface SettingsTabsProps {
  children: React.ReactNode[];
}

const tabs = [
  { id: 'general', label: 'כללי', icon: Building2 },
  { id: 'booking-page', label: 'עמוד קביעת תורים', icon: Globe },
  { id: 'contact', label: 'פרטי יצירת קשר', icon: Phone },
  { id: 'hours', label: 'שעות עבודה', icon: Clock },
  { id: 'slots', label: 'זמני פגישות', icon: Clock },
  { id: 'intake-forms', label: 'שאלונים', icon: FileText },
  { id: 'payments', label: 'סליקה', icon: CreditCard },
  { id: 'cancellation', label: 'מדיניות ביטול', icon: ShieldCheck },
  { id: 'reminders', label: 'תזכורות', icon: BellRing },
  { id: 'notifications', label: 'תבניות התראות', icon: Bell },
];

export function SettingsTabs({ children }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? 'block' : 'hidden'}
          >
            {children[index]}
          </div>
        ))}
      </div>
    </div>
  );
}

