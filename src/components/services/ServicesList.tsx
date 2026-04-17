'use client';

import { useState } from 'react';
import { Service, ServiceCategory, Staff, ServiceStaff } from '@prisma/client';
import { Edit, Trash2, Eye, EyeOff, Plus, Scissors, FolderOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { CategoryModal } from './CategoryModal';

type ServiceWithRelations = Service & {
  category: ServiceCategory | null;
  serviceStaff: (ServiceStaff & { staff: Staff })[];
};

interface ServicesListProps {
  services: ServiceWithRelations[];
  categories: ServiceCategory[];
  businessId: string;
  currency?: string;
}

export function ServicesList({ services, categories: initialCategories, businessId, currency = 'ILS' }: ServicesListProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCategories);

  const filteredServices = services.filter((service) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'uncategorized') return !service.categoryId;
    return service.categoryId === selectedCategory;
  });

  const handleToggleActive = async (serviceId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service');
      }

      toast.success(currentActive ? 'השירות הושבת' : 'השירות הופעל');
      router.refresh();
    } catch (error) {
      toast.error('אירעה שגיאה');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שירות זה?')) {
      return;
    }

    setIsDeleting(serviceId);
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      toast.success('השירות נמחק בהצלחה');
      router.refresh();
    } catch (error) {
      toast.error('אירעה שגיאה במחיקת השירות');
    } finally {
      setIsDeleting(null);
    }
  };

  const refreshCategories = async () => {
    try {
      const response = await fetch(`/api/service-categories?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  };

  const handleCategoryUpdated = () => {
    refreshCategories();
    router.refresh();
  };

  return (
    <div>
      {/* Category Filter */}
      <div className="flex gap-1.5 flex-wrap items-center bg-white border border-gray-200 rounded-xl p-1.5 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          הכל ({services.length})
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {category.name}
          </button>
        ))}
        <button
          onClick={() => setSelectedCategory('uncategorized')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === 'uncategorized'
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          ללא קטגוריה
        </button>
        
        {/* Manage Categories Button */}
        <div className="mr-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all font-medium flex items-center gap-1.5"
            title="יצירה, עריכה ומחיקה של קטגוריות שירותים"
          >
            <FolderOpen className="w-4 h-4" />
            <span>נהל קטגוריות</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {services.length === 0 ? 'אין עדיין שירותים' : 'אין שירותים בקטגוריה זו'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {services.length === 0 
                ? 'הוסף את השירות הראשון שלך כדי להתחיל לקבל תורים'
                : 'נסה לבחור קטגוריה אחרת או הוסף שירות חדש'
              }
            </p>
            {services.length === 0 && (
              <Link
                href="/dashboard/services/new"
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף שירות ראשון</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="block md:hidden space-y-2">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white border border-gray-200 rounded-xl p-4 ${!service.active && 'opacity-50'}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {service.color && (
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: service.color }} />
                      )}
                      <h3 className="font-medium text-sm text-gray-900 truncate">{service.name}</h3>
                    </div>
                    {service.category && (
                      <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{service.category.name}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/services/${service.id}/edit`} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit className="w-3.5 h-3.5 text-gray-400" />
                    </Link>
                    <button onClick={() => handleToggleActive(service.id, service.active)} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                      {service.active ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{service.durationMin} דק'</span>
                  {service.priceCents !== null && (
                    <span className="font-medium text-gray-900">{formatPrice(service.priceCents, currency)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all ${!service.active && 'opacity-50'}`}
              >
                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                    {service.category && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-xs bg-gray-50 text-gray-500 rounded-full">{service.category.name}</span>
                    )}
                  </div>
                  {service.color && (
                    <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: service.color }} />
                  )}
                </div>

                {/* Service Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">משך:</span>
                    <span className="font-medium text-gray-900">{service.durationMin} דקות</span>
                  </div>
                  {service.priceCents !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">מחיר:</span>
                      <span className="font-medium text-gray-900">{formatPrice(service.priceCents, currency)}</span>
                    </div>
                  )}
                  {service.bufferAfterMin > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">מרווח לאחר:</span>
                      <span className="font-medium text-gray-900">{service.bufferAfterMin} דקות</span>
                    </div>
                  )}
                </div>

                {/* Assigned Staff */}
                {service.serviceStaff.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1.5">עובדים משויכים:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.serviceStaff.map(({ staff }) => (
                        <span key={staff.id} className="inline-block px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded-full">{staff.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {service.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{service.description}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/dashboard/services/${service.id}/edit`)}
                    className="btn btn-secondary flex-1"
                    title="עריכת פרטי השירות"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>עריכה</span>
                  </button>
                  <button
                    onClick={() => handleToggleActive(service.id, service.active)}
                    className="btn btn-secondary px-2.5"
                    data-tooltip={service.active ? 'השבתת השירות' : 'הפעלת השירות'}
                  >
                    {service.active ? <Eye className="w-3.5 h-3.5 pointer-events-none" /> : <EyeOff className="w-3.5 h-3.5 pointer-events-none" />}
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    disabled={isDeleting === service.id}
                    className="btn btn-danger px-2.5"
                    data-tooltip="מחיקת השירות לצמיתות"
                  >
                    <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Category Management Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        businessId={businessId}
        categories={categories}
        onCategoryCreated={handleCategoryUpdated}
      />
    </div>
  );
}

