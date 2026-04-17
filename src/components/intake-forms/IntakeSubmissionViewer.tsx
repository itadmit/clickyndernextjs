'use client';

import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, Download, CheckCircle } from 'lucide-react';

interface IntakeField {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  optionsJson?: any;
  fileUrl?: string | null;
}

interface Submission {
  id: string;
  formId: string;
  answersJson: Record<string, any>;
  signatureData?: string | null;
  consentGiven: boolean;
  submittedAt: string;
  form: {
    id: string;
    name: string;
    fields: IntakeField[];
  };
}

interface IntakeSubmissionViewerProps {
  appointmentId: string;
}

export function IntakeSubmissionViewer({ appointmentId }: IntakeSubmissionViewerProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [appointmentId]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/intake-form-submissions?appointmentId=${appointmentId}`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-400">טוען תשובות...</div>;
  }

  if (submissions.length === 0) {
    return null; // Don't show anything if no forms were submitted
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        שאלונים שהוגשו ({submissions.length})
      </h4>

      {submissions.map((sub) => {
        const isExpanded = expandedId === sub.id;
        return (
          <div
            key={sub.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : sub.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-right"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">{sub.form.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {new Date(sub.submittedAt).toLocaleDateString('he-IL')}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-3">
                {sub.form.fields
                  .filter((f) => !['header', 'paragraph'].includes(f.type))
                  .map((field) => {
                    const answer = sub.answersJson[field.id];
                    return (
                      <div key={field.id}>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">
                          {field.label}
                        </p>
                        <AnswerDisplay field={field} answer={answer} />
                      </div>
                    );
                  })}

                {/* Signature */}
                {sub.signatureData && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">חתימה</p>
                    <img
                      src={sub.signatureData}
                      alt="חתימה"
                      className="max-w-[200px] border border-gray-200 rounded bg-white p-1"
                    />
                  </div>
                )}

                {/* Consent */}
                {sub.consentGiven && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>הלקוח אישר את המסמך</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnswerDisplay({ field, answer }: { field: IntakeField; answer: any }) {
  if (answer === undefined || answer === null || answer === '') {
    return <p className="text-sm text-gray-400 italic">לא הוזן</p>;
  }

  // Array answers (checkbox)
  if (Array.isArray(answer)) {
    return (
      <div className="flex flex-wrap gap-1">
        {answer.map((item: string, idx: number) => (
          <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {item}
          </span>
        ))}
      </div>
    );
  }

  // PDF consent
  if (field.type === 'pdf_consent') {
    return (
      <div className="flex items-center gap-2">
        {field.fileUrl && (
          <a
            href={field.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            צפה במסמך
          </a>
        )}
        <span className="text-xs text-green-600">✓ אושר</span>
      </div>
    );
  }

  // Regular text/number answers
  return <p className="text-sm text-gray-800">{String(answer)}</p>;
}


