'use client';

import { useState } from 'react';
import { ArrowRight, UserCircle, Phone, Mail, MessageSquare, ArrowLeft } from 'lucide-react';

interface CustomerFormProps {
  initialData?: {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
  };
  onSubmit: (data: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
  }) => void;
  onBack: () => void;
}

export function CustomerForm({ initialData, onSubmit, onBack }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    notes: initialData?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
          <UserCircle className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">פרטים אישיים</h2>
        <p className="mt-1 text-sm text-gray-400">איך נוכל ליצור איתך קשר?</p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-gray-500 mb-1.5">
            שם מלא *
          </label>
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <UserCircle className="w-4 h-4 text-gray-400" />
            </div>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              placeholder="שם פרטי ומשפחה"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-gray-500 mb-1.5">
            טלפון *
          </label>
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Phone className="w-4 h-4 text-gray-400" />
            </div>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              placeholder="050-1234567"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-500 mb-1.5">
            אימייל (אופציונלי)
          </label>
          <div className="relative">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-semibold text-gray-500 mb-1.5">
            הערות (אופציונלי)
          </label>
          <div className="relative">
            <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </div>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              rows={3}
              placeholder="יש משהו שחשוב לנו לדעת?"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה</span>
        </button>
        <button type="submit" className="btn btn-primary flex-1 flex items-center justify-center gap-2">
          <span>המשך לסיכום</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
