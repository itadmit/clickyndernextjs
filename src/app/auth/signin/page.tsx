'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Phone, Calendar, Users, Clock, ArrowRight } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const hasBusiness = (session.user as any)?.hasBusiness;
      if (hasBusiness === false) {
        router.push('/auth/register?complete=true');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!phone || phone.replace(/\D/g, '').length < 9) {
      toast.error('נא להזין מספר טלפון תקין');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'שגיאה בשליחת קוד');
        return;
      }

      setNormalizedPhone(data.phone);
      setStep('otp');
      setCountdown(60);
      toast.success('קוד אימות נשלח בוואטסאפ');

      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      toast.error('שגיאה בשליחת קוד');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    const fullCode = newOtp.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    if (pastedData.length === 6) {
      handleVerifyOtp(pastedData);
    } else {
      otpRefs.current[pastedData.length]?.focus();
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'קוד שגוי');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      // Sign in via NextAuth with the verification token
      const result = await signIn('credentials', {
        phone: normalizedPhone,
        verificationToken: data.verificationToken,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success('התחברת בהצלחה!');
      window.location.href = '/dashboard';
    } catch {
      toast.error('שגיאה באימות קוד');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex overflow-hidden" dir="rtl">
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center">
            <Link href="/">
              <img src="/assets/logo.png" alt="Clickinder" className="h-14 mb-4 mx-auto" />
            </Link>
          </div>

          {step === 'phone' ? (
            <>
              {/* Header */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  התחבר לחשבון שלך
                </h2>
                <p className="text-gray-600">
                  הזן את מספר הטלפון שלך ונשלח לך קוד אימות בוואטסאפ
                </p>
              </div>

              {/* Phone Form */}
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    מספר טלפון
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                      placeholder="050-1234567"
                      required
                      disabled={isLoading}
                      autoFocus
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
                      <span>שולח קוד...</span>
                    </div>
                  ) : (
                    'שלח קוד אימות'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* OTP Step */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  הזן קוד אימות
                </h2>
                <p className="text-gray-600">
                  שלחנו קוד בן 6 ספרות לוואטסאפ שלך
                </p>
                <p className="text-sm text-gray-500 mt-1">{normalizedPhone}</p>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center gap-3" dir="ltr">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {/* Resend / Back */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  <ArrowRight className="w-4 h-4" />
                  שינוי מספר
                </button>

                {countdown > 0 ? (
                  <span className="text-sm text-gray-500">
                    שליחה חוזרת בעוד {countdown} שניות
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    disabled={isLoading}
                  >
                    שלח קוד שוב
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>מאמת...</span>
                </div>
              )}
            </>
          )}

          {/* Sign Up Link */}
          <div className="text-center pt-4">
            <span className="text-gray-600">עדיין אין לך חשבון? </span>
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              צור חשבון
            </Link>
          </div>
        </div>
      </div>

      {/* Left Side - Feature Display */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg text-white space-y-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-4xl font-bold mb-4">
              התחבר לכל האפליקציות.
            </h2>
            <p className="text-xl text-blue-100">
              כל מה שאתה צריך בממשק אחד מותאם אישית וקל לשימוש.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Calendar className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">ניהול תורים חכם</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Users className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">ניהול לקוחות</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Clock className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">תזמון אוטומטי</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 pt-4">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <div className="w-3 h-3 rounded-full bg-white/40"></div>
            <div className="w-3 h-3 rounded-full bg-white/40"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
