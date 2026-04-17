'use client';

import { Staff, ServiceStaff, Service } from '@prisma/client';
import { User, ArrowRight, Check, Shuffle } from 'lucide-react';

type StaffWithServices = Staff & {
  serviceStaff: (ServiceStaff & {
    service: Service;
  })[];
};

interface StaffSelectionProps {
  staff: StaffWithServices[];
  selectedStaffId?: string;
  onSelect: (staffId: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StaffSelection({ 
  staff, 
  selectedStaffId, 
  onSelect, 
  onBack, 
  onSkip 
}: StaffSelectionProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
          <User className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">בחר עובד</h2>
        <p className="mt-1 text-sm text-gray-400">עם מי תרצה לקבוע?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {staff.map((member) => {
          const isSelected = selectedStaffId === member.id;
          return (
            <button
              key={member.id}
              onClick={() => onSelect(member.id)}
              className={`
                relative p-4 rounded-xl border text-center transition-all duration-300
                hover:shadow-md hover:border-primary-300
                ${isSelected
                  ? 'border-primary-500 bg-primary-50/80 shadow-sm'
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              <div
                className={`w-14 h-14 mx-auto mb-2.5 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                <User className="w-6 h-6" />
              </div>
              <h3 className={`text-sm font-bold transition-colors duration-300 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                {member.name}
              </h3>
              {member.roleLabel && (
                <p className="text-[11px] text-gray-400 mt-0.5">{member.roleLabel}</p>
              )}
              {isSelected && (
                <div className="absolute top-2 left-2 animate-phone-scale-in">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="btn btn-secondary flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה</span>
        </button>
        <button
          onClick={onSkip}
          className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <Shuffle className="w-4 h-4" />
          <span>לא משנה לי מי</span>
        </button>
      </div>
    </div>
  );
}
