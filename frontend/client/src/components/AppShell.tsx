import React, { useState, useEffect, ReactNode } from "react";
import {
  ArrowLeft,
  Search,
  Bell,
  Settings,
  X,
  Moon,
  Sun,
  Globe,
  Volume2,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  HeartPulse,
  Wifi,
  WifiOff,
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
}

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
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const initials = (user?.full_name || "U")
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
    setSettingsOpen(false);
    logout();
    onBack?.();
  };

  return (
    <div className="shell">
      {/* ── Top App Bar ── */}
      <header className="appbar">
        <div className="appbar__left">
          {onBack && (
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
          {/* Network indicator */}
          <div className={`net-dot ${isOnline ? "net-dot--on" : "net-dot--off"}`} title={isOnline ? "Online" : "Offline"}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          </div>

          {/* Search */}
          {showSearch && (
            <button className="appbar__icon-btn" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="w-[18px] h-[18px]" />
            </button>
          )}

          {/* Notification bell */}
          <button className="appbar__icon-btn appbar__notif-btn">
            <Bell className="w-[18px] h-[18px]" />
            <span className="appbar__notif-dot" />
          </button>

          {/* Settings */}
          <button className="appbar__icon-btn" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-[18px] h-[18px]" />
          </button>

          {/* Avatar */}
          <button className="appbar__avatar" onClick={() => setSettingsOpen(true)} style={{ background: accent }}>
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

      {/* ── Bottom Tab Bar ── */}
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

      {/* ── Settings Drawer (overlay) ── */}
      {settingsOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setSettingsOpen(false)} />
          <aside className="drawer">
            {/* Profile section */}
            <div className="drawer__profile">
              <div className="drawer__avatar" style={{ background: accent }}>{initials}</div>
              <div className="drawer__user-info">
                <div className="drawer__name">{user?.full_name || "User"}</div>
                <div className="drawer__id">{user?.abha_id || "SAHARA User"}</div>
              </div>
              <button className="drawer__close" onClick={() => setSettingsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="drawer__divider" />

            {/* Language */}
            <div className="drawer__section-label">Language / भाषा</div>
            <div className="drawer__lang-row">
              {(["English", "हिंदी", "मराठी"] as const).map((l) => (
                <button
                  key={l}
                  className={`drawer__lang-btn ${language === l ? "drawer__lang-btn--active" : ""}`}
                  onClick={() => onLanguageChange?.(l)}
                  style={language === l ? { background: accent, color: "white" } : undefined}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="drawer__divider" />

            {/* Toggle items */}
            <div className="drawer__section-label">Preferences</div>

            <label className="drawer__toggle-row">
              <div className="drawer__toggle-left">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              <input type="checkbox" className="toggle-switch" defaultChecked />
            </label>

            <label className="drawer__toggle-row">
              <div className="drawer__toggle-left">
                <Volume2 className="w-4 h-4" />
                <span>Sound Effects</span>
              </div>
              <input type="checkbox" className="toggle-switch" defaultChecked />
            </label>

            <div className="drawer__divider" />

            {/* Menu items */}
            <button className="drawer__menu-item" onClick={() => { setSettingsOpen(false); onTabChange("security"); }}>
              <Shield className="w-4 h-4" />
              <span>Privacy & Security Enclave</span>
              <ChevronRight className="w-4 h-4" style={{ marginLeft: "auto", opacity: 0.4 }} />
            </button>
            <button className="drawer__menu-item">
              <HelpCircle className="w-4 h-4" />
              <span>Help & Support</span>
              <ChevronRight className="w-4 h-4" style={{ marginLeft: "auto", opacity: 0.4 }} />
            </button>

            <div style={{ flex: 1 }} />

            {/* Logout */}
            <button className="drawer__logout" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            <div className="drawer__footer">
              SAHARA Health Bridge v1.0 • SIH 2024
            </div>
          </aside>
        </>
      )}
    </div>
  );
};
