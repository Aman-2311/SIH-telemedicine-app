import React from "react";
import {
  X,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useNetworkStore } from "../../../store/useNetworkStore";
import { MedicationSchedule } from "./MedicationSchedule";

interface MedicationScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: any;
  onNavigateToRx: () => void;
  onShowToast: (msg: string) => void;
}

export const MedicationScheduleModal: React.FC<MedicationScheduleModalProps> = ({
  isOpen,
  onClose,
  prescription,
  onNavigateToRx,
  onShowToast,
}) => {
  const { isOnline } = useNetworkStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Medication Schedule</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Your prescribed medicines and today's schedule.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Offline (Changes saved on this device)
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <MedicationSchedule
            prescription={prescription}
            onShowToast={onShowToast}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => {
              onClose();
              onNavigateToRx();
            }}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4" />
            <span>View Full Prescription</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="btn-clinical-outline text-xs py-2 px-5 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
