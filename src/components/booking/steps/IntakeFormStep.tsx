'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowLeft, FileText, Check, AlertCircle,
  Download, PenTool, RotateCcw, Upload,
} from 'lucide-react';

interface IntakeField {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  placeholder?: string | null;
  required: boolean;
  position: number;
  optionsJson?: string[] | null;
  fileUrl?: string | null;
  validationJson?: any;
}

interface IntakeFormData {
  id: string;
  name: string;
  description: string | null;
  fields: IntakeField[];
}

interface IntakeFormStepProps {
  forms: IntakeFormData[];
  onSubmit: (submissions: IntakeSubmissionData[]) => void;
  onBack: () => void;
}

export interface IntakeSubmissionData {
  formId: string;
  answers: Record<string, any>;
  signatureData?: string;
  consentGiven: boolean;
}

export function IntakeFormStep({ forms, onSubmit, onBack }: IntakeFormStepProps) {
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Record<string, Record<string, any>>>(() => {
    const initial: Record<string, Record<string, any>> = {};
    forms.forEach((form) => {
      initial[form.id] = {};
    });
    return initial;
  });
  const [allSignatures, setAllSignatures] = useState<Record<string, string>>({});
  const [allConsents, setAllConsents] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentForm = forms[currentFormIndex];
  const answers = allAnswers[currentForm?.id] || {};
  const isLastForm = currentFormIndex === forms.length - 1;

  const updateAnswer = (fieldId: string, value: any) => {
    setAllAnswers((prev) => ({
      ...prev,
      [currentForm.id]: {
        ...prev[currentForm.id],
        [fieldId]: value,
      },
    }));
    // Clear error
    if (errors[fieldId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const validateCurrentForm = () => {
    const newErrors: Record<string, string> = {};
    currentForm.fields.forEach((field) => {
      if (field.required && !['header', 'paragraph'].includes(field.type)) {
        const answer = answers[field.id];
        if (answer === undefined || answer === null || answer === '' || 
            (Array.isArray(answer) && answer.length === 0)) {
          newErrors[field.id] = 'שדה חובה';
        }
      }

      // Validate pdf_consent requires consent
      if (field.type === 'pdf_consent' && field.required) {
        if (!allConsents[field.id]) {
          newErrors[field.id] = 'נדרש אישור על המסמך';
        }
      }

      // Validate signature
      if (field.type === 'signature' && field.required) {
        if (!allSignatures[field.id]) {
          newErrors[field.id] = 'נדרשת חתימה';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentForm()) {
      return;
    }

    if (isLastForm) {
      // Submit all forms
      const submissions: IntakeSubmissionData[] = forms.map((form) => {
        const formSignature = form.fields.find((f) => f.type === 'signature');
        const formConsent = form.fields.some((f) => f.type === 'pdf_consent');
        return {
          formId: form.id,
          answers: allAnswers[form.id],
          signatureData: formSignature ? allSignatures[formSignature.id] : undefined,
          consentGiven: formConsent
            ? form.fields
                .filter((f) => f.type === 'pdf_consent')
                .every((f) => allConsents[f.id])
            : true,
        };
      });
      onSubmit(submissions);
    } else {
      setCurrentFormIndex((prev) => prev + 1);
    }
  };

  const handlePreviousForm = () => {
    if (currentFormIndex > 0) {
      setCurrentFormIndex((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  if (!currentForm) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-bold">{currentForm.name}</h2>
        </div>
        {currentForm.description && (
          <p className="text-gray-600 text-sm">{currentForm.description}</p>
        )}
        {forms.length > 1 && (
          <p className="text-xs text-gray-400 mt-1">
            שאלון {currentFormIndex + 1} מתוך {forms.length}
          </p>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-5 mb-6">
        {currentForm.fields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={(value) => updateAnswer(field.id, value)}
            error={errors[field.id]}
            consent={allConsents[field.id]}
            onConsentChange={(v) =>
              setAllConsents((prev) => ({ ...prev, [field.id]: v }))
            }
            signatureData={allSignatures[field.id]}
            onSignatureChange={(data) =>
              setAllSignatures((prev) => ({ ...prev, [field.id]: data }))
            }
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePreviousForm}
          className="btn btn-secondary flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isLastForm ? (
            <>
              <Check className="w-4 h-4" />
              <span>המשך</span>
            </>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4" />
              <span>שאלון הבא</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ==============================================
// Field Renderer - renders individual form fields
// ==============================================

interface FieldRendererProps {
  field: IntakeField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  consent?: boolean;
  onConsentChange?: (v: boolean) => void;
  signatureData?: string;
  onSignatureChange?: (data: string) => void;
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
  consent,
  onConsentChange,
  signatureData,
  onSignatureChange,
}: FieldRendererProps) {
  const hasError = !!error;

  // Layout fields
  if (field.type === 'header') {
    return (
      <div className="pt-2">
        <h3 className="text-lg font-bold text-gray-800">{field.label}</h3>
        {field.description && <p className="text-sm text-gray-500">{field.description}</p>}
      </div>
    );
  }

  if (field.type === 'paragraph') {
    return (
      <p className="text-sm text-gray-600 leading-relaxed">{field.label}</p>
    );
  }

  return (
    <div>
      <label className="form-label flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-gray-500 mb-2">{field.description}</p>
      )}

      {/* Text Input */}
      {field.type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          className={`form-input ${hasError ? 'border-red-400' : ''}`}
        />
      )}

      {/* Textarea */}
      {field.type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          rows={3}
          className={`form-input ${hasError ? 'border-red-400' : ''}`}
        />
      )}

      {/* Number */}
      {field.type === 'number' && (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          className={`form-input ${hasError ? 'border-red-400' : ''}`}
        />
      )}

      {/* Date */}
      {field.type === 'date' && (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`form-input ${hasError ? 'border-red-400' : ''}`}
        />
      )}

      {/* Select (Dropdown) */}
      {field.type === 'select' && (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`form-input ${hasError ? 'border-red-400' : ''}`}
        >
          <option value="">בחר אפשרות...</option>
          {(field.optionsJson || []).map((option: string, idx: number) => (
            <option key={idx} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      {/* Radio (Single Choice Buttons) */}
      {field.type === 'radio' && (
        <div className="space-y-2">
          {(field.optionsJson || []).map((option: string, idx: number) => (
            <label
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                value === option
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  value === option ? 'border-primary-600' : 'border-gray-300'
                }`}
              >
                {value === option && (
                  <div className="w-3 h-3 bg-primary-600 rounded-full" />
                )}
              </div>
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )}

      {/* Checkbox (Multiple Choice) */}
      {field.type === 'checkbox' && (
        <div className="space-y-2">
          {(field.optionsJson || []).map((option: string, idx: number) => {
            const selected = Array.isArray(value) ? value.includes(option) : false;
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selected
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const current = Array.isArray(value) ? [...value] : [];
                    if (selected) {
                      onChange(current.filter((v: string) => v !== option));
                    } else {
                      onChange([...current, option]);
                    }
                  }}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm">{option}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Yes/No */}
      {field.type === 'yes_no' && (
        <div className="flex gap-3">
          {['כן', 'לא'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                value === option
                  ? option === 'כן'
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* File Upload */}
      {field.type === 'file_upload' && (
        <FileUploadField value={value} onChange={onChange} />
      )}

      {/* PDF Consent */}
      {field.type === 'pdf_consent' && (
        <div className="space-y-3">
          {field.fileUrl && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={field.fileUrl}
                className="w-full border-0"
                style={{ height: '400px' }}
                title={field.label}
              />
              <a
                href={field.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2 bg-gray-50 border-t border-gray-200 text-blue-600 hover:bg-gray-100 transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                <span>פתח בחלון חדש</span>
              </a>
            </div>
          )}
          <label
            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              consent
                ? 'border-green-400 bg-green-50'
                : hasError
                ? 'border-red-400 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={consent || false}
              onChange={(e) => onConsentChange?.(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded mt-0.5"
            />
            <span className="text-sm">
              קראתי את המסמך ואני מאשר/ת את תוכנו
            </span>
          </label>
        </div>
      )}

      {/* Digital Signature */}
      {field.type === 'signature' && (
        <SignaturePad
          signatureData={signatureData}
          onChange={onSignatureChange}
          hasError={hasError}
        />
      )}

      {/* Error */}
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ==============================================
// Signature Pad Component
// ==============================================

interface SignaturePadProps {
  signatureData?: string;
  onChange?: (data: string) => void;
  hasError?: boolean;
}

function SignaturePad({ signatureData, onChange, hasError }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!signatureData);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set drawing style
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature
    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = signatureData;
    }
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoords(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing]
  );

  const stopDrawing = useCallback(async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const file = new File([blob], 'signature.png', { type: 'image/png' });
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'signatures');
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (res.ok) {
            const { url } = await res.json();
            onChange?.(url);
          } else {
            const fallback = canvas.toDataURL('image/png');
            onChange?.(fallback);
          }
        } catch {
          const fallback = canvas.toDataURL('image/png');
          onChange?.(fallback);
        }
      }, 'image/png');
    }
  }, [isDrawing, onChange]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    onChange?.('');
  };

  return (
    <div
      className={`border-2 rounded-lg overflow-hidden ${
        hasError ? 'border-red-400' : hasSignature ? 'border-green-400' : 'border-gray-300'
      }`}
    >
      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <PenTool className="w-4 h-4" />
          <span>חתום כאן</span>
        </div>
        {hasSignature && (
          <button
            type="button"
            onClick={clearSignature}
            className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            נקה
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="w-full bg-white cursor-crosshair touch-none"
        style={{ height: '150px' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}

// ==============================================
// File Upload Component with Vercel Blob
// ==============================================

interface FileUploadFieldProps {
  value: any;
  onChange: (value: any) => void;
}

function FileUploadField({ value, onChange }: FileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('הקובץ גדול מדי (מקסימום 10MB)');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'intake-files');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await res.json();
      onChange({ name: file.name, size: file.size, type: file.type, url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'שגיאה בהעלאת הקובץ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value?.url) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: value.url }),
        });
      } catch {}
    }
    onChange(null);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">מעלה קובץ...</p>
        </div>
      ) : value?.url ? (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          <span>קובץ הועלה: {value.name || 'קובץ'}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 mr-2"
          >
            הסר
          </button>
        </div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-2">גרור קובץ לכאן או לחץ לבחירה</p>
          <p className="text-xs text-gray-400 mb-2">תמונות, PDF - עד 10MB</p>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleUpload}
            className="block mx-auto text-sm"
          />
          {uploadError && (
            <p className="text-sm text-red-500 mt-2">{uploadError}</p>
          )}
        </>
      )}
    </div>
  );
}


