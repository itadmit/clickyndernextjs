'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, Eye, EyeOff, Loader2, Wifi, ExternalLink, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function SMTPSettingsSection() {
  const [settings, setSettings] = useState({
    resend_api_key: '',
    resend_from_name: 'Clickynder',
    resend_from_email: 'noreply@clickynder.com',
    hasApiKey: false,
    maskedKey: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/smtp-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resend_api_key: settings.resend_api_key || undefined,
          resend_from_name: settings.resend_from_name,
          resend_from_email: settings.resend_from_email,
        }),
      });

      if (res.ok) {
        toast.success('הגדרות Resend נשמרו בהצלחה!');
        setSettings(prev => ({ ...prev, resend_api_key: '' }));
        await loadSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'שגיאה בשמירת הגדרות');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast.error('שגיאה בשמירת הגדרות');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/smtp-settings', {
        method: 'PUT',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('חיבור ל-Resend הצליח! מייל בדיקה נשלח.');
      } else {
        toast.error(`חיבור נכשל: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing Resend:', error);
      toast.error('שגיאה בבדיקת חיבור');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">Resend</h2>
          <p className="text-sm text-slate-500">שליחת מיילים דרך Resend API</p>
        </div>
        <a
          href="https://resend.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Resend Dashboard
        </a>
      </div>

      <div className="p-6 space-y-5">
        {/* API Key */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            API Key
            {settings.hasApiKey && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                מוגדר ({settings.maskedKey})
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={settings.resend_api_key}
              onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
              className="w-full px-4 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all outline-none"
              placeholder={settings.hasApiKey ? 'השאר ריק כדי לא לשנות' : 'הזן Resend API Key (re_...)'}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* From Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">שם השולח</label>
            <input
              type="text"
              value={settings.resend_from_name}
              onChange={(e) => setSettings({ ...settings, resend_from_name: e.target.value })}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all outline-none"
              placeholder="Clickynder"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">אימייל השולח</label>
            <input
              type="email"
              value={settings.resend_from_email}
              onChange={(e) => setSettings({ ...settings, resend_from_email: e.target.value })}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all outline-none"
              placeholder="noreply@clickynder.com"
              dir="ltr"
            />
          </div>
        </div>

        {/* Help Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong className="text-slate-700">יצירת API Key:</strong>{' '}
            היכנס ל-
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Resend Dashboard
            </a>
            , צור API Key חדש והדבק כאן.
            ודא שהדומיין <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">clickynder.com</code> מאומת ב-Resend.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-blue-600/20"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {saving ? 'שומר...' : 'שמור הגדרות'}
          </button>

          <button
            onClick={handleTest}
            disabled={testing || !settings.hasApiKey}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            {testing ? 'בודק...' : 'בדוק חיבור'}
          </button>
        </div>
      </div>
    </div>
  );
}
