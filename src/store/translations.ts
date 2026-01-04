import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Language {
  id: number;
  key: string;
  name?: string; // Optional display name
}

interface LangsData {
  data: Language[];
  versions: {
    lang_version: number;
    default_lang: string;
  };
}

interface TranslationsData {
  data: {
    version: number;
    translations: Record<string, string>;
  };
}

// Language display name mappings for common language codes
const LANGUAGE_NAMES: Record<string, string> = {
  az: "AZ",
  en: "EN",
  ru: "RU",
};

interface TranslationState {
  langs: Language[];
  langVersion: number | null;
  defaultLang: string;
  translations: Record<string, string>;
  currentLang: string;
  isLoading: boolean;

  // Actions
  setLangs: (langsData: LangsData) => void;
  setTranslations: (translationsData: TranslationsData) => void;
  setCurrentLang: (lang: string) => void;
  setLoading: (loading: boolean) => void;
  needsUpdate: (newVersion: number) => boolean;
  clearTranslations: () => void;
  getLanguageName: (langKey: string) => string;
  getCurrentLanguageName: () => string;
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      langs: [],
      langVersion: null,
      defaultLang: "az",
      translations: {},
      currentLang: "az",
      isLoading: false,

      setLangs: (langsData) =>
        set({
          langs: langsData.data.map((lang) => ({
            ...lang,
            name:
              lang.name || LANGUAGE_NAMES[lang.key] || lang.key.toUpperCase(),
          })),
          langVersion: langsData.versions.lang_version,
          defaultLang: langsData.versions.default_lang,
          currentLang: get().currentLang || langsData.versions.default_lang,
        }),

      setTranslations: (translationsData) =>
        set({
          translations: translationsData.data.translations,
          langVersion: translationsData.data.version,
        }),

      setCurrentLang: (lang) => set({ currentLang: lang }),

      setLoading: (loading) => set({ isLoading: loading }),

      needsUpdate: (newVersion) => {
        const currentVersion = get().langVersion;
        return currentVersion === null || currentVersion !== newVersion;
      },

      clearTranslations: () =>
        set({
          langs: [],
          langVersion: null,
          translations: {},
          currentLang: "az",
        }),

      getLanguageName: (langKey) => {
        const lang = get().langs.find((l) => l.key === langKey);
        return lang?.name || LANGUAGE_NAMES[langKey] || langKey.toUpperCase();
      },

      getCurrentLanguageName: () => {
        const currentLang = get().currentLang;
        return get().getLanguageName(currentLang);
      },
    }),
    {
      name: "translations-storage",
      partialize: (state) => ({
        langs: state.langs,
        langVersion: state.langVersion,
        defaultLang: state.defaultLang,
        translations: state.translations,
        currentLang: state.currentLang,
      }),
    },
  ),
);
