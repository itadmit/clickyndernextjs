'use client';

import { Check, Building2, Layers, User, Calendar, FileText, UserCircle, ClipboardList } from 'lucide-react';

type BookingStep = 'branch' | 'service' | 'staff' | 'datetime' | 'intake' | 'customer' | 'summary' | 'success';

interface StepIndicatorProps {
  steps: BookingStep[];
  currentStep: BookingStep;
  completedSteps: BookingStep[];
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

const stepLabels: Record<BookingStep, string> = {
  branch: 'סניף',
  service: 'שירות',
  staff: 'עובד',
  datetime: 'תאריך',
  intake: 'שאלון',
  customer: 'פרטים',
  summary: 'סיכום',
  success: 'הושלם',
};

const stepIcons: Record<BookingStep, typeof Check> = {
  branch: Building2,
  service: Layers,
  staff: User,
  datetime: Calendar,
  intake: FileText,
  customer: UserCircle,
  summary: ClipboardList,
  success: Check,
};

export function StepIndicator({ steps, currentStep, completedSteps, primaryColor }: StepIndicatorProps) {
  const activeColor = primaryColor || '#0284c7';

  return (
    <div className="w-full mb-6">
      <div className="flex items-start justify-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const Icon = stepIcons[step];

          return (
            <div key={step} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-500"
                  style={{
                    backgroundColor: isCurrent ? activeColor : isCompleted ? '#10b981' : '#f3f4f6',
                    color: isCompleted || isCurrent ? 'white' : '#9ca3af',
                    transform: isCurrent ? 'scale(1.1)' : isCompleted ? 'scale(0.9)' : 'scale(1)',
                    boxShadow: isCurrent ? `0 4px 14px ${activeColor}40` : 'none',
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className="mt-1.5 text-[10px] font-semibold transition-colors duration-500 hidden sm:block"
                  style={{
                    color: isCurrent ? activeColor : isCompleted ? '#10b981' : '#d1d5db',
                  }}
                >
                  {stepLabels[step]}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className="mx-1.5 sm:mx-2.5 mt-[17px] h-[2px] w-4 sm:w-6 rounded-full transition-all duration-700"
                  style={{
                    backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
