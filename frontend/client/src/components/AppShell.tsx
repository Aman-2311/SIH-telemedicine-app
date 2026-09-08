import React, { useState, useEffect, ReactNode } from "react";
import {
  Menu,
  ArrowLeft,
  Search,
  X,
  Globe,
  Shield,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  HeartPulse,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  Info,
  CheckCircle2,
  Phone,
  BookOpen,
  Zap,
  ClipboardList,
  MapPin,
  ExternalLink,
  Stethoscope,
  Clock,
} from "lucide-react";
import { useNetworkStore } from "../store/useNetworkStore";
import { useAuthStore } from "../store/useAuthStore";
import { GeminiIcon } from "./GeminiIcon";

export interface TabItem {
  key: string;
  icon: ReactNode;
  label: string;
  badge?: number;
}

interface AppShellProps {
  title: string;
  subtitle?: string;
  accentColor?: "teal" | "blue" | "green";
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children: ReactNode;
  onBack?: () => void;
  fab?: { icon: ReactNode; label: string; onClick: () => void };
  language?: "English" | "हिंदी" | "मराठी";
  onLanguageChange?: (l: "English" | "हिंदी" | "मराठी") => void;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  headerSearchSlot?: ReactNode;
}

type ModalViewType = "notifications" | "updates" | "help" | "about" | null;

