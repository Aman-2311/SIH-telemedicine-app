import React from "react";
import { Pill, CheckCircle2, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { useMedicationStore } from "../../../store/useMedicationStore";

interface MedicationBannerProps {
  prescription: any;
  onOpenSchedule: () => void;
  onNavigateToRx: () => void;
}

export const MedicationBanner: React.FC<MedicationBannerProps> = ({
  prescription,
  onOpenSchedule,
  onNavigateToRx,
}) => {
  const { generateScheduleFromRx } = useMedicationStore();
  const {
    nextDose,
    bannerState,
    completedCount,
    totalTodayCount,
  } = generateScheduleFromRx(prescription);

  if (bannerState === "NO_ACTIVE_RX") {
    return (
      <div className="patient-adherence-banner bg-slate-50 border-slate-200">
        <div className="patient-adherence-left">
          <div className="patient-adherence-icon bg-slate-100 text-slate-500">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="patient-adherence-title text-slate-800">No active medicines</h3>
            <p className="patient-adherence-sub text-slate-500">
              You currently have no active prescription on record.
            </p>
          </div>
        </div>
        <button
          className="btn-clinical-outline text-xs py-2 px-4 shadow-sm"
          onClick={onNavigateToRx}
        >
          View Prescriptions
        </button>
      </div>
    );
  }

  if (bannerState === "ALL_COMPLETED") {
    return (
      <div className="patient-adherence-banner bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <div className="patient-adherence-left">
          <div className="patient-adherence-icon bg-emerald-100 text-emerald-700 shadow-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="patient-adherence-title text-emerald-950 flex items-center gap-2">
              <span>You're all caught up!</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {completedCount}/{totalTodayCount} Taken
              </span>
            </h3>
            <p className="patient-adherence-sub text-emerald-800/80">
              All scheduled medicines for today are marked as taken.
              {nextDose ? ` Next dose: ${nextDose.medicineName} (${nextDose.dayLabel}).` : ""}
            </p>
          </div>
        </div>
        <button
          className="btn-clinical-primary text-xs py-2 px-4 shadow-sm"
          onClick={onOpenSchedule}
        >
          View Schedule
        </button>
      </div>
    );
  }

  // UPCOMING or DUE_NOW
  return (
    <div className="patient-adherence-banner">
      <div className="patient-adherence-left">
        <div className="patient-adherence-icon">
          <Pill className="w-5 h-5" />
        </div>
        <div>
          <h3 className="patient-adherence-title">Take your medicines on time</h3>
          <p className="patient-adherence-sub">
            Stay consistent for a healthier you. Next dose:{" "}
            <strong className="text-slate-800">
              {nextDose
                ? `${nextDose.medicineName} · ${nextDose.dayLabel} · ${nextDose.slotLabel || nextDose.timeStr}`
                : "Scheduled as prescribed"}
            </strong>
          </p>
        </div>
      </div>
      <button
        className="btn-clinical-primary text-xs py-2 px-4 shadow-sm"
        onClick={onOpenSchedule}
      >
        View Schedule
      </button>
    </div>
  );
};
