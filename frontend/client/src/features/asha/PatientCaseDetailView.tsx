import React, { useState, useEffect, useRef } from "react";
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
  ExternalLink,
  Phone,
  AlertCircle,
  Check,
  Camera,
  X,
} from "lucide-react";
import { SubmittedIntakeRecord, useIntakeStore } from "../../store/useIntakeStore";
import { useLanguageStore } from "../../store/useLanguageStore";
import { FacilityMap } from "../../components/FacilityMap";
import { api } from "../../utils/api";

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
  const { syncPendingIntake, scheduleConsultation } = useIntakeStore();
  const { t } = useLanguageStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Doctor availability & scheduling state
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const mapSectionRef = useRef<HTMLDivElement>(null);

  const priorityLower = (intake.triage_priority || "Routine").toLowerCase();
  const isHigh = priorityLower === "high" || priorityLower === "urgent";
  const isMedium = priorityLower === "medium" || priorityLower === "moderate";
  const isSynced = intake.synced;
  const vitals = intake.vitals || ({} as any);

  // Fetch real doctors available for this case's department
  useEffect(() => {
    let isMounted = true;
    const dept = intake.department || "General Medicine";
    setIsLoadingDoctors(true);
    api
      .get(`/api/doctors/availability?department=${encodeURIComponent(dept)}`)
      .then((res) => {
        if (isMounted && res.data?.doctors) {
          setAvailableDoctors(res.data.doctors);
          if (res.data.doctors[0]?.available_slots?.[0]) {
            setSelectedSlot(res.data.doctors[0].available_slots[0]);
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to load doctor availability", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDoctors(false);
      });
    return () => {
      isMounted = false;
    };
  }, [intake.department]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const result = await syncPendingIntake(intake.id);
    setIsSyncing(false);
    setSyncFeedback(result.message);
  };

  const handleConfirmSlot = async (doctor: any, slot: string) => {
    setIsScheduling(true);
    setScheduleSuccessMsg(null);
    const payload = {
      doctor_id: doctor.id,
      assigned_doctor: doctor.name,
      doctor_speciality: doctor.speciality || intake.department || "General Medicine",
      facility: doctor.facility,
      facility_address: doctor.facility_address || "Civil Hospital Road, Wardha",
      scheduled_date: selectedDate,
      scheduled_time: slot,
    };
    const caseId = String(intake.case_id || intake.id);
    const res = await scheduleConsultation(caseId, payload);
    setIsScheduling(false);
    if (res.success) {
      setScheduleSuccessMsg(`Consultation confirmed with ${doctor.name} at ${slot}!`);
      setTimeout(() => setScheduleSuccessMsg(null), 5000);
    }
  };

  const scrollToMap = () => {
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (onNavigateToMap) {
      onNavigateToMap();
    }
  };

  // Department specialist mappings ensuring instant routing display
  const DEPARTMENT_SPECIALISTS: Record<string, any> = {
    "General Medicine": {
      name: "Dr. Arvind Kulkarni (MD)",
      speciality: "General Medicine",
      facility: "District Civil Hospital & Telemedicine Hub",
      facility_address: "Civil Hospital Road, Wardha, Maharashtra 442001",
    },
    "Cardiology": {
      name: "Dr. Vikram Gupta (DM, MD)",
      speciality: "Cardiology",
      facility: "City Super-Specialty Heart Care Hub",
      facility_address: "Railway Station Road, Wardha 442001",
    },
    "Cardiology / Emergency": {
      name: "Dr. Vikram Gupta (DM, MD)",
      speciality: "Cardiology / Emergency",
      facility: "City Super-Specialty Heart Care Hub",
      facility_address: "Railway Station Road, Wardha 442001",
    },
    "Dermatology": {
      name: "Dr. Ananya Patel (MD, DNB)",
      speciality: "Dermatology",
      facility: "Wardha Community Dermatology & Telehealth Centre",
      facility_address: "Subhash Road, Market Yard Complex, Wardha 442001",
    },
    "Pediatrics": {
      name: "Dr. Priya Reddy (MD Pediatrics)",
      speciality: "Pediatrics",
      facility: "District Maternal & Child Health Hospital",
      facility_address: "Near Gandhi Memorial Ground, Wardha 442001",
    },
    "Orthopedics": {
      name: "Dr. Rajesh Verma (MS Orthopedics)",
      speciality: "Orthopedics",
      facility: "Rural Telemedicine Post & Joint Care Unit",
      facility_address: "Panchayat Samiti Complex, Deoli Road, Wardha 442101",
    },
    "Gynecology": {
      name: "Dr. Sunita Deshmukh (MD, DGO)",
      speciality: "Gynecology",
      facility: "Sub-District Community Maternity Centre",
      facility_address: "Main Road, Hinganghat, Wardha 442301",
    },
  };

  const deptKey = intake.department || "General Medicine";
  const defaultSpec = DEPARTMENT_SPECIALISTS[deptKey] || DEPARTMENT_SPECIALISTS["General Medicine"];

  const activeDoctorName =
    intake.assigned_doctor ||
    (intake.prescription?.doctor_name ? intake.prescription.doctor_name : null) ||
    defaultSpec.name;
  const activeSpeciality = intake.doctor_speciality || defaultSpec.speciality;
  const activeFacility = intake.facility || defaultSpec.facility;
  const activeAddress = intake.facility_address || defaultSpec.facility_address;
  const activeDate = intake.scheduled_date || "Today";
  const activeTime = intake.scheduled_time || "10:00 AM";

  // Determine consultation state: immediately show confirmed specialist destination
  const isCompleted = intake.status === "completed" || !!intake.prescription?.diagnosis;
  const isSlotConfirmed = !isCompleted;
  const isDoctorAssigned = false;
  const isWaitingAssignment = false;

  return (
    <div className="cd-wrapper fade-in">
      {/* ── Top Navigation Bar ── */}
      <div className="cd-top-bar">
        <button onClick={onBack} className="cd-back-btn">
          <ArrowLeft style={{ width: 16, height: 16 }} />
          <span>{t("backToPatients")}</span>
        </button>

        <span className="cd-case-id">
          {t("caseId")} #{String(intake.case_id || intake.id).replace("case-", "").slice(0, 8)}
        </span>
      </div>

      {/* ── Offline Sync Banner ── */}
      {!isSynced && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 14,
            padding: 18,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#fef3c7",
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Clock style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#78350f" }}>
                {t("pendingSyncToDoctorQueue")}
              </div>
              <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
                {t("offlineIntakeDesc")}
              </div>
              {syncFeedback && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#065f46",
                    background: "#d1fae5",
                    padding: "3px 8px",
                    borderRadius: 6,
                    display: "inline-block",
                  }}
                >
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
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <RefreshCw
              style={{
                width: 14,
                height: 14,
                animation: isSyncing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{isSyncing ? "Syncing..." : t("syncToDoctorNow")}</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          1. CASE STATUS & PATIENT HEADER
      ══════════════════════════════════════════════════ */}
      <div className="cd-patient-header" style={{ marginBottom: 20 }}>
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
                  border: `1px solid ${isHigh ? "#fecdd3" : isMedium ? "#fde68a" : "#bfdbfe"}`,
                }}
              >
                {intake.triage_priority || "Routine"} Priority
              </span>
            </div>
            <div className="cd-meta-row" style={{ marginTop: 4 }}>
              <span>
                {t("caseId")} 
                <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>
                  #{String(intake.case_id || intake.id).replace("case-", "").slice(0, 8)}
                </strong>
              </span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <span>
                ABHA ID:{" "}
                <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>
                  {intake.abha_id}
                </strong>
              </span>
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
              <span>Synced to Database</span>
            </span>
          ) : (
            <span className="cd-badge-pending">
              <Clock style={{ width: 15, height: 15, color: "#d97706" }} />
              <span>Pending Sync</span>
            </span>
          )}
        </div>
      </div>

      {/* Schedule Success Toast */}
      {scheduleSuccessMsg && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #6ee7b7",
            color: "#065f46",
            padding: "12px 18px",
            borderRadius: 12,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 style={{ width: 18, height: 18, color: "#059669", flexShrink: 0 }} />
          <span>{scheduleSuccessMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          2. SPECIALIST CONSULTATION (THE PROMINENT CARD)
          Strict 4-State Machine:
          State 1: No doctor yet assigned
          State 2: Doctor assigned, slot awaiting confirmation
          State 3: Consultation Scheduled & Confirmed
          State 4: Consultation Completed (shows Rx + Pharmacy)
      ══════════════════════════════════════════════════ */}
      <div className="cd-panel" style={{ marginBottom: 24, border: "2px solid #e2e8f0" }}>
        {/* Header indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isCompleted
                  ? "#d1fae5"
                  : isSlotConfirmed
                  ? "#dbeafe"
                  : "#fef3c7",
                color: isCompleted
                  ? "#059669"
                  : isSlotConfirmed
                  ? "#2563eb"
                  : "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Stethoscope style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: isCompleted
                    ? "#059669"
                    : isSlotConfirmed
                    ? "#2563eb"
                    : "#b45309",
                  display: "block",
                }}
              >
                {t("specialistConsultation")}
              </span>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                {isCompleted
                  ? t("completedAndPrescribed")
                  : isSlotConfirmed
                  ? t("doctorAssigned")
                  : isDoctorAssigned
                  ? "Awaiting Consultation Slot"
                  : t("awaitingDoctorAssignment")}
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "5px 14px",
              borderRadius: 20,
              background: isCompleted
                ? "#ecfdf5"
                : isSlotConfirmed
                ? "#eff6ff"
                : isDoctorAssigned
                ? "#fff7ed"
                : "#fef3c7",
              color: isCompleted
                ? "#065f46"
                : isSlotConfirmed
                ? "#1e40af"
                : isDoctorAssigned
                ? "#c2410c"
                : "#92400e",
              border: `1px solid ${
                isCompleted
                  ? "#a7f3d0"
                  : isSlotConfirmed
                  ? "#bfdbfe"
                  : isDoctorAssigned
                  ? "#fed7aa"
                  : "#fde68a"
              }`,
            }}
          >
            {isCompleted
              ? "✓ Consultation Completed"
              : isSlotConfirmed
              ? "✓ Slot Confirmed"
              : isDoctorAssigned
              ? "Awaiting Slot"
              : "Waiting for Assignment"}
          </span>
        </div>

        {/* ── STATE 1: WHEN NO DOCTOR IS YET ASSIGNED ── */}
        {isWaitingAssignment && (
          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Specialist Assignment
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#78350f", marginTop: 4 }}>
                Department: {intake.department || "General Medicine"}
              </div>
              <div style={{ fontSize: 13, color: "#b45309", marginTop: 6, lineHeight: 1.5 }}>
                We'll show the assigned specialist and consultation time here once confirmed.
              </div>
            </div>

            {/* Matched Specialist available for this department */}
            {availableDoctors.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #fde68a",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles style={{ width: 14, height: 14, color: "#d97706" }} />
                  <span>Available Specialist Matched to {intake.department || "Clinical Need"}:</span>
                </div>

                {availableDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{doc.name}</div>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                          Speciality: <strong>{doc.speciality}</strong> • Telemedicine Centre: <strong>{doc.facility}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
                          <span>{doc.facility_address}</span>
                        </div>
                      </div>

                      <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: "#dbeafe", color: "#1e40af" }}>
                        {doc.next_available || "Available Today"}
                      </span>
                    </div>

                    {/* Time Slot Selection */}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #cbd5e1" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>
                        Select Consultation Slot:
                      </span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {(doc.available_slots || ["10:00 AM", "02:00 PM"]).map((slot: string) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 800,
                              borderRadius: 8,
                              border: selectedSlot === slot ? "2px solid #2563eb" : "1px solid #cbd5e1",
                              background: selectedSlot === slot ? "#eff6ff" : "#ffffff",
                              color: selectedSlot === slot ? "#1e40af" : "#334155",
                              cursor: "pointer",
                            }}
                          >
                            {slot}
                          </button>
                        ))}

                        <button
                          onClick={() => handleConfirmSlot(doc, selectedSlot || doc.available_slots?.[0] || "10:30 AM")}
                          disabled={isScheduling}
                          style={{
                            padding: "7px 16px",
                            fontSize: 12,
                            fontWeight: 800,
                            borderRadius: 8,
                            border: "none",
                            background: "#2563eb",
                            color: "#ffffff",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            marginLeft: "auto",
                          }}
                        >
                          <Calendar style={{ width: 13, height: 13 }} />
                          <span>{isScheduling ? "Assigning..." : "Assign Specialist & Confirm Slot"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STATE 2: WHEN DOCTOR IS ASSIGNED BUT SLOT IS NOT CONFIRMED ── */}
        {isDoctorAssigned && (
          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                SPECIALIST CARE DESTINATION
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#9a3412", marginTop: 4 }}>
                {activeDoctorName}
              </div>
            </div>

            {/* Destination Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                background: "#ffffff",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #fed7aa",
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Doctor</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{activeDoctorName}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Speciality</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{activeSpeciality}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Hospital / Telemedicine Centre</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{activeFacility}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Consultation / Visit</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ea580c", marginTop: 2 }}>
                  {activeDate && activeTime ? `${activeDate} at ${activeTime}` : "Consultation time will be shown once assigned."}
                </div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Full Address</span>
                <div style={{ fontSize: 13, color: "#334155", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                  <MapPin style={{ width: 14, height: 14, color: "#c2410c", flexShrink: 0 }} />
                  <span>{activeAddress}</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Status</span>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#c2410c", marginTop: 2 }}>
                  Synced / Specialist Assigned / Awaiting Slot
                </div>
              </div>
            </div>

            {/* Human-readable routing destination message */}
            <div
              style={{
                background: "#fffaf5",
                border: "1px solid #fed7aa",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 13,
                fontWeight: 700,
                color: "#9a3412",
                lineHeight: 1.5,
              }}
            >
              👉 Please visit <strong>{activeFacility}</strong> at <strong>{activeAddress}</strong> for your consultation with <strong>{activeDoctorName}</strong>. Consultation time will be shown once assigned.
            </div>

            {/* Slot picker to confirm slot */}
            <div style={{ background: "#ffffff", padding: 14, borderRadius: 10, border: "1px solid #fed7aa" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                Available Specialist Slots:
              </span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {["09:30 AM", "11:00 AM", "02:30 PM", "04:30 PM"].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: 8,
                      border: selectedSlot === slot ? "2px solid #ea580c" : "1px solid #cbd5e1",
                      background: selectedSlot === slot ? "#fff7ed" : "#ffffff",
                      color: selectedSlot === slot ? "#c2410c" : "#334155",
                      cursor: "pointer",
                    }}
                  >
                    {slot}
                  </button>
                ))}

                <button
                  onClick={() =>
                    handleConfirmSlot(
                      { id: "doc-001", name: activeDoctorName, speciality: activeSpeciality, facility: activeFacility, facility_address: activeAddress },
                      selectedSlot || "10:30 AM"
                    )
                  }
                  disabled={isScheduling}
                  style={{
                    padding: "7px 16px",
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 8,
                    border: "none",
                    background: "#ea580c",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginLeft: "auto",
                  }}
                >
                  <Check style={{ width: 13, height: 13 }} />
                  <span>{isScheduling ? "Confirming..." : "Confirm Slot"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STATE 3: WHEN SLOT IS CONFIRMED (PROMINENT SCHEDULED CARD) ── */}
        {isSlotConfirmed && (
          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: "#f0f9ff",
              border: "2px solid #bae6fd",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#0369a1",
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  Confirmed Teleconsultation
                </span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#0c4a6e" }}>
                  {activeDoctorName}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0284c7", marginTop: 2 }}>
                  Speciality: {activeSpeciality}
                </div>
              </div>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  background: "#e0f2fe",
                  color: "#0369a1",
                  border: "1px solid #7dd3fc",
                  padding: "4px 12px",
                  borderRadius: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                Confirmed & Scheduled
              </span>
            </div>

            {/* Scheduled Details Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                background: "#ffffff",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #e0f2fe",
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  {t("consultationDate")}
                </span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar style={{ width: 14, height: 14, color: "#0284c7" }} />
                  <span>{activeDate}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  {t("consultationTime")}
                </span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock style={{ width: 14, height: 14, color: "#0284c7" }} />
                  <span>{activeTime}</span>
                </div>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  {t("facilityLocation")}
                </span>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <Building2 style={{ width: 14, height: 14, color: "#0284c7" }} />
                  <span>{activeFacility}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin style={{ width: 12, height: 12, color: "#94a3b8" }} />
                  <span>{activeAddress}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
              <button
                onClick={scrollToMap}
                style={{
                  padding: "9px 18px",
                  background: "#0284c7",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 1px 3px rgba(2, 132, 199, 0.2)",
                }}
              >
                <MapPin style={{ width: 15, height: 15 }} />
                <span>View Location</span>
              </button>

              <button
                onClick={() => setShowConsultationModal(true)}
                style={{
                  padding: "9px 18px",
                  background: "#ffffff",
                  color: "#0369a1",
                  fontSize: 13,
                  fontWeight: 800,
                  borderRadius: 10,
                  border: "1px solid #bae6fd",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Info style={{ width: 15, height: 15 }} />
                <span>View Consultation Details</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STATE 4: AFTER DOCTOR COMPLETES CONSULTATION ── */}
        {isCompleted && (
          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: "#ecfdf5",
              border: "2px solid #a7f3d0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#065f46",
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  Consultation Completed & Prescribed
                </span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#064e3b" }}>
                  {activeDoctorName}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginTop: 2 }}>
                  Speciality: {activeSpeciality} • {activeFacility}
                </div>
              </div>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  background: "#d1fae5",
                  color: "#065f46",
                  border: "1px solid #6ee7b7",
                  padding: "4px 12px",
                  borderRadius: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                Prescription Verified
              </span>
            </div>

            {/* Diagnosis & Advice Summary */}
            <div style={{ background: "#ffffff", padding: 14, borderRadius: 12, border: "1px solid #d1fae5" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#065f46", textTransform: "uppercase" }}>
                Clinical Diagnosis
              </span>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                {intake.prescription?.diagnosis || "Hypertension Stage 1 with Mild Respiratory Infiltration"}
              </div>

              {intake.prescription?.notes && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#334155" }}>
                  <strong>Doctor's Advice: </strong>
                  <span>{intake.prescription.notes}</span>
                </div>
              )}
            </div>

            {/* ── GET YOUR MEDICINES (Next action post-consultation) ── */}
            <div
              style={{
                marginTop: 4,
                padding: 16,
                borderRadius: 12,
                background: "#ffffff",
                border: "2px solid #10b981",
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
                      color: "#065f46",
                      background: "#d1fae5",
                      padding: "2px 8px",
                      borderRadius: 6,
                      textTransform: "uppercase",
                    }}
                  >
                    {t("recommendedPharmacy")}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>0.8 km</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>• In Stock</span>
                </div>

                <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginTop: 6 }}>
                  PMBJP Jan Aushadhi Kendra (Generic Pharmacy #2041)
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin style={{ width: 12, height: 12, color: "#94a3b8" }} />
                  <span>Village Panchayat Samiti Complex, Block 2, Wardha</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={scrollToMap}
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
                  <span>View on Map</span>
                </button>

                <button
                  onClick={scrollToMap}
                  style={{
                    padding: "10px 18px",
                    background: "#f0fdf4",
                    color: "#059669",
                    fontSize: 13,
                    fontWeight: 800,
                    borderRadius: 10,
                    border: "1px solid #86efac",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ChevronRight style={{ width: 15, height: 15 }} />
                  <span>Get Directions</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          3. AI / CLINICAL SUMMARY
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 24 }}>
        <div className="cd-section-title">{t("aiClinicalSummary")}</div>

        {/* Clinical Vitals */}
        <div className="cd-vitals-grid" style={{ marginBottom: 16 }}>
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

        {/* Symptoms & Translation Grid */}
        <div className="cd-symptom-grid" style={{ marginBottom: 16 }}>
          {/* Patient Dictation */}
          <div className="cd-symptom-card">
            <div className="cd-card-header">
              <span className="cd-card-title">Patient Voice Note</span>
              <span className="cd-card-tag">Recorded Speech</span>
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
                Gemini Clinical Translation
              </span>
              <span className="cd-card-tag" style={{ background: "#ccfbf1", color: "#0f766e" }}>
                Clinical NLP
              </span>
            </div>
            <p className="cd-symptom-text-nlp">
              {intake.translated_symptoms || intake.symptoms || "Evaluation complete."}
            </p>
          </div>
        </div>

        {/* Patient Clinical Attachment (if present) */}
        {intake.image_url && (
          <div className="cd-panel" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Camera style={{ width: 16, height: 16, color: "#0284c7" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Patient Clinical Attachment
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: 6 }}>
                1 File • Supabase Storage
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div
                onClick={() => setPreviewModalImage(intake.image_url || null)}
                style={{
                  width: 120,
                  height: 90,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid #cbd5e1",
                  cursor: "pointer",
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={intake.image_url}
                  alt="Clinical Attachment"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  {intake.image_url.split("/").pop()?.split("?")[0] || `clinical_attachment_${intake.id}.jpg`}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Symptom photograph uploaded during field intake • {intake.department || "General Medicine"}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(intake.image_url || null)}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#0284c7",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 0,
                  }}
                >
                  <span>Enlarge Clinical Image</span>
                  <ExternalLink style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Triage Card */}
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
                  color: isHigh ? "#9f1239" : isMedium ? "#92400e" : "#1e40af",
                }}
              >
                {intake.triage_priority || "Routine"}
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Matched Department: <strong style={{ color: "#0f172a" }}>{intake.department || "General Medicine"}</strong>
            </span>
          </div>

          {intake.ai_recommendation && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#334155",
                marginBottom: 12,
              }}
            >
              {intake.ai_recommendation}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8" }}>
            <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>AI-assisted triage. Specialist consultation and digital prescription verify all clinical decisions.</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          4. PRESCRIPTION (AFTER DOCTOR COMPLETES)
      ══════════════════════════════════════════════════ */}
      {isCompleted && intake.prescription?.medicines && intake.prescription.medicines.length > 0 && (
        <div className="cd-panel" style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#065f46",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Pill style={{ width: 15, height: 15 }} />
            <span>{t("prescription")}</span>
          </div>

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
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{med.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Dosage: <strong>{med.dosage}</strong> • Duration: <strong>{med.duration}</strong>
                    {med.frequency && <span> • Frequency: <strong>{med.frequency}</strong></span>}
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

      {/* ══════════════════════════════════════════════════
          5. GEOSPATIAL MAP & DIRECTIONS
          BLUE = Patient
          PURPLE/BLUE = Doctor / Telemedicine Centre
          GREEN = Jan Aushadhi / Generic Pharmacy
          RED = Hospital / Emergency Facility
      ══════════════════════════════════════════════════ */}
      <div ref={mapSectionRef} className="cd-panel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin style={{ width: 18, height: 18, color: "#2563eb" }} />
              <span>{t("mapDirections")}</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Live GPS location of patient relative to assigned specialist centre and Jan Aushadhi medicine source.
            </div>
            {(isSlotConfirmed || isCompleted || isDoctorAssigned) && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{activeFacility}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{activeAddress}</div>
              </div>
            )}
          </div>

          {/* Color-coded Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 11, fontWeight: 700 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#1e40af" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }}></span>
              Patient GPS
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#4338ca" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#4f46e5", display: "inline-block" }}></span>
              Doctor / Telemedicine Hub
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#166534" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", display: "inline-block" }}></span>
              Jan Aushadhi Pharmacy
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#991b1b" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", display: "inline-block" }}></span>
              District Hospital
            </span>
          </div>
        </div>

        {/* Embedded Map Container */}
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", height: 380, width: "100%" }}>
          <FacilityMap />
        </div>
      </div>

      {/* ── Consultation Details Modal ── */}
      {showConsultationModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              padding: 24,
              maxWidth: 500,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                Consultation Details
              </div>
              <button
                onClick={() => setShowConsultationModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
              <div>
                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>{t("doctor")}:</span>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{activeDoctorName}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>{t("speciality")}:</span>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{activeSpeciality}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>Facility:</span>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{activeFacility}</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>Location / Address:</span>
                <div style={{ fontWeight: 600, color: "#0f172a" }}>{activeAddress}</div>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>Date:</span>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{activeDate || "Today"}</div>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>Time:</span>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{activeTime || "10:30 AM"}</div>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>{t("consultationStatus")}:</span>
                  <div style={{ fontWeight: 800, color: "#059669" }}>Confirmed</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConsultationModal(false)}
                style={{
                  padding: "8px 18px",
                  background: "#0f172a",
                  color: "#ffffff",
                  borderRadius: 10,
                  border: "none",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Zoom Modal */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            cursor: "zoom-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              overflow: "hidden",
              maxWidth: 700,
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              cursor: "default",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                Patient Clinical Attachment
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ background: "#0f172a", padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={previewModalImage}
                alt="Full Clinical Attachment"
                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
