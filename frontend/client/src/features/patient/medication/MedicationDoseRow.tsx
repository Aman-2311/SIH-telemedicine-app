import React from "react";
import { Pill } from "lucide-react";
import { MedicationScheduleItem } from "../../../store/useMedicationStore";
import { DoseStatus } from "./DoseStatus";

interface MedicationDoseRowProps {
  dose: MedicationScheduleItem;
  onMarkAsTaken?: (dose: MedicationScheduleItem) => void;
  showMarkButton?: boolean;
}

export const MedicationDoseRow: React.FC<MedicationDoseRowProps> = ({
  dose,
  onMarkAsTaken,
  showMarkButton = true,
}) => {
  const isTaken = dose.status === "taken";

  return (
    <div
      className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
        isTaken
          ? "bg-emerald-50/50 border-emerald-200"
          : "bg-white border-slate-200 hover:border-teal-400 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
            isTaken
              ? "bg-emerald-100 text-emerald-800"
              : "bg-teal-50 text-teal-700"
          }`}
        >
          <Pill className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm truncate">
              {dose.medicineName}
            </span>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              · {dose.slotLabel}
            </span>
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">
            {dose.instructions}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isTaken ? (
          <DoseStatus status="taken" takenAt={dose.takenAt} />
        ) : showMarkButton ? (
          <button
            onClick={() => onMarkAsTaken && onMarkAsTaken(dose)}
            className="btn-clinical-primary text-xs py-1.5 px-3.5 font-semibold shadow-sm"
          >
            Mark as Taken
          </button>
        ) : (
          <DoseStatus status={dose.status} />
        )}
      </div>
    </div>
  );
};
