import { Link, useLocation } from "@tanstack/react-router";
import React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils/index";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import type { ReactNode } from "react";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  isPrimary?: boolean;
  isCollapsed?: boolean;
  isMobile?: boolean;
  onItemClick?: () => void;
}

export function SidebarItem({
  icon,
  label,
  href,
  isPrimary = false,
  isCollapsed = false,
  isMobile = false,
  onItemClick,
}: SidebarItemProps) {
  const { pathname } = useLocation();
  const isActive = pathname === href;

  const handleClick = () => {
    if (isMobile && onItemClick) {
      onItemClick();
    }
  };

  return (
    <div className="relative">
      {isCollapsed && !isMobile ? (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                to={href}
                onClick={handleClick}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm rounded-lg transition-colors my-1 relative ",
                  "text-white ",
                  !isActive && "hover:bg-white/10 hover:z-10",
                  isPrimary && "text-white",
                  isActive &&
                    !isPrimary &&
                    "bg-white text-primary font-medium dark:bg-[#242428] dark:text-[#50B5FF]",
                )}
              >
                <span className="text-lg">{icon}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Link
          to={href}
          onClick={handleClick}
          className={cn(
            "flex items-center gap-3  py-3 text-sm rounded-lg transition-colors my-1 relative ",
            isMobile ? "text-primary  px-4" : "text-white px-6",
            !isActive && "hover:bg-white/10 hover:z-10",
            isPrimary && "text-white",
            isActive &&
              !isPrimary &&
              "bg-white text-primary font-medium dark:bg-[#242428] dark:text-[#50B5FF]",
            isMobile &&
              isActive &&
              "bg-[#3371EB33] text-primary font-medium dark:bg-[#1A1B23] dark:text-[#50B5FF]",
          )}
        >
          <span className="text-lg">{icon}</span>
          <span>{label}</span>
        </Link>
      )}
    </div>
  );
}

interface SidebarProps {
  className?: string;
  children: ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  className,
  children,
  isCollapsed = false,
  onToggle,
  isMobile = false,
}: SidebarProps) {
  // Clone children to pass isCollapsed prop
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        isCollapsed,
        isMobile,
        onItemClick: isMobile ? onToggle : undefined,
      } as any);
    }
    return child;
  });

  return (
    <aside
      className={cn(
        " bg-primary dark:bg-[#1A1B23] flex flex-col transition-all duration-300 ease-in-out relative",
        isCollapsed && !isMobile ? "w-[90px] h-screen" : "w-[250px] h-screen",
        isMobile && "w-full h-[60px]",
        className,
      )}
    >
      <div className="flex items-center h-16 px-6 ">
        <div
          className={cn(
            "flex items-center gap-2 w-full justify-center ",
            isCollapsed && !isMobile ? "justify-center" : "justify-between",
          )}
        >
          {(!isCollapsed || isMobile) && (
            <img
              src="/logo.svg"
              alt="logo"
              className="w-30 brightness-0 invert "
            />
          )}

          <button
            onClick={onToggle}
            className=" text-white hover:text-white/80 transition-colors cursor-pointer"
          >
            {!isCollapsed && isMobile ? (
              <X className="w-6 h-6" />
            ) : (
              <img src="/icons/menu.svg" alt="menu" className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "flex-1 py-4 overflow-y-auto mt-2 transition-all duration-300 ease-in-out",
          isMobile &&
            (isCollapsed
              ? "opacity-0 pointer-events-none transform translate-y-[-20px]"
              : "opacity-100 pointer-events-auto transform translate-y-0"),
          isMobile &&
            "absolute top-[20px] z-50 left-0 right-0 w-full h-[calc(100vh-60px)] mx-auto bg-gray-200 dark:bg-[#1A1B23]",
        )}
      >
        <nav
          className={cn(
            "space-y-1 px-2",
            isMobile &&
              " w-[90%] mx-auto bg-white dark:bg-[#242428] rounded-lg py-2",
          )}
        >
          {childrenWithProps}
        </nav>
      </div>
    </aside>
  );
}
