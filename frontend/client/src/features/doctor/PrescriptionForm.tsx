import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Pill,
  ArrowRight,
} from "lucide-react";
import { MedicineItem, PrescribePayload } from "../../utils/api";
import { useDoctorQueueStore } from "../../store/useDoctorQueueStore";
import { useAuthStore } from "../../store/useAuthStore";

// Extensive Brand to PMBJP Generic mapping dictionary
const GENERIC_CATALOG: Record<
  string,
  {
    genericName: string;
    genericPrice: string;
    brandPrice: string;
    savings: string;
    pmbjpCode: string;
    standardDosage: string;
  }
> = {
  dolo: {
    genericName: "Paracetamol IP 650mg",
    genericPrice: "₹12 (10 tabs)",
    brandPrice: "₹35 (10 tabs)",
    savings: "65%",
    pmbjpCode: "PMBJP-002",
    standardDosage: "1 tab SOS after food",
  },
  paracetamol: {
    genericName: "Paracetamol IP 500mg",
    genericPrice: "₹9 (10 tabs)",
    brandPrice: "₹24 (10 tabs)",
    savings: "62%",
    pmbjpCode: "PMBJP-001",
    standardDosage: "1 tab TDS",
  },
  augmentin: {
    genericName: "Amoxicillin & Potassium Clavulanate 625mg",
    genericPrice: "₹32 (6 tabs)",
    brandPrice: "₹205 (6 tabs)",
    savings: "84%",
    pmbjpCode: "PMBJP-104",
    standardDosage: "1 tab BD for 5 days",
  },
  moxikind: {
    genericName: "Amoxicillin 500mg IP",
    genericPrice: "₹22 (10 caps)",
    brandPrice: "₹88 (10 caps)",
    savings: "75%",
    pmbjpCode: "PMBJP-101",
    standardDosage: "1 cap TDS for 5 days",
  },
  azithral: {
    genericName: "Azithromycin 500mg IP",
    genericPrice: "₹28 (3 tabs)",
    brandPrice: "₹130 (3 tabs)",
    savings: "78%",
    pmbjpCode: "PMBJP-115",
    standardDosage: "1 tab OD before meals",
  },
  telma: {
    genericName: "Telmisartan 40mg IP",
    genericPrice: "₹14 (10 tabs)",
    brandPrice: "₹118 (10 tabs)",
    savings: "88%",
    pmbjpCode: "PMBJP-088",
    standardDosage: "1 tab OD morning",
  },
  pan: {
    genericName: "Pantoprazole 40mg Gastro-Resistant IP",
    genericPrice: "₹18 (10 tabs)",
    brandPrice: "₹145 (10 tabs)",
    savings: "87%",
    pmbjpCode: "PMBJP-045",
    standardDosage: "1 tab OD empty stomach",
  },
  pantocid: {
    genericName: "Pantoprazole 40mg IP",
    genericPrice: "₹18 (10 tabs)",
    brandPrice: "₹160 (10 tabs)",
    savings: "88%",
    pmbjpCode: "PMBJP-045",
    standardDosage: "1 tab OD empty stomach",
  },
  glycomet: {
    genericName: "Metformin Hydrochloride Prolonged-Release 500mg",
    genericPrice: "₹11 (10 tabs)",
    brandPrice: "₹62 (10 tabs)",
    savings: "82%",
    pmbjpCode: "PMBJP-210",
    standardDosage: "1 tab BD with meals",
  },
  metformin: {
    genericName: "Metformin 500mg IP",
    genericPrice: "₹11 (10 tabs)",
    brandPrice: "₹55 (10 tabs)",
    savings: "80%",
    pmbjpCode: "PMBJP-210",
    standardDosage: "1 tab BD with meals",
  },
  lipitor: {
    genericName: "Atorvastatin 10mg IP",
    genericPrice: "₹16 (10 tabs)",
    brandPrice: "₹190 (10 tabs)",
    savings: "91%",
    pmbjpCode: "PMBJP-076",
    standardDosage: "1 tab OD bedtime",
  },
  atorva: {
    genericName: "Atorvastatin 10mg IP",
    genericPrice: "₹16 (10 tabs)",
    brandPrice: "₹145 (10 tabs)",
    savings: "89%",
    pmbjpCode: "PMBJP-076",
    standardDosage: "1 tab OD bedtime",
  },
  cetrizine: {
    genericName: "Cetirizine Hydrochloride 10mg IP",
    genericPrice: "₹6 (10 tabs)",
    brandPrice: "₹38 (10 tabs)",
    savings: "84%",
    pmbjpCode: "PMBJP-015",
    standardDosage: "1 tab OD night",
  },
  montair: {
    genericName: "Montelukast 10mg + Levocetirizine 5mg",
    genericPrice: "₹30 (10 tabs)",
    brandPrice: "₹195 (10 tabs)",
    savings: "84%",
    pmbjpCode: "PMBJP-312",
    standardDosage: "1 tab OD night",
  },
  combiflam: {
    genericName: "Ibuprofen 400mg + Paracetamol 325mg",
    genericPrice: "₹14 (10 tabs)",
    brandPrice: "₹52 (10 tabs)",
    savings: "73%",
    pmbjpCode: "PMBJP-008",
    standardDosage: "1 tab BD after food",
  },
};

