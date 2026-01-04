import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./dropdown-menu";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useTranslationStore } from "@/store/translations";
import { TranslationLoader } from "@/lib/utils/translationLoader";
import { ChevronDown, Loader2 } from "lucide-react";

export function LanguageSwitcher() {
  const { currentLang, isLoading } = useTranslation();
  const { langs, getCurrentLanguageName } = useTranslationStore();
  const [isChanging, setIsChanging] = useState(false);

  const changeLang = async (newLang: string) => {
    if (newLang === currentLang || isChanging) return;

    setIsChanging(true);
    try {
      await TranslationLoader.switchLanguage(newLang);
    } catch (error) {
      console.error("Failed to change language:", error);
    } finally {
      setIsChanging(false);
    }
  };

  const currentLanguageName = getCurrentLanguageName();
  const isDisabled = isLoading || isChanging;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`px-3 py-2 border border-input rounded-lg flex items-center text-sm font-medium  justify-between transition-colors ${
          isDisabled
            ? "opacity-50 cursor-not-allowed bg-muted"
            : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
        }`}
        disabled={isDisabled}
      >
        <span className="truncate">
          {isChanging ? "..." : currentLanguageName}
        </span>
        {isDisabled ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {langs.map((lang) => (
          <DropdownMenuItem
            key={lang.key}
            onClick={() => changeLang(lang.key)}
            className={`cursor-pointer flex items-center justify-between ${
              lang.key === currentLang ? "bg-accent text-accent-foreground" : ""
            }`}
            disabled={isDisabled}
          >
            <span>{lang.name || lang.key.toUpperCase()}</span>
            {lang.key === currentLang && (
              <span className="text-xs opacity-60">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
