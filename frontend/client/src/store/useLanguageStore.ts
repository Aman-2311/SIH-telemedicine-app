import { create } from "zustand";
import { SupportedLanguage, getCopy } from "../i18n";

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: "English",
  setLanguage: (lang) => {
    try {
      localStorage.setItem("sahara_language", lang);
    } catch {}
    set({ language: lang });
  },
  t: (key) => {
    const copy = getCopy(get().language);
    return (copy as any)[key] || key;
  },
}));

// Initialize language from local storage on mount
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("sahara_language");
  if (stored === "English" || stored === "हिंदी" || stored === "मराठी") {
    useLanguageStore.getState().setLanguage(stored as SupportedLanguage);
  }
}
