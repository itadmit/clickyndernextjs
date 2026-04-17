'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Edit2, Save, Calendar, Clock, Palmtree, ThermometerSun, User, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate } from 'date-fns';
import { he } from 'date-fns/locale';

interface TimeOff {
  id: string;
  scope: 'staff' | 'branch' | 'business';
  type: 'holiday' | 'vacation' | 'personal' | 'sick' | 'other';
  staffId?: string;
  branchId?: string;
  startAt: string;
  endAt: string;
  reason?: string;
  isRecurring: boolean;
  isAllDay: boolean;
  staff?: { id: string; name: string };
  branch?: { id: string; name: string };
}

interface TimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  staffId?: string;
  staffName?: string;
  branchId?: string;
  branchName?: string;
  scope?: 'staff' | 'branch' | 'business';
  onSuccess: () => void;
}

const TIME_OFF_TYPES = [
  { value: 'vacation', label: 'חופשה', icon: Palmtree, color: 'text-blue-600 bg-blue-50' },
  { value: 'holiday', label: 'חג', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  { value: 'sick', label: 'מחלה', icon: ThermometerSun, color: 'text-red-600 bg-red-50' },
  { value: 'personal', label: 'אישי', icon: User, color: 'text-green-600 bg-green-50' },
  { value: 'other', label: 'אחר', icon: HelpCircle, color: 'text-gray-600 bg-gray-50' },
];

const TYPE_LABELS: Record<string, string> = {
  vacation: 'חופשה',
  holiday: 'חג',
  sick: 'מחלה',
  personal: 'אישי',
  other: 'אחר',
};

const TYPE_COLORS: Record<string, string> = {
  vacation: 'bg-blue-100 text-blue-700',
  holiday: 'bg-purple-100 text-purple-700',
  sick: 'bg-red-100 text-red-700',
  personal: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export function TimeOffModal({
  isOpen,
  onClose,
  businessId,
  staffId,
  staffName,
  branchId,
  branchName,
  scope = 'staff',
  onSuccess,
}: TimeOffModalProps) {
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    startAt: '',
    endAt: '',
    reason: '',
    type: scope === 'business' ? 'holiday' : 'vacation',
    isRecurring: false,
    isAllDay: true,
    startTime: '09:00',
    endTime: '17:00',
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTimeOffs();
    }
  }, [isOpen, staffId, branchId]);

  const fetchTimeOffs = async () => {
    setIsLoading(true);
    try {
      let url = `/api/time-off?businessId=${businessId}`;
      if (staffId) url += `&staffId=${staffId}`;
      if (branchId) url += `&branchId=${branchId}`;
      if (scope === 'business') url += `&scope=business`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTimeOffs(data);
      }
    } catch (error) {
      console.error('Failed to fetch time-offs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startAt) {
      toast.error('נא למלא תאריך התחלה');
      return;
    }

    if (!formData.endAt) {
      // If no end date, use start date (single day off)
      setFormData((prev) => ({ ...prev, endAt: prev.startAt }));
    }

    const endAt = formData.endAt || formData.startAt;

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/time-off/${editingId}` : '/api/time-off';
      const method = editingId ? 'PUT' : 'POST';

      let startAtValue = formData.startAt;
      let endAtValue = endAt;

      // If not all day, append time
      if (!formData.isAllDay) {
        startAtValue = `${formData.startAt}T${formData.startTime}:00`;
        endAtValue = `${endAt}T${formData.endTime}:00`;
      }

      const payload: any = {
        startAt: startAtValue,
        endAt: endAtValue,
        reason: formData.reason || null,
        type: formData.type,
        isRecurring: formData.isRecurring,
        isAllDay: formData.isAllDay,
      };

      if (!editingId) {
        payload.businessId = businessId;
        payload.scope = scope;
        if (scope === 'staff') payload.staffId = staffId;
        if (scope === 'branch') payload.branchId = branchId;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save time-off');
      }

      toast.success(editingId ? 'עודכן בהצלחה' : 'נוסף בהצלחה');
      resetForm();
      fetchTimeOffs();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'אירעה שגיאה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (timeOff: TimeOff) => {
    setEditingId(timeOff.id);
    const startDate = timeOff.startAt.split('T')[0];
    const endDate = timeOff.endAt.split('T')[0];
    
    setFormData({
      startAt: startDate,
      endAt: endDate,
      reason: timeOff.reason || '',
      type: timeOff.type || 'vacation',
      isRecurring: timeOff.isRecurring || false,
      isAllDay: timeOff.isAllDay !== false,
      startTime: timeOff.isAllDay === false ? timeOff.startAt.split('T')[1]?.substring(0, 5) || '09:00' : '09:00',
      endTime: timeOff.isAllDay === false ? timeOff.endAt.split('T')[1]?.substring(0, 5) || '17:00' : '17:00',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/time-off/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete time-off');
      }

      toast.success('נמחק בהצלחה');
      fetchTimeOffs();
      onSuccess();
    } catch (error) {
      toast.error('אירעה שגיאה במחיקה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      startAt: '',
      endAt: '',
      reason: '',
      type: scope === 'business' ? 'holiday' : 'vacation',
      isRecurring: false,
      isAllDay: true,
      startTime: '09:00',
      endTime: '17:00',
    });
  };

  const getTitle = () => {
    if (scope === 'branch') return `חופשים - ${branchName || 'סניף'}`;
    if (scope === 'business') return 'חגים וימים לא עובדים';
    return `חופשים - ${staffName || 'עובד'}`;
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold">{getTitle()}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {scope === 'business'
                ? 'חגים שבהם העסק סגור'
                : scope === 'branch'
                ? 'ימים שבהם הסניף סגור'
                : 'ימי חופשה והיעדרות'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add/Edit Form */}
          <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">
              {editingId ? 'עריכה' : 'הוספה'}
            </h3>

            {/* Type Selection */}
            <div className="mb-4">
              <label className="form-label">סוג *</label>
              <div className="flex gap-2 flex-wrap">
                {TIME_OFF_TYPES.map((typeOption) => {
                  const Icon = typeOption.icon;
                  return (
                    <button
                      key={typeOption.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: typeOption.value }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        formData.type === typeOption.value
                          ? `${typeOption.color} border-current shadow-sm`
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {typeOption.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="form-label">
                  {formData.startAt === formData.endAt || !formData.endAt ? 'תאריך *' : 'מתאריך *'}
                </label>
                <input
                  type="date"
                  value={formData.startAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startAt: e.target.value }))
                  }
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="form-label">עד תאריך</label>
                <input
                  type="date"
                  value={formData.endAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endAt: e.target.value }))
                  }
                  className="form-input"
                  min={formData.startAt}
                  placeholder="השאר ריק ליום אחד"
                />
                <p className="text-xs text-gray-400 mt-1">השאר ריק ליום בודד</p>
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAllDay}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isAllDay: e.target.checked }))
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium">כל היום</span>
              </label>
            </div>

            {/* Time Selection (if not all day) */}
            {!formData.isAllDay && (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="form-label">משעה</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">עד שעה</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="mb-3">
              <label className="form-label">סיבה / תיאור (אופציונלי)</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="form-input"
                placeholder={
                  formData.type === 'holiday'
                    ? 'יום כיפור, פסח...'
                    : formData.type === 'sick'
                    ? 'מחלה...'
                    : 'סיבה...'
                }
              />
            </div>

            {/* Recurring */}
            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isRecurring: e.target.checked }))
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium">חוזר כל שנה</span>
                  <p className="text-xs text-gray-500">לחגים שחוזרים באותו תאריך</p>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {editingId ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>עדכן</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>הוסף</span>
                  </>
                )}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  ביטול
                </button>
              )}
            </div>
          </form>

          {/* Time Offs List */}
          <div>
            <h3 className="font-semibold mb-3">
              {scope === 'business' ? 'חגים קיימים' : 'חופשים קיימים'}
            </h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-2">טוען...</p>
              </div>
            ) : timeOffs.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {scope === 'business' ? 'לא הוגדרו חגים עדיין' : 'אין חופשים מתוכננים'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeOffs.map((timeOff) => {
                  const isPast = new Date(timeOff.endAt) < new Date();
                  const isCurrent =
                    new Date(timeOff.startAt) <= new Date() &&
                    new Date(timeOff.endAt) >= new Date();
                  const isSameDay = timeOff.startAt.split('T')[0] === timeOff.endAt.split('T')[0];

                  return (
                    <div
                      key={timeOff.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrent
                          ? 'border-orange-300 bg-orange-50'
                          : isPast
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {/* Type Badge */}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[timeOff.type] || TYPE_COLORS.other}`}>
                              {TYPE_LABELS[timeOff.type] || timeOff.type}
                            </span>

                            {/* Date */}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                              <span className="font-medium text-sm">
                                {isSameDay ? (
                                  formatDate(new Date(timeOff.startAt), 'dd/MM/yyyy', { locale: he })
                                ) : (
                                  <>
                                    {formatDate(new Date(timeOff.startAt), 'dd/MM/yyyy', { locale: he })}
                                    {' - '}
                                    {formatDate(new Date(timeOff.endAt), 'dd/MM/yyyy', { locale: he })}
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Time if not all day */}
                            {!timeOff.isAllDay && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                <span className="text-xs text-gray-600">
                                  {timeOff.startAt.split('T')[1]?.substring(0, 5)} - {timeOff.endAt.split('T')[1]?.substring(0, 5)}
                                </span>
                              </div>
                            )}

                            {/* Status Badges */}
                            {timeOff.isRecurring && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                חוזר
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                                פעיל כעת
                              </span>
                            )}
                            {isPast && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                הסתיים
                              </span>
                            )}
                          </div>
                          
                          {timeOff.reason && (
                            <p className="text-sm text-gray-600">{timeOff.reason}</p>
                          )}

                          {/* Show staff/branch info if relevant */}
                          {timeOff.staff && scope !== 'staff' && (
                            <p className="text-xs text-gray-500 mt-1">עובד: {timeOff.staff.name}</p>
                          )}
                          {timeOff.branch && scope !== 'branch' && (
                            <p className="text-xs text-gray-500 mt-1">סניף: {timeOff.branch.name}</p>
                          )}
                        </div>

                        {!isPast && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(timeOff)}
                              disabled={isSubmitting}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                              title="ערוך"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(timeOff.id)}
                              disabled={isSubmitting}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="מחק"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn bg-gray-600 text-white hover:bg-gray-700 w-full"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
