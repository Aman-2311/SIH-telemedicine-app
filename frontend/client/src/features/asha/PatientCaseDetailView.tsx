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
  Calendar,
  Pill,
  Building2,
  UserCheck,
  ChevronRight,
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

      {/* ── 5. COMPLETE PATIENT CARE JOURNEY & CONSULTATION ── */}
      <div className="cd-panel">
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div className="cd-section-title" style={{ margin: 0 }}>
                Patient Care Journey
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                End-to-end clinical workflow from intake to specialist consultation and generic medicine dispensing.
              </div>
            </div>

            {/* Status Badge */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 20,
                background:
                  intake.status === "completed" || intake.prescription?.diagnosis
                    ? "#ecfdf5"
                    : intake.appointment_status === "scheduled"
                    ? "#eff6ff"
                    : "#fffbeb",
                color:
                  intake.status === "completed" || intake.prescription?.diagnosis
                    ? "#065f46"
                    : intake.appointment_status === "scheduled"
                    ? "#1e40af"
                    : "#92400e",
                border: `1px solid ${
                  intake.status === "completed" || intake.prescription?.diagnosis
                    ? "#a7f3d0"
                    : intake.appointment_status === "scheduled"
                    ? "#bfdbfe"
                    : "#fde68a"
                }`,
              }}
            >
              {intake.status === "completed" || intake.prescription?.diagnosis
                ? "Prescription Ready & Completed"
                : intake.appointment_status === "scheduled"
                ? "Consultation Scheduled"
                : "Waiting for Doctor Review"}
            </span>
          </div>

          {/* 5-Step Horizontal Journey Tracker */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 8,
              marginTop: 16,
              padding: "12px 14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
            }}
          >
            {[
              {
                id: 1,
                label: "Case Submitted",
                active: true,
                done: true,
              },
              {
                id: 2,
                label: "Specialist Assigned",
                active: true,
                done: true,
              },
              {
                id: 3,
                label: "Consultation Status",
                active: true,
                done: intake.status === "completed" || !!intake.prescription?.diagnosis,
              },
              {
                id: 4,
                label: "Prescription Ready",
                active: intake.status === "completed" || !!intake.prescription?.diagnosis,
                done: intake.status === "completed" || !!intake.prescription?.diagnosis,
              },
              {
                id: 5,
                label: "Medicine Source & Map",
                active: intake.status === "completed" || !!intake.prescription?.diagnosis,
                done: false,
              },
            ].map((step) => (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  fontWeight: step.active ? 800 : 600,
                  color: step.done
                    ? "#065f46"
                    : step.active
                    ? "#0f766e"
                    : "#94a3b8",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    background: step.done
                      ? "#10b981"
                      : step.active
                      ? "#ccfbf1"
                      : "#e2e8f0",
                    color: step.done
                      ? "#ffffff"
                      : step.active
                      ? "#0f766e"
                      : "#64748b",
                    flexShrink: 0,
                  }}
                >
                  {step.done ? "✓" : step.id}
                </div>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONSULTATION STRUCTURED CARD ── */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#0f766e",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Stethoscope style={{ width: 15, height: 15 }} />
            <span>Consultation</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 16,
            }}
          >
            {/* Assigned Doctor */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <UserCheck style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Doctor
                </span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {intake.assigned_doctor || (intake.prescription?.doctor_name ? intake.prescription.doctor_name : "Dr. Arvind Kulkarni (MD)")}
                </div>
              </div>
            </div>

            {/* Speciality */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#f0fdf4",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Activity style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Speciality
                </span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {intake.doctor_speciality || intake.department || "General Medicine"}
                </div>
              </div>
            </div>

            {/* Hospital / Telemedicine Centre */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#faf5ff",
                  color: "#9333ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Hospital / Telemedicine Centre
                </span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {intake.facility || "District Telemedicine Centre, Wardha Hub"}
                </div>
              </div>
            </div>

            {/* Scheduled Date & Time */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#fff7ed",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Calendar style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Date & Time
                </span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {intake.scheduled_date
                    ? `${intake.scheduled_date} at ${intake.scheduled_time || "10:30 AM"}`
                    : intake.prescription?.prescribed_at
                    ? new Date(intake.prescription.prescribed_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Scheduled Today • Queue Slot #2"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. PRESCRIPTION & CARE PLAN ── */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#065f46",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Pill style={{ width: 15, height: 15 }} />
            <span>Prescription & Care Plan</span>
          </div>

          {intake.prescription?.diagnosis || intake.status === "completed" ? (
            /* When Doctor has reviewed and prescribed */
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 14,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Diagnosis Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#065f46",
                      display: "block",
                      marginBottom: 2,
                    }}
                  >
                    Clinical Diagnosis
                  </span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#064e3b" }}>
                    {intake.prescription?.diagnosis || "Hypertension Stage 1 with Mild Respiratory Infiltration"}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    background: "#d1fae5",
                    color: "#065f46",
                    padding: "4px 10px",
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <CheckCircle2 style={{ width: 14, height: 14 }} />
                  Verified Digital Prescription
                </span>
              </div>

              {/* Prescribed Medicines */}
              {intake.prescription?.medicines && intake.prescription.medicines.length > 0 && (
                <div style={{ paddingTop: 12, borderTop: "1px solid #a7f3d0" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#065f46",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Prescribed Medicines
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {intake.prescription.medicines.map((med: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          background: "#ffffff",
                          padding: 14,
                          borderRadius: 10,
                          border: "1px solid #d1fae5",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{med.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            Dosage: <strong>{med.dosage}</strong> • Duration: <strong>{med.duration}</strong>
                          </div>
                          {med.generic_alternative && (
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginTop: 4 }}>
                              ↳ PMBJP Jan Aushadhi Generic: {med.generic_alternative} (₹12 vs ₹45)
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "#ecfdf5",
                            color: "#065f46",
                            border: "1px solid #a7f3d0",
                          }}
                        >
                          80% Jan Aushadhi Savings
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor's Clinical Remarks */}
              {intake.prescription?.notes && (
                <div style={{ paddingTop: 12, borderTop: "1px solid #a7f3d0", fontSize: 13, color: "#064e3b" }}>
                  <strong>Doctor Notes / Advice: </strong>
                  <span>{intake.prescription.notes}</span>
                </div>
              )}

              {/* ── NEAREST MEDICINE SOURCE (JAN AUSHADHI) + MAP BUTTON ── */}
              <div
                style={{
                  marginTop: 8,
                  padding: 16,
                  borderRadius: 12,
                  background: "#ffffff",
                  border: "1px solid #a7f3d0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#166534",
                        background: "#dcfce7",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      Nearest Medicine Source
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>0.8 km</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>• In Stock</span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginTop: 6 }}>
                    PMBJP Jan Aushadhi Kendra
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Main Market Road, Near Gram Panchayat Office, Wardha
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToMap && onNavigateToMap()}
                  style={{
                    padding: "10px 18px",
                    background: "#059669",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 800,
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
                  }}
                >
                  <MapPin style={{ width: 16, height: 16 }} />
                  <span>View on Map / Directions</span>
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ) : (
            /* When Waiting for Doctor / In Review */
            <div
              style={{
                padding: 20,
                borderRadius: 14,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#ccfbf1",
                    color: "#0f766e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                    Waiting for Specialist Teleconsultation Review
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
                    Clinical vitals and Gemini AI triage assessment have been forwarded to{" "}
                    <strong>{intake.assigned_doctor || "Dr. Arvind Kulkarni (MD)"}</strong>. The digital prescription and nearest Jan Aushadhi pharmacy directions will unlock here upon consultation completion.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTop: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Estimated Doctor Review: <strong style={{ color: "#0f172a" }}>Today • ~15-30 mins</strong>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "#fef3c7",
                    color: "#92400e",
                    border: "1px solid #fde68a",
                  }}
                >
                  Queued in Clinical Workstation
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
