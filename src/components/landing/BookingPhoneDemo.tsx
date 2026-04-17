'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Scissors,
  Calendar,
  Clock,
  Check,
  Sparkles,
  User,
  ChevronLeft,
  CalendarDays,
} from 'lucide-react';

const PAUSE_BEFORE_SELECT = 800;
const PAUSE_AFTER_SELECT = 600;
const PAUSE_BEFORE_TIME = 600;
const PAUSE_AFTER_TIME = 600;
const PAUSE_ON_DONE = 4000;

type Phase =
  | 'idle'
  | 'services'
  | 'service-selected'
  | 'datetime'
  | 'date-selected'
  | 'time-selected'
  | 'transitioning'
  | 'done';

const SERVICES = [
  { id: 'haircut', name: 'תספורת גברים', duration: '30 דק׳', price: '₪80' },
  { id: 'beard', name: 'עיצוב זקן', duration: '20 דק׳', price: '₪50' },
  { id: 'combo', name: 'תספורת + זקן', duration: '45 דק׳', price: '₪120' },
];

function getDays() {
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const now = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return {
      label: i === 0 ? 'היום' : i === 1 ? 'מחר' : `יום ${dayNames[d.getDay()]}`,
      num: d.getDate(),
      month: d.toLocaleDateString('he-IL', { month: 'short' }),
    };
  });
}

const DAYS = getDays();

const TIME_SLOTS = ['10:00', '11:30', '14:00', '16:30'];

const steps = [
  { label: 'שירות', icon: Scissors },
  { label: 'תאריך', icon: Calendar },
  { label: 'מוכן!', icon: Check },
];

