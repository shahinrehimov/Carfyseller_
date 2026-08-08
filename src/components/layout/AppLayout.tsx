import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, LayoutDashboard, Package, Star, LifeBuoy, Store, ShoppingCart } from "lucide-react";
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
    { icon: <Store />, label: t("store_profile"), href: "/store" },
    { icon: <Package />, label: t("products"), href: "/products" },
    { icon: <ShoppingCart />, label: t("orders", "Sifarişlər"), href: "/orders" },
    { icon: <Star />, label: t("reviews"), href: "/reviews" },
    { icon: <Bell />, label: t("push_notifications", "Bildirişlər"), href: "/push-notifications" },
    { icon: <LifeBuoy />, label: t("support"), href: "/support" },
  ];
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobileView);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "flex h-dvh overflow-hidden bg-[#FBFBFBFB] dark:bg-[#242428]",
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

        <main
          data-app-scroll-container
          className="flex min-h-0 flex-1 flex-col overflow-auto overscroll-y-contain px-4 pt-4 pb-2 sm:p-6"
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
