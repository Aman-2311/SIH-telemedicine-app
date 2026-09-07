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
  onSuccess?: () => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  caseId,
  patientAbha,
  patientName,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { prescribe, isSubmittingPrescription, error, clearError } =
    useDoctorQueueStore();

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { name: "", dosage: "1-0-1", duration: "5 days", generic_alternative: "" },
  ]);
  const [activeGenericSuggestion, setActiveGenericSuggestion] = useState<{
    index: number;
    match: typeof GENERIC_CATALOG[string];
  } | null>(null);

  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) return;

    clearError();
    setSuccess(false);

    const validMedicines = medicines.filter((m) => m.name.trim() !== "");
    const payload: PrescribePayload = {
      doctor_id: user?.abha_id || "DOC-PUNE-402",
      diagnosis: diagnosis.trim(),
      medicines:
        validMedicines.length > 0
          ? validMedicines
          : [{ name: "Multivitamin & Hydration Salts", dosage: "1 OD", duration: "5 days" }],
    };

    const isOk = await prescribe(caseId, payload);
    if (isOk) {
      setSuccess(true);
      setDiagnosis("");
      setNotes("");
      setMedicines([{ name: "", dosage: "1-0-1", duration: "5 days", generic_alternative: "" }]);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="bg-white border-2 border-gray-300 rounded-2xl p-5 shadow-sm font-sans text-gray-900">
      <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3 mb-4">
        <div>
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
            <Pill className="w-4 h-4" />
            Official E-Prescription & Generic Substitutions
          </span>
          <h3 className="text-base font-extrabold text-blue-950 mt-0.5">
            Prescribe for Case: {caseId}
          </h3>
        </div>
        <span className="text-xs text-gray-600 font-mono font-bold bg-gray-100 px-2.5 py-1 rounded border">
          Consulting Doctor: {user?.abha_id || "DOC-PUNE-402"}
        </span>
      </div>

      {error && (
        <div className="p-3.5 mb-4 text-xs font-bold text-rose-900 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 mb-4 text-xs font-bold text-emerald-900 bg-emerald-50 border-2 border-emerald-400 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Prescription successfully logged to `/api/queue/{caseId}/prescribe` and patient case resolved!
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1.5">
            Clinical Diagnosis <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute Upper Respiratory Tract Infection / Stage 1 Hypertension"
            className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-2.5 text-base text-gray-900 font-bold placeholder-gray-400 focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Prescription Drugs & Dosages</span>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                Auto-Suggests PMBJP Jan Aushadhi Generics
              </span>
            </label>
            <button
              type="button"
              onClick={addMedicine}
              className="text-xs text-blue-900 hover:text-blue-950 font-extrabold flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
            >
              <Plus className="w-3.5 h-3.5" /> Add Drug Row
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((med, idx) => (
              <div
                key={idx}
                className="bg-gray-50 border-2 border-gray-300 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 font-bold placeholder-gray-400 focus:outline-none focus:border-blue-900"
                      placeholder="Type Brand (e.g. Augmentin, Dolo 650, Telma 40, Pan 40)"
                      value={med.name}
                      onChange={(e) => updateMedicine(idx, "name", e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      className="w-28 bg-white border-2 border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-900 font-bold placeholder-gray-400 focus:outline-none focus:border-blue-900"
                      placeholder="Dosage (1-0-1)"
                      value={med.dosage}
                      onChange={(e) =>
                        updateMedicine(idx, "dosage", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="w-28 bg-white border-2 border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-900 font-bold placeholder-gray-400 focus:outline-none focus:border-blue-900"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) =>
                        updateMedicine(idx, "duration", e.target.value)
                      }
                    />

                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(idx)}
                        className="text-gray-400 hover:text-rose-600 p-2 rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* DYNAMIC GENERIC SUGGESTION BANNER */}
                {activeGenericSuggestion?.index === idx && (
                  <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm animate-in slide-in-from-top-1">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-emerald-950 text-sm">
                          🌿 Recommend Government Generic:{" "}
                          <span className="text-blue-950 underline">
                            {activeGenericSuggestion.match.genericName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-800 mt-0.5 font-medium">
                          Jan Aushadhi:{" "}
                          <span className="text-emerald-900 font-extrabold">
                            {activeGenericSuggestion.match.genericPrice}
                          </span>{" "}
                          (vs Brand {activeGenericSuggestion.match.brandPrice}) •{" "}
                          <span className="text-emerald-800 font-extrabold">
                            Saves {activeGenericSuggestion.match.savings} for Patient
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        applyGeneric(idx, activeGenericSuggestion.match)
                      }
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0 shadow cursor-pointer transition-all"
                    >
                      <span>Apply Generic</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {med.generic_alternative && (
                  <div className="text-xs text-emerald-900 font-bold bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg">
                    ✓ {med.generic_alternative}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-1">
            Doctor Advice Notes / ASHA Follow-up Instructions
          </label>
          <textarea
            className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-blue-900"
            rows={2}
            placeholder="e.g. Take generic medications after food. Measure BP in 3 days. Hydrate regularly."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmittingPrescription || !diagnosis.trim()}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-base transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmittingPrescription ? (
            <span>Signing Prescription...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Sign & Dispatch E-Prescription</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
