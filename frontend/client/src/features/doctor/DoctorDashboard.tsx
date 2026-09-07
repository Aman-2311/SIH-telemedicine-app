import React, { useEffect, useState } from "react";
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  Search,
  RefreshCw,
  Gauge,
  Thermometer,
  Heart,
  Sparkles,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  HeartPulse,
  ClipboardList,
  Home,
  FileText,
  Users,
  ArrowLeft,
  Clock,
  Zap,
} from "lucide-react";
import { AppShell, TabItem } from "../../components/AppShell";
import { useDoctorQueueStore } from "../../store/useDoctorQueueStore";
import { useAuthStore } from "../../store/useAuthStore";
import { PrescriptionForm } from "./PrescriptionForm";
import { QueueItem } from "../../utils/api";

interface DoctorDashboardProps {
  onBack?: () => void;
  language?: "English" | "हिंदी" | "मराठी";
  onLanguageChange?: (l: "English" | "हिंदी" | "मराठी") => void;
}

type DocTab = "home" | "queue" | "patient";

const fallbackDemoQueue: QueueItem[] = [
  {
    id: "case-mh-101", case_id: "case-mh-101",
    patient_name: "Rameshwar Rao", abha_id: "91-4455-8899-1023",
    age: 58, gender: "Male", triage_priority: "Urgent", department: "Cardiology",
    vitals: { bp: "165/105", temp: "99.1", pulse: "108", spo2: "94" },
    voice_note_text: "मरीज को छाती में भारीपन है।",
    translated_symptoms: "Patient reports acute chest tightness, dyspnea and elevated BP 165/105 mmHg with tachycardia.",
    ai_red_flags: ["Stage 2 Hypertension", "Tachycardia (108 bpm)", "Suspected Angina"],
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "case-mh-102", case_id: "case-mh-102",
    patient_name: "Priya Devi", abha_id: "91-8899-2233-4455",
    age: 26, gender: "Female", triage_priority: "Moderate", department: "Dermatology",
    vitals: { bp: "118/78", temp: "101.4", pulse: "82", spo2: "99" },
    voice_note_text: "हातावर लाल पुरळ आले आहे।",
    translated_symptoms: "Erythematous pruritic rash on arms with pyrexia 101.4°F for 3 days.",
    ai_red_flags: ["Pyrexia (101.4°F)"], created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "case-mh-103", case_id: "case-mh-103",
    patient_name: "Santosh Shinde", abha_id: "91-1122-3344-5566",
    age: 42, gender: "Male", triage_priority: "Routine", department: "General Medicine",
    vitals: { bp: "124/82", temp: "98.4", pulse: "74", spo2: "98" },
    voice_note_text: "सामान्य डोकेदुखी.",
    translated_symptoms: "Mild tension headache, fatigue and anorexia for 2 days.",
    ai_red_flags: [], created_at: new Date(Date.now() - 90 * 60000).toISOString(),
  },
];

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onBack, language = "English", onLanguageChange }) => {
  const { user } = useAuthStore();
  const { queue, selectedCase, isLoadingQueue, fetchQueue, selectCase, setFilterPriority, filterPriority } = useDoctorQueueStore();

  const [activeTab, setActiveTab] = useState<DocTab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedQueue, setDisplayedQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    void fetchQueue();
    const t = setInterval(() => void fetchQueue(), 20000);
    return () => clearInterval(t);
  }, [fetchQueue]);

  useEffect(() => {
    const src = queue.length > 0 ? queue : fallbackDemoQueue;
    let f = [...src];
    if (filterPriority !== "all") f = f.filter(i => i.triage_priority.toLowerCase() === filterPriority.toLowerCase());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(i => (i.patient_name || "").toLowerCase().includes(q) || i.abha_id.toLowerCase().includes(q) || i.department.toLowerCase().includes(q));
    }
    setDisplayedQueue(f);
  }, [queue, filterPriority, searchQuery]);

  const activePatient = selectedCase || displayedQueue[0] || null;
  const urgentCount = displayedQueue.filter(c => ["urgent", "high"].includes(c.triage_priority.toLowerCase())).length;

  const tabs: TabItem[] = [
    { key: "home", icon: <Home className="w-5 h-5" />, label: "Home" },
    { key: "queue", icon: <ClipboardList className="w-5 h-5" />, label: "Queue", badge: urgentCount },
    { key: "patient", icon: <FileText className="w-5 h-5" />, label: "Patient" },
  ];

  const getPriorityColor = (p: string) => {
    const pl = p.toLowerCase();
    if (pl === "urgent" || pl === "high") return "var(--coral)";
    if (pl === "moderate" || pl === "medium") return "var(--amber)";
    return "var(--teal)";
  };

  const openPatient = (item: QueueItem) => {
    selectCase(item.case_id || item.id);
    setActiveTab("patient");
  };

  const firstName = (user?.full_name || "Doctor").split(" ")[0];

  return (
    <AppShell
      title="SAHARA"
      subtitle="Doctor Teleconsultation Hub"
      accentColor="blue"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(k) => setActiveTab(k as DocTab)}
      onBack={activeTab !== "home" ? () => setActiveTab("home") : undefined}
      showSearch
      onSearch={setSearchQuery}
      language={language}
      onLanguageChange={onLanguageChange}
    >
      {/* ═══ HOME TAB ═══ */}
      {activeTab === "home" && (
        <div className="page fade-in">
          <div className="page__greeting">
            <h2 className="greeting-text">Welcome, Dr. {firstName}</h2>
            <p className="greeting-sub">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>

          <div className="stat-row">
            <div className="stat-card stat-card--blue">
              <div className="stat-card__icon"><Users className="w-5 h-5" /></div>
              <div className="stat-card__value">{displayedQueue.length}</div>
              <div className="stat-card__label">In Queue</div>
            </div>
            <div className="stat-card stat-card--coral">
              <div className="stat-card__icon"><AlertTriangle className="w-5 h-5" /></div>
              <div className="stat-card__value">{urgentCount}</div>
              <div className="stat-card__label">Urgent</div>
            </div>
            <div className="stat-card stat-card--teal">
              <div className="stat-card__icon"><CheckCircle2 className="w-5 h-5" /></div>
              <div className="stat-card__value">5</div>
              <div className="stat-card__label">Treated</div>
            </div>
          </div>

          <div className="section-label">Waiting Room</div>
          <div className="action-cards">
            {displayedQueue.slice(0, 3).map((item) => (
              <button key={item.case_id || item.id} className="action-card" onClick={() => openPatient(item)}>
                <div className="action-card__icon-wrap" style={{ background: `${getPriorityColor(item.triage_priority)}20`, color: getPriorityColor(item.triage_priority) }}>
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div className="action-card__text">
                  <div className="action-card__title">{item.patient_name || "Patient"}</div>
                  <div className="action-card__desc">{item.department} • BP: {item.vitals?.bp || "--"}</div>
                </div>
                <span className="triage-dot" style={{ background: getPriorityColor(item.triage_priority) }} />
              </button>
            ))}
          </div>

          {displayedQueue.length > 3 && (
            <button className="see-all-btn" onClick={() => setActiveTab("queue")}>
              View all {displayedQueue.length} patients →
            </button>
          )}
        </div>
      )}

      {/* ═══ QUEUE TAB ═══ */}
      {activeTab === "queue" && (
        <div className="page fade-in">
          {/* Filter pills */}
          <div className="filter-pills">
            {["all", "urgent", "moderate", "routine"].map(p => (
              <button
                key={p}
                className={`filter-pill ${filterPriority === p ? "filter-pill--active" : ""}`}
                onClick={() => setFilterPriority(p)}
                style={filterPriority === p ? { background: p === "urgent" ? "var(--coral)" : p === "moderate" ? "var(--amber)" : p === "routine" ? "var(--teal)" : "var(--navy)", color: "white" } : undefined}
              >
                {p === "all" ? "All" : p[0].toUpperCase() + p.slice(1)}
                {p === "urgent" && urgentCount > 0 && ` (${urgentCount})`}
              </button>
            ))}
            <button className="icon-btn icon-btn--sm" onClick={() => void fetchQueue()} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${isLoadingQueue ? "spin" : ""}`} />
            </button>
          </div>

          {displayedQueue.length === 0 ? (
            <div className="empty-card">
              <CheckCircle2 className="w-12 h-12" style={{ color: "var(--teal)", opacity: 0.4 }} />
              <h3>Queue empty</h3>
              <p>No patients matching this filter.</p>
            </div>
          ) : (
            <div className="queue-list">
              {displayedQueue.map((item) => (
                <button key={item.case_id || item.id} className="queue-card-v2" onClick={() => openPatient(item)}>
                  <div className="queue-card-v2__avatar" style={{ background: `${getPriorityColor(item.triage_priority)}20`, color: getPriorityColor(item.triage_priority) }}>
                    {(item.patient_name || "P")[0]}
                  </div>
                  <div className="queue-card-v2__info">
                    <div className="queue-card-v2__name">{item.patient_name || "Patient"}</div>
                    <div className="queue-card-v2__detail">{item.department} • {item.age || "--"} yrs • {item.gender || "--"}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span className="triage-pill" style={{ background: `${getPriorityColor(item.triage_priority)}18`, color: getPriorityColor(item.triage_priority), border: `1px solid ${getPriorityColor(item.triage_priority)}40` }}>
                      {item.triage_priority}
                    </span>
                    <span style={{ fontSize: ".58rem", color: "var(--muted)" }}>BP: {item.vitals?.bp || "--"}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ PATIENT TAB ═══ */}
      {activeTab === "patient" && (
        <div className="page fade-in">
          {activePatient ? (
            <>
              {/* Patient profile header */}
              <div className="glass-panel">
                <div className="patient-profile">
                  <div className="patient-profile__avatar" style={{ background: `${getPriorityColor(activePatient.triage_priority)}20`, color: getPriorityColor(activePatient.triage_priority) }}>
                    {(activePatient.patient_name || "P")[0]}
                  </div>
                  <div className="patient-profile__info">
                    <h3 className="patient-profile__name">{activePatient.patient_name || "Patient"}</h3>
                    <p className="patient-profile__meta">{activePatient.age || "--"} yrs • {activePatient.gender || "--"} • {activePatient.department}</p>
                    <p className="patient-profile__abha">
                      <ShieldCheck className="w-3 h-3" />
                      ABHA: {activePatient.abha_id}
                    </p>
                  </div>
                  <span className="triage-pill" style={{ background: `${getPriorityColor(activePatient.triage_priority)}18`, color: getPriorityColor(activePatient.triage_priority), border: `1px solid ${getPriorityColor(activePatient.triage_priority)}40` }}>
                    {activePatient.triage_priority}
                  </span>
                </div>
              </div>

              {/* Red flags */}
              {activePatient.ai_red_flags && activePatient.ai_red_flags.length > 0 && (
                <div className="alert-banner alert-banner--red">
                  <AlertTriangle className="w-4 h-4" />
                  <div>
                    <strong>AI Red Flags</strong>
                    <div className="alert-banner__tags">
                      {activePatient.ai_red_flags.map((f, i) => (
                        <span key={i} className="alert-tag">⚡ {f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Vitals grid */}
              <div className="section-label">Vitals</div>
              <div className="vitals-row">
                {[
                  { icon: <Gauge className="w-4 h-4" />, label: "BP", val: activePatient.vitals?.bp, c: "blue" },
                  { icon: <Thermometer className="w-4 h-4" />, label: "Temp", val: activePatient.vitals?.temp ? `${activePatient.vitals.temp}°F` : "--", c: "amber" },
                  { icon: <Heart className="w-4 h-4" />, label: "Pulse", val: activePatient.vitals?.pulse ? `${activePatient.vitals.pulse}` : "--", c: "coral" },
                  { icon: <Activity className="w-4 h-4" />, label: "SpO2", val: activePatient.vitals?.spo2 ? `${activePatient.vitals.spo2}%` : "98%", c: "teal" },
                ].map(v => (
                  <div key={v.label} className={`vital-chip vital-chip--${v.c}`}>
                    {v.icon}
                    <div>
                      <span className="vital-chip__label">{v.label}</span>
                      <strong className="vital-chip__value">{v.val || "--"}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Symptoms */}
              <div className="glass-panel" style={{ marginTop: 12 }}>
                <div className="panel-label"><Sparkles className="w-4 h-4" /> AI Translated Symptoms</div>
                <p className="panel-body-text">{activePatient.translated_symptoms || "Clinical evaluation required."}</p>
                {activePatient.voice_note_text && (
                  <div className="original-dictation">
                    <Volume2 className="w-3.5 h-3.5" />
                    <em>"{activePatient.voice_note_text}"</em>
                  </div>
                )}
              </div>

              {/* Prescription Form */}
              <div style={{ marginTop: 16 }}>
                <PrescriptionForm
                  caseId={activePatient.case_id || activePatient.id}
                  patientAbha={activePatient.abha_id}
                  patientName={activePatient.patient_name}
                  onSuccess={() => void fetchQueue()}
                />
              </div>
            </>
          ) : (
            <div className="empty-card">
              <Stethoscope className="w-12 h-12" style={{ color: "var(--navy)", opacity: 0.3 }} />
              <h3>Select a patient</h3>
              <p>Choose from the Queue tab to begin teleconsultation.</p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
};
