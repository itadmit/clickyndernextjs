'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Save, GripVertical, FileText, Type, AlignLeft,
  List, CheckSquare, ToggleLeft, Hash, Calendar, Upload,
  FileSignature, Heading, Text, ChevronDown, ChevronUp, Eye, X,
  Copy, Settings2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface IntakeField {
  id?: string;
  type: string;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  fileUrl?: string;
  validation?: any;
}

interface IntakeForm {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isGlobal: boolean;
  fields: (IntakeField & { id: string })[];
  services: { service: { id: string; name: string } }[];
  _count?: { submissions: number };
}

interface IntakeFormBuilderProps {
  businessId: string;
  services: { id: string; name: string }[];
}

const FIELD_TYPES = [
  { type: 'header', label: 'כותרת', icon: Heading, category: 'layout' },
  { type: 'paragraph', label: 'פסקת טקסט', icon: Text, category: 'layout' },
  { type: 'text', label: 'טקסט קצר', icon: Type, category: 'input' },
  { type: 'textarea', label: 'טקסט ארוך', icon: AlignLeft, category: 'input' },
  { type: 'number', label: 'מספר', icon: Hash, category: 'input' },
  { type: 'date', label: 'תאריך', icon: Calendar, category: 'input' },
  { type: 'select', label: 'בחירה יחידה (רשימה)', icon: List, category: 'choice' },
  { type: 'radio', label: 'בחירה יחידה (כפתורים)', icon: ToggleLeft, category: 'choice' },
  { type: 'checkbox', label: 'בחירה מרובה', icon: CheckSquare, category: 'choice' },
  { type: 'yes_no', label: 'כן / לא', icon: ToggleLeft, category: 'choice' },
  { type: 'file_upload', label: 'העלאת קובץ', icon: Upload, category: 'special' },
  { type: 'pdf_consent', label: 'הסכמה על מסמך PDF', icon: FileText, category: 'special' },
  { type: 'signature', label: 'חתימה דיגיטלית', icon: FileSignature, category: 'special' },
];

const FIELD_TYPE_LABELS: Record<string, string> = {};
FIELD_TYPES.forEach((f) => {
  FIELD_TYPE_LABELS[f.type] = f.label;
});

const CHOICE_TYPES = ['select', 'radio', 'checkbox'];

