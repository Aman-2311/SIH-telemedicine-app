import React, { useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { useNetworkStore } from "../store/useNetworkStore";
import { useAuthStore } from "../store/useAuthStore";

interface NetworkStatusBannerProps {
  currentLanguage?: "English" | "हिंदी" | "मराठी";
  onLanguageChange?: (lang: "English" | "हिंदी" | "मराठी") => void;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  currentLanguage = "English",
  onLanguageChange,
}) => {
  const {
    isOnline,
    isSyncing,
    pendingSyncCount,
    lastSyncedAt,
    initNetworkListeners,
    triggerManualSync,
  } = useNetworkStore();

  const { user, role } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initNetworkListeners();
    return () => unsubscribe();
  }, [initNetworkListeners]);

  return (
    <div className="w-full bg-blue-950 text-white border-b border-blue-900 px-3 py-1.5 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 select-none shadow-sm">
      {/* Left: Official Government Tag & Network Status */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-blue-200 uppercase tracking-wide text-[11px] font-bold">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">National Health Mission •</span>
          <span>SAHARA Health Bridge</span>
        </div>

        {/* Network Indicator Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
            isOnline
              ? "bg-emerald-700 text-white border-emerald-500"
              : "bg-rose-700 text-white border-rose-500 animate-pulse"
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>🟢 Online (Localhost:8000)</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>🔴 Offline (Dexie Store Active)</span>
            </>
          )}
        </div>

        {/* Offline Queue Badge */}
        {pendingSyncCount > 0 && (
          <button
            onClick={() => triggerManualSync()}
            disabled={!isOnline || isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
              isSyncing
                ? "bg-amber-500 text-gray-950 border-amber-300"
                : "bg-amber-400 hover:bg-amber-300 text-gray-950 border-amber-300"
            }`}
          >
            <RefreshCw
              className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span>
              {isSyncing
                ? "Syncing Intakes..."
                : `${pendingSyncCount} Offline Intakes Pending Sync`}
            </span>
          </button>
        )}
      </div>

      {/* Right: Language Selector & User Badge */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {onLanguageChange && (
          <div className="flex items-center bg-blue-900 rounded-lg p-0.5 border border-blue-700">
            <Globe className="w-3 h-3 ml-1.5 mr-1 text-blue-300" />
            {(["English", "हिंदी", "मराठी"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  currentLanguage === lang
                    ? "bg-white text-blue-950 shadow-sm"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}

        {user?.abha_id && (
          <div className="hidden sm:flex items-center gap-1.5 bg-blue-900 px-2.5 py-0.5 rounded border border-blue-700 text-white font-mono text-[11px]">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{user.abha_id}</span>
            <span className="bg-blue-800 text-amber-300 px-1 rounded text-[10px] uppercase font-bold">
              {role}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
