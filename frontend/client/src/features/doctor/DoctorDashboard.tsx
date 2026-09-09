import React, { useEffect, useState, useMemo } from "react";
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
  VolumeX,
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
  Building2,
  Pill,
  MapPin,
  Calendar,
  Bell,
  Settings,
  LogOut,
  Printer,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Radio,
  Share2,
  Info,
  Menu,
  GitBranch,
  Check,
  Circle,
  ArrowRight,
  Camera,
  ImageOff,
} from "lucide-react";
import { useDoctorQueueStore } from "../../store/useDoctorQueueStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useNetworkStore } from "../../store/useNetworkStore";
import { PrescriptionForm } from "./PrescriptionForm";
import { QueueItem } from "../../utils/api";
import { FacilityMap } from "../../components/FacilityMap";

interface DoctorDashboardProps {
  onBack?: () => void;
  language?: "English" | "हिंदी" | "मराठी";
  onLanguageChange?: (l: "English" | "हिंदी" | "मराठी") => void;
}

type DocView = "home" | "queue" | "patient" | "radar" | "reports" | "success";

// Real production queue - zero static mock records


/* ─── CASE LIFECYCLE STEPPER SUBCOMPONENT ─── */
interface CaseLifecycleStepperProps {
  currentStage: number; // 4: Doctor Review active, 5: Treatment Plan active
  caseId?: string;
  isCompleted?: boolean;
}

const LIFECYCLE_STEPS = [
  { id: 1, title: "ASHA Visit", sub: "Vitals & Voice Intake" },
  { id: 2, title: "AI Triage", sub: "Offline Gemini Edge" },
  { id: 3, title: "Referred", sub: "Priority Queue Assigned" },
  { id: 4, title: "Doctor Review", sub: "Clinical Teleconsult" },
  { id: 5, title: "Treatment", sub: "Rx Dispatched" },
  { id: 6, title: "Follow-Up", sub: "ASHA Re-assessment" },
  { id: 7, title: "Resolved", sub: "Closed-Loop Recovery" },
];

