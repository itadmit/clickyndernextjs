'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User, Mail, Phone, Calendar, LogOut, Save, Trash2, AlertTriangle, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface ProfileSettingsProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: Date;
  };
  hasPassword: boolean;
}

export function ProfileSettings({ user, hasPassword }: ProfileSettingsProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage({ type: 'success', text: 'הפרטים עודכנו בהצלחה' });
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'אירעה שגיאה בעדכון הפרטים' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validate
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'הסיסמאות אינן תואמות' });
      return;
    }

    if (hasPassword && !passwordData.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'נא להזין את הסיסמה הנוכחית' });
      return;
    }

    setIsPasswordLoading(true);

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword || undefined,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordMessage({ type: 'success', text: data.message || 'הסיסמה עודכנה בהצלחה' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      router.refresh();
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'אירעה שגיאה בעדכון הסיסמה',
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleResetData = async () => {
    if (!confirm('⚠️ אזהרה!\n\nפעולה זו תמחק את כל הנתונים שלך לצמיתות:\n- תורים\n- לקוחות\n- שירותים\n- עובדים\n- סניפים\n\nלאחר המחיקה המערכת תאפס למצב התחלתי.\n\nהאם אתה בטוח שברצונך להמשיך?')) {
      return;
    }

    if (!confirm('האם אתה באמת בטוח? פעולה זו לא ניתנת לביטול!')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/profile/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset data');
      }

      setMessage({ type: 'success', text: 'כל הנתונים נמחקו בהצלחה. מפנה מחדש...' });
      
      setTimeout(async () => {
        await signOut({ callbackUrl: '/auth/signin' });
      }, 2000);
    } catch (error) {
      console.error('Error resetting data:', error);
      setMessage({ type: 'error', text: 'אירעה שגיאה במחיקת הנתונים' });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            פרטים אישיים
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="form-label">
              שם מלא
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="form-input !pr-10"
                required
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="form-label">
              אימייל
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                id="email"
                value={user.email || ''}
                className="form-input !pr-10 bg-gray-50 cursor-not-allowed text-gray-500"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">לא ניתן לשנות את כתובת האימייל</p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="form-label">
              טלפון
            </label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="form-input !pr-10"
                placeholder="050-1234567"
              />
            </div>
          </div>

          {/* Member Since */}
          <div>
            <label className="form-label">חבר מאז</label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={new Date(user.createdAt).toLocaleDateString('he-IL')}
                className="form-input !pr-10 bg-gray-50 cursor-not-allowed text-gray-500"
                disabled
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              className="btn btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>שומר...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>שמור שינויים</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary flex-1"
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4" />
              <span>התנתק</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-500" />
            {hasPassword ? 'שינוי סיסמה' : 'הגדרת סיסמה'}
          </h2>
        </div>

        <form onSubmit={handlePasswordChange} className="p-5 space-y-5">
          {/* Current Password - only if user already has one */}
          {hasPassword && (
            <div>
              <label htmlFor="currentPassword" className="form-label">
                סיסמה נוכחית
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  className="form-input !pr-10 !pl-10"
                  placeholder="הזן סיסמה נוכחית"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="form-label">
              סיסמה חדשה
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                className="form-input !pr-10 !pl-10"
                placeholder="לפחות 6 תווים"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">מינימום 6 תווים</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="form-label">
              אימות סיסמה חדשה
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="form-input !pr-10 !pl-10"
                placeholder="הזן שוב את הסיסמה החדשה"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">הסיסמאות אינן תואמות</p>
            )}
          </div>

          {/* Password Message */}
          {passwordMessage && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPasswordLoading || (passwordData.newPassword !== passwordData.confirmPassword)}
          >
            {isPasswordLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>מעדכן...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>{hasPassword ? 'שנה סיסמה' : 'הגדר סיסמה'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200">
        <div className="px-5 py-4 border-b border-red-100 bg-red-50 rounded-t-xl">
          <h2 className="font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            אזור מסוכן
          </h2>
        </div>
        <div className="p-5">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-1">
              מחק את כל התוכן ואפס למצב התחלתי
            </p>
            <p className="text-sm text-gray-500">
              פעולה זו תמחק לצמיתות את כל הנתונים: תורים, לקוחות, שירותים, עובדים וסניפים.
              המערכת תחזור למצב התחלתי כאילו נרשמת עכשיו.
            </p>
          </div>
          <button
            onClick={handleResetData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
            <span>מחק את כל הנתונים</span>
          </button>
        </div>
      </div>
    </div>
  );
}
