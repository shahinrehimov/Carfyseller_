import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Sidebar, SidebarItem } from "../ui/sidebar";
import { Header } from "../ui/header";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/utils/translationLoader";

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobileView = useMediaQuery("(width<48rem)");
  const { t } = useTranslation();

  const sidebarItems = [
    { icon: <LayoutDashboard />, label: t("dashboard"), href: "/" },
  ];
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobileView);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden bg-[#FBFBFBFB] dark:bg-[#242428]",
        isMobileView && "flex-col",
      )}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        isMobile={isMobileView}
      >
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isMobile={isMobileView}
          />
        ))}
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header pageTitle="Dashboard" />

        <main className="flex-1 overflow-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
