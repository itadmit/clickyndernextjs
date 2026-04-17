'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Save, CreditCard } from 'lucide-react';

interface PaymentSettingsProps {
  business: {
    id: string;
    paymentProvider?: string | null;
    paymeSellerPaymeId?: string | null;
    paymeApiKey?: string | null;
    depositEnabled?: boolean;
    depositAmountCents?: number | null;
    depositPercentage?: number | null;
    requirePaymentForBooking?: boolean;
  };
}

export function PaymentSettings({ business }: PaymentSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    paymeSellerPaymeId: business.paymeSellerPaymeId || '',
    paymeApiKey: business.paymeApiKey || '',
    depositEnabled: business.depositEnabled || false,
    depositAmountCents: business.depositAmountCents ? business.depositAmountCents / 100 : 0,
    depositPercentage: business.depositPercentage || 0,
    requirePaymentForBooking: business.requirePaymentForBooking || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentProvider: 'quickpayments',
          paymeSellerPaymeId: formData.paymeSellerPaymeId || null,
          paymeApiKey: formData.paymeApiKey || null,
          depositEnabled: formData.depositEnabled,
          depositAmountCents: formData.depositAmountCents > 0 ? Math.round(formData.depositAmountCents * 100) : null,
          depositPercentage: formData.depositPercentage > 0 ? formData.depositPercentage : null,
          requirePaymentForBooking: formData.requirePaymentForBooking,
          onlinePaymentEnabled: !!(formData.paymeSellerPaymeId && formData.paymeApiKey),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      toast.success('הגדרות סליקה נשמרו');
    } catch {
      toast.error('שגיאה בשמירת הגדרות');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold">הגדרות סליקה - Quick Payments</h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="form-label">Seller PayMe ID (MPL Key)</label>
          <input
            type="text"
            value={formData.paymeSellerPaymeId}
            onChange={(e) => setFormData((prev) => ({ ...prev, paymeSellerPaymeId: e.target.value }))}
            className="form-input font-mono"
            placeholder="MPL...-...-...-..."
            dir="ltr"
          />
          <p className="text-xs text-gray-500 mt-1">המפתח הפרטי שלך ב-PayMe</p>
        </div>

        <div>
          <label className="form-label">Merchant API Key</label>
          <input
            type="text"
            value={formData.paymeApiKey}
            onChange={(e) => setFormData((prev) => ({ ...prev, paymeApiKey: e.target.value }))}
            className="form-input font-mono"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            dir="ltr"
          />
          <p className="text-xs text-gray-500 mt-1">מפתח API לטופס תשלום מוטבע (Hosted Fields)</p>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requirePaymentForBooking}
              onChange={(e) => setFormData((prev) => ({ ...prev, requirePaymentForBooking: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium">חובת תשלום בעת קביעת תור</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.depositEnabled}
              onChange={(e) => setFormData((prev) => ({ ...prev, depositEnabled: e.target.checked }))}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium">אפשר מקדמה (במקום תשלום מלא)</span>
          </label>
        </div>

        {formData.depositEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
            <div>
              <label className="form-label">סכום מקדמה קבוע (₪)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.depositAmountCents}
                onChange={(e) => setFormData((prev) => ({ ...prev, depositAmountCents: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="form-label">או אחוז מהמחיר (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.depositPercentage}
                onChange={(e) => setFormData((prev) => ({ ...prev, depositPercentage: parseInt(e.target.value) || 0 }))}
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>
        )}

        <div className="pt-5 border-t border-gray-100">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'שומר...' : 'שמור הגדרות סליקה'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