function Confetti({ cycle }: { cycle: number }) {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: `${cycle}-${i}`,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.5 + Math.random() * 1.5,
    size: 3 + Math.random() * 4,
    color: ['#0284c7', '#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#d946ef'][
      Math.floor(Math.random() * 6)
    ],
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 40,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-phone-confetti"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        >
          <div
            style={{
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: 1,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[270px] md:w-[290px]">
      <div className="relative rounded-[3rem] border-[6px] border-gray-300/40 bg-gray-100 p-1 shadow-2xl shadow-primary-600/10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white">
          <div className="relative z-20 flex justify-center pt-3 pb-1">
            <div className="h-[22px] w-[90px] rounded-full bg-gray-900" />
          </div>
          <div className="relative min-h-[460px] md:min-h-[490px]">
            {children}
          </div>
          <div className="flex justify-center pb-3 pt-2">
            <div className="h-1 w-28 rounded-full bg-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPhoneDemo() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loopCount, setLoopCount] = useState(0);

  const resetAndReplay = useCallback(() => {
    setSelectedService(null);
    setSelectedDay(null);
    setSelectedTime(null);
    setShowConfetti(false);
    setLoopCount((c) => c + 1);
    setPhase('services');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPhase('services'), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'services') return;
    const t = setTimeout(() => {
      setSelectedService('haircut');
      setPhase('service-selected');
    }, PAUSE_BEFORE_SELECT);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'service-selected') return;
    const t = setTimeout(() => setPhase('datetime'), PAUSE_AFTER_SELECT);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'datetime') return;
    const t = setTimeout(() => {
      setSelectedDay(1);
      setPhase('date-selected');
    }, PAUSE_BEFORE_TIME);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'date-selected') return;
    const t = setTimeout(() => {
      setSelectedTime('14:00');
      setPhase('time-selected');
    }, PAUSE_AFTER_TIME);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'time-selected') return;
    const t1 = setTimeout(() => setPhase('transitioning'), 400);
    const t2 = setTimeout(() => {
      setPhase('done');
      setShowConfetti(true);
    }, 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(resetAndReplay, PAUSE_ON_DONE);
    return () => clearTimeout(t);
  }, [phase, resetAndReplay]);

  const currentStep =
    phase === 'done' || phase === 'transitioning'
      ? 2
      : phase === 'datetime' || phase === 'date-selected' || phase === 'time-selected'
        ? 1
        : 0;

  return (
    <section className="container mx-auto px-4 py-20 md:py-24">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-6 lg:gap-10 max-w-6xl mx-auto">
        {/* Text Side - pushed to the left (closer to phone) with right padding */}
        <div className="text-center md:text-right order-2 md:order-1 md:pr-8 lg:pr-16">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>קביעת תור בשניות</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight">
            ככה הלקוחות שלך
            <br />
            <span className="text-primary-600">קובעים תור.</span>
          </h2>

          <p className="mt-5 text-base md:text-lg leading-relaxed text-gray-500 max-w-lg mx-auto md:mx-0">
            בלי טלפונים, בלי המתנה.
            <br className="hidden md:block" />
            הלקוחות בוחרים שירות, תאריך ושעה — והתור נקבע תוך שניות.
          </p>

          {/* Step indicators */}
          <div className="mt-8 flex items-center justify-center gap-0 md:justify-start">
            {steps.map((s, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ${
                        done
                          ? 'bg-emerald-500 text-white scale-90'
                          : active
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105'
                            : 'bg-gray-100 text-gray-300'
                      }`}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] font-semibold transition-colors duration-500 ${
                        active
                          ? 'text-gray-900'
                          : done
                            ? 'text-emerald-500'
                            : 'text-gray-300'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`mx-2.5 mb-4 h-[2px] w-6 rounded-full transition-all duration-700 ${
                        done ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Phone Side */}
        <div className="flex items-center justify-center order-1 md:order-2">
          <PhoneFrame>
            {/* Header bar inside phone */}
            <div className="bg-primary-600 px-4 py-2.5 flex items-center justify-between">
              <ChevronLeft className="h-4 w-4 text-white/60" />
              <span className="text-[11px] font-bold text-white">מספרת סטייל</span>
              <div className="w-4" />
            </div>

            {/* Phase: Services */}
            <div
              className={`transition-all duration-500 ${
                currentStep === 0
                  ? 'opacity-100 translate-y-0'
                  : 'absolute inset-0 top-[42px] opacity-0 -translate-y-4 pointer-events-none'
              }`}
            >
              <div className="px-4 py-5">
                <div className="text-center mb-5">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                    <Scissors className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">בחר שירות</h3>
                  <p className="mt-1 text-[10px] text-gray-400">
                    איזה שירות תרצה לקבל?
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {SERVICES.map((s) => {
                    const isSelected = selectedService === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-400 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 shadow-sm'
                            : selectedService && !isSelected
                              ? 'border-gray-100 bg-gray-50/50 opacity-50'
                              : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-400 ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Scissors className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-bold transition-colors duration-300 ${
                              isSelected ? 'text-gray-900' : 'text-gray-600'
                            }`}
                          >
                            {s.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {s.duration}
                            </span>
                            <span className="text-[10px] font-semibold text-primary-600">
                              {s.price}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="animate-phone-scale-in">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                              <Check className="h-3 w-3" />
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Phase: DateTime */}
            <div
              className={`transition-all duration-500 ${
                currentStep === 1
                  ? 'opacity-100 translate-y-0'
                  : 'absolute inset-0 top-[42px] opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <div className="px-4 py-5">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    בחר תאריך ושעה
                  </h3>
                  <p className="mt-1 text-[10px] text-gray-400">
                    מתי נוח לך?
                  </p>
                </div>

                {/* Day pills with numbers */}
                <div className="flex gap-1.5 mb-3 justify-center">
                  {DAYS.map((day, i) => {
                    const isSelected = selectedDay === i;
                    return (
                      <div
                        key={i}
                        className={`flex flex-col items-center rounded-lg px-2 py-1.5 min-w-[42px] transition-all duration-400 ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-sm'
                            : selectedDay !== null && !isSelected
                              ? 'bg-gray-50 text-gray-300'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <span className="text-[8px] font-medium leading-tight opacity-80">
                          {day.label}
                        </span>
                        <span className="text-sm font-bold leading-tight">
                          {day.num}
                        </span>
                        <span className="text-[7px] leading-tight opacity-60">
                          {day.month}
                        </span>
                      </div>
                    );
                  })}
                  {/* Calendar button */}
                  <div className="flex flex-col items-center justify-center rounded-lg px-2 py-1.5 min-w-[42px] bg-gray-50 border border-dashed border-gray-200 text-gray-300">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-[7px] mt-0.5">עוד...</span>
                  </div>
                </div>

                {/* Staff mini */}
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100">
                    <User className="h-3.5 w-3.5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-700">דני כהן</p>
                    <p className="text-[9px] text-gray-400">מעצב שיער</p>
                  </div>
                </div>

                {/* Time slots */}
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <div
                        key={time}
                        className={`flex items-center justify-center rounded-lg border p-2.5 transition-all duration-400 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 shadow-sm'
                            : selectedTime && !isSelected
                              ? 'border-gray-100 bg-gray-50/50 opacity-40'
                              : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Clock
                          className={`h-3 w-3 ml-1.5 ${
                            isSelected ? 'text-primary-600' : 'text-gray-300'
                          }`}
                        />
                        <span
                          dir="ltr"
                          className={`text-xs font-bold ${
                            isSelected ? 'text-primary-600' : 'text-gray-500'
                          }`}
                        >
                          {time}
                        </span>
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-600 mr-1 animate-phone-scale-in" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Phase: Done */}
            <div
              className={`transition-all duration-500 ${
                currentStep === 2
                  ? 'opacity-100 scale-100'
                  : 'absolute inset-0 top-[42px] opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="relative px-5 py-8">
                {showConfetti && <Confetti cycle={loopCount} />}
                <div className="relative z-10 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 animate-phone-scale-in items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <h3 className="animate-phone-fade-up text-lg font-black text-gray-900">
                    התור נקבע!
                  </h3>
                  <p
                    className="mt-1.5 animate-phone-fade-up text-[11px] text-gray-400"
                    style={{ animationDelay: '0.15s' }}
                  >
                    תזכורת תישלח בוואטסאפ
                  </p>

                  <div
                    className="mt-5 animate-phone-fade-up rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-right"
                    style={{ animationDelay: '0.3s' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Scissors className="h-3.5 w-3.5 text-primary-600" />
                      <span className="text-[11px] font-bold text-gray-700">
                        תספורת גברים
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-3.5 w-3.5 text-primary-600" />
                      <span className="text-[11px] text-gray-500">
                        מחר, 14:00
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-primary-600" />
                      <span className="text-[11px] text-gray-500">דני כהן</span>
                    </div>
                  </div>

                  <div
                    className="mt-4 animate-phone-fade-up flex items-center justify-center gap-1.5"
                    style={{ animationDelay: '0.45s' }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                    <span className="text-[10px] text-gray-400">
                      מספרת סטייל · רחוב הרצל 25
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress dots */}
            <div className="absolute bottom-8 left-0 right-0">
              <div className="flex items-center justify-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === currentStep
                        ? 'w-5 bg-primary-600'
                        : i < currentStep
                          ? 'w-3 bg-emerald-500'
                          : 'w-1.5 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