export function IntakeFormBuilder({ businessId, services }: IntakeFormBuilderProps) {
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<IntakeForm | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New/Edit form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsGlobal, setFormIsGlobal] = useState(false);
  const [formServiceIds, setFormServiceIds] = useState<string[]>([]);
  const [formFields, setFormFields] = useState<IntakeField[]>([]);
  const [showFieldTypes, setShowFieldTypes] = useState(false);
  const [expandedFieldIndex, setExpandedFieldIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchForms();
  }, [businessId]);

  const fetchForms = async () => {
    try {
      const response = await fetch(`/api/intake-forms?businessId=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormIsGlobal(false);
    setFormServiceIds([]);
    setFormFields([]);
    setEditingForm(null);
    setIsCreating(true);
    setExpandedFieldIndex(null);
  };

  const startEdit = (form: IntakeForm) => {
    setFormName(form.name);
    setFormDescription(form.description || '');
    setFormIsGlobal(form.isGlobal);
    setFormServiceIds(form.services.map((s) => s.service.id));
    setFormFields(
      form.fields.map((f: any) => ({
        type: f.type,
        label: f.label,
        description: f.description || undefined,
        placeholder: f.placeholder || undefined,
        required: f.required,
        options: (f.optionsJson || f.options) as string[] || undefined,
        fileUrl: f.fileUrl || undefined,
        validation: (f.validationJson || f.validation) || undefined,
      }))
    );
    setEditingForm(form);
    setIsCreating(true);
    setExpandedFieldIndex(null);
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingForm(null);
  };

  const addField = (type: string) => {
    const newField: IntakeField = {
      type,
      label: FIELD_TYPE_LABELS[type] || 'שדה חדש',
      required: false,
      ...(CHOICE_TYPES.includes(type) ? { options: ['אפשרות 1', 'אפשרות 2'] } : {}),
      ...(type === 'yes_no' ? { options: ['כן', 'לא'] } : {}),
    };
    setFormFields((prev) => [...prev, newField]);
    setExpandedFieldIndex(formFields.length);
    setShowFieldTypes(false);
  };

  const updateField = (index: number, updates: Partial<IntakeField>) => {
    setFormFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeField = (index: number) => {
    setFormFields((prev) => prev.filter((_, i) => i !== index));
    if (expandedFieldIndex === index) setExpandedFieldIndex(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formFields.length) return;
    const newFields = [...formFields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFormFields(newFields);
    setExpandedFieldIndex(newIndex);
  };

  const duplicateField = (index: number) => {
    const field = { ...formFields[index], label: `${formFields[index].label} (העתק)` };
    const newFields = [...formFields];
    newFields.splice(index + 1, 0, field);
    setFormFields(newFields);
  };

  const addOption = (fieldIndex: number) => {
    const field = formFields[fieldIndex];
    const options = field.options || [];
    updateField(fieldIndex, {
      options: [...options, `אפשרות ${options.length + 1}`],
    });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = formFields[fieldIndex];
    const options = [...(field.options || [])];
    options[optionIndex] = value;
    updateField(fieldIndex, { options });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = formFields[fieldIndex];
    const options = (field.options || []).filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options });
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('נא להזין שם לשאלון');
      return;
    }

    if (formFields.length === 0) {
      toast.error('נא להוסיף לפחות שדה אחד');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingForm
        ? `/api/intake-forms/${editingForm.id}`
        : '/api/intake-forms';
      const method = editingForm ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          name: formName,
          description: formDescription || null,
          isGlobal: formIsGlobal,
          serviceIds: formIsGlobal ? [] : formServiceIds,
          fields: formFields,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save form');
      }

      toast.success(editingForm ? 'השאלון עודכן בהצלחה' : 'השאלון נוצר בהצלחה');
      cancelEdit();
      fetchForms();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'אירעה שגיאה');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFormActive = async (form: IntakeForm) => {
    try {
      const response = await fetch(`/api/intake-forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !form.isActive }),
      });

      if (response.ok) {
        toast.success(form.isActive ? 'השאלון הושבת' : 'השאלון הופעל');
        fetchForms();
      }
    } catch (error) {
      toast.error('אירעה שגיאה');
    }
  };

  const deleteForm = async (formId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שאלון זה? כל התשובות ימחקו.')) return;

    try {
      const response = await fetch(`/api/intake-forms/${formId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('השאלון נמחק');
        fetchForms();
      }
    } catch (error) {
      toast.error('אירעה שגיאה');
    }
  };

  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find((f) => f.type === type);
    return fieldType?.icon || Type;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-2">טוען שאלונים...</p>
      </div>
    );
  }

  // Builder Mode
  if (isCreating) {
    return (
      <div className="space-y-6">
        {/* Form Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {editingForm ? 'עריכת שאלון' : 'יצירת שאלון חדש'}
          </h3>
          <button onClick={cancelEdit} className="btn btn-secondary text-sm">
            <X className="w-4 h-4" />
            ביטול
          </button>
        </div>

        {/* Form Settings */}
        <div className="card">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            הגדרות השאלון
          </h4>

          <div className="space-y-4">
            <div>
              <label className="form-label">שם השאלון *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="form-input"
                placeholder="שאלון בריאות, טופס הסכמה..."
              />
            </div>

            <div>
              <label className="form-label">תיאור (אופציונלי)</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="form-input"
                rows={2}
                placeholder="הסבר קצר שיוצג ללקוח לפני מילוי השאלון"
              />
            </div>

            {/* Global toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsGlobal}
                  onChange={(e) => setFormIsGlobal(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium">שאלון גלובלי</span>
                  <p className="text-xs text-gray-500">חל על כל השירותים בעסק</p>
                </div>
              </label>
            </div>

            {/* Service selection (if not global) */}
            {!formIsGlobal && (
              <div>
                <label className="form-label">שירותים משויכים</label>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() =>
                        setFormServiceIds((prev) =>
                          prev.includes(service.id)
                            ? prev.filter((id) => id !== service.id)
                            : [...prev, service.id]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                        formServiceIds.includes(service.id)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
                {services.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">אין שירותים. צור שירותים קודם.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fields Builder */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              שדות השאלון ({formFields.length})
            </h4>
          </div>

          {/* Fields List */}
          <div className="space-y-3 mb-4">
            {formFields.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">לחץ "הוסף שדה" להתחיל לבנות את השאלון</p>
              </div>
            )}

            {formFields.map((field, index) => {
              const Icon = getFieldIcon(field.type);
              const isExpanded = expandedFieldIndex === index;

              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg transition-all ${
                    isExpanded ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Field Header */}
                  <div
                    className="flex items-center gap-2 p-3 cursor-pointer"
                    onClick={() => setExpandedFieldIndex(isExpanded ? null : index)}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <Icon className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span className="font-medium text-sm flex-1 truncate">{field.label}</span>
                    {field.required && (
                      <span className="text-xs text-red-500 font-medium">חובה</span>
                    )}
                    <span className="text-xs text-gray-400">{FIELD_TYPE_LABELS[field.type]}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {/* Expanded Editor */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-200 pt-3 space-y-3">
                      <div>
                        <label className="form-label text-xs">
                          {field.type === 'header' ? 'כותרת' : field.type === 'paragraph' ? 'טקסט' : 'תווית השאלה *'}
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          className="form-input text-sm"
                        />
                      </div>

                      {!['header', 'paragraph'].includes(field.type) && (
                        <>
                          <div>
                            <label className="form-label text-xs">טקסט עזרה (אופציונלי)</label>
                            <input
                              type="text"
                              value={field.description || ''}
                              onChange={(e) =>
                                updateField(index, { description: e.target.value || undefined })
                              }
                              className="form-input text-sm"
                              placeholder="הסבר נוסף ללקוח..."
                            />
                          </div>

                          {['text', 'textarea', 'number'].includes(field.type) && (
                            <div>
                              <label className="form-label text-xs">placeholder</label>
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) =>
                                  updateField(index, { placeholder: e.target.value || undefined })
                                }
                                className="form-input text-sm"
                                placeholder="טקסט שיוצג בשדה ריק..."
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Options Editor for choice fields */}
                      {CHOICE_TYPES.includes(field.type) && (
                        <div>
                          <label className="form-label text-xs">אפשרויות</label>
                          <div className="space-y-2">
                            {(field.options || []).map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                  className="form-input text-sm flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeOption(index, optIndex)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addOption(index)}
                              className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              הוסף אפשרות
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PDF Upload/URL for pdf_consent */}
                      {field.type === 'pdf_consent' && (
                        <PdfUploadField
                          fileUrl={field.fileUrl}
                          onUrlChange={(url) => updateField(index, { fileUrl: url || undefined })}
                        />
                      )}

                      {/* Required toggle */}
                      {!['header', 'paragraph'].includes(field.type) && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm">שדה חובה</span>
                        </label>
                      )}

                      {/* Field Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                          className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-30 flex items-center gap-1"
                        >
                          <ChevronUp className="w-3 h-3" />
                          למעלה
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 'down')}
                          disabled={index === formFields.length - 1}
                          className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-30 flex items-center gap-1"
                        >
                          <ChevronDown className="w-3 h-3" />
                          למטה
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateField(index)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          שכפל
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 mr-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          מחק
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Field Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFieldTypes(!showFieldTypes)}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              הוסף שדה
            </button>

            {showFieldTypes && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                {/* Layout */}
                <div className="p-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 px-2 mb-1">עיצוב</p>
                  {FIELD_TYPES.filter((f) => f.category === 'layout').map((fieldType) => {
                    const Icon = fieldType.icon;
                    return (
                      <button
                        key={fieldType.type}
                        type="button"
                        onClick={() => addField(fieldType.type)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm text-right"
                      >
                        <Icon className="w-4 h-4 text-gray-500" />
                        {fieldType.label}
                      </button>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="p-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 px-2 mb-1">קלט</p>
                  {FIELD_TYPES.filter((f) => f.category === 'input').map((fieldType) => {
                    const Icon = fieldType.icon;
                    return (
                      <button
                        key={fieldType.type}
                        type="button"
                        onClick={() => addField(fieldType.type)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm text-right"
                      >
                        <Icon className="w-4 h-4 text-blue-500" />
                        {fieldType.label}
                      </button>
                    );
                  })}
                </div>

                {/* Choice */}
                <div className="p-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 px-2 mb-1">בחירה</p>
                  {FIELD_TYPES.filter((f) => f.category === 'choice').map((fieldType) => {
                    const Icon = fieldType.icon;
                    return (
                      <button
                        key={fieldType.type}
                        type="button"
                        onClick={() => addField(fieldType.type)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm text-right"
                      >
                        <Icon className="w-4 h-4 text-green-500" />
                        {fieldType.label}
                      </button>
                    );
                  })}
                </div>

                {/* Special */}
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-400 px-2 mb-1">מיוחד</p>
                  {FIELD_TYPES.filter((f) => f.category === 'special').map((fieldType) => {
                    const Icon = fieldType.icon;
                    return (
                      <button
                        key={fieldType.type}
                        type="button"
                        onClick={() => addField(fieldType.type)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm text-right"
                      >
                        <Icon className="w-4 h-4 text-purple-500" />
                        {fieldType.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {editingForm ? 'עדכן שאלון' : 'צור שאלון'}
          </button>
          <button onClick={cancelEdit} className="btn btn-secondary">
            ביטול
          </button>
        </div>
      </div>
    );
  }

  // Forms List Mode
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">שאלונים וטפסים</h3>
          <p className="text-sm text-gray-600">צור שאלונים שהלקוח ימלא לפני קביעת תור</p>
        </div>
        <button onClick={startCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          שאלון חדש
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-600 mb-2">אין שאלונים</h4>
          <p className="text-sm text-gray-500 mb-4">
            צור שאלון בריאות, טופס הסכמה, או כל שאלון שתרצה שהלקוח ימלא לפני קביעת תור
          </p>
          <button onClick={startCreate} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            צור שאלון ראשון
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className={`card border-2 transition-all ${
                form.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <h4 className="font-bold">{form.name}</h4>
                    {form.isGlobal && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        גלובלי
                      </span>
                    )}
                    {!form.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        מושבת
                      </span>
                    )}
                  </div>

                  {form.description && (
                    <p className="text-sm text-gray-600 mb-2">{form.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{form.fields.length} שדות</span>
                    <span>{form._count?.submissions || 0} תשובות</span>
                    {!form.isGlobal && form.services.length > 0 && (
                      <span>
                        שירותים: {form.services.map((s) => s.service.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(form)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                    title="עריכה"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleFormActive(form)}
                    className={`p-2 rounded-lg transition-colors ${
                      form.isActive
                        ? 'hover:bg-gray-100 text-gray-600'
                        : 'hover:bg-green-100 text-green-600'
                    }`}
                    title={form.isActive ? 'השבת' : 'הפעל'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteForm(form.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                    title="מחק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==============================================
// PDF Upload Component for Intake Form Builder
// ==============================================

interface PdfUploadFieldProps {
  fileUrl?: string;
  onUrlChange: (url: string) => void;
}

function PdfUploadField({ fileUrl, onUrlChange }: PdfUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>(fileUrl && !fileUrl.includes('vercel') ? 'url' : 'upload');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('נא להעלות קובץ PDF בלבד');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('גודל הקובץ חייב להיות פחות מ-10MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'consent-pdfs');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await res.json();
      onUrlChange(url);
      toast.success('הקובץ הועלה בהצלחה');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בהעלאת הקובץ');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="form-label text-xs">מסמך PDF</label>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`text-xs px-3 py-1 rounded-lg border transition-all ${
            mode === 'upload' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          <Upload className="w-3 h-3 inline ml-1" />
          העלאה
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`text-xs px-3 py-1 rounded-lg border transition-all ${
            mode === 'url' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          קישור URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          {fileUrl ? (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 flex-1 truncate">{fileUrl.split('/').pop()}</span>
              <button
                type="button"
                onClick={() => onUrlChange('')}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                הסר
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-500">מעלה PDF...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 mb-2">העלה קובץ PDF (עד 10MB)</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload}
                    className="block mx-auto text-xs"
                  />
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <input
          type="url"
          value={fileUrl || ''}
          onChange={(e) => onUrlChange(e.target.value)}
          className="form-input text-sm"
          placeholder="https://example.com/document.pdf"
          dir="ltr"
        />
      )}

      <p className="text-xs text-gray-400 mt-1">הלקוח יצטרך לסמן &quot;קראתי ואני מסכים/ה&quot;</p>
    </div>
  );
}

