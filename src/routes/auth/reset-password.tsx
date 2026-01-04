import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useTheme } from "@/components/themes/provider";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "@/lib/utils/translationLoader";
import { controlApi } from "@/lib/axios/controlApi";

const resetPasswordPageSchema = z.object({
  token: z.string().optional(),
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/auth/reset-password")({
  component: RouteComponent,
  validateSearch: zodValidator(resetPasswordPageSchema),
});

function RouteComponent() {
  const searchParams = Route.useSearch();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  // Check if required parameters are present
  if (!searchParams.token || !searchParams.email) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
          </div>

          {/* Error Container with Border */}
          <div
            className={`rounded-lg border ${
              isDark
                ? "border-gray-700 bg-gray-800/50"
                : "border-gray-200 bg-white"
            } p-8 shadow-sm`}
          >
            <h1
              className={`mb-6 text-center text-2xl font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {t("reset_password") || "Reset Password"}
            </h1>
            <div
              className={`rounded-md border ${
                isDark
                  ? "border-red-800 bg-red-900/20 text-red-400"
                  : "border-red-300 bg-red-50 text-red-600"
              } p-4 text-center`}
            >
              <p>
                {t("invalid_reset_link") ||
                  "Invalid or expired reset link. Please request a new password reset."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ResetPasswordFormSchema = z
    .object({
      password: z
        .string({ message: t("required_field") })
        .min(8, t("password_min_length")),
      password_confirmation: z
        .string({ message: t("required_field") })
        .min(1, t("required_field")),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("passwords_must_match"),
      path: ["password_confirmation"],
    });

  type ResetPasswordFormSchema = z.infer<typeof ResetPasswordFormSchema>;

  const form = useForm({
    resolver: zodResolver(ResetPasswordFormSchema),
  });

  const resetPassword = useMutation({
    mutationFn: async (json: ResetPasswordFormSchema) => {
      const response = await controlApi.post("/reset-password", {
        ...json,
        token: searchParams.token,
        email: searchParams.email,
      });
      return response.data;
    },
    onSuccess(data) {
      toast.success(data.message || t("reset_password_success"));
      navigate({ to: "/auth/signin" });
    },
    async onError(error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message || t("reset_password_error"));
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
        </div>

        {/* Form Container with Border */}
        <div
          className={`rounded-lg border ${
            isDark
              ? "border-gray-700 bg-gray-800/50"
              : "border-gray-200 bg-white"
          } p-8 shadow-sm`}
        >
          <h1
            className={`mb-6 text-center text-2xl font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {t("reset_password")}
          </h1>

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((formData) => {
              if (resetPassword.isPending) return;
              resetPassword.mutate(formData);
            })}
          >
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("password")}
                  className={`w-full rounded-md border ${
                    isDark
                      ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                      : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                  } focus:border-primary px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    isDark
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPasswordConfirmation ? "text" : "password"}
                  placeholder={t("password_confirmation")}
                  className={`w-full rounded-md border ${
                    isDark
                      ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                      : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                  } focus:border-primary px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  {...form.register("password_confirmation")}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordConfirmation(!showPasswordConfirmation)
                  }
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    isDark
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {showPasswordConfirmation ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {form.formState.errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.password_confirmation.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={resetPassword.isPending}
              className="bg-primary hover:bg-primary/90 w-full rounded-md py-3 font-medium text-white transition-colors disabled:opacity-50"
            >
              {resetPassword.isPending ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                t("reset_password")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
