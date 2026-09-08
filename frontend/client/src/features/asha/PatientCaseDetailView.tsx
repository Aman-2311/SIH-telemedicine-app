import React, { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Gauge,
  Thermometer,
  Activity,
  Stethoscope,
  Clock,
  CheckCircle2,
  MapPin,
  Info,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { SubmittedIntakeRecord, useIntakeStore } from "../../store/useIntakeStore";

interface PatientCaseDetailViewProps {
  intake: SubmittedIntakeRecord;
  onBack: () => void;
  onNavigateToMap?: (facilityId?: string) => void;
}

export const PatientCaseDetailView: React.FC<PatientCaseDetailViewProps> = ({
  intake,
  onBack,
  onNavigateToMap,
}) => {
  const { syncPendingIntake } = useIntakeStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const priorityLower = (intake.triage_priority || "Routine").toLowerCase();
  const isHigh = priorityLower === "high" || priorityLower === "urgent";
  const isMedium = priorityLower === "medium" || priorityLower === "moderate";
  const isSynced = intake.synced;
  const vitals = intake.vitals || ({} as any);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await syncPendingIntake(intake.id);
    setIsSyncing(false);
    setSyncFeedback(result.message);
  };

  return (
    <div className="cd-wrapper fade-in">
      {/* ── Top Navigation Bar ── */}
      <div className="cd-top-bar">
        <button onClick={onBack} className="cd-back-btn">
          <ArrowLeft style={{ width: 16, height: 16 }} />
          <span>Back to Patients</span>
        </button>

        <span className="cd-case-id">
          Case ID: #{String(intake.case_id || intake.id).replace("case-", "").slice(0, 8)}
        </span>
      </div>

      {/* ── Sync Alert Banner if not yet synced ── */}
      {!isSynced && (
        <div style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 14,
          padding: 18,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#fef3c7",
              color: "#b45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 2
            }}>
              <Clock style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#78350f" }}>
                Pending Sync to Doctor Queue
              </div>
              <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
                This intake was recorded offline. Click to dispatch directly to Dr. Arvind Kulkarni's clinical queue.
              </div>
              {syncFeedback && (
                <div style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#065f46",
                  background: "#d1fae5",
                  padding: "3px 8px",
                  borderRadius: 6,
                  display: "inline-block"
                }}>
                  {syncFeedback}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            style={{
              padding: "9px 16px",
              background: "#d97706",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
            <span>{isSyncing ? "Syncing..." : "Sync to Doctor Now"}</span>
          </button>
        </div>
      )}

      {/* ── 1. PATIENT HEADER CARD ── */}
      <div className="cd-patient-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="cd-patient-avatar">
            {(intake.patient_name || "P")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 className="cd-patient-name">{intake.patient_name}</h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: isHigh ? "#ffe4e6" : isMedium ? "#fef3c7" : "#eff6ff",
                  color: isHigh ? "#9f1239" : isMedium ? "#92400e" : "#1e40af",
                  border: `1px solid ${isHigh ? "#fecdd3" : isMedium ? "#fde68a" : "#bfdbfe"}`
                }}
              >
                {intake.triage_priority || "Routine"} Priority
              </span>
            </div>
            <div className="cd-meta-row">
              <span>ABHA ID: <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{intake.abha_id}</strong></span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <span>{intake.department || "General Medicine"}</span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <span>{intake.timestamp || "Today"}</span>
            </div>
          </div>
        </div>

        <div>
          {isSynced ? (
            <span className="cd-badge-synced">
              <CheckCircle2 style={{ width: 15, height: 15, color: "#059669" }} />
              <span>Synced to Doctor</span>
            </span>
          ) : (
            <span className="cd-badge-pending">
              <Clock style={{ width: 15, height: 15, color: "#d97706" }} />
              <span>Pending Sync</span>
            </span>
          )}
        </div>
      </div>

      {/* ── 2. RECORDED VITALS (Large, Spacious, Non-Clipping) ── */}
      <div style={{ marginBottom: 24 }}>
        <div className="cd-section-title">Recorded Clinical Vitals</div>
        <div className="cd-vitals-grid">
          {/* Blood Pressure */}
          <div className="cd-vital-card">
            <div className="cd-vital-top">
              <span className="cd-vital-label">Blood Pressure</span>
              <div className="cd-vital-icon-wrap" style={{ background: "#f0f9ff", color: "#0284c7" }}>
                <Gauge style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div>
              <div className="cd-vital-val">{vitals.bp || "--"}</div>
              <div className="cd-vital-unit">mmHg</div>
            </div>
          </div>

          {/* Pulse Rate */}
          <div className="cd-vital-card">
            <div className="cd-vital-top">
              <span className="cd-vital-label">Pulse Rate</span>
              <div className="cd-vital-icon-wrap" style={{ background: "#fff1f2", color: "#e11d48" }}>
                <Heart style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div>
              <div className="cd-vital-val">{vitals.pulse || "--"}</div>
              <div className="cd-vital-unit">beats / min</div>
            </div>
          </div>

          {/* Temperature */}
          <div className="cd-vital-card">
            <div className="cd-vital-top">
              <span className="cd-vital-label">Temperature</span>
              <div className="cd-vital-icon-wrap" style={{ background: "#fffbeb", color: "#d97706" }}>
                <Thermometer style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div>
              <div className="cd-vital-val">{vitals.temp || "--"}</div>
              <div className="cd-vital-unit">°Fahrenheit</div>
            </div>
          </div>

          {/* Oxygen (SpO2) */}
          <div className="cd-vital-card">
            <div className="cd-vital-top">
              <span className="cd-vital-label">Oxygen SpO₂</span>
              <div className="cd-vital-icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
                <Activity style={{ width: 18, height: 18 }} />
              </div>
            </div>
            <div>
              <div className="cd-vital-val">{vitals.spo2 ? `${vitals.spo2}%` : "--"}</div>
              <div className="cd-vital-unit">Blood Oxygen</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. SYMPTOM DICTATION & CLINICAL TRANSLATION ── */}
      <div style={{ marginBottom: 24 }}>
        <div className="cd-section-title">Symptom Dictation & Translation</div>
        <div className="cd-symptom-grid">
          {/* Patient Dictation */}
          <div className="cd-symptom-card">
            <div className="cd-card-header">
              <span className="cd-card-title">Patient Voice Note</span>
              <span className="cd-card-tag">Local Speech</span>
            </div>
            <p className="cd-symptom-text" style={{ fontStyle: "italic" }}>
              "{intake.symptoms || "No audio note recorded."}"
            </p>
          </div>

          {/* AI Clinical Translation */}
          <div className="cd-symptom-card-nlp">
            <div className="cd-card-header">
              <span className="cd-card-title" style={{ color: "#0f766e", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles style={{ width: 14, height: 14 }} />
                Clinical Translation
              </span>
              <span className="cd-card-tag" style={{ background: "#ccfbf1", color: "#0f766e" }}>
                Gemini Clinical NLP
              </span>
            </div>
            <p className="cd-symptom-text-nlp">
              {intake.translated_symptoms || intake.symptoms || "Evaluation complete."}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. AI TRIAGE ASSESSMENT ── */}
      <div className="cd-panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>AI Triage Assessment</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 12,
                background: isHigh ? "#ffe4e6" : isMedium ? "#fef3c7" : "#eff6ff",
                color: isHigh ? "#9f1239" : isMedium ? "#92400e" : "#1e40af"
              }}
            >
              {intake.triage_priority || "Routine"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Recommended Department: <strong style={{ color: "#0f172a" }}>{intake.department || "General Medicine"}</strong>
          </span>
        </div>

        {intake.ai_recommendation && (
          <div style={{
            background: "#f8fafc",
            border: "1px solid #f1f5f9",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            lineHeight: 1.6,
            color: "#334155",
            marginBottom: 12
          }}>
            {intake.ai_recommendation}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8" }}>
          <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>AI-assisted triage. Clinical decisions and prescriptions are verified by consulting doctors.</span>
        </div>
      </div>

      {/* ── 5. DOCTOR TELECONSULTATION STATUS & PRESCRIPTION ── */}
      <div className="cd-panel">
        <div className="cd-section-title" style={{ marginBottom: 14 }}>
          Teleconsultation Status & Treatment Plan
        </div>

        {intake.status === "completed" && intake.prescription?.diagnosis ? (
          /* When Doctor has finished reviewing and prescribed */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#065f46", display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 style={{ width: 18, height: 18, color: "#059669" }} />
                Prescription Ready
              </span>
              {intake.prescription?.doctor_name && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "4px 12px", borderRadius: 8 }}>
                  By {intake.prescription.doctor_name}
                </span>
              )}
            </div>

            <div style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 14,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#065f46", display: "block", marginBottom: 2 }}>
                  Diagnosis
                </span>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#064e3b", margin: 0 }}>
                  {intake.prescription.diagnosis}
                </p>
              </div>

              {intake.prescription.medicines && intake.prescription.medicines.length > 0 && (
                <div style={{ paddingTop: 10, borderTop: "1px solid #a7f3d0" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#065f46", display: "block", marginBottom: 8 }}>
                    Prescribed Medicines
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {intake.prescription.medicines.map((med: any, idx: number) => (
                      <div key={idx} style={{ background: "#ffffff", padding: 12, borderRadius: 10, border: "1px solid #d1fae5" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{med.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          {med.dosage} • {med.duration}
                        </div>
                        {med.generic_alternative && (
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginTop: 4 }}>
                            ↳ Jan Aushadhi Affordable Generic: {med.generic_alternative}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {intake.prescription.notes && (
                <div style={{ paddingTop: 10, borderTop: "1px solid #a7f3d0", fontSize: 12, color: "#065f46" }}>
                  <strong>Doctor's Advice: </strong>{intake.prescription.notes}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* When waiting in doctor queue */
          <div style={{
            padding: 18,
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#ccfbf1",
                color: "#0f766e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <Stethoscope style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  Queued for Teleconsultation Doctor Review
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>
                  Case is active in Dr. Arvind Kulkarni's queue. Digital prescription will appear here once reviewed.
                </div>
              </div>
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "5px 12px",
              borderRadius: 8,
              background: "#fef3c7",
              color: "#92400e",
              border: "1px solid #fde68a",
              whiteSpace: "nowrap"
            }}>
              Awaiting Doctor
            </span>
          </div>
        )}
      </div>

      {/* ── 6. RECOMMENDED CARE FACILITIES ── */}
      <div className="cd-panel">
        <div style={{ marginBottom: 14 }}>
          <div className="cd-section-title">Recommended Care Facilities</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            Nearby Jan Aushadhi generic pharmacy and referral hospital.
          </div>
        </div>

        <div className="cd-facilities-grid">
          {/* Pharmacy */}
          <div className="cd-facility-card" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", border: "1px solid #bbf7d0" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: 6 }}>
                  Generic Pharmacy (80% Off)
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>0.8 km</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginTop: 6 }}>
                PMBJP Jan Aushadhi Kendra
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                Main Market Road, Near Panchayat Office
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => onNavigateToMap && onNavigateToMap()}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#166534",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <MapPin style={{ width: 14, height: 14 }} />
                <span>View on Map</span>
              </button>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>Open 24/7</span>
            </div>
          </div>

          {/* Hospital */}
          <div className="cd-facility-card" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #fff7ed 100%)", border: "1px solid #fecdd3" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#9f1239", background: "#ffe4e6", padding: "2px 8px", borderRadius: 6 }}>
                  Emergency & Inpatient
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#9f1239" }}>2.9 km</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginTop: 6 }}>
                District Civil Hospital
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                Civil Lines, 24/7 Casualty & Diagnostic Lab
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #fecdd3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => onNavigateToMap && onNavigateToMap()}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9f1239",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <MapPin style={{ width: 14, height: 14 }} />
                <span>View on Map</span>
              </button>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#be123c" }}>Emergency Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
