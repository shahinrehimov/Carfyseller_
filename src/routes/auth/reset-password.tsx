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
      <div className="mx-auto w-full max-w-sm py-8">
        <div className="text-center mb-6">
          <h2
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}
          >
            {t("reset_password") || "Reset Password"}
          </h2>
        </div>
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
      const response = await controlApi.post(
        `/reset-password?token=${searchParams.token}&email=${searchParams.email}`,
        json,
      );
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
    <div className="mx-auto w-full max-w-sm py-8">
      <div className="text-center mb-6">
        <h2
          className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}
        >
          {t("reset_password")}
        </h2>
      </div>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((formData) => {
          if (resetPassword.isPending) return;
          resetPassword.mutate(formData);
        })}
      >
        <div className="space-y-5">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("password")}
              className={`w-full rounded-md border ${
                isDark
                  ? "border-gray-600 bg-gray-800 text-white"
                  : "border-gray-300 bg-white text-black"
              } px-4 py-3 pr-12 focus:border-primary focus:outline-none`}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-black"
              } transition-colors`}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">
              {form.formState.errors.password.message}
            </p>
          )}

          <div className="relative">
            <input
              type={showPasswordConfirmation ? "text" : "password"}
              placeholder={t("password_confirmation")}
              className={`w-full rounded-md border ${
                isDark
                  ? "border-gray-600 bg-gray-800 text-white"
                  : "border-gray-300 bg-white text-black"
              } px-4 py-3 pr-12 focus:border-primary focus:outline-none`}
              {...form.register("password_confirmation")}
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswordConfirmation(!showPasswordConfirmation)
              }
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-black"
              } transition-colors`}
            >
              {showPasswordConfirmation ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {form.formState.errors.password_confirmation && (
            <p className="text-sm text-red-500">
              {form.formState.errors.password_confirmation.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="w-full rounded-md bg-primary py-3 font-medium text-white transition-colors hover:bg-primary/90"
        >
          {resetPassword.isPending ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            t("reset_password")
          )}
        </button>
      </form>
    </div>
  );
}