interface PrescriptionFormProps {
  caseId: string;
  patientAbha?: string;
  patientName?: string;
  onSuccess?: (details: { caseId: string; patientName: string; diagnosis: string; timestamp: string }) => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  caseId,
  patientAbha,
  patientName = "Patient",
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { prescribe, isSubmittingPrescription, error, clearError } =
    useDoctorQueueStore();

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { name: "Paracetamol 500mg", dosage: "500 mg", duration: "3 days", generic_alternative: "PMBJP-001 Generic" },
    { name: "ORS", dosage: "1 sachet", duration: "3 days", generic_alternative: "" },
  ]);
  const [activeGenericSuggestion, setActiveGenericSuggestion] = useState<{
    index: number;
    match: typeof GENERIC_CATALOG[string];
  } | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  const checkGenericSuggestion = (text: string, index: number) => {
    const lower = text.toLowerCase().trim();
    if (!lower) {
      setActiveGenericSuggestion(null);
      return;
    }

    const matchKey = Object.keys(GENERIC_CATALOG).find(
      (k) => lower.includes(k) || k.includes(lower)
    );

    if (matchKey && GENERIC_CATALOG[matchKey]) {
      setActiveGenericSuggestion({
        index,
        match: GENERIC_CATALOG[matchKey],
      });
    } else {
      setActiveGenericSuggestion(null);
    }
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { name: "", dosage: "1-0-1", duration: "5 days", generic_alternative: "" },
    ]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
    if (activeGenericSuggestion?.index === index) {
      setActiveGenericSuggestion(null);
    }
  };

  const updateMedicine = (
    index: number,
    field: keyof MedicineItem,
    value: string
  ) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);

    if (field === "name") {
      checkGenericSuggestion(value, index);
    }
  };

  const applyGeneric = (index: number, match: typeof GENERIC_CATALOG[string]) => {
    const updated = [...medicines];
    updated[index].name = match.genericName;
    updated[index].dosage = match.standardDosage;
    updated[index].generic_alternative = `${match.pmbjpCode} (PMBJP: ${match.genericPrice} vs Brand ${match.brandPrice} - Saves ${match.savings})`;
    setMedicines(updated);
    setActiveGenericSuggestion(null);
  };

  const handleSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) return;

    clearError();

    const validMedicines = medicines.filter((m) => m.name.trim() !== "");
    const payload: PrescribePayload = {
      doctor_id: user?.abha_id || "DOCTOR-MH-7313",
      diagnosis: diagnosis.trim(),
      medicines:
        validMedicines.length > 0
          ? validMedicines
          : [{ name: "Multivitamin & Hydration Salts", dosage: "1 OD", duration: "5 days" }],
    };

    const isOk = await prescribe(caseId, payload);
    if (isOk) {
      const now = new Date();
      const timeStr = `${now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      if (onSuccess) {
        onSuccess({
          caseId,
          patientName,
          diagnosis: diagnosis.trim(),
          timestamp: timeStr,
        });
      }
    }
  };

  return (
    <div className="clinical-card p-6 space-y-4 text-slate-900">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 mb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">E-Prescription</span>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                Case #{caseId}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              Prescribe for {patientName}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 block">
            {user?.abha_id || "DOCTOR-MH-7313"}
          </span>
          {draftSaved && (
            <span className="text-xs font-bold text-emerald-600 block mt-1">
              ✓ Draft saved
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Diagnosis Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Diagnosis <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {diagnosis.length}/500
            </span>
          </div>
          <input
            type="text"
            required
            maxLength={500}
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Viral fever with dehydration / Acute Bronchitis"
            className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
          />
        </div>

        {/* Medicines Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Medicines & Generic Alternatives
            </label>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Jan Aushadhi Generics
            </span>
          </div>

          <div className="space-y-2.5">
            {medicines.map((med, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2"
              >
                <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    className="flex-1 min-w-[140px] h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                    placeholder="Medicine (e.g. Paracetamol, Dolo)"
                    value={med.name}
                    onChange={(e) => updateMedicine(idx, "name", e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-24 h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                    placeholder="Dosage"
                    value={med.dosage}
                    onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-24 h-10 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                    placeholder="Duration"
                    value={med.duration}
                    onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                  />
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(idx)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Remove medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* DYNAMIC GENERIC SUGGESTION BANNER */}
                {activeGenericSuggestion?.index === idx && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-1">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-emerald-950 text-xs">
                          Generic Alternative:{" "}
                          <span className="text-blue-900 underline font-bold">
                            {activeGenericSuggestion.match.genericName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 mt-0.5">
                          PMBJP: <span className="font-bold text-emerald-800">{activeGenericSuggestion.match.genericPrice}</span> (vs Brand {activeGenericSuggestion.match.brandPrice}) •{" "}
                          <span className="font-bold text-emerald-700">Saves {activeGenericSuggestion.match.savings}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        applyGeneric(idx, activeGenericSuggestion.match)
                      }
                      className="btn-clinical-primary !h-8 !px-3 text-xs !bg-emerald-700 hover:!bg-emerald-800 shrink-0"
                    >
                      <span>Use Generic</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {med.generic_alternative && (
                  <div className="text-xs text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-md">
                    ✓ {med.generic_alternative}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMedicine}
            className="btn-clinical-outline !h-10 text-xs font-bold mt-2.5 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-blue-700" />
            <span>Add Medicine</span>
          </button>
        </div>

        {/* Doctor Advice Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Advice & ASHA Follow-up Instructions
          </label>
          <textarea
            className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
            rows={3}
            placeholder="e.g. Ensure oral rehydration solution. Re-check temperature if pyrexia persists."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Action Row */}
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="btn-clinical-outline flex-1 justify-center !h-12 text-sm font-bold"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmittingPrescription || !diagnosis.trim()}
            className="btn-clinical-primary flex-2 justify-center !h-12 text-sm font-bold shadow-md shadow-blue-500/20"
          >
            {isSubmittingPrescription ? (
              <span>Signing Prescription...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Sign & Submit Prescription</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
