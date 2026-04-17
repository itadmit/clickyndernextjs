'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Edit2, Save, Coffee, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StaffBreak {
  id: string;
  staffId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  title: string | null;
  active: boolean;
}

interface StaffBreaksModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  onSuccess: () => void;
}

const WEEKDAY_NAMES = [
  'ראשון',
  'שני',
  'שלישי',
  'רביעי',
  'חמישי',
  'שישי',
  'שבת',
];

const WEEKDAY_NAMES_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export function StaffBreaksModal({
  isOpen,
  onClose,
  staffId,
  staffName,
  onSuccess,
}: StaffBreaksModalProps) {
  const [breaks, setBreaks] = useState<StaffBreak[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    startTime: '12:00',
    endTime: '13:00',
    title: '',
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBreaks();
    }
  }, [isOpen, staffId]);

  const fetchBreaks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/staff-breaks?staffId=${staffId}`);
      if (response.ok) {
        const data = await response.json();
        setBreaks(data);
      }
    } catch (error) {
      console.error('Failed to fetch breaks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startTime || !formData.endTime) {
      toast.error('נא למלא שעות התחלה וסיום');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('שעת סיום חייבת להיות אחרי שעת התחלה');
      return;
    }

    if (editingId) {
      // Update existing break
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/staff-breaks/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: formData.startTime,
            endTime: formData.endTime,
            title: formData.title || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update break');
        }

        toast.success('ההפסקה עודכנה בהצלחה');
        resetForm();
        fetchBreaks();
        onSuccess();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'אירעה שגיאה');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Create new breaks for selected days
    if (selectedDays.length === 0) {
      toast.error('נא לבחור לפחות יום אחד');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const weekday of selectedDays) {
      try {
        const response = await fetch('/api/staff-breaks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId,
            weekday,
            startTime: formData.startTime,
            endTime: formData.endTime,
            title: formData.title || null,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const error = await response.json();
          console.error(`Failed for day ${weekday}:`, error);
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} הפסקות נוספו בהצלחה`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} הפסקות נכשלו (ייתכן שכבר קיימת הפסקה חופפת)`);
    }

    resetForm();
    fetchBreaks();
    onSuccess();
    setIsSubmitting(false);
  };

  const handleEdit = (breakItem: StaffBreak) => {
    setEditingId(breakItem.id);
    setFormData({
      startTime: breakItem.startTime,
      endTime: breakItem.endTime,
      title: breakItem.title || '',
    });
    setSelectedDays([breakItem.weekday]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הפסקה זו?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/staff-breaks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete break');
      }

      toast.success('ההפסקה נמחקה בהצלחה');
      fetchBreaks();
      onSuccess();
    } catch (error) {
      toast.error('אירעה שגיאה במחיקת ההפסקה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (breakItem: StaffBreak) => {
    try {
      const response = await fetch(`/api/staff-breaks/${breakItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !breakItem.active }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle break');
      }

      toast.success(breakItem.active ? 'ההפסקה הושבתה' : 'ההפסקה הופעלה');
      fetchBreaks();
    } catch (error) {
      toast.error('אירעה שגיאה');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ startTime: '12:00', endTime: '13:00', title: '' });
    setSelectedDays([]);
  };

  const toggleDay = (day: number) => {
    if (editingId) return; // Can't change day while editing
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectAllDays = () => {
    if (editingId) return;
    if (selectedDays.length === 7) {
      setSelectedDays([]);
    } else {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    }
  };

  const selectWorkDays = () => {
    if (editingId) return;
    setSelectedDays([0, 1, 2, 3, 4]); // Sunday to Thursday (Israeli workweek)
  };

  // Group breaks by weekday
  const breaksByDay = breaks.reduce(
    (acc, b) => {
      if (!acc[b.weekday]) acc[b.weekday] = [];
      acc[b.weekday].push(b);
      return acc;
    },
    {} as Record<number, StaffBreak[]>
  );

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600" />
              ניהול הפסקות
            </h2>
            <p className="text-sm text-gray-600 mt-1">{staffName}</p>
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
          <form onSubmit={handleSubmit} className="mb-6 bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="font-semibold mb-3 text-amber-900">
              {editingId ? 'עריכת הפסקה' : 'הוספת הפסקה חדשה'}
            </h3>

            {/* Day Selection */}
            <div className="mb-4">
              <label className="form-label">בחר ימים *</label>
              <div className="flex gap-2 mb-2">
                {WEEKDAY_NAMES_SHORT.map((name, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    disabled={!!editingId}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                      selectedDays.includes(index)
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {!editingId && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectWorkDays}
                    className="text-xs text-amber-700 hover:text-amber-900 underline"
                  >
                    ימי עבודה (א׳-ה׳)
                  </button>
                  <button
                    type="button"
                    onClick={selectAllDays}
                    className="text-xs text-amber-700 hover:text-amber-900 underline"
                  >
                    {selectedDays.length === 7 ? 'נקה הכל' : 'כל הימים'}
                  </button>
                </div>
              )}
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="form-label">שעת התחלה *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">שעת סיום *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Title */}
            <div className="mb-3">
              <label className="form-label">שם (אופציונלי)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="form-input"
                placeholder="הפסקת צהריים, הפסקה..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary bg-amber-600 hover:bg-amber-700"
              >
                {editingId ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>עדכן</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>הוסף הפסקה</span>
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

          {/* Breaks List */}
          <div>
            <h3 className="font-semibold mb-3">הפסקות קיימות</h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-2">טוען...</p>
              </div>
            ) : breaks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Coffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">אין הפסקות מוגדרות</p>
                <p className="text-xs text-gray-400 mt-1">
                  הוסף הפסקות כדי לחסום זמן שלא זמין לתורים
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const dayBreaks = breaksByDay[day];
                  if (!dayBreaks || dayBreaks.length === 0) return null;

                  return (
                    <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="font-medium text-sm">
                          יום {WEEKDAY_NAMES[day]}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {dayBreaks.map((breakItem) => (
                          <div
                            key={breakItem.id}
                            className={`px-4 py-3 flex items-center justify-between ${
                              !breakItem.active ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-amber-600" />
                              <div>
                                <span className="font-medium text-sm">
                                  {breakItem.startTime} - {breakItem.endTime}
                                </span>
                                {breakItem.title && (
                                  <span className="text-sm text-gray-500 mr-2">
                                    ({breakItem.title})
                                  </span>
                                )}
                              </div>
                              {!breakItem.active && (
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                  מושבת
                                </span>
                              )}
                            </div>

                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(breakItem)}
                                disabled={isSubmitting}
                                className={`p-1.5 rounded-lg transition-colors text-xs ${
                                  breakItem.active
                                    ? 'hover:bg-gray-100 text-gray-600'
                                    : 'hover:bg-green-100 text-green-600'
                                }`}
                                title={breakItem.active ? 'השבת' : 'הפעל'}
                              >
                                {breakItem.active ? 'השבת' : 'הפעל'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(breakItem)}
                                disabled={isSubmitting}
                                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                title="ערוך"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(breakItem.id)}
                                disabled={isSubmitting}
                                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                title="מחק"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
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


