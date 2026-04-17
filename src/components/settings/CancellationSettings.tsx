'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Save, ShieldCheck } from 'lucide-react';

interface CancellationSettingsProps {
  business: {
    id: string;
    cancellationPolicyEnabled?: boolean;
    cancellationDeadlineHours?: number;
    cancellationFeePercentage?: number | null;
    noShowFeePercentage?: number | null;
  };
}

export function CancellationSettings({ business }: CancellationSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cancellationPolicyEnabled: business.cancellationPolicyEnabled || false,
    cancellationDeadlineHours: business.cancellationDeadlineHours || 24,
    cancellationFeePercentage: business.cancellationFeePercentage || 0,
    noShowFeePercentage: business.noShowFeePercentage || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellationPolicyEnabled: formData.cancellationPolicyEnabled,
          cancellationDeadlineHours: formData.cancellationDeadlineHours,
          cancellationFeePercentage: formData.cancellationFeePercentage || null,
          noShowFeePercentage: formData.noShowFeePercentage || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      toast.success('מדיניות ביטול נשמרה');
    } catch {
      toast.error('שגיאה בשמירה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold">מדיניות ביטול</h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cancellationPolicyEnabled}
              onChange={(e) => setFormData((prev) => ({ ...prev, cancellationPolicyEnabled: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium">הפעל מדיניות ביטול</span>
          </label>
        </div>

        {formData.cancellationPolicyEnabled && (
          <>
            <div>
              <label className="form-label">מועד אחרון לביטול (שעות לפני התור)</label>
              <input
                type="number"
                min="1"
                value={formData.cancellationDeadlineHours}
                onChange={(e) => setFormData((prev) => ({ ...prev, cancellationDeadlineHours: parseInt(e.target.value) || 24 }))}
                className="form-input"
              />
              <p className="text-xs text-gray-500 mt-1">ביטול לאחר מועד זה יחויב בעמלה</p>
            </div>

            <div>
              <label className="form-label">עמלת ביטול מאוחר (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.cancellationFeePercentage}
                onChange={(e) => setFormData((prev) => ({ ...prev, cancellationFeePercentage: parseInt(e.target.value) || 0 }))}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">עמלת אי הגעה (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.noShowFeePercentage}
                onChange={(e) => setFormData((prev) => ({ ...prev, noShowFeePercentage: parseInt(e.target.value) || 0 }))}
                className="form-input"
              />
            </div>
          </>
        )}

        <div className="pt-5 border-t border-gray-100">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'שומר...' : 'שמור מדיניות ביטול'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
