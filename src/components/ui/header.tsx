import { Moon, Sun } from "lucide-react";
import { cn } from "../../lib/utils/index";
import { useTheme } from "../themes/provider";
import { LanguageSwitcher } from "./language-switcher";
import { ProfileDropdown } from "./profile-dropdown";
// import { SearchDropdown } from "./search-dropdown";
// import { NotificationsDropdown } from "./notifications-dropdown";
import type { ReactNode } from "react";

interface HeaderProps {
  className?: string;
  pageTitle: string;
  children?: ReactNode;
}

export function Header({ className, pageTitle, children }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 py-2",
        className,
      )}
    >
      <h1 className="order-1 text-2xl font-semibold md:order-1">{pageTitle}</h1>
      <div className="order-3 flex-1 md:order-2 md:ml-auto md:max-w-xl">
        {/* <SearchDropdown /> */}
      </div>

      <div className="order-2 flex items-center gap-2 md:order-3">
        <LanguageSwitcher />

        <button
          onClick={toggleTheme}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground border-input cursor-pointer rounded-lg border p-2 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* <NotificationsDropdown /> */}
        <ProfileDropdown />
      </div>

      {children}
    </header>
  );
}
