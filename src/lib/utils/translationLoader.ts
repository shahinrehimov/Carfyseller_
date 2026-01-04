import { useTranslationStore } from "@/store/translations";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";

interface LangsResponse {
  data: Array<{ id: number; key: string }>;
  versions: {
    lang_version: number;
    default_lang: string;
  };
}

interface TranslationsResponse {
  data: {
    version: number;
    translations: Record<string, string>;
  };
}

export class TranslationLoader {
  // Direct API calls to get full response data
  private static async fetchLangs(): Promise<LangsResponse> {
    const response = await controlPrivateApi.get(
      "/local-translations/languages/list",
    );
    return response.data;
  }

  private static async fetchTranslations(
    lang: string,
  ): Promise<TranslationsResponse> {
    const response = await controlPrivateApi.get(`/local-translations/${lang}`);
    return response.data;
  }

  static async loadTranslations(): Promise<void> {
    const store = useTranslationStore.getState();

    try {
      store.setLoading(true);

      // First, get languages data
      const langsData = await this.fetchLangs();

      // Check if we need to update translations, check langs length
      const needsUpdate =
        store.needsUpdate(langsData.versions.lang_version) ||
        langsData.data.length !== store.langs.length;

      if (needsUpdate) {
        console.log("Language version changed, updating translations...");

        // Update langs data
        store.setLangs(langsData);

        // Get current language from localStorage or use default
        const currentLang =
          localStorage.getItem("lang") || langsData.versions.default_lang;
        store.setCurrentLang(currentLang);

        // Fetch translations for current language
        const translationsData = await this.fetchTranslations(currentLang);

        // Update translations
        store.setTranslations(translationsData);

        // Update localStorage with new version
        localStorage.setItem(
          "lang_version",
          langsData.versions.lang_version.toString(),
        );
        localStorage.setItem("lang", currentLang);

        console.log("Translations updated successfully");
      } else {
        console.log("Translations are up to date");

        // Still update current language if needed
        const currentLang = localStorage.getItem("lang") || store.defaultLang;
        if (currentLang !== store.currentLang) {
          store.setCurrentLang(currentLang);
        }
      }
    } catch (error) {
      console.error("Failed to load translations:", error);
    } finally {
      store.setLoading(false);
    }
  }

  static async switchLanguage(newLang: string): Promise<void> {
    const store = useTranslationStore.getState();

    try {
      store.setLoading(true);

      // Update current language
      store.setCurrentLang(newLang);
      localStorage.setItem("lang", newLang);

      // Fetch translations for new language
      const translationsData = await this.fetchTranslations(newLang);
      store.setTranslations(translationsData);

      console.log(`Language switched to: ${newLang}`);
    } catch (error) {
      console.error("Failed to switch language:", error);
    } finally {
      store.setLoading(false);
    }
  }
}

// Helper function to get translation
export function useTranslation() {
  const translations = useTranslationStore((state) => state.translations);
  const currentLang = useTranslationStore((state) => state.currentLang);
  const isLoading = useTranslationStore((state) => state.isLoading);

  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || `{${key}}`;
  };

  return {
    t,
    currentLang,
    isLoading,
    translations,
  };
}
