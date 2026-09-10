import React, { useState, useEffect, useRef } from "react";
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
  Stethoscope,
  Navigation,
  ExternalLink,
  Search,
  RotateCw,
} from "lucide-react";
import { AppShell, TabItem } from "../../components/AppShell";
import { VoiceIntakeForm } from "./VoiceIntakeForm";
import { FacilityMap } from "../../components/FacilityMap";
import { SecurityPage } from "../security/SecurityPage";
import { PatientHistoryPage } from "./PatientHistoryPage";
import { PatientCaseDetailView } from "./PatientCaseDetailView";
import { GlobalPatientSearch } from "./components/GlobalPatientSearch";
import { useIntakeStore, SubmittedIntakeRecord } from "../../store/useIntakeStore";
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

type AshaTab = "home" | "intake" | "queue" | "history" | "case_detail" | "map" | "security";

export const AshaWorkerTablet: React.FC<AshaWorkerTabletProps> = ({
  onBack,
  language = "English",
  onLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<AshaTab>("home");
  const [selectedCase, setSelectedCase] = useState<SubmittedIntakeRecord | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { facilities, getUserLocation, fetchNearbyFacilities } = useFacilityStore();
  const { submittedIntakes, fetchRecentIntakes } = useIntakeStore();

  // Keep selectedCase in sync with submittedIntakes (e.g. when automatic sync updates it)
  useEffect(() => {
    if (selectedCase) {
      const match = submittedIntakes.find((i) => String(i.id) === String(selectedCase.id) || String(i.case_id) === String(selectedCase.case_id));
      if (match && (match.synced !== selectedCase.synced || match.case_id !== selectedCase.case_id || match.status !== selectedCase.status)) {
        setSelectedCase(match);
      }
    }
  }, [submittedIntakes, selectedCase]);

  const [mapFilter, setMapFilter] = useState<"all" | "pharmacy" | "hospital" | "doctor">("all");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"active" | "unavailable" | "checking">("checking");
  const [pendingIntakes, setPendingIntakes] = useState<OfflineIntake[]>([]);

  const voiceRecognitionRef = useRef<any>(null);

  // Watch real-time GPS position with graceful error handling
  useEffect(() => {
    let watchId: number | null = null;
    if ("geolocation" in navigator) {
      setGpsStatus("active");
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsStatus("active");
          void fetchNearbyFacilities(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setGpsStatus("unavailable");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsStatus("unavailable");
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [fetchNearbyFacilities]);

  const handleRetryLocation = async () => {
    setGpsStatus("checking");
    const loc = await getUserLocation();
    if (loc) {
      setGpsStatus("active");
      await fetchNearbyFacilities(loc.lat, loc.lon);
    } else {
      setGpsStatus("unavailable");
    }
  };

  useEffect(() => {
    void getPendingIntakes().then(setPendingIntakes);
    void fetchRecentIntakes();
    const interval = setInterval(() => {
      void getPendingIntakes().then(setPendingIntakes);
      void fetchRecentIntakes();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchRecentIntakes]);

  // Bottom navigation stays STRICTLY 4 items
  const tabs: TabItem[] = [
    { key: "home", icon: <Zap className="w-5 h-5" />, label: "Home" },
    { key: "intake", icon: <GeminiIcon size={18} />, label: "New Intake" },
    { key: "queue", icon: <ClipboardList className="w-5 h-5" />, label: "Queue", badge: submittedIntakes.length },
    { key: "map", icon: <MapPin className="w-5 h-5" />, label: "Map" },
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

  const urgentCount = submittedIntakes.filter((i) => ["high", "urgent"].includes((i.triage_priority || "").toLowerCase())).length;

  // Web Speech API Voice Search for Facility Map
  const handleMapVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "हिंदी" ? "hi-IN" : language === "मराठी" ? "mr-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsVoiceSearching(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setMapSearchQuery(transcript);
        }
        setIsVoiceSearching(false);
      };

      recognition.onerror = () => {
        setIsVoiceSearching(false);
      };

      recognition.onend = () => {
        setIsVoiceSearching(false);
      };

      recognition.start();
      voiceRecognitionRef.current = recognition;
    } catch {
      setIsVoiceSearching(false);
    }
  };

  // Filter facilities by category AND search query
  const filteredFacilities = facilities.filter((fac) => {
    const cat = (fac.type || (fac as any).category || "").toLowerCase();
    const name = (fac.name || "").toLowerCase();
    const addr = (fac.address || "").toLowerCase();
    const q = mapSearchQuery.toLowerCase().trim();

    const matchesQuery = !q || name.includes(q) || addr.includes(q) || cat.includes(q);

    if (!matchesQuery) return false;
    if (mapFilter === "all") return true;
    if (mapFilter === "pharmacy") return cat.includes("pharmacy") || cat.includes("jan_aushadhi");
    if (mapFilter === "hospital") return cat.includes("hospital") || cat.includes("phc");
    if (mapFilter === "doctor") return cat.includes("doctor");
    return true;
  });

  return (
    <AppShell
      title="SAHARA"
      subtitle={t.subtitle}
      accentColor="teal"
      tabs={tabs}
      activeTab={activeTab === "history" || activeTab === "case_detail" ? "home" : activeTab}
      onTabChange={(key) => setActiveTab(key as AshaTab)}
      onBack={
        activeTab === "case_detail"
          ? () => setActiveTab("history")
          : activeTab !== "home"
            ? () => setActiveTab("home")
            : undefined
      }
      fab={activeTab === "home" ? { icon: <Plus className="w-5 h-5" />, label: t.newIntake, onClick: () => setActiveTab("intake") } : undefined}
      language={language}
      onLanguageChange={onLanguageChange}
      headerSearchSlot={
        <GlobalPatientSearch
          intakes={submittedIntakes}
          onSelectCase={(item) => {
            setSelectedCase(item);
            setActiveTab("case_detail");
          }}
        />
      }
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
              <div className="stat-card__value">{urgentCount}</div>
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

            <button className="action-card" onClick={() => setActiveTab("history")}>
              <div className="action-card__icon-wrap action-card__icon-wrap--indigo">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="action-card__text">
                <div className="action-card__title">Patient History</div>
                <div className="action-card__desc">View previous consultations & case outcomes</div>
              </div>
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
          </div>

          {/* Recent Activity */}
          <div className="section-label">{t.todayStats}</div>
          <div className="glass-panel">
            {submittedIntakes.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                No recent activity today. Record an intake to get started.
              </div>
            ) : (
              submittedIntakes.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="recent-item cursor-pointer hover:bg-slate-50 transition p-2.5 rounded-xl"
                  onClick={() => {
                    setSelectedCase(item);
                    setActiveTab("case_detail");
                  }}
                >
                  <div className={`recent-item__dot recent-item__dot--${item.triage_priority === "High" ? "amber" : "green"}`} />
                  <div className="recent-item__body">
                    <strong>{item.patient_name} — {item.department || "General Medicine"}</strong>
                    <span>
                      {item.synced ? "Synced to Doctor" : "Pending Sync in local queue"} • {item.triage_priority} Priority • {item.timestamp}
                    </span>
                  </div>
                  {item.synced ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
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
            onSuccessSubmitted={() => {
              const latest = submittedIntakes[0];
              if (latest) setSelectedCase(latest);
              setActiveTab("case_detail");
            }}
            onViewCaseDetails={(caseId) => {
              const match = submittedIntakes.find(i => String(i.id) === String(caseId) || String(i.case_id) === String(caseId) || i.id.includes(caseId || "")) || submittedIntakes[0];
              if (match) setSelectedCase(match);
              setActiveTab("case_detail");
            }}
            onGoHome={() => setActiveTab("home")}
            language={language}
          />
        </div>
      )}

      {/* ═══ PATIENT HISTORY TAB (Dedicated Page from Sidebar or Quick Action) ═══ */}
      {activeTab === "history" && (
        <PatientHistoryPage
          intakes={submittedIntakes}
          onSelectCase={(item) => {
            setSelectedCase(item);
            setActiveTab("case_detail");
          }}
          onNewIntake={() => setActiveTab("intake")}
        />
      )}

      {/* ═══ PATIENT CASE DETAILS VIEW ═══ */}
      {activeTab === "case_detail" && selectedCase && (
        <PatientCaseDetailView
          intake={selectedCase}
          onBack={() => setActiveTab("history")}
          onNavigateToMap={(facId) => {
            if (facId) setSelectedFacilityId(facId);
            setActiveTab("map");
          }}
        />
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
                <div
                  key={intake.id}
                  onClick={() => {
                    setSelectedCase(intake);
                    setActiveTab("case_detail");
                  }}
                  className="queue-card-v2 cursor-pointer hover:border-teal-500 transition"
                  style={{ flexDirection: "column", alignItems: "stretch", gap: 12, padding: "16px 18px" }}
                >
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

                  <div className="flex items-center justify-end pt-1">
                    <span className="text-xs font-semibold text-teal-700 flex items-center gap-1 hover:underline">
                      <span>View Full Case Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ GEOSPATIAL MAP & CARE REFERRAL TAB ═══ */}
      {activeTab === "map" && (
        <div className="page fade-in">
          {/* Header */}
          <div className="map-page-header">
            <div>
              <h2 className="map-page-title">Find Care Near You</h2>
              <p className="map-page-sub">
                Locate nearest Jan Aushadhi generic pharmacy, primary health centre, or emergency hospital.
              </p>
            </div>

            {/* Live GPS Status Indicator */}
            <div className="flex items-center gap-2">
              {gpsStatus === "active" ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>● Live location active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  <span>Location unavailable</span>
                  <button
                    onClick={handleRetryLocation}
                    className="font-bold underline flex items-center gap-1 text-amber-900"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search & Voice Search Bar + Map Legend */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="Search hospitals, pharmacies, care centres..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition outline-none"
                />
              </div>

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={handleMapVoiceSearch}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${isVoiceSearching
                    ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                title="Voice Search"
              >
                <Mic className={`w-4 h-4 ${isVoiceSearching ? "text-rose-600" : "text-teal-600"}`} />
                <span className="hidden sm:inline">
                  {isVoiceSearching ? "Listening..." : "Voice Search"}
                </span>
              </button>
            </div>

            {/* Map Legend (Requirement 15) */}
            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600 overflow-x-auto">
              <span className="font-bold text-slate-700 flex-shrink-0">Legend:</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Blue: You</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Green: Jan Aushadhi</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Red: District Hospital</span>
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Purple: PHC / Specialist</span>
              </span>
            </div>
          </div>

          {/* Split Container: Left Nav Sidebar + Right Map */}
          <div className="map-split-container">
            {/* ── LEFT NAVIGATION SIDEBAR ── */}
            <div className="map-nav-sidebar">
              {/* Filter Tabs */}
              <div className="map-filter-tabs">
                <button
                  onClick={() => setMapFilter("all")}
                  className={`map-filter-tab ${mapFilter === "all" ? "map-filter-tab--active" : ""}`}
                >
                  All ({filteredFacilities.length})
                </button>
                <button
                  onClick={() => setMapFilter("pharmacy")}
                  className={`map-filter-tab ${mapFilter === "pharmacy" ? "map-filter-tab--active" : ""}`}
                >
                  🟢 Jan Aushadhi
                </button>
                <button
                  onClick={() => setMapFilter("hospital")}
                  className={`map-filter-tab ${mapFilter === "hospital" ? "map-filter-tab--active" : ""}`}
                >
                  🔴 Hospitals & PHCs
                </button>
                <button
                  onClick={() => setMapFilter("doctor")}
                  className={`map-filter-tab ${mapFilter === "doctor" ? "map-filter-tab--active" : ""}`}
                >
                  👨‍⚕️ Specialist Doctor
                </button>
              </div>

              {/* Dynamic Facilities List */}
              <div className="map-nav-facilities-list">
                {filteredFacilities.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl m-2 border border-slate-200/60">
                    No matching facility found nearby.
                  </div>
                ) : (
                  filteredFacilities.map((fac) => {
                    const cat = (fac.type || (fac as any).category || "pharmacy").toLowerCase();
                    const isPharm = cat.includes("pharmacy") || cat.includes("jan_aushadhi");
                    const isHosp = cat.includes("hospital");
                    const isPHC = cat.includes("phc");
                    const isDoc = cat.includes("doctor");
                    const isSelected = selectedFacilityId === String(fac.id);

                    return (
                      <div
                        key={fac.id}
                        onClick={() => setSelectedFacilityId(String(fac.id))}
                        className={`map-facility-card ${isSelected ? "map-facility-card--active" : ""}`}
                      >
                        <div className="map-facility-card-top">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isPharm ? (
                              <Pill className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : isHosp ? (
                              <Building2 className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            ) : isDoc ? (
                              <Stethoscope className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            ) : (
                              <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            )}
                            <div className="map-facility-name">{fac.name}</div>
                          </div>

                          <span
                            className={`map-facility-dist ${isPharm
                                ? "map-facility-dist--green"
                                : isHosp
                                  ? "map-facility-dist--red"
                                  : "map-facility-dist--blue"
                              }`}
                          >
                            {fac.distance_km ? `${fac.distance_km} km` : "Nearby"}
                          </span>
                        </div>

                        <div className="map-facility-addr">
                          {fac.address || "District Healthcare Network"}
                        </div>

                        {/* Badges */}
                        <div className="map-facility-tag-row">
                          {isPharm && (
                            <span className="map-tag map-tag--generic">
                              PMBJP Generic (80% Off)
                            </span>
                          )}
                          {(fac as any).emergency_services && (
                            <span className="map-tag map-tag--emergency">
                              24/7 Emergency Care
                            </span>
                          )}
                          {isDoc && (
                            <span className="map-tag map-tag--doctor">
                              Teleconsult Specialist
                            </span>
                          )}
                          {isPHC && (
                            <span className="map-tag" style={{ background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe" }}>
                              Primary Health Centre
                            </span>
                          )}
                        </div>

                        {/* Generic medicines price comparison if pharmacy */}
                        {(fac as any).generic_medicines && (
                          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 8px", borderRadius: 6 }}>
                            <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#15803d", marginBottom: 2 }}>
                              Affordable Generic Alternatives:
                            </div>
                            {((fac as any).generic_medicines as any[]).slice(0, 2).map((m: any, mi: number) => (
                              <div key={mi} style={{ fontSize: "0.66rem", color: "#166534", display: "flex", justifyContent: "space-between" }}>
                                <span>{m.name}</span>
                                <strong>{m.generic_price} <s style={{ color: "#9ca3af" }}>{m.brand_price}</s></strong>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="map-facility-actions">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFacilityId(String(fac.id));
                            }}
                            className="map-focus-btn"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Locate on Map</span>
                          </button>

                          {fac.lat && fac.lon && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lon}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="map-directions-btn"
                            >
                              <span>Directions</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── RIGHT MAP VIEW PANEL ── */}
            <div className="map-main-view">
              <FacilityMap
                facilities={filteredFacilities}
                selectedFacilityId={selectedFacilityId}
                onSelectFacility={(fac) => setSelectedFacilityId(String(fac.id))}
              />
            </div>
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