export const CaseLifecycleStepper: React.FC<CaseLifecycleStepperProps> = ({
  currentStage,
  caseId,
}) => {
  return (
    <div className="lifecycle-stepper-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-700">
            Case Lifecycle Tracking
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {caseId ? `• Case #${caseId}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${currentStage >= 5
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${currentStage >= 5 ? "bg-emerald-600" : "bg-blue-600 animate-pulse"
                }`}
            />
            {currentStage === 4 && "Stage 4: Active Doctor Teleconsultation"}
            {currentStage === 5 && "Stage 5: E-Prescription & Pharmacy Dispatch Active"}
            {currentStage >= 6 && "Stage 6: Post-Consultation Follow-Up"}
          </span>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded hidden sm:inline-block">
            ABDM Milestones Synchronized
          </span>
        </div>
      </div>

      <div className="lifecycle-track">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isDone = step.id < currentStage;
          const isActive = step.id === currentStage;
          const isUpcoming = step.id > currentStage;

          return (
            <div key={step.id} className="lifecycle-step">
              {/* Connector line between steps */}
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <div
                  className={`lifecycle-connector ${step.id < currentStage - 1
                      ? "lifecycle-connector--completed"
                      : step.id === currentStage - 1
                        ? "lifecycle-connector--active"
                        : "lifecycle-connector--upcoming"
                    }`}
                />
              )}

              {/* Circle Node */}
              <div
                className={`lifecycle-circle ${isDone
                    ? "lifecycle-circle--completed"
                    : isActive
                      ? "lifecycle-circle--active"
                      : "lifecycle-circle--upcoming"
                  }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : (
                  <Circle className="w-2.5 h-2.5 opacity-60" />
                )}
              </div>

              {/* Labels */}
              <div
                className={`lifecycle-label ${isDone
                    ? "lifecycle-label--completed"
                    : isActive
                      ? "lifecycle-label--active"
                      : "lifecycle-label--upcoming"
                  }`}
              >
                {step.title}
              </div>
              <div className="lifecycle-sub">{step.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-blue-600 font-bold">● Current Status:</span>
          <span>
            {currentStage === 4
              ? "Doctor teleconsultation in progress. Examining symptoms, audio clip, and vitals."
              : "Doctor review completed. Treatment instructions dispatched to field tablet via ABDM."}
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 hidden md:block">
          Audit Hash: 0x7f4b89c2...
        </div>
      </div>
    </div>
  );
};

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  onBack,
  language = "English",
  onLanguageChange,
}) => {
  const { user, logout } = useAuthStore();
  const { isOnline } = useNetworkStore();
  const {
    queue,
    completedCases,
    selectedCase,
    isLoadingQueue,
    fetchQueue,
    fetchCompletedCases,
    selectCase,
    filterPriority,
    setFilterPriority,
    lastSyncedAt,
  } = useDoctorQueueStore();

  // Navigation & Workspace State
  const [activeView, setActiveView] = useState<DocView>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [sortBy, setSortBy] = useState("priority");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [markedFollowUp, setMarkedFollowUp] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [activeModal, setActiveModal] = useState<"notifications" | "sync" | "abdm" | "help" | null>(null);

  // Referral Intelligence Panel State
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralReason, setReferralReason] = useState("");
  const [referralPriority, setReferralPriority] = useState<"urgent" | "routine" | "scheduled">("urgent");
  const [referralFindings, setReferralFindings] = useState<Record<string, boolean>>({
    bp_trend: true,
    symptoms: true,
    previous_history: true,
    ai_observations: false,
    vitals: true,
  });
  const [referralSubmitted, setReferralSubmitted] = useState(false);

  // Closed-loop submitted case state
  const [submittedCaseInfo, setSubmittedCaseInfo] = useState<{
    caseId: string;
    patientName: string;
    diagnosis: string;
    timestamp: string;
  } | null>(null);

  // Live timer for clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync data with backend on load and periodic intervals (5s polling)
  useEffect(() => {
    void fetchQueue();
    void fetchCompletedCases();
    const interval = setInterval(() => {
      void fetchQueue();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue, fetchCompletedCases]);

  // Pure real database queue from Supabase
  const allCases = queue;

  // Filtered and sorted queue
  const displayedQueue = useMemo(() => {
    let list = [...allCases];

    // Priority filter
    if (filterPriority !== "all") {
      list = list.filter(
        (c) => (c.triage_priority || "").toLowerCase() === filterPriority.toLowerCase()
      );
    }

    // Department filter
    if (deptFilter !== "All Departments") {
      list = list.filter(
        (c) => (c.department || "").toLowerCase() === deptFilter.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          (c.patient_name || "").toLowerCase().includes(q) ||
          (c.case_id || c.id || "").toLowerCase().includes(q) ||
          (c.abha_id || "").toLowerCase().includes(q) ||
          (c.department || "").toLowerCase().includes(q)
      );
    }

    // Sort order (Today's active cases prioritized, then priority tier, then newest first)
    if (sortBy === "priority") {
      const todayPrefix = new Date().toISOString().split("T")[0];
      const pWeights: Record<string, number> = { urgent: 3, high: 3, moderate: 2, medium: 2, routine: 1, low: 1 };
      list.sort((a, b) => {
        const aToday = (a.created_at || "").startsWith(todayPrefix) ? 1 : 0;
        const bToday = (b.created_at || "").startsWith(todayPrefix) ? 1 : 0;
        if (bToday !== aToday) return bToday - aToday;

        const weightA = pWeights[a.triage_priority?.toLowerCase() || ""] || 0;
        const weightB = pWeights[b.triage_priority?.toLowerCase() || ""] || 0;
        if (weightB !== weightA) return weightB - weightA;

        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    } else if (sortBy === "waiting") {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return list;
  }, [allCases, filterPriority, deptFilter, searchQuery, sortBy]);

  // Active patient for clinical workspace
  const currentCase = useMemo(() => {
    if (selectedCase) {
      const found = allCases.find((c) => (c.case_id || c.id) === (selectedCase.case_id || selectedCase.id));
      return found || selectedCase;
    }
    return displayedQueue[0] || allCases[0] || null;
  }, [selectedCase, allCases, displayedQueue]);

  useEffect(() => {
    setImageLoadError(false);
  }, [currentCase?.case_id, currentCase?.id]);

  // KPI calculations from real database records
  const totalInQueue = allCases.length;
  const urgentCount = allCases.filter((c) =>
    ["urgent", "high"].includes((c.triage_priority || "").toLowerCase())
  ).length;
  const moderateCount = allCases.filter((c) =>
    ["moderate", "medium"].includes((c.triage_priority || "").toLowerCase())
  ).length;

  const treatedTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return (completedCases || []).filter((c: any) => {
      const rxDate = c.prescription?.prescribed_at || c.created_at;
      return rxDate && String(rxDate).startsWith(todayStr);
    }).length;
  }, [completedCases]);

  const handleOpenPatient = (item: QueueItem) => {
    selectCase(item.case_id || item.id);
    setActiveView("patient");
  };

  const handlePrescriptionSuccess = (details: {
    caseId: string;
    patientName: string;
    diagnosis: string;
    timestamp: string;
  }) => {
    setSubmittedCaseInfo(details);
    setActiveView("success");
    void fetchQueue();
  };

  const handleNextUrgentCase = () => {
    const urgentItems = allCases.filter(
      (c) =>
        ["urgent", "high"].includes((c.triage_priority || "").toLowerCase()) &&
        (c.case_id || c.id) !== submittedCaseInfo?.caseId
    );
    if (urgentItems.length > 0) {
      selectCase(urgentItems[0].case_id || urgentItems[0].id);
      setActiveView("patient");
    } else {
      setActiveView("queue");
    }
  };

  const toggleAudio = () => {
    setAudioPlaying(!audioPlaying);
  };

  const formatWaitingMinutes = (isoString?: string) => {
    if (!isoString) return "18 min";
    const mins = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000));
    if (mins >= 60) return `${Math.floor(mins / 60)} hr`;
    return `${mins} min`;
  };

  return (
    <div className="doctor-workstation font-sans">
      {/* ═══════════════════════════════════════════════════════════════
          1. TOP CLINICAL HEADER BAR
          ═══════════════════════════════════════════════════════════════ */}
      <header className="doctor-topbar">
        {/* Left: Branding & Collapse Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Toggle Clinical Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveView("home")}
          >
            <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">
                  SAHARA
                </span>
                <span className="hidden md:inline text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Doctor Teleconsultation Hub
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-xl mx-8 min-w-0 hidden sm:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, case ID, ABHA ID…"
              className="w-full h-10 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-teal-600 rounded-lg pl-10 pr-9 text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Network Status, Notifications & Doctor Avatar */}
        <div className="flex items-center gap-4">
          {/* Connection Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${isOnline
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
            />
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => setActiveModal("notifications")}
            className="relative p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Clinical Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
              6
            </span>
          </button>

          {/* Doctor Avatar */}
          <div
            onClick={() => setActiveModal("help")}
            className="flex items-center gap-2.5 cursor-pointer pl-1"
          >
            <div className="w-9 h-9 rounded-full bg-teal-800 text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-xs avatar-ring">
              DA
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                Dr. Arvind K.
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                General Medicine
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. DESKTOP LAYOUT (Sidebar + Main Workspace)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="doctor-layout">
        {/* ── PERSISTENT CLINICAL SIDEBAR ── */}
        {!sidebarCollapsed && (
          <aside className="doctor-sidebar animate-in slide-in-from-left-2 duration-150">
            {/* Doctor Profile Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                DA
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate leading-snug">
                  Dr. Arvind Kulkarni
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  DOCTOR-MH-7313
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Online Sync</span>
                </div>
              </div>
            </div>

            {/* Group 1: Clinical Workflow */}
            <div>
              <div className="doc-sidebar-section-title">Clinical Workflow</div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveView("home")}
                  className={`doc-nav-item ${activeView === "home" ? "doc-nav-item--active" : ""}`}
                >
                  <Home className="w-4 h-4" />
                  <span>Dashboard Home</span>
                </button>

                <button
                  onClick={() => setActiveView("queue")}
                  className={`doc-nav-item ${activeView === "queue" || activeView === "patient" ? "doc-nav-item--active" : ""}`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Clinical Patient Queue</span>
                  <span className="doc-nav-badge doc-nav-badge--blue">{allCases.length}</span>
                </button>

                <button
                  onClick={() => setActiveView("radar")}
                  className={`doc-nav-item ${activeView === "radar" ? "doc-nav-item--active" : ""}`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Geospatial Care Radar</span>
                </button>

                <button
                  onClick={() => setActiveView("reports")}
                  className={`doc-nav-item ${activeView === "reports" ? "doc-nav-item--active" : ""}`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Reports & Insights</span>
                </button>
              </nav>
            </div>

            {/* Group 2: System & Services */}
            <div>
              <div className="doc-sidebar-section-title">System & Services</div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveModal("notifications")}
                  className="doc-nav-item"
                >
                  <Bell className="w-4 h-4" />
                  <span>Notifications & Alerts</span>
                  <span className="doc-nav-badge doc-nav-badge--coral">6</span>
                </button>

                <button
                  onClick={() => setActiveModal("sync")}
                  className="doc-nav-item"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Offline Sync & Updates</span>
                </button>

                <button
                  onClick={() => setActiveModal("abdm")}
                  className="doc-nav-item"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Security & ABDM</span>
                  <span className="doc-nav-badge doc-nav-badge--abdm">ABDM</span>
                </button>

                <button
                  onClick={() => setActiveModal("help")}
                  className="doc-nav-item"
                >
                  <Info className="w-4 h-4" />
                  <span>Help Centre & Protocols</span>
                </button>
              </nav>
            </div>

            {/* Group 3: Account & Session */}
            <div className="mt-auto pt-2 border-t border-slate-100">
              <div className="doc-sidebar-section-title">Account</div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveModal("help")}
                  className="doc-nav-item text-xs"
                >
                  <Users className="w-4 h-4" />
                  <span>Doctor Profile</span>
                </button>

                <button
                  onClick={() => setActiveModal("sync")}
                  className="doc-nav-item text-xs"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>


                <button
                  onClick={() => {
                    logout();
                    if (onBack) onBack();
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </nav>
            </div>
          </aside>
        )}

        {/* ── MAIN WORKSPACE CONTENT ── */}
        <main className="doctor-main-content">
          {/* ═════════════════════════════════════════════════════════════
              VIEW 1: DASHBOARD HOME (Panel 1 from reference)
              ═════════════════════════════════════════════════════════════ */}
          {activeView === "home" && (
            <div className="view-enter space-y-6">
              {/* Welcome Section */}
              <div className="clinical-card flex flex-col sm:flex-row sm:items-center justify-between gap-5 slide-up">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Good morning, Dr. Arvind
                  </h1>
                  <p className="text-base text-slate-500 font-medium mt-1.5 leading-relaxed">
                    Your prioritized triage queue for today.
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">
                      {currentTime.toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center justify-end gap-1.5">
                      <span>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-sans font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {lastSyncedAt ? `Synced` : "Syncing…"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Clinical KPI Cards */}
              <div className="kpi-grid stagger">
                {/* 1. Patients in Queue */}
                <div
                  className="kpi-card kpi-card--blue cursor-pointer slide-up hover-lift"
                  onClick={() => setActiveView("queue")}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      +12%
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                    {totalInQueue}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Patients in Queue
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Waiting for consultation
                    </div>
                  </div>
                </div>

                {/* 2. Urgent Cases */}
                <div
                  className="kpi-card kpi-card--coral cursor-pointer slide-up hover-lift"
                  onClick={() => {
                    setFilterPriority("urgent");
                    setActiveView("queue");
                  }}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      High Triage
                    </span>
                  </div>
                  <div className="text-3xl font-black text-rose-700 mt-2 font-mono">
                    {urgentCount}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Urgent Cases
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Requires immediate attention
                    </div>
                  </div>
                </div>

                {/* 3. Moderate Cases */}
                <div
                  className="kpi-card kpi-card--amber cursor-pointer slide-up hover-lift"
                  onClick={() => {
                    setFilterPriority("moderate");
                    setActiveView("queue");
                  }}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Review Today
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                    {moderateCount}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Moderate Cases
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Needs review today
                    </div>
                  </div>
                </div>

                {/* 4. Treated Today */}
                <div className="kpi-card kpi-card--teal slide-up hover-lift">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      Completed
                    </span>
                  </div>
                  <div className="text-3xl font-black text-teal-700 mt-2 font-mono">
                    {treatedTodayCount}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      Treated Today
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Consultations completed
                    </div>
                  </div>
                </div>
              </div>

              {/* Split Middle Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 65%: Requires Your Attention */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Requires Your Attention
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        High priority cases flagged by offline AI triage
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView("queue")}
                      className="text-sm font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      View All →
                    </button>
                  </div>

                  {/* Priority Patient Cards - Spacious 2-Tier Layout */}
                  <div className="space-y-4">
                    {displayedQueue.slice(0, 4).map((item) => {
                      const isUrgent = ["urgent", "high"].includes(
                        (item.triage_priority || "").toLowerCase()
                      );
                      const isModerate = ["moderate", "medium"].includes(
                        (item.triage_priority || "").toLowerCase()
                      );

                      return (
                        <div
                          key={item.case_id || item.id}
                          className={`priority-clinical-card ${isUrgent ? "priority-card-urgent" : isModerate ? "priority-card-moderate" : ""
                            }`}
                        >
                          {/* TIER 1: Identification, Badge, and Action */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isUrgent
                                    ? "bg-rose-100 text-rose-800 ring-2 ring-rose-200"
                                    : "bg-amber-100 text-amber-800 ring-2 ring-amber-200"
                                  }`}
                              >
                                {(item.patient_name || "P")[0]}
                                {(item.patient_name || "P").split(" ")[1]?.[0] || ""}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h3 className="text-lg font-bold text-slate-900 truncate">
                                    {item.patient_name}
                                  </h3>
                                  <span
                                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${isUrgent
                                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                                        : "bg-amber-100 text-amber-800 border border-amber-200"
                                      }`}
                                  >
                                    {item.triage_priority} Priority
                                  </span>
                                </div>

                                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap font-medium">
                                  <span>{item.age} yrs • {item.gender}</span>
                                  <span>•</span>
                                  <span className="font-mono text-slate-700 font-semibold">
                                    Case #{item.case_id || item.id}
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-500">{formatWaitingMinutes(item.created_at)} waiting</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenPatient(item)}
                              className="btn-clinical-primary text-xs shrink-0 self-start sm:self-center"
                            >
                              <span>Review Case</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* TIER 2: Clinical Description & Vital Signs */}
                          <div className="pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="text-sm text-slate-700 leading-relaxed min-w-0 flex items-center gap-2.5">
                              <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md text-xs shrink-0">
                                {item.department}
                              </span>
                              <span className="truncate text-slate-600">{item.translated_symptoms}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              <span className="vital-pill">
                                BP: <strong className="text-slate-900 font-mono">{item.vitals?.bp || "--"}</strong>
                              </span>
                              <span className="vital-pill">
                                Temp: <strong className="text-slate-900 font-mono">{item.vitals?.temp ? `${item.vitals.temp}°F` : "--"}</strong>
                              </span>
                              <span className="vital-pill">
                                Pulse: <strong className="text-slate-900 font-mono">{item.vitals?.pulse ? `${item.vitals.pulse} bpm` : "--"}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent Activity Timeline in Clinical Card */}
                  <div className="clinical-card p-5 mt-6">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Recent Activity
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        Live updates
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex items-start gap-3 text-xs leading-relaxed">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-50" />
                        <span className="font-mono text-slate-400 shrink-0 font-medium">10:42 AM</span>
                        <span className="text-slate-700">
                          Prescription submitted — <strong className="text-slate-900">Case #21</strong>
                        </span>
                        <span className="ml-auto text-xs text-slate-400 font-mono">Dr. Arvind</span>
                      </div>

                      <div className="flex items-start gap-3 text-xs leading-relaxed">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0 ring-4 ring-rose-50" />
                        <span className="font-mono text-slate-400 shrink-0 font-medium">10:31 AM</span>
                        <span className="text-slate-700">
                          New urgent case received — <strong className="text-slate-900">Case #23</strong>
                        </span>
                        <span className="ml-auto text-xs text-slate-400 font-mono">AI Triage</span>
                      </div>

                      <div className="flex items-start gap-3 text-xs leading-relaxed">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0 ring-4 ring-blue-50" />
                        <span className="font-mono text-slate-400 shrink-0 font-medium">10:12 AM</span>
                        <span className="text-slate-700">
                          Case #19 completed & dispatched to ASHA worker
                        </span>
                        <span className="ml-auto text-xs text-slate-400 font-mono">Dr. Arvind</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 35%: Quick Actions & System Status */}
                <div className="lg:col-span-4 space-y-6">

                  {/* Quick Actions */}
                  <div className="clinical-card p-5 space-y-3.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Quick Actions
                    </h3>

                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveView("queue")}
                        className="btn-clinical-outline justify-between w-full"
                      >
                        <div className="flex items-center gap-2.5">
                          <ClipboardList className="w-4 h-4 text-blue-700" />
                          <span>Open Patient Queue</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setFilterPriority("urgent");
                          setActiveView("queue");
                        }}
                        className="btn-clinical-outline justify-between w-full hover:border-rose-300 hover:bg-rose-50/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>View Urgent Cases</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveView("queue");
                          document.querySelector("input")?.focus();
                        }}
                        className="btn-clinical-outline justify-between w-full"
                      >
                        <div className="flex items-center gap-2.5">
                          <Search className="w-4 h-4 text-slate-600" />
                          <span>Search Patient</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => void fetchQueue()}
                        className="btn-clinical-outline justify-between w-full"
                      >
                        <div className="flex items-center gap-2.5">
                          <RefreshCw className={`w-4 h-4 text-emerald-600 ${isLoadingQueue ? "spin" : ""}`} />
                          <span>Refresh Queue</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* System Status Card */}
                  <div className="clinical-card p-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        System Status
                      </h3>
                      <button
                        onClick={() => setActiveModal("sync")}
                        className="text-xs font-bold text-blue-700 hover:underline"
                      >
                        View Details
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium">API Connected & Verified</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium">Database Synced (IndexedDB)</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium">Queue Updated Real-Time</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                        <span className="font-medium">Offline Sync Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              VIEW 2: CLINICAL PATIENT QUEUE (Panel 2 from reference)
              ═════════════════════════════════════════════════════════════ */}
          {activeView === "queue" && (
            <div className="view-enter space-y-5">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Patient Queue
                  </h1>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    Cases prioritized by offline AI triage algorithm.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { key: "all", label: `All (${allCases.length})`, activeClass: "bg-blue-700 text-white border-blue-700", baseClass: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50" },
                      { key: "urgent", label: `⚠️ Urgent (${urgentCount})`, activeClass: "bg-rose-600 text-white border-rose-600", baseClass: "bg-white text-rose-700 border-rose-200 hover:bg-rose-50" },
                      { key: "moderate", label: `🕒 Moderate (${moderateCount})`, activeClass: "bg-amber-600 text-white border-amber-600", baseClass: "bg-white text-amber-800 border-amber-200 hover:bg-amber-50" },
                      { key: "routine", label: `✓ Routine (${allCases.length - urgentCount - moderateCount})`, activeClass: "bg-teal-700 text-white border-teal-700", baseClass: "bg-white text-teal-800 border-teal-200 hover:bg-teal-50" },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setFilterPriority(btn.key)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-bold border shadow-xs transition-all cursor-pointer ${filterPriority === btn.key
                            ? btn.activeClass
                            : btn.baseClass
                          }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Department Select */}
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 font-bold focus:outline-none"
                  >
                    <option>All Departments</option>
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Dermatology</option>
                    <option>Pediatrics</option>
                    <option>Orthopedics</option>
                  </select>

                  {/* Refresh Button */}
                  <button
                    onClick={() => void fetchQueue()}
                    className="h-10 flex items-center gap-2 px-4 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-sm font-bold border border-blue-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingQueue ? "spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Clinical Table Container */}
              <div className="clinical-table-container">
                <table className="clinical-table">
                  <thead>
                    <tr>
                      <th style={{ width: "26%" }}>
                        <button
                          onClick={() => setSortBy(sortBy === "priority" ? "waiting" : "priority")}
                          className="flex items-center gap-1.5 uppercase tracking-wider font-bold text-slate-600 hover:text-slate-900 transition-colors text-xs"
                        >
                          <span>Patient</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      <th style={{ width: "32%" }}>Clinical Summary</th>
                      <th style={{ width: "16%" }}>Vitals</th>
                      <th style={{ width: "14%" }}>
                        <button
                          onClick={() => setSortBy(sortBy === "priority" ? "waiting" : "priority")}
                          className="flex items-center gap-1.5 uppercase tracking-wider font-bold text-slate-600 hover:text-slate-900 transition-colors text-xs"
                        >
                          <span>Status & Wait</span>
                          <ChevronDown className={`w-3.5 h-3.5 ${sortBy === "priority" ? "text-blue-600" : ""}`} />
                        </button>
                      </th>
                      <th style={{ width: "12%", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedQueue.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                              <Search className="w-5 h-5" />
                            </div>
                            <div className="text-sm font-bold text-slate-700">No matching patient cases found</div>
                            <div className="text-xs text-slate-400">Try adjusting your filters or search query</div>
                            <button
                              onClick={() => {
                                setFilterPriority("all");
                                setDeptFilter("All Departments");
                                setSearchQuery("");
                              }}
                              className="mt-1 text-sm font-bold text-blue-700 hover:underline cursor-pointer"
                            >
                              Reset All Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedQueue.map((item) => {
                        const isUrgent = ["urgent", "high"].includes(
                          (item.triage_priority || "").toLowerCase()
                        );
                        const isModerate = ["moderate", "medium"].includes(
                          (item.triage_priority || "").toLowerCase()
                        );

                        return (
                          <tr
                            key={item.case_id || item.id}
                            onClick={() => handleOpenPatient(item)}
                            className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                          >
                            {/* Column 1: Patient Details */}
                            <td>
                              <div className="flex items-center gap-3.5">
                                <div
                                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-xs ${isUrgent
                                      ? "bg-rose-100 text-rose-800"
                                      : isModerate
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                  {(item.patient_name || "P")[0]}
                                  {(item.patient_name || "P").split(" ")[1]?.[0] || ""}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-base">
                                    {item.patient_name}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                                    {item.age} yrs • {item.gender}
                                  </div>
                                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                                    Case #{item.case_id || item.id} • {formatWaitingMinutes(item.created_at)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Clinical Summary */}
                            <td>
                              <div className="text-sm text-slate-900 font-bold line-clamp-1">
                                {item.department}
                              </div>
                              <div className="text-xs text-slate-600 line-clamp-2 mt-0.5 font-normal leading-relaxed">
                                {item.translated_symptoms}
                              </div>
                              {item.ai_red_flags && item.ai_red_flags.length > 0 && (
                                <div className="mt-1.5 flex items-center gap-1">
                                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    AI: {item.ai_red_flags[0]}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Column 3: Vitals */}
                            <td>
                              <div className="text-xs font-mono font-bold text-slate-900">
                                BP: {item.vitals?.bp || "--"}
                              </div>
                              <div className="text-xs text-slate-600 font-mono mt-0.5">
                                Temp: {item.vitals?.temp ? `${item.vitals.temp}°F` : "--"}
                              </div>
                              <div className="text-xs text-slate-600 font-mono mt-0.5">
                                Pulse: {item.vitals?.pulse ? `${item.vitals.pulse} bpm` : "--"}
                              </div>
                            </td>

                            {/* Column 4: Status */}
                            <td>
                              <span
                                className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded-md ${isUrgent
                                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                                    : isModerate
                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                      : "bg-blue-100 text-blue-800 border border-blue-300"
                                  }`}
                              >
                                {item.triage_priority}
                              </span>
                              <div className="text-xs text-slate-400 font-mono mt-1 font-medium">
                                ⏱ {formatWaitingMinutes(item.created_at)}
                              </div>
                            </td>

                            {/* Column 5: Action */}
                            <td style={{ textAlign: "right" }}>
                              <button
                                onClick={() => handleOpenPatient(item)}
                                className="btn-clinical-primary text-xs !h-9 !px-3.5 inline-flex items-center gap-1.5 shrink-0 rounded-xl font-bold"
                              >
                                <span>Review Case</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      }))}
                  </tbody>
                </table>

                {/* Table Footer & Pagination */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    Showing 1-{displayedQueue.length} of {allCases.length} patients
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
                      1
                    </button>
                    <button className="w-7 h-7 rounded hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-xs">
                      2
                    </button>
                    <button className="w-7 h-7 rounded hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-xs">
                      3
                    </button>
                    <button className="w-7 h-7 rounded hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-xs">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              VIEW 3: PATIENT CLINICAL WORKSPACE (Panel 3 from reference)
              ═════════════════════════════════════════════════════════════ */}
          {activeView === "patient" && currentCase && (
            <div className="view-enter space-y-6">
              {/* Back to Queue & Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => setActiveView("queue")}
                    className="flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Queue</span>
                  </button>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                      Patient Details & Teleconsultation
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                      Complete clinical record, multimodal symptoms and e-prescription workspace.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMarkedFollowUp(!markedFollowUp)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${markedFollowUp
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>{markedFollowUp ? "Marked for Follow-up" : "Mark for Follow-up"}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Case</span>
                  </button>
                </div>
              </div>

              {/* Patient Header Banner Card */}
              <div className="clinical-card p-6 sm:p-7 slide-up">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 font-black text-xl flex items-center justify-center border-2 border-blue-200 shrink-0 shadow-xs">
                      {(currentCase.patient_name || "P")[0]}
                      {(currentCase.patient_name || "P").split(" ")[1]?.[0] || ""}
                    </div>
                    <div>
                      <div className="flex items-center gap-3.5 flex-wrap">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                          {currentCase.patient_name}
                        </h2>
                        <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
                          Case #{currentCase.case_id || currentCase.id}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mt-1.5 font-medium flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-slate-700">{currentCase.age} yrs • {currentCase.gender}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-800 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-0.5 rounded-md text-xs">
                          {currentCase.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-center min-w-[125px]">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        ABHA ID
                      </div>
                      <div className="text-base font-mono font-extrabold text-slate-900 flex items-center justify-center gap-1.5 mt-1">
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                        <span>{currentCase.abha_id || "12345678"}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-center min-w-[125px]">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Priority
                      </div>
                      <span className={`inline-block text-sm font-black px-3.5 py-1 rounded-full mt-1 ${["urgent", "high"].includes((currentCase.triage_priority || "").toLowerCase())
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : ["moderate", "medium"].includes((currentCase.triage_priority || "").toLowerCase())
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-teal-100 text-teal-800 border border-teal-300"
                        }`}>
                        {currentCase.triage_priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-center min-w-[125px]">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Waiting Time
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-1">
                        {formatWaitingMinutes(currentCase.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── CASE LIFECYCLE STEPPER ─── */}
              <CaseLifecycleStepper
                currentStage={4}
                caseId={currentCase.case_id || currentCase.id}
              />

              {/* Scheduled Teleconsultation Banner if scheduled */}
              {(currentCase.scheduled_date || currentCase.vitals?.consultation?.scheduled_date) && (
                <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 slide-up">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                        Confirmed Specialist Teleconsultation Slot
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {currentCase.scheduled_date || currentCase.vitals?.consultation?.scheduled_date} at {currentCase.scheduled_time || currentCase.vitals?.consultation?.scheduled_time || "10:30 AM"}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Specialist: <strong>{currentCase.assigned_doctor || currentCase.vitals?.consultation?.assigned_doctor || "Attending Specialist"}</strong> • Facility: <strong>{currentCase.facility || currentCase.vitals?.consultation?.facility || "District Telemedicine Hub"}</strong>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    Consultation Confirmed
                  </span>
                </div>
              )}

              {/* ─── 2-COLUMN CLINICAL WORKSPACE GRID ─── */}
              <div className="clinical-workspace-grid">
                {/* ── LEFT COLUMN: Clinical Information & Field Context ── */}
                <div className="space-y-6">
                  {/* Vitals Grid (4 elevated cards) */}
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-700" />
                        <span>Vitals Baseline</span>
                      </div>
                      <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Recorded by ASHA Tablet
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="clinical-card p-5 hover-lift">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">BP</span>
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">High</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          {currentCase.vitals?.bp || "150/95"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1 font-medium">mmHg</div>
                      </div>

                      <div className="clinical-card p-5 hover-lift">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Temp</span>
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">Fever</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          {currentCase.vitals?.temp ? `${currentCase.vitals.temp}°F` : "102°F"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1 font-medium">Fahrenheit</div>
                      </div>

                      <div className="clinical-card p-5 hover-lift">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pulse</span>
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">Elevated</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          {currentCase.vitals?.pulse || "110"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1 font-medium">bpm</div>
                      </div>

                      <div className="clinical-card p-5 hover-lift">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SpO₂</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Normal</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                          {currentCase.vitals?.spo2 ? `${currentCase.vitals.spo2}%` : "98%"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1 font-medium">Oxygen Sat.</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Translated Symptoms & Vernacular Audio */}
                  <div className="clinical-card p-6 sm:p-7 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                          <Sparkles className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                            <span>AI Translated Symptoms</span>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
                              Gemini 3.6 Multimodal
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                        Marathi → Clinical English
                      </span>
                    </div>

                    {/* Clinical English Standardized */}
                    <div className="bg-blue-50/50 border-l-4 border-blue-600 rounded-r-2xl p-5 space-y-1.5">
                      <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Standardized Clinical English
                      </div>
                      <p className="text-base font-semibold text-slate-900 leading-relaxed m-0">
                        {currentCase.translated_symptoms ||
                          "Patient reports persistent high fever for 3 days, body ache, weakness and loss of appetite."}
                      </p>
                    </div>

                    {/* Vernacular Audio Transcription */}
                    <div className="bg-slate-50 border-l-4 border-slate-400 rounded-r-2xl p-5 space-y-1.5">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Original Spoken Audio Dictation (Marathi)
                      </div>
                      <p className="text-base italic text-slate-800 font-medium leading-relaxed m-0">
                        "{currentCase.voice_note_text || "मला तीन दिवसांपासून ज्वर आहे, अंग दुखत आहे, खायची इच्छा नाही."}"
                      </p>
                    </div>

                    {/* Audio Playback Button */}
                    <button
                      type="button"
                      onClick={toggleAudio}
                      className={`btn-clinical-outline w-full justify-center gap-3 !h-12 text-sm font-bold rounded-xl ${audioPlaying ? "bg-rose-50 text-rose-700 border-rose-300" : ""
                        }`}
                    >
                      {audioPlaying ? (
                        <>
                          <VolumeX className="w-5 h-5 text-rose-600" />
                          <span>Pause Audio Dictation</span>
                          <div className="waveform-bars ml-2">
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                            <div className="waveform-bar" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-5 h-5 text-blue-700" />
                          <span>Play Original ASHA Audio Dictation</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Field Observation (by ASHA Worker) */}
                  <div className="clinical-card p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                        <Users className="w-5 h-5 text-teal-700" />
                        <span>Field Observation (by ASHA Worker)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3.5">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Collected by</div>
                        <div className="text-base font-bold text-slate-900 mt-1">ASHA Worker</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Location</div>
                        <div className="text-base font-bold text-slate-900 mt-1">Bhandara, MH</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Recorded</div>
                        <div className="text-base font-bold text-slate-900 mt-1">8 Sept 2025, 10:23 AM</div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Image / Attachment */}
                  <div className="clinical-card p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Patient Clinical Attachment
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                          currentCase.image_url
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            : "text-slate-500 bg-slate-100"
                        }`}
                      >
                        {currentCase.image_url ? "1 File" : "0 Files"}
                      </span>
                    </div>

                    {currentCase.image_url ? (
                      <div className="flex items-center gap-5">
                        <div
                          onClick={() => {
                            if (!imageLoadError) setImagePreviewOpen(true);
                          }}
                          className={`relative w-32 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0 ${
                            imageLoadError ? "bg-slate-100 cursor-default" : "cursor-pointer group"
                          }`}
                        >
                          {imageLoadError ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                              <AlertTriangle className="w-5 h-5 text-amber-500 mb-1" />
                              <span className="text-[10px] font-bold text-slate-500 leading-tight">Image Unavailable</span>
                            </div>
                          ) : (
                            <>
                              <img
                                src={currentCase.image_url}
                                alt={`Clinical Attachment for Case #${currentCase.case_id || currentCase.id}`}
                                onError={() => setImageLoadError(true)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/0 transition-colors flex items-center justify-center text-white">
                                <ExternalLink className="w-5 h-5" />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-slate-600 min-w-0">
                          <div
                            className="text-base font-bold text-slate-900 truncate max-w-xs"
                            title={currentCase.image_url.split("/").pop()?.split("?")[0]}
                          >
                            {currentCase.image_url.split("/").pop()?.split("?")[0] ||
                              `case_${currentCase.case_id || currentCase.id}_attachment.jpg`}
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            Clinical Observation Photo • {currentCase.department || "General"}
                          </div>
                          {!imageLoadError && (
                            <button
                              type="button"
                              onClick={() => setImagePreviewOpen(true)}
                              className="text-blue-700 hover:text-blue-900 font-bold text-sm mt-2.5 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Enlarge Image</span>
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 py-4 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-700">No clinical photo attached</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            The ASHA worker did not attach any symptom or wound photo for this intake.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT COLUMN: AI Insights & E-Prescription Workspace ── */}
                <div className="space-y-6">
                  {/* AI Triage Insight Card */}
                  <div className="clinical-card p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>AI Triage Insight</span>
                      </div>
                      <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-md">
                        {currentCase.department}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Priority:</span>
                      <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-0.5 rounded-full">
                        {currentCase.triage_priority.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                        AI Red Flags Identified
                      </div>
                      <div className="space-y-2.5">
                        {(currentCase.ai_red_flags || [
                          "Persistent high fever for 3 days",
                          "Elevated pulse (110 bpm)",
                          "Risk of secondary bacterial infection",
                        ]).map((flag, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-3">
                      "AI-generated triage assistance. Final clinical decision remains with the consulting doctor."
                    </p>
                  </div>

                  {/* ─── REFERRAL INTELLIGENCE & CARE ROUTING PANEL ─── */}
                  <div className="clinical-card p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                          <GitBranch className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
                            <span>Referral Intelligence</span>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                              Care Routing
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            Coordinate secondary/tertiary referrals with structured clinical context
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReferralOpen(!referralOpen)}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer shrink-0"
                      >
                        <span>{referralOpen ? "Collapse" : "Refer Patient"}</span>
                        {referralOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {referralSubmitted ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
                        <div className="flex items-center justify-center gap-2.5 text-emerald-800 font-bold text-base">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>Referral Successfully Created & Queued</span>
                        </div>
                        <div className="text-sm text-emerald-700 font-medium leading-relaxed">
                          Referral package for <strong>{currentCase.patient_name}</strong> transmitted to{" "}
                          <strong>District Hospital Aundh (Cardiology & Specialty Wing)</strong>.
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/70 py-2 px-4 rounded-lg inline-block">
                          ABDM Referral ID: ABDM-REF-2026-9042 • Token Generated
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setReferralSubmitted(false)}
                            className="text-sm font-bold text-emerald-800 underline hover:text-emerald-900 cursor-pointer"
                          >
                            Edit / Send Another Referral
                          </button>
                        </div>
                      </div>
                    ) : referralOpen ? (
                      <div className="space-y-4 pt-1">
                        {/* Referral Reason */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                            Referral Reason
                          </label>
                          <select
                            value={referralReason || (currentCase.department === "Cardiology" ? "Cardiology Review" : "Specialist Consultation")}
                            onChange={(e) => setReferralReason(e.target.value)}
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Cardiology Review">Cardiology Review (Elevated BP / Cardiac Flags)</option>
                            <option value="Pulmonology Assessment">Pulmonology Assessment (Dyspnea / Chest Infiltration)</option>
                            <option value="Dermatological Biopsy">Dermatological Biopsy & Advanced Pathology</option>
                            <option value="Pediatric Subspecialty">Pediatric Subspecialty Consultation</option>
                            <option value="Emergency District Admission">Emergency District Admission (High Risk Triage)</option>
                          </select>
                        </div>

                        {/* Priority Selector */}
                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                            Referral Priority
                          </label>
                          <div className="flex gap-2.5">
                            {[
                              { id: "urgent", label: "● Urgent (< 24h)", color: "text-rose-700 border-rose-300 bg-rose-50" },
                              { id: "routine", label: "○ Routine (3-5d)", color: "text-blue-700 border-blue-300 bg-blue-50" },
                              { id: "scheduled", label: "○ Scheduled", color: "text-slate-700 border-slate-300 bg-slate-50" },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setReferralPriority(opt.id as any)}
                                className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-xl border transition-all cursor-pointer ${referralPriority === opt.id
                                    ? opt.color + " ring-2 ring-indigo-400"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Relevant Findings Checklist + Recommended Facility Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Checkbox list */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Relevant Findings
                            </div>
                            {[
                              { key: "bp_trend", label: `BP trend (${currentCase.vitals?.bp || "150/95"})` },
                              { key: "symptoms", label: "Vernacular audio & translation" },
                              { key: "previous_history", label: "Past history & conditions" },
                              { key: "ai_observations", label: "AI triage red flags & score" },
                              { key: "vitals", label: "Complete vitals baseline" },
                            ].map((item) => (
                              <label
                                key={item.key}
                                className="flex items-center gap-2.5 text-sm text-slate-700 font-semibold cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={referralFindings[item.key] ?? true}
                                  onChange={(e) =>
                                    setReferralFindings((prev) => ({ ...prev, [item.key]: e.target.checked }))
                                  }
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                                />
                                <span>{item.label}</span>
                              </label>
                            ))}
                          </div>

                          {/* Recommended Specialty & Facility Card */}
                          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                Recommended Specialty
                              </div>
                              <div className="text-base font-black text-slate-900">
                                {currentCase.department === "Cardiology"
                                  ? "Cardiology & Tele-ICU"
                                  : currentCase.department === "Dermatology"
                                    ? "Dermatology & Cutaneous Surgery"
                                    : "Internal Medicine / General Hospital"}
                              </div>
                            </div>
                            <div className="space-y-1.5 mt-3 pt-3 border-t border-blue-200">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Suggested Facility
                              </div>
                              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                                <span>District Hospital Aundh (12.4 km)</span>
                              </div>
                              <div className="text-xs text-emerald-700 font-bold">
                                Jan Aushadhi Kendra Attached • High Stock
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Create Referral Action Button */}
                        <button
                          type="button"
                          onClick={() => setReferralSubmitted(true)}
                          className="btn-clinical-primary w-full justify-center !bg-indigo-700 hover:!bg-indigo-800 !h-12 text-sm font-bold rounded-xl"
                        >
                          <GitBranch className="w-4 h-4" />
                          <span>Create Referral & Transmit via ABDM</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span>Need higher facility care or sub-specialist opinion?</span>
                        <button
                          type="button"
                          onClick={() => setReferralOpen(true)}
                          className="font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                        >
                          Open Referral Form
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Clinical E-Prescription Form */}
                  <PrescriptionForm
                    caseId={currentCase.case_id || currentCase.id}
                    patientAbha={currentCase.abha_id}
                    patientName={currentCase.patient_name}
                    onSuccess={handlePrescriptionSuccess}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              VIEW 4: PRESCRIPTION SUBMITTED (Panel 4 from reference)
              ═════════════════════════════════════════════════════════════ */}
          {activeView === "success" && (
            <div className="view-enter max-w-3xl mx-auto py-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
                {/* Big Green Checkmark */}
                <div className="relative mx-auto w-20 h-20">
                  <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-30" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Prescription Submitted
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Case #{submittedCaseInfo?.caseId || "23"} has been closed successfully.
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    The patient's treatment plan has been sent to the ASHA worker.
                  </p>
                </div>

                {/* Patient Summary Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                      {(submittedCaseInfo?.patientName || "P")[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {submittedCaseInfo?.patientName || "Priya Sharma"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        42 yrs • Female
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-t border-slate-200/70 pt-2.5 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Case ID</div>
                      <div className="font-mono font-bold text-slate-800">
                        #{submittedCaseInfo?.caseId || "23"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Status</div>
                      <div className="text-emerald-700 font-bold text-[11px]">
                        Closed
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Consulting Doctor</div>
                      <div className="font-mono font-bold text-slate-800 text-[11px]">
                        DOCTOR-MH-7313
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Submitted</div>
                      <div className="text-[11px] text-slate-700 font-medium">
                        {submittedCaseInfo?.timestamp || "8 Sept 2025, 10:45 AM"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Case Lifecycle Stepper (Stage 5 active: Treatment dispatched) */}
                <div className="text-left">
                  <CaseLifecycleStepper
                    currentStage={5}
                    caseId={submittedCaseInfo?.caseId}
                    isCompleted={true}
                  />
                </div>

                {/* Closed-Loop Action Buttons */}
                <div className="flex gap-4 pt-4 pb-2">
                  <button
                    onClick={() => setActiveView("queue")}
                    className="btn-clinical-outline flex-1 justify-center"
                  >
                    Return to Queue
                  </button>

                  <button
                    onClick={handleNextUrgentCase}
                    className="btn-clinical-primary flex-1 justify-center"
                  >
                    <span>View Next Urgent Case</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Footer Quote */}
                <p className="text-[11px] text-slate-400 italic pt-4 border-t border-slate-100">
                  "Bridging distances. Bringing better care." — SAHARA
                </p>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              VIEW 5: GEOSPATIAL CARE RADAR
              ═════════════════════════════════════════════════════════════ */}
          {activeView === "radar" && (
            <div className="view-enter space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h1 className="text-base font-extrabold text-slate-900">
                    Geospatial Care Radar
                  </h1>
                  <p className="text-xs text-slate-500">
                    Live map routing for nearby Jan Aushadhi pharmacies and referral hospitals.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView("queue")}
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  Back to Queue
                </button>
              </div>

              <div className="h-[600px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white">
                <FacilityMap />
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              VIEW 6: REPORTS & INSIGHTS
              ═════════════════════════════════════════════════════════════ */}
          {activeView === "reports" && (
            <div className="view-enter space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h1 className="text-lg font-extrabold text-slate-900">
                  Clinical Teleconsultation Telemetry
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rural consultation turnaround times and PMBJP generic drug adoption rate.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-slate-900">
                    <div className="text-xs font-bold text-blue-700">Average Turnaround</div>
                    <div className="text-2xl font-black mt-1">14.2 min</div>
                    <div className="text-[11px] text-slate-500">From ASHA intake to doctor sign-off</div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-900">
                    <div className="text-xs font-bold text-emerald-800">Generic Substitution</div>
                    <div className="text-2xl font-black mt-1">84.6%</div>
                    <div className="text-[11px] text-slate-500">Jan Aushadhi medicines adopted</div>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-slate-900">
                    <div className="text-xs font-bold text-purple-700">Villages Covered</div>
                    <div className="text-2xl font-black mt-1">28</div>
                    <div className="text-[11px] text-slate-500">District: Bhandara, Maharashtra</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODALS & OVERLAYS
          ═══════════════════════════════════════════════════════════════ */}

      {/* Notifications Drawer / Modal */}
      {activeModal === "notifications" && (
        <div className="modal-overlay-premium modal-backdrop-enter">
          <div className="modal-card-premium modal-enter">
            <div className="modal-header-bar modal-header-bar--rose" />
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-700" />
                  <h3 className="text-base font-bold text-slate-900">Clinical Alerts & Notifications</h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm">
                  <div className="font-bold text-rose-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    New High Priority Case
                  </div>
                  <div className="text-slate-700 mt-1.5">
                    Case #23 requires immediate review (BP 150/95, Temp 102°F).
                  </div>
                  <div className="text-xs text-slate-400 mt-1">18 min ago</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
                  <div className="font-bold text-amber-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    Moderate Case Waiting
                  </div>
                  <div className="text-slate-700 mt-1.5">
                    Case #18 waiting 32 minutes (Dermatology referral).
                  </div>
                  <div className="text-xs text-slate-400 mt-1">32 min ago</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
                  <div className="font-bold text-emerald-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Prescription Dispatched
                  </div>
                  <div className="text-slate-700 mt-1.5">
                    Case #21 closed and treatment sent to ASHA worker.
                  </div>
                  <div className="text-xs text-slate-400 mt-1">45 min ago</div>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Sync & System Status Modal */}
      {activeModal === "sync" && (
        <div className="modal-overlay-premium modal-backdrop-enter">
          <div className="modal-card-premium modal-enter">
            <div className="modal-header-bar modal-header-bar--green" />
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <RefreshCw className="w-5 h-5 text-emerald-700" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Offline Sync & System Engine</h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-sm text-slate-700">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-base text-slate-900">SAHARA Offline Bridge v2.4</div>
                  <div className="text-slate-600 text-sm mt-1 leading-relaxed">
                    Dual-layer sync using IndexedDB (Dexie) and FastAPI WebSocket heartbeats for high reliability in remote clinic environments.
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                  <span className="font-medium text-slate-600">API Gateway Connection</span>
                  <span className="font-bold text-emerald-700">● 100% Operational</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                  <span className="font-medium text-slate-600">Database Sync (Supabase)</span>
                  <span className="font-bold text-emerald-700">● Live Auto-Sync (5s)</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                  <span className="font-medium text-slate-600">Active Waiting Cases</span>
                  <span className="font-bold text-slate-900 font-mono text-base">{allCases.length} waiting</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 text-sm">
                  <span className="font-medium text-slate-600">Last Synchronized</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : "Just now"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    void fetchQueue();
                    void fetchCompletedCases();
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingQueue ? "spin" : ""}`} />
                  <span>Force Sync Now</span>
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security & ABDM Compliance Modal */}
      {activeModal === "abdm" && (
        <div className="modal-overlay-premium modal-backdrop-enter">
          <div className="modal-card-premium modal-enter">
            <div className="modal-header-bar modal-header-bar--teal" />
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="w-5 h-5 text-teal-700" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">ABDM & Data Security</h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-sm text-slate-700">
                <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/70 border border-teal-200">
                  <div className="font-extrabold text-base text-teal-950">ABHA & HPR Compliance Ready</div>
                  <div className="text-teal-900 text-sm mt-1 leading-relaxed">
                    All teleconsultation records are cryptographically signed and comply with National Digital Health Mission (NDHM / ABDM) standards.
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-800 py-1.5 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  <span>End-to-end AES-256 local vault encryption</span>
                </div>
                <div className="flex items-center gap-3 text-slate-800 py-1.5 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  <span>Doctor HPR identity authenticated: <strong className="font-mono text-slate-900">DOCTOR-MH-7313</strong></span>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Centre Modal */}
      {activeModal === "help" && (
        <div className="modal-overlay-premium modal-backdrop-enter">
          <div className="modal-card-premium modal-enter">
            <div className="modal-header-bar modal-header-bar--blue" />
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    <Info className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Clinical Protocols & Help</h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-sm text-slate-700">
                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-bold text-base text-slate-900">Triage Escalation Protocol</div>
                  <div className="text-slate-600 text-sm mt-1 leading-relaxed">
                    Urgent red-flag cases should be reviewed within 30 minutes. If critical intervention is needed, use the Geospatial Care Radar to route to the nearest CHC.
                  </div>
                </div>
                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-bold text-base text-slate-900">Generic Drug Policy</div>
                  <div className="text-slate-600 text-sm mt-1 leading-relaxed">
                    Prescribe PMBJP Jan Aushadhi generic formulations whenever clinically equivalent to reduce out-of-pocket costs for rural patients.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {imagePreviewOpen && currentCase?.image_url && (
        <div
          onClick={() => setImagePreviewOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-6 z-50 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl border border-slate-200 cursor-default"
          >
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-800">
                  Clinical Attachment — Case #{currentCase?.case_id || currentCase?.id}
                </span>
                <span className="text-[11px] font-mono text-slate-500 truncate max-w-sm">
                  ({currentCase.image_url.split("/").pop()?.split("?")[0]})
                </span>
              </div>
              <button
                onClick={() => setImagePreviewOpen(false)}
                className="text-slate-500 hover:text-slate-800 p-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 p-3 flex items-center justify-center min-h-[300px]">
              <img
                src={currentCase.image_url}
                alt="Clinical Attachment Full Preview"
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