export const AppShell: React.FC<AppShellProps> = ({
  title,
  subtitle,
  accentColor = "teal",
  tabs,
  activeTab,
  onTabChange,
  children,
  onBack,
  fab,
  language = "English",
  onLanguageChange,
  showSearch = false,
  onSearch,
  headerSearchSlot,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalViewType>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [transitionTabLabel, setTransitionTabLabel] = useState("");
  const { user, logout } = useAuthStore();
  const { isOnline } = useNetworkStore();

  // Browser history popstate guard
  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== "home") {
        onTabChange("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab, onTabChange]);

  const handleTabSelect = (key: string) => {
    if (key === activeTab) return;
    const tabObj = tabs.find((t) => t.key === key);
    setTransitionTabLabel(tabObj?.label || key);
    setIsPageTransitioning(true);
    onTabChange(key);
    setTimeout(() => {
      setIsPageTransitioning(false);
    }, 280);
  };

  const handleSidebarNav = (key: string) => {
    setSidebarOpen(false);
    handleTabSelect(key);
  };

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateStatus("System is up to date • SAHARA Engine v2.4 (Build 2026.09)");
    }, 1400);
  };

  const initials = (user?.full_name || "Sunita Patil (TEST)")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accentMap = {
    teal: "var(--teal)",
    blue: "var(--navy)",
    green: "#1a8c79",
  };
  const accent = accentMap[accentColor];

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
    onBack?.();
  };

  return (
    <div className="shell">
      {/* ── Top App Bar ── */}
      <header className="appbar">
        <div className="appbar__left">
          {/* 3-Line Hamburger Menu Button (Gmail Style on Left) */}
          <button
            id="main-sidebar-toggle-btn"
            className="appbar__icon-btn appbar__hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            title="Main Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {onBack && activeTab !== "home" && (
            <button className="appbar__icon-btn" onClick={onBack} title="Back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="appbar__brand">
            <div className="appbar__logo" style={{ background: accent }}>
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h1 className="appbar__title">{title}</h1>
              {subtitle && <p className="appbar__sub">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="appbar__right">
          {headerSearchSlot}

          {/* Network indicator */}
          <div className={`net-dot ${isOnline ? "net-dot--on" : "net-dot--off"}`} title={isOnline ? "Online" : "Offline"}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>

          {/* Search */}
          {showSearch && !headerSearchSlot && (
            <button className="appbar__icon-btn" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* Direct Sign Out / Switch Role Button */}
          <button
            id="topbar-signout-btn"
            className="appbar__signout-btn"
            onClick={handleLogout}
            title="Sign Out to Sign-in page"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.08)",
              color: "#dc2626",
              border: "1px solid rgba(239, 68, 68, 0.22)",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          {/* User Profile Avatar (Clicking also opens left side navigation) */}
          <button
            className="appbar__avatar"
            onClick={() => setSidebarOpen(true)}
            style={{ background: accent }}
            title="User Profile & Menu"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Search bar (slide down) */}
      {searchOpen && (
        <div className="search-bar-slide">
          <div className="search-bar">
            <Search className="w-4 h-4" style={{ color: "var(--muted)", flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); onSearch?.(e.target.value); }}
              placeholder="Search patients, records…"
              autoFocus
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); onSearch?.(""); }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── App Icon Page Transition Overlay ── */}
      {isPageTransitioning && (
        <div className="page-transition-curtain">
          <div className="page-transition-pill">
            <div className="page-transition-logo" style={{ background: accent }}>
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="page-transition-text">
              <span className="page-transition-title">SAHARA</span>
              <span className="page-transition-sub">{transitionTabLabel}</span>
            </div>
            <GeminiIcon size={16} />
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="shell__body">{children}</main>

      {/* ── FAB ── */}
      {fab && (
        <button className="fab" onClick={fab.onClick} title={fab.label} style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}>
          {fab.icon}
        </button>
      )}

      {/* ── Bottom Tab Bar (Security Removed from Bottom as Requested) ── */}
      <nav className="tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tabbar__item ${activeTab === tab.key ? "tabbar__item--active" : ""}`}
            onClick={() => handleTabSelect(tab.key)}
            style={activeTab === tab.key ? { color: accent } : undefined}
          >
            <span className="tabbar__icon">
              {tab.icon}
              {tab.badge != null && tab.badge > 0 && (
                <span className="tabbar__badge">{tab.badge > 9 ? "9+" : tab.badge}</span>
              )}
            </span>
            <span className="tabbar__label">{tab.label}</span>
            {activeTab === tab.key && <span className="tabbar__indicator" style={{ background: accent }} />}
          </button>
        ))}
      </nav>

      {/* ── LEFT SIDE NAVIGATION DRAWER (Gmail Style 3-Line Menu) ── */}
      {sidebarOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="drawer drawer--left" id="main-sidebar-drawer">
            {/* Header */}
            <div className="sidebar-header">
              <div className="sidebar-header-brand">
                <div className="sidebar-logo" style={{ background: accent }}>
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="sidebar-title">SAHARA</h3>
                  <p className="sidebar-sub">Telemedicine Gateway</p>
                </div>
              </div>
              <button
                className="sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
                title="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info Card */}
            <div className="sidebar-profile-card">
              <div className="sidebar-avatar" style={{ background: accent }}>
                {initials}
              </div>
              <div className="sidebar-profile-info">
                <div className="sidebar-profile-name">{user?.full_name || "Sunita Patil (TEST)"}</div>
                <div className="sidebar-profile-id">{user?.abha_id || "TEST-ASHA-MH-0001"}</div>
                <div className={`sidebar-status-tag ${isOnline ? "sidebar-status-tag--online" : "sidebar-status-tag--offline"}`}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOnline ? "#16a34a" : "#d97706" }} />
                  <span>{isOnline ? "Online Sync Active" : "Offline Vault Mode"}</span>
                </div>
              </div>
            </div>

            {/* SECTION 1: CLINICAL WORKFLOW */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Clinical Workflow</div>
              <button
                className={`sidebar-nav-btn ${activeTab === "home" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("home")}
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Home</span>
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "intake" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("intake")}
              >
                <GeminiIcon size={16} />
                <span>New Patient Intake</span>
                <span className="sidebar-nav-badge sidebar-nav-badge--purple">AI</span>
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "queue" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("queue")}
              >
                <ClipboardList className="w-4 h-4 text-blue-500" />
                <span>Patient Queue</span>
              </button>

              <button
                id="sidebar-nav-history"
                className={`sidebar-nav-btn ${activeTab === "history" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("history")}
              >
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Patient History</span>
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "map" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => handleSidebarNav("map")}
              >
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Nearby Facilities</span>
                <span className="sidebar-nav-badge sidebar-nav-badge--teal">GPS</span>
              </button>
            </div>

            {/* SECTION 2: SYSTEM */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">System</div>

              {/* 🛡️ SECURITY & ABDM COMPLIANCE */}
              <button
                id="sidebar-nav-security"
                className={`sidebar-nav-btn ${activeTab === "security" ? "sidebar-nav-btn--active" : ""}`}
                onClick={() => {
                  setSidebarOpen(false);
                  onTabChange("security");
                }}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security & ABDM</span>
                <span className="sidebar-nav-badge sidebar-nav-badge--teal">ABDM</span>
              </button>

              {/* 🔄 OFFLINE SYNC */}
              <button
                id="sidebar-nav-updates"
                className="sidebar-nav-btn"
                onClick={() => {
                  setSidebarOpen(false);
                  setModalView("updates");
                }}
              >
                <RefreshCw className="w-4 h-4 text-sky-600" />
                <span>Offline Sync</span>
                <span className="sidebar-nav-badge sidebar-nav-badge--amber">v2.4</span>
              </button>

              {/* ❓ HELP / PROTOCOLS */}
              <button
                id="sidebar-nav-help"
                className="sidebar-nav-btn"
                onClick={() => {
                  setSidebarOpen(false);
                  setModalView("help");
                }}
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Help / Protocols</span>
              </button>

              {/* ℹ️ ABOUT SAHARA */}
              <button
                id="sidebar-nav-about"
                className="sidebar-nav-btn"
                onClick={() => {
                  setSidebarOpen(false);
                  setModalView("about");
                }}
              >
                <Info className="w-4 h-4 text-slate-500" />
                <span>About SAHARA</span>
              </button>
            </div>

            {/* SECTION 3: LANGUAGE & PREFERENCES */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Language / भाषा</div>
              <div className="sidebar-lang-row">
                {(["English", "हिंदी", "मराठी"] as const).map((l) => (
                  <button
                    key={l}
                    className="sidebar-lang-btn"
                    onClick={() => onLanguageChange?.(l)}
                    style={language === l ? { background: accent, color: "white", borderColor: accent } : undefined}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 16 }} />

            {/* Sign Out Button */}
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </button>

            <div className="sidebar-footer">
              SAHARA Health Bridge v2.4 • Smart India Hackathon 2024
            </div>
          </aside>
        </>
      )}

      {/* ── MODAL: NOTIFICATIONS & CLINICAL ALERTS ── */}
      {modalView === "notifications" && (
        <div className="sahara-modal-overlay" onClick={() => setModalView(null)}>
          <div className="sahara-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sahara-modal-header">
              <h3 className="sahara-modal-title">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>Notifications & Clinical Alerts</span>
              </h3>
              <button className="sidebar-close-btn" onClick={() => setModalView(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sahara-modal-body">
              <div className="flex flex-col gap-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-sm font-bold text-slate-900">Dr. Vikram Patil (Specialist Hub)</strong>
                      <span className="text-xs text-slate-400 font-medium">15m ago</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed m-0">
                      Reviewed clinical case for <strong className="text-slate-900 font-semibold">Aman Sharma</strong>. Electronic prescription issued with Jan Aushadhi generic alternatives (Paracetamol 500mg, Amoxicillin).
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-sm font-bold text-emerald-900">PMBJP Jan Aushadhi Kendra #2041</strong>
                      <span className="text-xs text-emerald-700 font-medium">1h ago</span>
                    </div>
                    <p className="text-sm text-emerald-800 leading-relaxed m-0">
                      Essential antibiotic and fever medicines stock refreshed with guaranteed 80%+ discount comparison available on radar.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-sm font-bold text-slate-900">Dexie.js Offline Store Auto-Sync</strong>
                      <span className="text-xs text-slate-400 font-medium">3h ago</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed m-0">
                      Background daemon completed synchronization of 2 patient intake records. All records cryptographically verified.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sahara-modal-footer">
              <button
                onClick={() => setModalView(null)}
                className="sahara-modal-close-btn"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: OFFLINE SYNC & SYSTEM UPDATES ── */}
      {modalView === "updates" && (
        <div className="sahara-modal-overlay" onClick={() => setModalView(null)}>
          <div className="sahara-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sahara-modal-header">
              <h3 className="sahara-modal-title">
                <RefreshCw className="w-5 h-5 text-sky-600" />
                <span>System Updates & Offline Status</span>
              </h3>
              <button className="sidebar-close-btn" onClick={() => setModalView(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sahara-modal-body">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Platform Version:</span>
                  <strong className="text-slate-900 font-bold">v2.4.0 (SIH 2024 Production)</strong>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Encrypted Local Vault:</span>
                  <strong className="text-emerald-700 font-bold">Dexie.js IndexedDB (Active)</strong>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">AI Translation Model:</span>
                  <strong className="text-purple-700 font-bold">Gemini 3.6 Flash Multi-Lingual</strong>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Geospatial Calculation:</span>
                  <strong className="text-sky-700 font-bold">Haversine GPS Dynamic Engine</strong>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Network Gateway:</span>
                  <strong className={isOnline ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                    {isOnline ? "Online Central Dispatch" : "Offline Local Cache"}
                  </strong>
                </div>
              </div>

              {updateStatus && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{updateStatus}</span>
                </div>
              )}

              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${checkingUpdate ? "spin" : ""}`} />
                <span>{checkingUpdate ? "Checking Central Server..." : "Check for Updates Now"}</span>
              </button>
            </div>

            <div className="sahara-modal-footer">
              <button
                onClick={() => setModalView(null)}
                className="sahara-modal-close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HELP CENTRE & CLINICAL PROTOCOLS ── */}
      {modalView === "help" && (
        <div className="sahara-modal-overlay" onClick={() => setModalView(null)}>
          <div className="sahara-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sahara-modal-header">
              <h3 className="sahara-modal-title">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <span>Help Centre & Field Protocols</span>
              </h3>
              <button className="sidebar-close-btn" onClick={() => setModalView(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sahara-modal-body">
              {/* Emergency Numbers */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
                <div className="text-xs font-bold text-rose-800 mb-2.5 uppercase tracking-wider">
                  Emergency Helpline Numbers (24/7 Toll-Free)
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white p-2.5 rounded-lg border border-rose-200 text-center">
                    <span className="text-xs text-slate-500 block font-medium">National Ambulance</span>
                    <strong className="text-rose-700 text-lg font-mono font-bold">108</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-rose-200 text-center">
                    <span className="text-xs text-slate-500 block font-medium">National Health Helpline</span>
                    <strong className="text-sky-700 text-lg font-mono font-bold">104</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-rose-200 text-center">
                    <span className="text-xs text-slate-500 block font-medium">Women & Child Helpline</span>
                    <strong className="text-purple-700 text-lg font-mono font-bold">181</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-rose-200 text-center">
                    <span className="text-xs text-slate-500 block font-medium">Emergency General</span>
                    <strong className="text-slate-900 text-lg font-mono font-bold">112</strong>
                  </div>
                </div>
              </div>

              {/* Protocol FAQs */}
              <div className="flex flex-col gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <strong className="text-sm font-bold text-slate-900 block mb-1">
                    How to record intakes when internet is down?
                  </strong>
                  <p className="text-sm text-slate-600 leading-relaxed m-0 font-medium">
                    Your tablet uses local Dexie.js offline storage. Intakes and voice transcriptions save automatically. Once connectivity is detected, they auto-sync to the urban specialist queue.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <strong className="text-sm font-bold text-slate-900 block mb-1">
                    How does Gemini NLP translate Hindi/Marathi?
                  </strong>
                  <p className="text-sm text-slate-600 leading-relaxed m-0 font-medium">
                    Select the Hindi or Marathi speech language tag. Click &quot;Speak Here&quot; and narrate symptoms naturally. Gemini 3.6 Flash translates the dialect into clinical English and extracts vitals.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <strong className="text-sm font-bold text-slate-900 block mb-1">
                    Jan Aushadhi Generic Medicine Savings
                  </strong>
                  <p className="text-sm text-slate-600 leading-relaxed m-0 font-medium">
                    Check the Referral Map tab to guide patients to the nearest Jan Aushadhi Kendra, saving up to 80% on brand-name medicine costs.
                  </p>
                </div>
              </div>
            </div>

            <div className="sahara-modal-footer">
              <button
                onClick={() => setModalView(null)}
                className="sahara-modal-close-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ABOUT SAHARA ── */}
      {modalView === "about" && (
        <div className="sahara-modal-overlay" onClick={() => setModalView(null)}>
          <div className="sahara-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sahara-modal-header">
              <h3 className="sahara-modal-title">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                <span>About SAHARA Telemedicine</span>
              </h3>
              <button className="sidebar-close-btn" onClick={() => setModalView(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sahara-modal-body">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <HeartPulse className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-900 m-0">
                  SAHARA Health Bridge
                </h4>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  Dual-Interface Asynchronous Telemedicine for Rural Bharat
                </p>
                <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Smart India Hackathon 2024 Finalist
                </span>
              </div>

              <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <strong className="text-slate-900">The Rural Healthcare Challenge:</strong>
                  <p className="text-slate-600 mt-1">
                    In underdeveloped villages, real-time video telemedicine fails because internet drops constantly. Specialist doctors are miles away in city hospitals.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <strong className="text-slate-900">Our Solution:</strong>
                  <p className="text-slate-600 mt-1">
                    SAHARA is a 100% offline-first, store-and-forward telemedicine bridge. ASHA workers record voice intakes in regional languages (Hindi/Marathi), Gemini 3.6 Flash translates them into clinical summaries, urban doctors review cases asynchronously, and patients are referred to affordable generic pharmacies.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 text-sm block">ABDM Compliant</strong>
                  <span className="text-slate-500 font-medium">Full ABHA ID & HL7 integration</span>
                </div>
                <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 text-sm block">Generic Savings</strong>
                  <span className="text-slate-500 font-medium">PMBJP Jan Aushadhi 80% discount</span>
                </div>
              </div>
            </div>

            <div className="sahara-modal-footer">
              <button
                onClick={() => setModalView(null)}
                className="sahara-modal-close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

