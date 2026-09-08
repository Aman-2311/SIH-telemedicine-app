import React from "react";
import { Pill, Sparkles, ChevronRight } from "lucide-react";

interface MedicationCardProps {
  medicine: any;
  nextScheduledDose?: string;
  onClick?: () => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medicine,
  nextScheduledDose,
  onClick,
}) => {
  const name = medicine?.name || "Prescribed Medicine";
  const dosage = medicine?.dosage || "As directed";
  const duration = medicine?.duration || "Course as prescribed";
  const alternative = medicine?.alternative || medicine?.generic_alternative;

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500 shadow-sm transition cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 text-sm">{name}</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            Active
          </span>
        </div>

        <div className="text-xs text-slate-600 mb-1 leading-relaxed">{dosage}</div>
        <div className="text-[11px] text-slate-400 font-medium">Duration: {duration}</div>

        {nextScheduledDose && (
          <div className="text-[11px] text-teal-700 font-semibold mt-1">
            Next dose: {nextScheduledDose}
          </div>
        )}
      </div>

      {alternative && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-800 font-semibold">
          <span className="flex items-center gap-1 truncate">
            <Sparkles className="w-3 h-3 text-teal-600 flex-shrink-0" />
            <span className="truncate">Jan Aushadhi: {alternative}</span>
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0 ml-1" />
        </div>
      )}
    </div>
  );
};
