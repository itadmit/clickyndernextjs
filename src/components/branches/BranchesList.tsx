'use client';

import { useState } from 'react';
import { Branch } from '@prisma/client';
import { Edit, Trash2, Eye, EyeOff, MapPin, Phone, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type BranchWithCount = Branch & {
  _count: {
    staff: number;
  };
};

interface BranchesListProps {
  branches: BranchWithCount[];
  businessId: string;
}

export function BranchesList({ branches }: BranchesListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleToggleActive = async (branchId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update branch');
      }

      toast.success(currentActive ? 'הסניף הושבת' : 'הסניף הופעל');
      router.refresh();
    } catch (error) {
      toast.error('אירעה שגיאה');
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק סניף זה?')) {
      return;
    }

    setIsDeleting(branchId);
    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete branch');
      }

      toast.success('הסניף נמחק בהצלחה');
      router.refresh();
    } catch (error) {
      toast.error('אירעה שגיאה במחיקת הסניף');
    } finally {
      setIsDeleting(null);
    }
  };

  if (branches.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl text-center py-12">
        <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-600 mb-1">אין סניפים עדיין</p>
        <p className="text-sm text-gray-500">
          הוסף סניפים כדי לנהל מיקומים שונים של העסק שלך
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {branches.map((branch) => (
        <div
          key={branch.id}
          className={`bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all ${!branch.active && 'opacity-50'}`}
        >
          {/* Branch Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-600" />
                {branch.name}
              </h3>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {branch.isDefault && (
                <span className="badge badge-success">ברירת מחדל</span>
              )}
              {branch.hasCustomHours && (
                <span className="badge badge-info">שעות מותאמות</span>
              )}
            </div>
          </div>

          {/* Branch Details */}
          <div className="space-y-2 mb-4">
            {branch.address && (
              <div className="flex items-start gap-2 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="break-words">{branch.address}</span>
              </div>
            )}
            {branch.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr">{branch.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span>{branch._count.staff} עובדים</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            {branch.active ? (
              <span className="badge badge-success">פעיל</span>
            ) : (
              <span className="badge badge-danger">לא פעיל</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 pt-4 border-t border-gray-100">
            <button
              onClick={() => router.push(`/dashboard/branches/${branch.id}/edit`)}
              className="btn btn-secondary flex-1"
              title="עריכת פרטי הסניף"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>עריכה</span>
            </button>
            <button
              onClick={() => handleToggleActive(branch.id, branch.active)}
              className="btn btn-secondary px-2.5"
              data-tooltip={branch.active ? 'השבתה' : 'הפעלה'}
            >
              {branch.active ? <Eye className="w-3.5 h-3.5 pointer-events-none" /> : <EyeOff className="w-3.5 h-3.5 pointer-events-none" />}
            </button>
            <button
              onClick={() => handleDelete(branch.id)}
              disabled={isDeleting === branch.id}
              className="btn btn-danger px-2.5"
              data-tooltip="מחיקה"
            >
              <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

