'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, ArrowRight, Clock, Users, CalendarDays } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';

interface GroupSessionData {
  id: string;
  startAt: string;
  endAt: string;
  time: string;
  maxParticipants: number;
  currentCount: number;
  availableSpots: number;
  staff: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  notes: string | null;
}

interface DateTimeSelectionProps {
  businessId: string;
  branchId?: string;
  serviceId: string;
  staffId?: string;
  serviceDurationMin?: number;
  onSelect: (date: string, time: string, groupSessionId?: string) => void;
  onBack: () => void;
  onWaitlist?: () => void;
}

export function DateTimeSelection({
  businessId,
  branchId,
  serviceId,
  staffId,
  serviceDurationMin,
  onSelect,
  onBack,
  onWaitlist,
}: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [groupSessions, setGroupSessions] = useState<GroupSessionData[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hideTodayPill, setHideTodayPill] = useState(false);
  const [checkedToday, setCheckedToday] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const getEndTime = (startTime: string, durationMin: number = 30) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + durationMin;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
  };

  const allDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      dayName: i === 0 ? 'היום' : i === 1 ? 'מחר' : format(date, 'EEEE', { locale: he }),
      dayNum: format(date, 'd'),
      month: format(date, 'MMM', { locale: he }),
      isToday: i === 0,
    };
  });

  const dates = checkedToday
    ? allDates.filter((d) => !(d.isToday && hideTodayPill))
    : allDates;

  const checkTodaySlots = useCallback(async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    try {
      const params = new URLSearchParams({
        businessId,
        serviceId,
        date: todayStr,
        ...(branchId && { branchId }),
        ...(staffId && { staffId }),
      });
      const response = await fetch(`/api/appointments/slots?${params}`);
      if (response.ok) {
        const data = await response.json();
        const hasSlots = (data.slots && data.slots.length > 0) ||
          (data.groupSessions && data.groupSessions.length > 0);
        if (!hasSlots) {
          setHideTodayPill(true);
        }
      } else {
        setHideTodayPill(true);
      }
    } catch {
      // keep today visible on error
    }
    setCheckedToday(true);
  }, [businessId, serviceId, branchId, staffId]);

  useEffect(() => {
    checkTodaySlots();
  }, [checkTodaySlots]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, businessId, serviceId, branchId, staffId]);

  const fetchAvailableSlots = async (date: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        businessId,
        serviceId,
        date,
        ...(branchId && { branchId }),
        ...(staffId && { staffId }),
      });

      const response = await fetch(`/api/appointments/slots?${params}`);
      if (!response.ok) {
        setAvailableSlots([]);
        setGroupSessions([]);
        return;
      }
      const data = await response.json();
      setAvailableSlots(data.slots || []);
      setGroupSessions(data.groupSessions || []);
      setIsGroup(data.isGroup || false);
      setWaitlistEnabled(data.waitlistEnabled || false);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
      setGroupSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (input) {
      input.showPicker?.();
      input.focus();
      input.click();
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedDate(val);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
          <Calendar className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">בחר תאריך ושעה</h2>
        <p className="mt-1 text-sm text-gray-400">מתי נוח לך להגיע?</p>
      </div>

      {/* Date pills */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dates.map((date) => {
            const isSelected = selectedDate === date.value;
            return (
              <button
                key={date.value}
                onClick={() => setSelectedDate(date.value)}
                className={`flex-shrink-0 flex flex-col items-center rounded-xl px-3 py-2.5 min-w-[64px] transition-all duration-300 border ${
                  isSelected
                    ? 'border-primary-500 bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-primary-50/50'
                }`}
              >
                <span className="text-[10px] font-medium opacity-80">{date.dayName}</span>
                <span className="text-lg font-bold leading-tight">{date.dayNum}</span>
                <span className="text-[10px] opacity-60">{date.month}</span>
              </button>
            );
          })}
          {/* Open calendar picker */}
          <div className="relative flex-shrink-0">
            <button
              onClick={openDatePicker}
              className="flex flex-col items-center justify-center rounded-xl px-3 py-2.5 min-w-[64px] h-full border border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all duration-300"
            >
              <CalendarDays className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium">עוד...</span>
            </button>
            <input
              ref={dateInputRef}
              type="date"
              className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
              tabIndex={-1}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={handleDatePickerChange}
            />
          </div>
        </div>
      </div>

      {/* Time / Group Session Selection */}
      {selectedDate && (
        <div className="animate-fade-in">
          <p className="text-xs font-semibold text-gray-400 mb-3 text-center">
            {isGroup ? 'סשנים זמינים' : 'שעות פנויות'}
          </p>

          {isLoading ? (
            <div className="text-center py-10">
              <div className="spinner mx-auto" />
              <p className="text-sm text-gray-400 mt-3">טוען שעות פנויות...</p>
            </div>
          ) : isGroup ? (
            groupSessions.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">אין סשנים זמינים בתאריך זה</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {groupSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onSelect(selectedDate, session.time, session.id)}
                    disabled={session.availableSpots <= 0}
                    className={`w-full p-4 rounded-xl border text-right transition-all duration-300 ${
                      session.availableSpots > 0
                        ? 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                        : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                          <Clock className="w-4 h-4 text-primary-600" />
                        </div>
                        <span className="font-bold text-sm text-gray-900">{session.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className={`text-xs font-medium ${session.availableSpots <= 2 ? 'text-red-500' : 'text-gray-500'}`}>
                          {session.availableSpots > 0
                            ? `${session.availableSpots} מקומות`
                            : 'מלא'}
                        </span>
                      </div>
                    </div>
                    {session.staff && (
                      <p className="text-xs text-gray-400 mt-1.5 mr-10">מדריך/ה: {session.staff.name}</p>
                    )}
                    {session.notes && (
                      <p className="text-[11px] text-gray-300 mt-1 mr-10">{session.notes}</p>
                    )}
                  </button>
                ))}
              </div>
            )
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">אין שעות פנויות בתאריך זה</p>
              {waitlistEnabled && onWaitlist && (
                <button onClick={onWaitlist} className="mt-4 btn btn-primary">
                  הצטרף לרשימת המתנה
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onSelect(selectedDate, slot)}
                  className="flex flex-col items-center justify-center py-2 px-1.5 rounded-lg border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm transition-all duration-300 group"
                >
                  <span className="text-sm font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                    {slot}
                  </span>
                  <span className="text-[10px] text-gray-300 group-hover:text-primary-400 transition-colors mt-0.5">
                    —
                  </span>
                  <span className="text-[11px] text-gray-400 group-hover:text-primary-500 transition-colors">
                    {getEndTime(slot, serviceDurationMin)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onBack}
        className="mt-6 btn btn-secondary flex items-center gap-2"
      >
        <ArrowRight className="w-4 h-4" />
        <span>חזרה</span>
      </button>
    </div>
  );
}
