import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { useTranslation } from "@/lib/utils/translationLoader";

export function ProfileDropdown() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // State for loading
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // Get user from auth store
  const authStore = useAuthStore();
  const username = `${authStore.user?.name ?? ""} ${authStore.user?.surname ?? ""}`;

  // Logout handler
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await controlPrivateApi.post("/logout");

      // Clear auth and cache
      clearAuth();
      queryClient.clear();

      // Navigate to login
      navigate({ to: "/auth/signin", replace: true });

      toast.success(t("logout_success") || "Logged out successfully");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(
        error?.response?.data?.message ||
          t("logout_error") ||
          "Failed to logout",
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Logout from all devices handler
  const handleLogoutAll = async () => {
    try {
      setIsLoggingOutAll(true);
      await controlPrivateApi.post("/logout-all");

      // Clear auth and cache
      clearAuth();
      queryClient.clear();

      // Navigate to login
      navigate({ to: "/auth/signin", replace: true });

      toast.success(
        t("logout_all_success") || "Logged out from all devices successfully",
      );
    } catch (error: any) {
      console.error("Logout all error:", error);
      toast.error(
        error?.response?.data?.message ||
          t("logout_all_error") ||
          "Failed to logout from all devices",
      );
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 pl-2">
        <div className="h-8 w-8 rounded-full bg-accent overflow-hidden flex items-center justify-center">
          <User className="h-6 w-6 text-gray-500" />
        </div>
        <span className="text-sm font-medium hidden md:block">{username}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => navigate({ to: "/profile" })}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>{t("profile")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut || isLoggingOutAll}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{t("logout")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogoutAll}
          disabled={isLoggingOut || isLoggingOutAll}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          {isLoggingOutAll ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{t("logout_all_devices") || "Logout from all devices"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
