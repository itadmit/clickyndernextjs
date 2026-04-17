'use client';

import { Branch } from '@prisma/client';
import { MapPin, Phone, Check, Building2 } from 'lucide-react';

interface BranchSelectionProps {
  branches: Branch[];
  selectedBranchId?: string;
  onSelect: (branchId: string) => void;
}

export function BranchSelection({ branches, selectedBranchId, onSelect }: BranchSelectionProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
          <Building2 className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">בחר סניף</h2>
        <p className="mt-1 text-sm text-gray-400">איפה תרצה לקבל את השירות?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {branches.map((branch) => {
          const isSelected = selectedBranchId === branch.id;
          return (
            <button
              key={branch.id}
              onClick={() => onSelect(branch.id)}
              className={`
                relative p-4 rounded-xl border text-right transition-all duration-300
                hover:shadow-md hover:border-primary-300
                ${isSelected
                  ? 'border-primary-500 bg-primary-50/80 shadow-sm'
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                    isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold transition-colors duration-300 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                    {branch.name}
                  </h3>
                  {branch.address && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{branch.address}</span>
                    </p>
                  )}
                  {branch.phone && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{branch.phone}</span>
                    </p>
                  )}
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-3 left-3 animate-phone-scale-in">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
