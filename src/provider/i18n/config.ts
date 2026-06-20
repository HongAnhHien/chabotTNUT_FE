import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi";
import en from "./locales/en";

export const LANGUAGES = {
  vi: { label: "Tiếng Việt", flag: "🇻🇳" },
  en: { label: "English", flag: "🇺🇸" },
} as const;

export type Language = keyof typeof LANGUAGES;

const STORAGE_KEY = "app_language";

const savedLang = (localStorage.getItem(STORAGE_KEY) as Language) ?? "vi";

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: "vi",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lang) => {
  localStorage.setItem(STORAGE_KEY, lang);
});

export default i18n;
