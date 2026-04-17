'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'אירעה שגיאה');
        return;
      }

      setIsSent(true);
    } catch {
      toast.error('אירעה שגיאה בשליחת הבקשה');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">הבקשה נשלחה!</h2>
          <p className="text-gray-600 leading-relaxed">
            אם קיים חשבון עם כתובת האימייל <strong>{email}</strong>, נשלח אליך קישור לאיפוס הסיסמה.
          </p>
          <p className="text-sm text-gray-500">
            לא קיבלת מייל? בדוק את תיקיית הספאם או נסה שוב.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => { setIsSent(false); setEmail(''); }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              שלח שוב
            </button>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 animate-fade-in">
        <div className="text-center">
          <Link href="/">
            <img src="/assets/logo.png" alt="Clickinder" className="h-14 mb-4 mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">שכחת סיסמה?</h2>
          <p className="text-gray-600">
            הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              אימייל
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>שולח...</span>
              </div>
            ) : (
              'שלח קישור לאיפוס'
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
}
