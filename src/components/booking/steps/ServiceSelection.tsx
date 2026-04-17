'use client';

import { Service, ServiceCategory } from '@prisma/client';
import { Clock, ArrowRight, Check, Scissors } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type ServiceWithCategory = Service & {
  category: ServiceCategory | null;
};

interface ServiceSelectionProps {
  services: ServiceWithCategory[];
  selectedServiceId?: string;
  onSelect: (serviceId: string) => void;
  onBack?: () => void;
  currency?: string;
}

export function ServiceSelection({ 
  services, 
  selectedServiceId, 
  onSelect, 
  onBack,
  currency = 'ILS'
}: ServiceSelectionProps) {
  const categorized: Record<string, ServiceWithCategory[]> = {};
  const uncategorized: ServiceWithCategory[] = [];

  services.forEach((service) => {
    if (service.category) {
      if (!categorized[service.category.name]) {
        categorized[service.category.name] = [];
      }
      categorized[service.category.name].push(service);
    } else {
      uncategorized.push(service);
    }
  });

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
          <Scissors className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">בחר שירות</h2>
        <p className="mt-1 text-sm text-gray-400">איזה שירות תרצה לקבל?</p>
      </div>

      <div className="space-y-6">
        {Object.entries(categorized).map(([categoryName, categoryServices]) => (
          <div key={categoryName}>
            <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">{categoryName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedServiceId === service.id}
                  onSelect={() => onSelect(service.id)}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div>
            {Object.keys(categorized).length > 0 && (
              <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">שירותים נוספים</h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uncategorized.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedServiceId === service.id}
                  onSelect={() => onSelect(service.id)}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-6 btn btn-secondary flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה</span>
        </button>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  selected,
  onSelect,
  currency = 'ILS',
}: {
  service: Service;
  selected: boolean;
  onSelect: () => void;
  currency?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        relative flex items-center gap-3 p-4 rounded-xl border text-right transition-all duration-300
        hover:shadow-md hover:border-primary-300
        ${selected
          ? 'border-primary-500 bg-primary-50/80 shadow-sm'
          : 'border-gray-200 bg-white'
        }
      `}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
          selected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
        }`}
      >
        <Scissors className="h-4.5 w-4.5" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-bold transition-colors duration-300 ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
          {service.name}
        </h3>
        {service.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{service.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {service.durationMin} דק׳
          </span>
          {(service.priceCents || 0) > 0 ? (
            <span className="text-xs font-bold text-primary-600">
              {formatPrice(service.priceCents || 0, currency)}
            </span>
          ) : (service.priceCents || 0) === 0 ? (
            <span className="text-xs font-bold text-emerald-500">חינם</span>
          ) : null}
        </div>
      </div>

      {selected && (
        <div className="animate-phone-scale-in">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </div>
      )}
    </button>
  );
}
