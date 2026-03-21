import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/components/themes/provider";
import { useTranslation } from "@/lib/utils/translationLoader";
import { checkUserQueryOptions } from "@/lib/queries/checkUser";

export const Route = createFileRoute("/change-password")({
  component: RouteComponent,
  beforeLoad() {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error("unauthenticated");
    }
  },
});

const ChangePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type ChangePasswordSchema = z.infer<typeof ChangePasswordSchema>;

function RouteComponent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<ChangePasswordSchema>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      old_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: ChangePasswordSchema) => {
      const response = await controlPrivateApi.post("/profile/change-password", {
        old_password: data.old_password,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      return response.data;
    },
    onSuccess(data) {
      toast.success(data.message ?? t("password_changed_successfully"));
      queryClient.invalidateQueries({ queryKey: checkUserQueryOptions.queryKey });
      navigate({ to: "/" });
    },
    onError(error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message ?? t("failed_to_change_password"));
      }
    },
  });

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${isDark ? "bg-[#1D1D1D]" : "bg-gray-50"}`}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
        </div>

        <div
          className={`rounded-lg border ${
            isDark
              ? "border-gray-700 bg-gray-800/50"
              : "border-gray-200 bg-white"
          } p-8 shadow-sm`}
        >
          <h1
            className={`mb-2 text-center text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {t("change_password")}
          </h1>
          <p
            className={`mb-6 text-center text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {t("password_must_change_notice") ?? "Please set a new password before continuing."}
          </p>

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((data) => {
              if (changePassword.isPending) return;
              changePassword.mutate(data);
            })}
          >
            <div>
              <input
                type="password"
                placeholder={t("current_password")}
                className={`w-full rounded-md border ${
                  isDark
                    ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                    : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                {...form.register("old_password")}
              />
              {form.formState.errors.old_password && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.old_password.message}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder={t("new_password")}
                className={`w-full rounded-md border ${
                  isDark
                    ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                    : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder={t("confirm_new_password")}
                className={`w-full rounded-md border ${
                  isDark
                    ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                    : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                {...form.register("password_confirmation")}
              />
              {form.formState.errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.password_confirmation.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={changePassword.isPending}
              className="bg-primary hover:bg-primary/90 w-full rounded-md py-3 font-medium text-white transition-colors disabled:opacity-50"
            >
              {changePassword.isPending ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                t("update")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
