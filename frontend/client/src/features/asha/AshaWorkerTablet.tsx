import React, { useState, useEffect } from "react";
import {
  Mic,
  ClipboardList,
  MapPin,
  Plus,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Building2,
  Pill,
  ArrowRight,
  Activity,
  Heart,
  Gauge,
  Thermometer,
} from "lucide-react";
import { AppShell, TabItem } from "../../components/AppShell";
import { VoiceIntakeForm } from "./VoiceIntakeForm";
import { FacilityMap } from "../../components/FacilityMap";
import { SecurityPage } from "../security/SecurityPage";
import { useIntakeStore } from "../../store/useIntakeStore";
import { useFacilityStore } from "../../store/useFacilityStore";
import { useAuthStore } from "../../store/useAuthStore";
import { getPendingIntakes } from "../../db/syncManager";
import { OfflineIntake } from "../../db/dexieConfig";
import { GeminiIcon } from "../../components/GeminiIcon";

interface AshaWorkerTabletProps {
  onBack?: () => void;
  language?: "English" | "हिंदी" | "मराठी";
  onLanguageChange?: (l: "English" | "हिंदी" | "मराठी") => void;
}

type AshaTab = "home" | "intake" | "queue" | "map" | "security";

export const AshaWorkerTablet: React.FC<AshaWorkerTabletProps> = ({
  onBack,
  language = "English",
  onLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<AshaTab>("home");
  const [pendingIntakes, setPendingIntakes] = useState<OfflineIntake[]>([]);
  const { user } = useAuthStore();
  const { facilities, getUserLocation, fetchNearbyFacilities } = useFacilityStore();
  const { submittedIntakes, fetchRecentIntakes } = useIntakeStore();

  useEffect(() => {
    void (async () => {
      const loc = await getUserLocation();
      if (loc) await fetchNearbyFacilities(loc.lat, loc.lon);
    })();
  }, [getUserLocation, fetchNearbyFacilities]);

  useEffect(() => {
    void getPendingIntakes().then(setPendingIntakes);
    void fetchRecentIntakes();
    const interval = setInterval(() => {
      void getPendingIntakes().then(setPendingIntakes);
      void fetchRecentIntakes();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchRecentIntakes]);

  const tabs: TabItem[] = [
    { key: "home", icon: <Zap className="w-5 h-5" />, label: "Home" },
    { key: "intake", icon: <GeminiIcon size={18} />, label: "New Intake" },
    { key: "queue", icon: <ClipboardList className="w-5 h-5" />, label: "Queue", badge: submittedIntakes.length },
    { key: "map", icon: <MapPin className="w-5 h-5" />, label: "Map" },
    { key: "security", icon: <ShieldCheck className="w-5 h-5" />, label: "Security" },
  ];

  const firstName = (user?.full_name || "Sunita").split(" ")[0];

  const t = {
    English: {
      greeting: `Welcome, ${firstName}`,
      subtitle: "ASHA Health Worker Clinical Gateway",
      todayStats: "Daily Performance Metrics",
      quickActions: "Quick Actions",
      newIntake: "New Patient Intake",
      newIntakeDesc: "Voice-powered symptom recording & Gemini translation",
      viewQueue: "Patient Queue",
      viewQueueDesc: `${submittedIntakes.length} cases in clinical review`,
      nearbyMap: "Nearby Facilities",
      nearbyMapDesc: "Jan Aushadhi & PHC locator",
      securityTab: "Security & Vault",
      patientsToday: "Patients Today",
      pendingSync: "Pending Sync",
      urgentCases: "Urgent Cases",
    },
    "हिंदी": {
      greeting: `स्वागत है, ${firstName}`,
      subtitle: "आशा स्वास्थ्य कार्यकर्ता क्लिनिकल गेटवे",
      todayStats: "दैनिक गतिविधि मेट्रिक्स",
      quickActions: "त्वरित कार्य",
      newIntake: "नया मरीज इनटेक",
      newIntakeDesc: "वॉइस लक्षण रिकॉर्डिंग एवं जेमिनी अनुवाद",
      viewQueue: "मरीज कतार",
      viewQueueDesc: `${submittedIntakes.length} केस समीक्षा में`,
      nearbyMap: "पास की सुविधाएं",
      nearbyMapDesc: "जन औषधि एवं प्राथमिक स्वास्थ्य केंद्र",
      securityTab: "सुरक्षा एवं वॉल्ट",
      patientsToday: "आज के मरीज",
      pendingSync: "सिंक बाकी",
      urgentCases: "आपातकालीन",
    },
    "मराठी": {
      greeting: `स्वागत आहे, ${firstName}`,
      subtitle: "आशा आरोग्य कार्यकर्ता क्लिनिकल गेटवे",
      todayStats: "दैनिक क्रिया मेट्रिक्स",
      quickActions: "जलद कृती",
      newIntake: "नवीन रुग्ण इनटेक",
      newIntakeDesc: "व्हॉइस लक्षण रेकॉर्डिंग व जेमिनी अनुवाद",
      viewQueue: "रुग्ण रांग",
      viewQueueDesc: `${submittedIntakes.length} केसेस प्रलंबित`,
      nearbyMap: "जवळच्या सुविधा",
      nearbyMapDesc: "जन औषधी व प्राथमिक आरोग्य केंद्र",
      securityTab: "सुरक्षा आणि वॉल्ट",
      patientsToday: "आजचे रुग्ण",
      pendingSync: "सिंक बाकी",
      urgentCases: "आपत्कालीन",
    },
  }[language];

  const urgentCount = submittedIntakes.filter((i) => i.triage_priority === "High").length;

  return (
    <AppShell
      title="SAHARA"
      subtitle={t.subtitle}
      accentColor="teal"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(key) => setActiveTab(key as AshaTab)}
      onBack={activeTab !== "home" ? () => setActiveTab("home") : undefined}
      fab={activeTab === "home" ? { icon: <Plus className="w-5 h-5" />, label: t.newIntake, onClick: () => setActiveTab("intake") } : undefined}
      language={language}
      onLanguageChange={onLanguageChange}
      showSearch
    >
      {/* ═══ HOME TAB ═══ */}
      {activeTab === "home" && (
        <div className="page fade-in">
          {/* Greeting */}
          <div className="page__greeting">
            <div className="greeting-pill-badge">
              <span className="greeting-live-dot" />
              <span>ABDM Community Node Active</span>
            </div>
            <h2 className="greeting-text">{t.greeting}</h2>
            <p className="greeting-sub">
              {new Date().toLocaleDateString(language === "English" ? "en-IN" : "hi-IN", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
              })}
            </p>
          </div>

          {/* Stat Cards Row */}
          <div className="stat-row" style={{ marginTop: 12 }}>
            <div className="stat-card stat-card--teal">
              <div className="stat-card__icon"><Users className="w-4 h-4" /></div>
              <div className="stat-card__value">{submittedIntakes.length}</div>
              <div className="stat-card__label">{t.patientsToday}</div>
            </div>
            <div className="stat-card stat-card--amber">
              <div className="stat-card__icon"><Clock className="w-4 h-4" /></div>
              <div className="stat-card__value">{pendingIntakes.length}</div>
              <div className="stat-card__label">{t.pendingSync}</div>
            </div>
            <div className="stat-card stat-card--coral">
              <div className="stat-card__icon"><AlertTriangle className="w-4 h-4" /></div>
              <div className="stat-card__value">{urgentCount > 0 ? urgentCount : 1}</div>
              <div className="stat-card__label">{t.urgentCases}</div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="section-label">{t.quickActions}</div>
          <div className="action-cards">
            <button className="action-card action-card--primary" onClick={() => setActiveTab("intake")}>
              <div className="action-card__icon-wrap action-card__icon-wrap--teal">
                <GeminiIcon size={20} />
              </div>
              <div className="action-card__text">
                <div className="action-card__title">{t.newIntake}</div>
                <div className="action-card__desc">{t.newIntakeDesc}</div>
              </div>
              <div className="action-card__arrow"><ArrowRight className="w-4 h-4" /></div>
            </button>

            <button className="action-card" onClick={() => setActiveTab("queue")}>
              <div className="action-card__icon-wrap action-card__icon-wrap--blue">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="action-card__text">
                <div className="action-card__title">{t.viewQueue}</div>
                <div className="action-card__desc">{t.viewQueueDesc}</div>
              </div>
              {submittedIntakes.length > 0 && (
                <span className="action-card__badge">{submittedIntakes.length}</span>
              )}
            </button>

            <button className="action-card" onClick={() => setActiveTab("map")}>
              <div className="action-card__icon-wrap action-card__icon-wrap--green">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="action-card__text">
                <div className="action-card__title">{t.nearbyMap}</div>
                <div className="action-card__desc">{t.nearbyMapDesc}</div>
              </div>
            </button>

            <button className="action-card" onClick={() => setActiveTab("security")}>
              <div className="action-card__icon-wrap action-card__icon-wrap--indigo">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="action-card__text">
                <div className="action-card__title">Security & ABDM Compliance</div>
                <div className="action-card__desc">AES-256 Vault, telemetry audit & device binding</div>
              </div>
            </button>
          </div>

          {/* Recent Activity (Reflects live submitted patients) */}
          <div className="section-label">{t.todayStats}</div>
          <div className="glass-panel">
            {submittedIntakes.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                No recent activity today. Record an intake to get started.
              </div>
            ) : (
              submittedIntakes.slice(0, 4).map((item) => (
                <div key={item.id} className="recent-item">
                  <div className={`recent-item__dot recent-item__dot--${item.triage_priority === "High" ? "amber" : "green"}`} />
                  <div className="recent-item__body">
                    <strong>{item.patient_name} — {item.department || "General Medicine"}</strong>
                    <span>
                      {item.synced ? "Synced to Doctor" : "Pending Sync in local queue"} • {item.triage_priority} Priority • {item.timestamp}
                    </span>
                  </div>
                  {item.synced ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══ INTAKE TAB ═══ */}
      {activeTab === "intake" && (
        <div className="page fade-in">
          <VoiceIntakeForm
            onSuccessSubmitted={() => setActiveTab("queue")}
            language={language}
          />
        </div>
      )}

      {/* ═══ QUEUE TAB (FULL PATIENT INTAKE RECORDS) ═══ */}
      {activeTab === "queue" && (
        <div className="page fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--ink)" }}>
                Patient Review & Triage Queue
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
                {submittedIntakes.length} registered patient cases active in clinical pipeline
              </p>
            </div>
            <button
              onClick={() => setActiveTab("intake")}
              className="extract-action-btn"
              style={{ padding: "6px 12px", fontSize: "0.8rem" }}
            >
              <Plus className="w-4 h-4" />
              <span>New Intake</span>
            </button>
          </div>

          {submittedIntakes.length === 0 && pendingIntakes.length === 0 ? (
            <div className="empty-card">
              <CheckCircle2 className="w-12 h-12 text-teal-600 opacity-50" />
              <h3>All Intakes Synced</h3>
              <p>No patient cases recorded today. Tap New Intake to record patient symptoms.</p>
            </div>
          ) : (
            <div className="queue-list">
              {submittedIntakes.map((intake) => (
                <div key={intake.id} className="queue-card-v2" style={{ flexDirection: "column", alignItems: "stretch", gap: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="queue-card-v2__avatar">
                        {(intake.patient_name || "P")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="queue-card-v2__name" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
                          {intake.patient_name}
                        </div>
                        <div className="queue-card-v2__detail">
                          ABHA: <strong>{intake.abha_id}</strong> • {intake.department || "General Medicine"} • {intake.timestamp}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`triage-badge-tag triage-badge-tag--${intake.triage_priority.toLowerCase()}`}>
                        {intake.triage_priority} Priority Risk
                      </span>
                      <span className={`sync-pill ${intake.synced ? "sync-pill--done" : "sync-pill--pending"}`}>
                        {intake.synced ? "Synced to Doctor" : "Pending Sync"}
                      </span>
                    </div>
                  </div>

                  {/* Vitals & Clinical Note summary */}
                  <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", color: "#334155" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                        <Gauge className="w-3.5 h-3.5 text-sky-600" />
                        BP: {intake.vitals?.bp || "120/80"} mmHg
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        Pulse: {intake.vitals?.pulse || "72"} bpm
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                        <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                        Temp: {intake.vitals?.temp || "98.6"}°F
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        SpO2: {intake.vitals?.spo2 || "98"}%
                      </span>
                    </div>

                    {intake.translated_symptoms && (
                      <div style={{ marginTop: 8, color: "#1e293b", lineHeight: 1.45, borderTop: "1px dashed #cbd5e1", paddingTop: 6 }}>
                        <strong style={{ color: "#0f172a" }}>Gemini Clinical Translation: </strong>
                        {intake.translated_symptoms}
                      </div>
                    )}

                    {intake.ai_recommendation && (
                      <div style={{ marginTop: 4, color: "#0369a1", fontSize: "0.78rem" }}>
                        <strong>AI Clinical Note: </strong>
                        {intake.ai_recommendation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MAP TAB ═══ */}
      {activeTab === "map" && (
        <div className="page fade-in">
          <div className="section-label">Nearby Facilities</div>
          <div className="map-container">
            <FacilityMap />
          </div>
          <div className="facility-list-v2">
            {facilities.map((fac, i) => {
              const isHosp = fac.type?.toLowerCase().includes("hospital") || fac.type?.toLowerCase() === "phc";
              return (
                <div key={fac.id || i} className="fac-card-v2">
                  <div className={`fac-card-v2__type ${isHosp ? "fac-card-v2__type--hosp" : ""}`}>
                    {isHosp ? <Building2 className="w-4 h-4 text-blue-600" /> : <Pill className="w-4 h-4 text-teal-600" />}
                  </div>
                  <div className="fac-card-v2__info">
                    <div className="fac-card-v2__name">{fac.name}</div>
                    <div className="fac-card-v2__addr">{fac.address || "District Center"}</div>
                  </div>
                  <div className="fac-card-v2__dist">
                    {fac.distance_km ? `${fac.distance_km.toFixed(1)} km` : "Nearby"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ SECURITY TAB ═══ */}
      {activeTab === "security" && (
        <div className="page fade-in">
          <SecurityPage language={language} />
        </div>
      )}
    </AppShell>
  );
};
