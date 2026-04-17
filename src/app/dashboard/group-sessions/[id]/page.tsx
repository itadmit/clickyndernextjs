'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  Calendar,
  Clock,
  User,
  Phone,
  Save,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface GroupSession {
  id: string;
  startAt: string;
  endAt: string;
  maxParticipants: number;
  currentCount: number;
  status: string;
  notes?: string;
  service: {
    id: string;
    name: string;
    durationMin: number;
  };
  staff?: {
    id: string;
    name: string;
  } | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  appointments: {
    id: string;
    status: string;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
    };
  }[];
}

export default function GroupSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<GroupSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editMaxParticipants, setEditMaxParticipants] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/group-sessions/${id}`);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      setSession(data.groupSession);
      setEditMaxParticipants(data.groupSession.maxParticipants);
      setEditNotes(data.groupSession.notes || '');
    } catch (error) {
      toast.error('שגיאה בטעינת השיעור');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/group-sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxParticipants: editMaxParticipants,
          notes: editNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      const data = await response.json();
      setSession(data.groupSession);
      setIsEditing(false);
      toast.success('השיעור עודכן בהצלחה');
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בעדכון');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/group-sessions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('השיעור בוטל בהצלחה');
      router.push('/dashboard/group-sessions');
    } catch (error) {
      toast.error('שגיאה בביטול השיעור');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  if (isLoading) {
    return (
      <div>
        <DashboardHeader title="שיעור קבוצתי" subtitle="טוען..." />
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <DashboardHeader title="שיעור קבוצתי" subtitle="לא נמצא" />
        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">השיעור לא נמצא</p>
            <Link href="/dashboard/group-sessions" className="btn btn-primary mt-4 inline-flex">
              חזרה לרשימה
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const participantCount = session.appointments?.length || session.currentCount || 0;
  const occupancy = Math.round((participantCount / session.maxParticipants) * 100);

  return (
    <div>
      <DashboardHeader
        title={session.service.name}
        subtitle="פרטי שיעור קבוצתי"
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/group-sessions"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לשיעורים קבוצתיים
        </Link>

        {/* Session Info */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              פרטי השיעור
            </h2>
            <div className="flex items-center gap-2">
              {session.status === 'open' && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary text-sm"
                >
                  עריכה
                </button>
              )}
              {session.status === 'canceled' && (
                <span className="badge badge-error">בוטל</span>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">שירות</p>
                <p className="text-sm font-medium text-gray-900">{session.service.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">תאריך</p>
                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(session.startAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">שעה</p>
                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {formatTime(session.startAt)} - {formatTime(session.endAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">איש צוות</p>
                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {session.staff?.name || 'לא נבחר'}
                </p>
              </div>
            </div>

            {/* Occupancy Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">תפוסה</p>
                <p className="text-sm font-medium text-gray-700">
                  {participantCount} / {session.maxParticipants} משתתפים
                </p>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${occupancy >= 100 ? 'bg-red-500' : occupancy >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                />
              </div>
            </div>

            {/* Edit Fields */}
            {isEditing && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    מקסימום משתתפים
                  </label>
                  <input
                    type="number"
                    min={participantCount || 2}
                    value={editMaxParticipants}
                    onChange={(e) => setEditMaxParticipants(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    הערות
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="form-input"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditMaxParticipants(session.maxParticipants);
                      setEditNotes(session.notes || '');
                    }}
                    className="btn btn-secondary"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-primary"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>שמור</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notes (view mode) */}
            {!isEditing && session.notes && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 mb-1">הערות</p>
                <p className="text-sm text-gray-700">{session.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              משתתפים ({participantCount})
            </h2>
          </div>

          {session.appointments.length === 0 ? (
            <div className="text-center py-8 px-5">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">אין משתתפים רשומים עדיין</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {session.appointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {apt.customer.firstName} {apt.customer.lastName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {apt.customer.phone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel Session */}
        {session.status !== 'canceled' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-5">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-secondary text-red-600 hover:bg-red-50 border-red-200 w-full justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ביטול שיעור</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        האם אתה בטוח שברצונך לבטל את השיעור?
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        פעולה זו תבטל את כל התורים של המשתתפים.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn btn-secondary"
                    >
                      חזור
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="btn bg-red-600 text-white hover:bg-red-700"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      <span>כן, בטל</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
