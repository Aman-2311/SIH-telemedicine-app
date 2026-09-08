import React from "react";

interface MedicationProgressProps {
  completedCount: number;
  totalCount: number;
}

export const MedicationProgress: React.FC<MedicationProgressProps> = ({
  completedCount,
  totalCount,
}) => {
  const percent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  return (
    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/80 rounded-xl p-4">
      <div className="flex items-center justify-between text-xs font-bold text-teal-950 mb-2">
        <span>Today's progress</span>
        <span className="text-teal-800 font-semibold">
          {completedCount} of {totalCount} doses completed ({percent}%)
        </span>
      </div>
      <div className="w-full bg-teal-200/50 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-teal-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
