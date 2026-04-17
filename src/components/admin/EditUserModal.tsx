'use client';

import { useState } from 'react';
import { X, User as UserIcon, Mail, Phone, Link as LinkIcon, Lock, Building2, Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UserWithBusinesses } from '@/types/admin';

interface EditUserModalProps {
  user: UserWithBusinesses;
  onClose: () => void;
  onSuccess: (updatedUser: UserWithBusinesses) => void;
}

export function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    businessSlug: user.ownedBusinesses[0]?.slug || '',
    packageCode: user.ownedBusinesses[0]?.subscription?.package.code || 'starter',
    resetPassword: false,
    newPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userResponse = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          ...(formData.resetPassword && formData.newPassword && { password: formData.newPassword }),
        }),
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.error || 'Failed to update user');
      }

      if (user.ownedBusinesses[0] && formData.businessSlug !== user.ownedBusinesses[0].slug) {
        const businessResponse = await fetch(`/api/businesses/${user.ownedBusinesses[0].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: formData.businessSlug }),
        });

        if (!businessResponse.ok) {
          const error = await businessResponse.json();
          throw new Error(error.error || 'Failed to update business slug');
        }
      }

      if (
        user.ownedBusinesses[0] &&
        formData.packageCode !== user.ownedBusinesses[0]?.subscription?.package.code
      ) {
        const subscriptionResponse = await fetch(
          `/api/admin/subscriptions/${user.ownedBusinesses[0].id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageCode: formData.packageCode }),
          }
        );

        if (!subscriptionResponse.ok) {
          const error = await subscriptionResponse.json();
          throw new Error(error.error || 'Failed to update subscription');
        }
      }

      toast.success('המשתמש עודכן בהצלחה');

      const refreshedUser = await fetch(`/api/admin/users/${user.id}`).then(res => res.json());
      onSuccess(refreshedUser);
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בעדכון המשתמש');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">עריכת משתמש</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              שם מלא
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all outline-none"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              אימייל
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all outline-none"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              טלפון
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all outline-none"
              placeholder="0501234567"
              dir="ltr"
            />
          </div>

          {user.ownedBusinesses[0] && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  כתובת העסק (Slug)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.businessSlug}
                    onChange={(e) =>
                      setFormData({ ...formData, businessSlug: e.target.value.toLowerCase() })
                    }
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all outline-none"
                    dir="ltr"
                    pattern="[a-z0-9-]+"
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap">/clickynder.com</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  חבילת מנוי
                </label>
                <select
                  value={formData.packageCode}
                  onChange={(e) => setFormData({ ...formData, packageCode: e.target.value as any })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all outline-none"
                >
                  <option value="trial">ניסיון (Trial)</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </>
          )}

          {/* Password Reset */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={formData.resetPassword}
                onChange={(e) =>
                  setFormData({ ...formData, resetPassword: e.target.checked, newPassword: '' })
                }
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                איפוס סיסמה
              </span>
            </label>

            {formData.resetPassword && (
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all outline-none"
                placeholder="סיסמה חדשה (מינימום 6 תווים)"
                minLength={6}
                required={formData.resetPassword}
                dir="ltr"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 transition-all"
              disabled={isSubmitting}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
