'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  User, Phone, Building2, MapPin, Link as LinkIcon,
  ArrowRight, ArrowLeft, Check, Clock, Calendar, Users,
  Bell, Loader2, CheckCircle, XCircle
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState<'phone' | 'otp' | 'details' | 'setup'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [setupStep, setSetupStep] = useState(0);

  // Phone / OTP state
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Business details
  const [formData, setFormData] = useState({
    name: '',
    businessSlug: '',
    businessAddress: '',
    city: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    return () => {
      if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
    };
  }, [slugCheckTimeout]);

  // Redirect if already logged in with a business
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const hasBusiness = (session.user as any)?.hasBusiness;
      if (hasBusiness) {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  // --- Phone Step ---
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) {
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

  // --- OTP Step ---
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

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
    if (!pastedData.length) return;

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

      setVerificationToken(data.verificationToken);
      setStep('details');
      toast.success('הטלפון אומת בהצלחה!');
    } catch {
      toast.error('שגיאה באימות קוד');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Business Details ---
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 2 || !/^[a-z0-9-]+$/.test(slug)) {
      setSlugCheckStatus('idle');
      return;
    }

    setSlugCheckStatus('checking');
    try {
      const response = await fetch(`/api/businesses/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();
      if (response.ok) {
        setSlugCheckStatus(data.available ? 'available' : 'taken');
      } else {
        setSlugCheckStatus('idle');
      }
    } catch {
      setSlugCheckStatus('idle');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'businessSlug') {
      const filteredValue = value
        .replace(/[\u0590-\u05FF]/g, '')
        .replace(/[^a-z0-9-]/g, '')
        .toLowerCase();

      setFormData(prev => ({ ...prev, [name]: filteredValue }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

      if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
      const timeout = setTimeout(() => checkSlugAvailability(filteredValue), 500);
      setSlugCheckTimeout(timeout);
      setSlugCheckStatus('idle');
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'city' && !formData.businessSlug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, businessSlug: slug }));
      if (slugCheckTimeout) clearTimeout(slugCheckTimeout);
      const timeout = setTimeout(() => checkSlugAvailability(slug), 500);
      setSlugCheckTimeout(timeout);
    }
  };

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'שם מלא הוא שדה חובה';
    if (!formData.businessSlug.trim()) {
      newErrors.businessSlug = 'כתובת URL היא שדה חובה';
    } else if (!/^[a-z0-9-]+$/.test(formData.businessSlug)) {
      newErrors.businessSlug = 'רק אותיות אנגליות קטנות, מספרים ומקפים';
    } else if (slugCheckStatus === 'taken') {
      newErrors.businessSlug = 'הכתובת תפוסה, אנא בחר כתובת אחרת';
    } else if (slugCheckStatus === 'checking') {
      newErrors.businessSlug = 'בודק זמינות...';
    } else if (slugCheckStatus !== 'available') {
      newErrors.businessSlug = 'אנא המתן לבדיקת זמינות הכתובת';
    }
    if (!formData.businessAddress.trim()) newErrors.businessAddress = 'כתובת העסק היא שדה חובה';
    if (!formData.city.trim()) newErrors.city = 'עיר היא שדה חובה';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;

    setIsLoading(true);
    setStep('setup');

    const setupSteps = [
      { delay: 400 },
      { delay: 900 },
      { delay: 1400 },
      { delay: 1900 },
      { delay: 2400 },
      { delay: 2900 },
      { delay: 3400 },
      { delay: 3900 },
    ];

    setupSteps.forEach((s, index) => {
      setTimeout(() => setSetupStep(index + 1), s.delay);
    });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: normalizedPhone,
          verificationToken,
          businessSlug: formData.businessSlug,
          businessAddress: formData.businessAddress,
          city: formData.city,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהרשמה');
      }

      // Auto sign-in via NextAuth using the returned verification token
      if (data.newVerificationToken) {
        await signIn('credentials', {
          phone: normalizedPhone,
          verificationToken: data.newVerificationToken,
          redirect: false,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 4200));

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בהרשמה');
      setIsLoading(false);
      setStep('details');
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

  // Setup/Loading Screen
  if (step === 'setup') {
    const setupLabels = [
      'מכין לך את הדשבורד...',
      'יוצר סניף ברירת מחדל...',
      'יוצר עובד ברירת מחדל...',
      'יוצר שירות ברירת מחדל...',
      'מגדיר התראות וואטסאפ...',
      'יוצר לקוח לדוגמא...',
      'יוצר תור לדוגמא...',
      'סיימתי!',
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {setupStep < 6 ? (
              <>
                <div className="mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    מגדיר את המערכת שלך...
                  </h1>
                </div>
                <div className="space-y-3 text-right">
                  {setupLabels.slice(0, 5).map((label, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        setupStep > index
                          ? 'bg-green-50 text-green-700'
                          : setupStep === index + 1
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {setupStep > index + 1 ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : setupStep === index + 1 ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <span className="font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-12 h-12 text-green-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    סיימתי!
                  </h1>
                  <p className="text-gray-600">מעביר אותך לדשבורד...</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentProgressStep = step === 'phone' || step === 'otp' ? 1 : 2;

  return (
    <div className="min-h-screen flex overflow-hidden" dir="rtl">
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Logo */}
          <div className="text-center">
            <Link href="/">
              <img src="/assets/logo.png" alt="Clickynder" className="h-14 mb-4 mx-auto" />
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-center">
              {[1, 2].map((s, index) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    s === currentProgressStep
                      ? 'bg-blue-600 text-white scale-110'
                      : s < currentProgressStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s < currentProgressStep ? <Check className="w-6 h-6" /> : s}
                  </div>
                  {index < 1 && (
                    <div className={`w-16 h-1 mx-2 ${currentProgressStep > 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <p className="text-sm text-gray-600">
                {currentProgressStep === 1 ? 'אימות טלפון' : 'פרטי העסק'}
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              הצטרפות לקליקינדר
            </h2>
            <p className="text-gray-600">
              {step === 'phone' && 'הזן את מספר הטלפון שלך לאימות'}
              {step === 'otp' && 'הזן את קוד האימות שנשלח בוואטסאפ'}
              {step === 'details' && 'ספר לנו על העסק שלך'}
            </p>
          </div>

          {/* Step: Phone */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline ml-1" />
                  מספר טלפון
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input text-lg"
                  placeholder="050-1234567"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>שולח קוד...</span>
                  </>
                ) : (
                  <>
                    שלח קוד אימות
                    <ArrowLeft className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 text-center">{normalizedPhone}</p>

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
            </div>
          )}

          {/* Step: Business Details */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline ml-1" />
                  שם מלא *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="ישראל ישראלי"
                  autoFocus
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Business Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LinkIcon className="w-4 h-4 inline ml-1" />
                  כתובת URL לקביעת תורים *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      name="businessSlug"
                      value={formData.businessSlug}
                      onChange={handleChange}
                      className={`form-input w-full pr-10 ${
                        errors.businessSlug
                          ? 'border-red-500'
                          : slugCheckStatus === 'available'
                          ? 'border-green-500'
                          : slugCheckStatus === 'taken'
                          ? 'border-red-500'
                          : ''
                      }`}
                      placeholder="my-business"
                      dir="ltr"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {slugCheckStatus === 'checking' && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {slugCheckStatus === 'available' && (
                        <Check className="w-5 h-5 text-green-500 font-bold" />
                      )}
                      {slugCheckStatus === 'taken' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm whitespace-nowrap">/clickynder.com</span>
                </div>
                {slugCheckStatus === 'available' && !errors.businessSlug && (
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    הכתובת פנויה
                  </p>
                )}
                {slugCheckStatus === 'taken' && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    הכתובת תפוסה
                  </p>
                )}
                {errors.businessSlug && slugCheckStatus !== 'available' && slugCheckStatus !== 'taken' && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessSlug}</p>
                )}
                {!errors.businessSlug && slugCheckStatus !== 'available' && slugCheckStatus !== 'taken' && (
                  <p className="text-xs text-gray-500 mt-1">רק אותיות אנגליות קטנות, מספרים ומקפים</p>
                )}
              </div>

              {/* Business Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline ml-1" />
                  כתובת העסק *
                </label>
                <input
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  className={`form-input ${errors.businessAddress ? 'border-red-500' : ''}`}
                  placeholder="דרך מנחם בגין 23"
                />
                {errors.businessAddress && <p className="text-red-500 text-sm mt-1">{errors.businessAddress}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline ml-1" />
                  עיר *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`form-input ${errors.city ? 'border-red-500' : ''}`}
                  placeholder="תל אביב"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                <p className="text-xs text-gray-500 mt-1">ישמש כשם ברירת המחדל לסניף</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                {isLoading ? 'יוצר חשבון...' : 'צור חשבון'}
                {!isLoading && <Check className="w-5 h-5" />}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              כבר יש לך חשבון?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                התחבר כאן
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Left Side - Slides */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white w-full">
          <div className="max-w-lg w-full space-y-12">
            {/* Slide 1: Phone verification */}
            <div className={`space-y-6 transition-all duration-700 ${currentProgressStep === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute'}`}>
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-4">ניהול זמן אוטומטי</h3>
                <p className="text-blue-100 text-lg leading-relaxed">
                  כל מה שאתה צריך במקום אחד. מערכת תזמון חכמה שמנהלת את כל התורים שלך בקלות.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <Calendar className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">לוח שנה חכם</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">ניהול לקוחות</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <Bell className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">תזכורות אוטומטיות</p>
                </div>
              </div>
            </div>

            {/* Slide 2: Business Features */}
            <div className={`space-y-6 transition-all duration-700 ${currentProgressStep === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute'}`}>
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-4">העסק שלך באינטרנט</h3>
                <p className="text-blue-100 text-lg leading-relaxed">
                  דף הזמנה מותאם אישית, ניהול מלא של עובדים ושירותים, והכל בממשק פשוט ונוח.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <p>דף קביעת תורים מותאם אישית</p>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <p>התראות WhatsApp אוטומטיות</p>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <p>דוחות ותובנות עסקיות</p>
                </div>
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 pt-8">
              {[1, 2].map((dot) => (
                <div
                  key={dot}
                  className={`h-2 rounded-full transition-all ${
                    dot === currentProgressStep ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
