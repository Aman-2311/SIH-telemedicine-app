import React from "react";
import { X, Pill, ShieldCheck, UserCheck } from "lucide-react";

interface MedicationDetailsDialogProps {
  medicine: any | null;
  onClose: () => void;
  doctorName?: string;
}

export const MedicationDetailsDialog: React.FC<MedicationDetailsDialogProps> = ({
  medicine,
  onClose,
  doctorName,
}) => {
  if (!medicine) return null;

  const name = medicine.name || medicine.medicineName;
  const dosage = medicine.dosage || medicine.instructions;
  const duration = medicine.duration || "As prescribed";
  const alternative = medicine.alternative || medicine.genericAlternative || medicine.generic_alternative;
  const price = medicine.janAushadhiPrice || medicine.generic_price;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in zoom-in-95">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{name}</h3>
              <span className="text-xs text-emerald-700 font-semibold">Active Prescription</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-600 space-y-3 mb-5">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1">Prescription Instructions:</span>
            <span className="text-slate-700">{dosage}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-500 block mb-0.5">Duration:</span>
              <span className="font-bold text-slate-800">{duration}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-500 block mb-0.5">Prescribed By:</span>
              <span className="font-bold text-slate-800">{doctorName || "Treating Physician"}</span>
            </div>
          </div>

          {alternative && (
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-950 block mb-1">Generic Alternative (Jan Aushadhi):</span>
              <div className="text-emerald-900 font-medium">{alternative}</div>
              {price && (
                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                  Verified Jan Aushadhi price: {price}
                </div>
              )}
            </div>
          )}

          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <span>
              Follow instructions as prescribed. For any adverse side effects or dosage questions, consult your doctor.
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-clinical-primary text-xs w-full py-2.5 font-semibold"
        >
          Close Details
        </button>
      </div>
    </div>
  );
};
