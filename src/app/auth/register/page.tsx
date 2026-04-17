'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, 
  Building2, MapPin, Link as LinkIcon, 
  ArrowRight, ArrowLeft, Check,
  Clock, Calendar, Users, Bell, Loader2, CheckCircle, XCircle
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [slugCheckStatus, setSlugCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [phoneCheckTimeout, setPhoneCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [setupStep, setSetupStep] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Step 2
    businessSlug: '',
    businessAddress: '',
    city: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if this is a Google signup completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isComplete = urlParams.get('complete') === 'true';
    
    if (status === 'authenticated' && session) {
      // בדוק אם המשתמש יש לו עסק
      const hasBusiness = (session.user as any)?.hasBusiness;
      
      // אם זה השלמת הרשמה דרך Google (complete=true)
      if (isComplete) {
        // טען את המידע מהמשתמש
        if (session.user?.name) {
          setFormData(prev => ({ ...prev, name: session.user?.name || '' }));
        }
        if (session.user?.email) {
          setFormData(prev => ({ ...prev, email: session.user?.email || '' }));
        }
        // עבור לשלב ביניים (שלב 1.5)
        setStep(1.5);
      } else if (hasBusiness) {
        // אם יש session ויש עסק, הפנה לדשבורד
        router.push('/dashboard');
      } else {
        // אם אין עסק והמשתמש לא ב-complete mode, הפנה להשלמה
        // זה יכול לקרות אם המשתמש הגיע ישירות לדף ההרשמה אחרי התחברות Google
        router.push('/auth/register?complete=true');
      }
    }
  }, [status, session, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
      if (phoneCheckTimeout) {
        clearTimeout(phoneCheckTimeout);
      }
    };
  }, [slugCheckTimeout, emailCheckTimeout, phoneCheckTimeout]);

  // Show loading while checking session
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

  // Don't render if authenticated UNLESS it's Google signup completion (step 1.5)
  if (status === 'authenticated') {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const isComplete = urlParams.get('complete') === 'true';
    // אם זה לא השלמת הרשמה דרך Google, אל תציג את הדף
    if (!isComplete) {
      return null;
    }
    // אם זה שלב 1.5 (השלמת הרשמה), תן לדף להמשיך
  }

  // Check email availability
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailCheckStatus('idle');
      return;
    }

    setEmailCheckStatus('checking');

    try {
      const response = await fetch(`/api/auth/check-availability?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setEmailCheckStatus(data.emailAvailable ? 'available' : 'taken');
        if (!data.emailAvailable) {
          setErrors(prev => ({ ...prev, email: 'משתמש עם אימייל זה כבר קיים' }));
        } else {
          setErrors(prev => {
            const { email, ...rest } = prev;
            return rest;
          });
        }
      } else {
        setEmailCheckStatus('idle');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailCheckStatus('idle');
    }
  };

  // Check phone availability
  const checkPhoneAvailability = async (phone: string) => {
    if (!phone || phone.length < 9) {
      setPhoneCheckStatus('idle');
      return;
    }

    setPhoneCheckStatus('checking');

    try {
      const response = await fetch(`/api/auth/check-availability?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();

      if (response.ok) {
        setPhoneCheckStatus(data.phoneAvailable ? 'available' : 'taken');
        if (!data.phoneAvailable) {
          setErrors(prev => ({ ...prev, phone: 'מספר טלפון זה כבר בשימוש' }));
        } else {
          setErrors(prev => {
            const { phone, ...rest } = prev;
            return rest;
          });
        }
      } else {
        setPhoneCheckStatus('idle');
      }
    } catch (error) {
      console.error('Error checking phone:', error);
      setPhoneCheckStatus('idle');
    }
  };

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugCheckStatus('idle');
      return;
    }

    // Validate format first
    if (!/^[a-z0-9-]+$/.test(slug)) {
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
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugCheckStatus('idle');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Block Hebrew characters in businessSlug
    if (name === 'businessSlug') {
      // Remove Hebrew characters and any non-allowed characters
      const filteredValue = value
        .replace(/[\u0590-\u05FF]/g, '') // Remove Hebrew
        .replace(/[^a-z0-9-]/g, '') // Keep only lowercase English, numbers, and hyphens
        .toLowerCase();
      
      setFormData(prev => ({ ...prev, [name]: filteredValue }));
      
      // Clear error for this field
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }

      // Clear previous timeout
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }

      // Set new timeout for checking
      const timeout = setTimeout(() => {
        checkSlugAvailability(filteredValue);
      }, 500); // Wait 500ms after user stops typing

      setSlugCheckTimeout(timeout);
      setSlugCheckStatus('idle');
      return;
    }

    // Check email availability with debounce
    if (name === 'email') {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }

      // Clear previous timeout
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }

      // Set new timeout for checking
      const timeout = setTimeout(() => {
        checkEmailAvailability(value);
      }, 500);

      setEmailCheckTimeout(timeout);
      setEmailCheckStatus('idle');
      return;
    }

    // Check phone availability with debounce
    if (name === 'phone') {
      // הסרת כל מה שלא ספרות
      const numbersOnly = value.replace(/\D/g, '');
      
      // הגבלה ל-10 ספרות מקסימום
      const limitedValue = numbersOnly.slice(0, 10);
      
      setFormData(prev => ({ ...prev, [name]: limitedValue }));
      
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }

      // Clear previous timeout
      if (phoneCheckTimeout) {
        clearTimeout(phoneCheckTimeout);
      }

      // Set new timeout for checking
      const timeout = setTimeout(() => {
        checkPhoneAvailability(limitedValue);
      }, 500);

      setPhoneCheckTimeout(timeout);
      setPhoneCheckStatus('idle');
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Auto-generate slug from city if empty
    if (name === 'city' && !formData.businessSlug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, businessSlug: slug }));
      
      // Check the auto-generated slug
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }
      const timeout = setTimeout(() => {
        checkSlugAvailability(slug);
      }, 500);
      setSlugCheckTimeout(timeout);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'שם מלא הוא שדה חובה';
    
    // Validate email
    if (!formData.email.trim()) newErrors.email = 'אימייל הוא שדה חובה';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    } else if (emailCheckStatus === 'taken') {
      newErrors.email = 'משתמש עם אימייל זה כבר קיים';
    } else if (emailCheckStatus === 'checking') {
      newErrors.email = 'בודק זמינות...';
    } else if (emailCheckStatus !== 'available') {
      newErrors.email = 'אנא המתן לבדיקת זמינות האימייל';
    }
    
    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'טלפון הוא שדה חובה';
    } else if (formData.phone.length !== 10) {
      newErrors.phone = 'מספר טלפון חייב להכיל בדיוק 10 ספרות';
    } else if (!/^05\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'מספר טלפון לא תקין (חייב להתחיל ב-05)';
    } else if (phoneCheckStatus === 'taken') {
      newErrors.phone = 'מספר טלפון זה כבר בשימוש';
    } else if (phoneCheckStatus === 'checking') {
      newErrors.phone = 'בודק זמינות...';
    } else if (phoneCheckStatus !== 'available') {
      newErrors.phone = 'אנא המתן לבדיקת זמינות הטלפון';
    }
    
    // Validate password only if not a Google user (step 1.5 is Google user)
    if (step !== 1.5) {
      if (!formData.password) newErrors.password = 'סיסמה היא שדה חובה';
      else if (formData.password.length < 6) {
        newErrors.password = 'הסיסמה חייבת להכיל לפחות 6 תווים';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessSlug.trim()) newErrors.businessSlug = 'כתובת URL היא שדה חובה';
    else if (!/^[a-z0-9-]+$/.test(formData.businessSlug)) {
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

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);
    setStep(3);

    // Simulate setup steps with delays
    const setupSteps = [
      { text: 'מכין לך את הדשבורד...', delay: 400 },
      { text: 'יוצר סניף ברירת מחדל...', delay: 900 },
      { text: 'יוצר עובד ברירת מחדל...', delay: 1400 },
      { text: 'יוצר שירות ברירת מחדל...', delay: 1900 },
      { text: 'מגדיר התראות וואטסאפ...', delay: 2400 },
      { text: 'יוצר לקוח לדוגמא...', delay: 2900 },
      { text: 'יוצר תור לדוגמא...', delay: 3400 },
      { text: 'סיימתי! 🎉', delay: 3900 },
    ];

    // Show setup steps
    setupSteps.forEach((step, index) => {
      setTimeout(() => {
        setSetupStep(index + 1);
      }, step.delay);
    });

    try {
      // Check if this is a Google user (no password means Google signup)
      const isGoogleUser = !formData.password && !!session && (session as any)?.user?.email === formData.email;

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          ...(formData.password && { password: formData.password }), // שלח סיסמה רק אם יש
          businessSlug: formData.businessSlug,
          businessAddress: formData.businessAddress,
          city: formData.city,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהרשמה');
      }

      await new Promise(resolve => setTimeout(resolve, 4200));
      
      // Sign in the user automatically (רק אם לא זה משתמש Google)
      if (!isGoogleUser && formData.password) {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
      }

      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Redirect to dashboard regardless - if sign in failed, dashboard will redirect to signin
      // Using window.location.href to force full page reload and session refresh
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (error: any) {
      toast.error(error.message || 'שגיאה בהרשמה');
      setIsLoading(false);
      setStep(2);
    }
  };

  // Step 3: Setup/Loading Screen
  if (step === 3) {
    const setupSteps = [
      'מכין לך את הדשבורד...',
      'יוצר סניף ברירת מחדל...',
      'יוצר עובד ברירת מחדל...',
      'יוצר שירות ברירת מחדל...',
      'מגדיר התראות וואטסאפ...',
      'יוצר לקוח לדוגמא...',
      'יוצר תור לדוגמא...',
      'סיימתי! 🎉'
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
                  {setupSteps.slice(0, 5).map((stepText, index) => (
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
                      <span className="font-medium">{stepText}</span>
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
                    סיימתי! 🎉
                  </h1>
                  <p className="text-gray-600">
                    מעביר אותך לדשבורד...
                  </p>
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
                    (s === step || (step === 1.5 && s === 1))
                      ? 'bg-blue-600 text-white scale-110' 
                      : (s < step || (step === 1.5 && s < 2))
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {(s < step || (step === 1.5 && s === 1)) ? <Check className="w-6 h-6" /> : s}
                  </div>
                  {index < 1 && (
                    <div className={`w-16 h-1 mx-2 ${(s < step || step === 1.5) ? 'bg-green-500' : step === 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <p className="text-sm text-gray-600">
                {step === 1 || step === 1.5 ? 'פרטים אישיים' : 'פרטי העסק'}
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              הצטרפות לקליקינדר
            </h2>
            <p className="text-gray-600">
              {step === 1 || step === 1.5 ? 'צור את החשבון שלך' : 'ספר לנו על העסק'}
            </p>
          </div>

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Step 1.5: Google Signup - Show pre-filled info */}
            {step === 1.5 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 text-center">
                    התחברת עם Google. נא השלם את הפרטים הבאים:
                  </p>
                </div>
                
                {/* Name - Pre-filled and disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline ml-1" />
                    שם מלא
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input bg-gray-50"
                    disabled
                  />
                </div>

                {/* Email - Pre-filled and disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline ml-1" />
                    אימייל
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input bg-gray-50"
                    disabled
                    dir="ltr"
                  />
                </div>

                {/* Phone - Required for Google users */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline ml-1" />
                    טלפון (ישמש להתחברות) *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className={`form-input pr-10 ${
                        errors.phone 
                          ? 'border-red-500' 
                          : phoneCheckStatus === 'available' 
                          ? 'border-green-500' 
                          : phoneCheckStatus === 'taken'
                          ? 'border-red-500'
                          : ''
                      }`}
                      placeholder="0501234567"
                      dir="ltr"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {phoneCheckStatus === 'checking' && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {phoneCheckStatus === 'available' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {phoneCheckStatus === 'taken' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  {phoneCheckStatus === 'available' && !errors.phone && (
                    <p className="text-green-600 text-sm mt-1">✓ הטלפון זמין</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Validate phone before proceeding
                    if (!formData.phone || formData.phone.length < 9) {
                      setErrors(prev => ({ ...prev, phone: 'נא למלא מספר טלפון תקין' }));
                      return;
                    }
                    // Check phone availability
                    if (phoneCheckStatus === 'idle') {
                      checkPhoneAvailability(formData.phone);
                      return;
                    }
                    if (phoneCheckStatus === 'available' || (phoneCheckStatus === 'taken' && !errors.phone)) {
                      setStep(2);
                    }
                  }}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  המשך לשלב 2
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Google Sign Up Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/auth/register?complete=true' })}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium text-gray-700">הרשם עם Google</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">
                      או המשך עם פרטים ידניים
                    </span>
                  </div>
                </div>
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
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline ml-1" />
                    אימייל *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`form-input pr-10 ${
                        errors.email 
                          ? 'border-red-500' 
                          : emailCheckStatus === 'available' 
                          ? 'border-green-500' 
                          : emailCheckStatus === 'taken'
                          ? 'border-red-500'
                          : ''
                      }`}
                      placeholder="example@email.com"
                      dir="ltr"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailCheckStatus === 'checking' && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {emailCheckStatus === 'available' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {emailCheckStatus === 'taken' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  {emailCheckStatus === 'available' && !errors.email && (
                    <p className="text-green-600 text-sm mt-1">✓ האימייל זמין</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline ml-1" />
                    טלפון (ישמש להתחברות) *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className={`form-input pr-10 ${
                        errors.phone 
                          ? 'border-red-500' 
                          : phoneCheckStatus === 'available' 
                          ? 'border-green-500' 
                          : phoneCheckStatus === 'taken'
                          ? 'border-red-500'
                          : ''
                      }`}
                      placeholder="0501234567"
                      dir="ltr"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {phoneCheckStatus === 'checking' && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {phoneCheckStatus === 'available' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {phoneCheckStatus === 'taken' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  {phoneCheckStatus === 'available' && !errors.phone && (
                    <p className="text-green-600 text-sm mt-1">✓ הטלפון זמין</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline ml-1" />
                    סיסמה *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`form-input ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline ml-1" />
                    אימות סיסמה *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  המשך
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 2: Business Info */}
            {step === 2 && (
              <div className="space-y-4">
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
                      {/* Status Icon inside input - right side */}
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
                  
                  {/* Status Messages */}
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

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 btn bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-5 h-5" />
                    חזור
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'יוצר חשבון...' : 'צור חשבון'}
                    {!isLoading && <Check className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
          </form>

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
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white w-full">
          <div className="max-w-lg w-full space-y-12">
            {/* Slide 1: Time Management */}
            <div className={`space-y-6 transition-all duration-700 ${step === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute'}`}>
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
            <div className={`space-y-6 transition-all duration-700 ${step === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute'}`}>
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
                    dot === step ? 'w-8 bg-white' : 'w-2 bg-white/40'
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

