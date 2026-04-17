'use client';

import { useState, useEffect } from 'react';
import { Business, Branch, Service, Staff, ServiceCategory, ServiceStaff } from '@prisma/client';
import { StepIndicator } from './StepIndicator';
import { BranchSelection } from './steps/BranchSelection';
import { ServiceSelection } from './steps/ServiceSelection';
import { StaffSelection } from './steps/StaffSelection';
import { DateTimeSelection } from './steps/DateTimeSelection';
import { IntakeFormStep, IntakeSubmissionData } from './steps/IntakeFormStep';
import { CustomerForm } from './steps/CustomerForm';
import { BookingSummary } from './steps/BookingSummary';
import { SuccessScreen } from './steps/SuccessScreen';

export type ServiceWithCategory = Service & {
  category: ServiceCategory | null;
};

export type StaffWithServices = Staff & {
  serviceStaff: (ServiceStaff & {
    service: Service;
  })[];
};

interface BookingFlowProps {
  business: Business;
  branches: Branch[];
  services: ServiceWithCategory[];
  staff: StaffWithServices[];
  onBookingSuccess?: () => void;
  initialStaffId?: string;
}

type BookingStep = 
  | 'branch' 
  | 'service' 
  | 'staff' 
  | 'datetime' 
  | 'intake'
  | 'customer' 
  | 'summary' 
  | 'success';

interface IntakeFormData {
  id: string;
  name: string;
  description: string | null;
  fields: {
    id: string;
    type: string;
    label: string;
    description?: string | null;
    placeholder?: string | null;
    required: boolean;
    position: number;
    optionsJson?: string[] | null;
    fileUrl?: string | null;
    validationJson?: any;
  }[];
}

interface BookingData {
  branchId?: string;
  serviceId?: string;
  staffId?: string;
  date?: string;
  time?: string;
  groupSessionId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  confirmationCode?: string;
  intakeSubmissions?: IntakeSubmissionData[];
}

export function BookingFlow({ business, branches, services, staff, onBookingSuccess, initialStaffId }: BookingFlowProps) {
  const shouldShowBranchSelection = business.showBranches && branches.length > 0;
  
  const [currentStep, setCurrentStep] = useState<BookingStep>(
    shouldShowBranchSelection ? 'branch' : 'service'
  );
  const [bookingData, setBookingData] = useState<BookingData>(
    initialStaffId ? { staffId: initialStaffId } : {}
  );
  const [intakeForms, setIntakeForms] = useState<IntakeFormData[]>([]);
  const [hasIntakeForms, setHasIntakeForms] = useState(false);

  useEffect(() => {
    if (bookingData.serviceId) {
      fetchIntakeForms(bookingData.serviceId);
    } else {
      setIntakeForms([]);
      setHasIntakeForms(false);
    }
  }, [bookingData.serviceId]);

  const fetchIntakeForms = async (serviceId: string) => {
    try {
      const response = await fetch(
        `/api/public/intake-forms?businessId=${business.id}&serviceId=${serviceId}`
      );
      if (response.ok) {
        const data: IntakeFormData[] = await response.json();
        const activeForms = data.filter((f) => f.fields.length > 0);
        setIntakeForms(activeForms);
        setHasIntakeForms(activeForms.length > 0);
      }
    } catch (error) {
      console.error('Failed to fetch intake forms:', error);
      setIntakeForms([]);
      setHasIntakeForms(false);
    }
  };

  const steps: BookingStep[] = [
    ...(shouldShowBranchSelection ? ['branch' as const] : []),
    'service',
    'staff',
    'datetime',
    ...(hasIntakeForms ? ['intake' as const] : []),
    'customer',
    'summary',
  ];

  const currentStepIndex = steps.indexOf(currentStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  if (currentStep === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <SuccessScreen
          business={business}
          bookingData={bookingData}
          branches={branches}
          services={services}
          staff={staff}
          onBookAnother={() => {
            setBookingData({});
            setCurrentStep(shouldShowBranchSelection ? 'branch' : 'service');
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        completedSteps={steps.slice(0, currentStepIndex)}
        primaryColor={business.primaryColor}
        secondaryColor={business.secondaryColor}
      />

      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-5 md:p-7">
        {currentStep === 'branch' && (
          <BranchSelection
            branches={branches}
            selectedBranchId={bookingData.branchId}
            onSelect={(branchId) => {
              updateBookingData({ branchId });
              goToNextStep();
            }}
          />
        )}

        {currentStep === 'service' && (
          <ServiceSelection
            services={services}
            selectedServiceId={bookingData.serviceId}
            onSelect={(serviceId) => {
              updateBookingData({ serviceId });
              goToNextStep();
            }}
            onBack={shouldShowBranchSelection ? goToPreviousStep : undefined}
            currency={business.currency}
          />
        )}

        {currentStep === 'staff' && (
          <StaffSelection
            staff={staff.filter((s) => {
              if (!bookingData.serviceId) return true;
              if (!s.serviceStaff || s.serviceStaff.length === 0) return true;
              return s.serviceStaff.some((ss) => ss.serviceId === bookingData.serviceId);
            })}
            selectedStaffId={bookingData.staffId}
            onSelect={(staffId) => {
              updateBookingData({ staffId });
              goToNextStep();
            }}
            onBack={goToPreviousStep}
            onSkip={() => {
              updateBookingData({ staffId: undefined });
              goToNextStep();
            }}
          />
        )}

        {currentStep === 'datetime' && (
          <DateTimeSelection
            businessId={business.id}
            branchId={bookingData.branchId}
            serviceId={bookingData.serviceId!}
            staffId={bookingData.staffId}
            serviceDurationMin={services.find(s => s.id === bookingData.serviceId)?.durationMin}
            onSelect={(date, time, groupSessionId) => {
              updateBookingData({ date, time, groupSessionId });
              goToNextStep();
            }}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === 'intake' && intakeForms.length > 0 && (
          <IntakeFormStep
            forms={intakeForms}
            onSubmit={(submissions) => {
              updateBookingData({ intakeSubmissions: submissions });
              goToNextStep();
            }}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === 'customer' && (
          <CustomerForm
            initialData={{
              name: bookingData.customerName,
              phone: bookingData.customerPhone,
              email: bookingData.customerEmail,
              notes: bookingData.notes,
            }}
            onSubmit={(data) => {
              updateBookingData({
                customerName: data.name,
                customerPhone: data.phone,
                customerEmail: data.email,
                notes: data.notes,
              });
              goToNextStep();
            }}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === 'summary' && (
          <BookingSummary
            business={business}
            bookingData={bookingData}
            branches={branches}
            services={services}
            staff={staff}
            onConfirm={async () => {
              const response = await fetch('/api/appointments/book', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  businessId: business.id,
                  ...bookingData,
                }),
              });

              if (response.ok) {
                const result = await response.json();

                if (bookingData.intakeSubmissions && bookingData.intakeSubmissions.length > 0) {
                  for (const submission of bookingData.intakeSubmissions) {
                    try {
                      await fetch('/api/intake-form-submissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ...submission,
                          appointmentId: result.appointmentId || result.id,
                        }),
                      });
                    } catch (err) {
                      console.error('Failed to submit intake form:', err);
                    }
                  }
                }

                updateBookingData({ confirmationCode: result.confirmationCode });
                setCurrentStep('success');
                onBookingSuccess?.();
              } else {
                throw new Error('Booking failed');
              }
            }}
            onBack={goToPreviousStep}
          />
        )}
      </div>
    </div>
  );
}
