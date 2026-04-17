'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import {
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  Eye,
} from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  createdAt: string;
  _count?: {
    appointments: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      toast.error('שגיאה בטעינת הלקוחות');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchTerm);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div>
      <DashboardHeader
        title="לקוחות"
        subtitle="נהל את רשימת הלקוחות שלך"
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חפש לפי שם, טלפון או אימייל..."
                className="form-input pr-10"
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'חפש'
              )}
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  fetchCustomers();
                }}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                נקה
              </button>
            )}
          </form>
        </div>

        {/* Customers List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-12 w-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 px-5">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600 mb-1">
                {searchTerm ? 'לא נמצאו לקוחות' : 'עדיין אין לקוחות'}
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? 'נסה לחפש עם מילות חיפוש אחרות'
                  : 'לקוחות יופיעו כאן לאחר שיקבעו תור'}
              </p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-sm text-gray-500">
                  {customers.length} לקוחות נמצאו
                </p>
              </div>

              {/* Mobile View - Cards */}
              <div className="block md:hidden divide-y divide-gray-100">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => (window.location.href = `/dashboard/customers/${customer.id}`)}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    </div>
                    <span className="badge badge-info flex-shrink-0">
                      {customer._count?.appointments || 0} תורים
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">לקוח</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">טלפון</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">אימייל</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">תורים</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">הצטרפות</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                          <a href={`tel:${customer.phone}`} className="hover:text-primary-600">{customer.phone}</a>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                          {customer.email ? (
                            <a href={`mailto:${customer.email}`} className="hover:text-primary-600">{customer.email}</a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="badge badge-info">{customer._count?.appointments || 0}</span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            onClick={() => (window.location.href = `/dashboard/customers/${customer.id}`)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            צפה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

