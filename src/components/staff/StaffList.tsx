'use client';

import { useState } from 'react';
import { Staff, Branch, Service, ServiceStaff } from '@prisma/client';
import { Edit, Trash2, Eye, EyeOff, Phone, Mail, MapPin, Calendar, Coffee } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { TimeOffModal } from './TimeOffModal';
import { StaffBreaksModal } from './StaffBreaksModal';

type StaffWithRelations = Staff & {
  branch: Branch | null;
  serviceStaff: (ServiceStaff & { service: Service })[];
};

interface StaffListProps {
  staff: StaffWithRelations[];
  branches: Branch[];
  businessId: string;
}

export function StaffList({ staff, branches, businessId }: StaffListProps) {
  const router = useRouter();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [timeOffModalOpen, setTimeOffModalOpen] = useState<{
    staffId: string;
    staffName: string;
  } | null>(null);
  const [breaksModalOpen, setBreaksModalOpen] = useState<{
    staffId: string;
    staffName: string;
  } | null>(null);

  const filteredStaff = staff.filter((member) => {
    if (selectedBranch === 'all') return true;
    if (selectedBranch === 'unassigned') return !member.branchId;
    return member.branchId === selectedBranch;
  });

  const handleToggleActive = async (staffId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update staff');
      }

      toast.success(currentActive ? 'העובד הושבת' : 'העובד הופעל');
      router.refresh();
    } catch (error) {
      toast.error('אירעה שגיאה');
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
      return;
    }

    setIsDeleting(staffId);
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete staff');
      }

      toast.success('העובד נמחק בהצלחה');
      router.refresh();
    } catch (error) {
      toast.error('אירעה שגיאה במחיקת העובד');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      {/* Branch Filter */}
      <div className="flex gap-1.5 flex-wrap bg-white border border-gray-200 rounded-xl p-1.5 mb-6">
        <button
          onClick={() => setSelectedBranch('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            selectedBranch === 'all'
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          הכל ({staff.length})
        </button>
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => setSelectedBranch(branch.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedBranch === branch.id
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {branch.name}
          </button>
        ))}
        <button
          onClick={() => setSelectedBranch('unassigned')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            selectedBranch === 'unassigned'
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          לא משויך לסניף
        </button>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-12">
          <p className="text-sm text-gray-500">אין עובדים להצגה</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className={`bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all ${!member.active && 'opacity-50'}`}
            >
              {/* Staff Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                  {member.roleLabel && (
                    <p className="text-sm text-gray-500 mt-0.5">{member.roleLabel}</p>
                  )}
                </div>
                {member.calendarColor && (
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: member.calendarColor }}
                    title="צבע ביומן"
                  />
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1.5 mb-4">
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.branch && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{member.branch.name}</span>
                  </div>
                )}
              </div>

              {/* Services */}
              {member.serviceStaff.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1.5">שירותים:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.serviceStaff.map(({ service }) => (
                      <span
                        key={service.id}
                        className="inline-block px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded-full"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar Provider */}
              {member.calendarProvider !== 'none' && (
                <div className="mb-4">
                  <span className="inline-block px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700 rounded-full">
                    מחובר ל-{member.calendarProvider}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1.5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => router.push(`/dashboard/staff/${member.id}/edit`)}
                  className="btn btn-secondary flex-1"
                  title="עריכת פרטי העובד"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>עריכה</span>
                </button>
                <button
                  onClick={() =>
                    setTimeOffModalOpen({
                      staffId: member.id,
                      staffName: member.name,
                    })
                  }
                  className="btn btn-secondary px-2.5"
                  data-tooltip="ניהול חופשים"
                >
                  <Calendar className="w-3.5 h-3.5 pointer-events-none" />
                </button>
                <button
                  onClick={() =>
                    setBreaksModalOpen({
                      staffId: member.id,
                      staffName: member.name,
                    })
                  }
                  className="btn btn-secondary px-2.5"
                  data-tooltip="ניהול הפסקות"
                >
                  <Coffee className="w-3.5 h-3.5 pointer-events-none" />
                </button>
                <button
                  onClick={() => handleToggleActive(member.id, member.active)}
                  className="btn btn-secondary px-2.5"
                  data-tooltip={member.active ? 'השבתה' : 'הפעלה'}
                >
                  {member.active ? (
                    <Eye className="w-3.5 h-3.5 pointer-events-none" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 pointer-events-none" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  disabled={isDeleting === member.id}
                  className="btn btn-danger px-2.5"
                  data-tooltip="מחיקה"
                >
                  <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time Off Modal */}
      {timeOffModalOpen && (
        <TimeOffModal
          isOpen={true}
          onClose={() => setTimeOffModalOpen(null)}
          businessId={businessId}
          staffId={timeOffModalOpen.staffId}
          staffName={timeOffModalOpen.staffName}
          scope="staff"
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Breaks Modal */}
      {breaksModalOpen && (
        <StaffBreaksModal
          isOpen={true}
          onClose={() => setBreaksModalOpen(null)}
          staffId={breaksModalOpen.staffId}
          staffName={breaksModalOpen.staffName}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}

