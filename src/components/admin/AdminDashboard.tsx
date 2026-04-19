'use client';

import { useState } from 'react';
import { SystemSettings } from '@prisma/client';
import {
  Users,
  Building2,
  Settings,
  Search,
  Edit,
  Trash2,
  Shield,
  MessageSquare,
  LogOut,
  ChevronLeft,
  Send,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Crown,
  TrendingUp,
  Clock,
  MoreVertical,
  Key,
  Hash,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { EditUserModal } from './EditUserModal';
import { SMTPSettingsSection } from './SMTPSettingsSection';
import { toast } from 'react-hot-toast';
import { UserWithBusinesses } from '@/types/admin';

interface AdminDashboardProps {
  users: UserWithBusinesses[];
  systemSettings: SystemSettings[];
}

export function AdminDashboard({ users: initialUsers, systemSettings: initialSettings }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState(initialUsers);
  const [systemSettings, setSystemSettings] = useState(initialSettings);
  const [sendingTest, setSendingTest] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithBusinesses | null>(null);
  const [showToken, setShowToken] = useState(true);

  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const totalBusinesses = users.reduce((acc, u) => acc + u.ownedBusinesses.length, 0);
  const totalAppointments = users.reduce(
    (acc, u) => acc + (u.ownedBusinesses[0]?.appointments?.length || 0),
    0
  );
  const superAdminCount = users.filter((u) => u.isSuperAdmin).length;

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש "${userName}"?\n\nפעולה זו תמחק גם את כל העסקים, התורים והנתונים המשויכים!`)) {
      return;
    }

    const confirmText = prompt(`אנא הקלד את המילה "מחק" כדי לאשר את המחיקה של ${userName}:`);
    if (confirmText !== 'מחק') {
      toast.error('המחיקה בוטלה');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('המשתמש נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה במחיקת המשתמש');
    }
  };

  const handleUpdateSystemSetting = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) throw new Error('Failed to update setting');

      const updatedSetting = await response.json();
      setSystemSettings((prev) => {
        const existing = prev.find((s) => s.key === key);
        if (existing) {
          return prev.map((s) => (s.key === key ? updatedSetting : s));
        } else {
          return [...prev, updatedSetting];
        }
      });

      toast.success('ההגדרה עודכנה בהצלחה');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('שגיאה בעדכון ההגדרה');
    }
  };

  const handleUserUpdated = (updatedUser: UserWithBusinesses) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  };

  const getIBotInstanceId = () => {
    return systemSettings.find((s) => s.key === 'ibot_instance_id')?.value || '';
  };

  const getIBotToken = () => {
    return systemSettings.find((s) => s.key === 'ibot_token')?.value || '';
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('נא להזין מספר טלפון');
      return;
    }

    const instanceId = getIBotInstanceId();
    const apiToken = getIBotToken();

    if (!instanceId || !apiToken) {
      toast.error('נא להזין את פרטי iBot Chat קודם');
      return;
    }

    setSendingTest(true);

    try {
      const response = await fetch('/api/admin/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`הודעה נשלחה בהצלחה ל-${data.normalizedPhone}!`);
        setTestPhone('');
      } else {
        toast.error(data.error || 'שליחה נכשלה');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('שגיאה בשליחת הודעה');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="relative bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Super Admin</h1>
                <p className="text-sm text-slate-400">ניהול מערכת Clickinder</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">v2.2</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-300 hover:text-white transition-all"
                title="התנתק"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">התנתק</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              משתמשים ועסקים
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {users.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'settings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              הגדרות מערכת
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="משתמשים"
                value={users.length}
                icon={<Users className="w-5 h-5" />}
                color="indigo"
              />
              <StatCard
                label="עסקים"
                value={totalBusinesses}
                icon={<Building2 className="w-5 h-5" />}
                color="emerald"
              />
              <StatCard
                label="תורים"
                value={totalAppointments}
                icon={<TrendingUp className="w-5 h-5" />}
                color="amber"
              />
              <StatCard
                label="אדמינים"
                value={superAdminCount}
                icon={<Shield className="w-5 h-5" />}
                color="rose"
              />
            </div>

            {/* Search + Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Search Bar */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="relative max-w-md">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="חיפוש לפי שם או אימייל..."
                    className="w-full pr-10 pl-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        משתמש
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        עסקים
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        חבילה
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                        תורים
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                        התחברות אחרונה
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">
                        פעולות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                          {searchTerm ? 'לא נמצאו תוצאות' : 'אין משתמשים'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                user.isSuperAdmin
                                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                  : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                              }`}>
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900 truncate">
                                    {user.name || 'ללא שם'}
                                  </span>
                                  {user.isSuperAdmin && (
                                    <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{user.email || 'ללא אימייל'}</div>
                                {user.phone && (
                                  <div className="text-xs text-slate-400" dir="ltr">{user.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {user.ownedBusinesses.length > 0 ? (
                              <div className="space-y-1">
                                {user.ownedBusinesses.map((business) => (
                                  <div key={business.id} className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-800">{business.name}</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                      /{business.slug}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            {user.ownedBusinesses[0]?.subscription ? (
                              <div>
                                <div className="text-sm font-medium text-slate-800">
                                  {user.ownedBusinesses[0].subscription.package.name}
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${
                                    user.ownedBusinesses[0].subscription.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : user.ownedBusinesses[0].subscription.status === 'trial'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    user.ownedBusinesses[0].subscription.status === 'active'
                                      ? 'bg-emerald-500'
                                      : user.ownedBusinesses[0].subscription.status === 'trial'
                                      ? 'bg-blue-500'
                                      : 'bg-slate-400'
                                  }`} />
                                  {user.ownedBusinesses[0].subscription.status === 'active'
                                    ? 'פעיל'
                                    : user.ownedBusinesses[0].subscription.status === 'trial'
                                    ? 'ניסיון'
                                    : user.ownedBusinesses[0].subscription.status}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell">
                            <span className="text-sm font-semibold text-slate-800">
                              {user.ownedBusinesses[0]?.appointments?.length || 0}
                            </span>
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell">
                            {user.lastLoginAt ? (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Clock className="w-3.5 h-3.5" />
                                <div>
                                  <span>{new Date(user.lastLoginAt).toLocaleDateString('he-IL')}</span>
                                  <span className="mx-1 text-slate-300">|</span>
                                  <span>
                                    {new Date(user.lastLoginAt).toLocaleTimeString('he-IL', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingUser(user)}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="ערוך משתמש"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name || 'משתמש ללא שם')}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="מחק משתמש"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              {filteredUsers.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-xs text-slate-400">
                    מציג {filteredUsers.length} מתוך {users.length} משתמשים
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            {/* True Story WhatsApp Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">iBot Chat WhatsApp</h2>
                  <p className="text-sm text-slate-500">חיבור לשליחת הודעות WhatsApp Business</p>
                </div>
                <a
                  href="https://ibot-chat.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  דשבורד iBot Chat
                </a>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      Instance ID
                    </label>
                    <input
                      type="text"
                      defaultValue={getIBotInstanceId()}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== getIBotInstanceId()) handleUpdateSystemSetting('ibot_instance_id', val);
                      }}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:bg-white transition-all outline-none"
                      placeholder="Instance ID מ-iBot Chat"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      API Token
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        defaultValue={getIBotToken()}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val !== getIBotToken()) handleUpdateSystemSetting('ibot_token', val);
                        }}
                        className="w-full px-4 py-2.5 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:bg-white transition-all outline-none"
                        placeholder="API Token מ-iBot Chat"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    התחבר לדשבורד iBot Chat וחבר את WhatsApp.
                    לאחר החיבור תראה את ה-Instance ID (שהוא גם ה-Token).
                    פרטים אלה ישמשו לשליחת הודעות WhatsApp לכל הלקוחות במערכת.
                  </p>
                </div>

                {/* Test Message */}
                <div className="pt-5 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-500" />
                    בדיקת חיבור
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="מספר טלפון (לדוגמה: 0542284283)"
                      className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:bg-white transition-all outline-none"
                      dir="ltr"
                    />
                    <button
                      onClick={handleSendTestMessage}
                      disabled={sendingTest || !testPhone.trim()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-emerald-600/20"
                    >
                      {sendingTest ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {sendingTest ? 'שולח...' : 'שלח'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SMTP Settings */}
            <SMTPSettingsSection />

            {/* Other System Settings */}
            {systemSettings.filter(
              (s) => !s.key.startsWith('truestory_') && !s.key.startsWith('rappelsend_') && !s.key.startsWith('ibot_') && !s.key.startsWith('smtp_')
            ).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">הגדרות נוספות</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {systemSettings
                    .filter(
                      (s) => !s.key.startsWith('truestory_') && !s.key.startsWith('rappelsend_') && !s.key.startsWith('ibot_') && !s.key.startsWith('smtp_')
                    )
                    .map((setting) => (
                      <div key={setting.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-800 font-mono">{setting.key}</div>
                          {setting.description && (
                            <div className="text-xs text-slate-500 mt-0.5">{setting.description}</div>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 font-mono bg-slate-50 px-3 py-1 rounded-lg">
                          {setting.value}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleUserUpdated}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
}) {
  const styles = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const iconBg = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
          <p className="text-3xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
