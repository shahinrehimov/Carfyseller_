import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { controlApi } from "@/lib/axios/controlApi";
import { isAxiosError } from "axios";
import { useTheme } from "@/components/themes/provider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/auth/forgot-password")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  const ForgotPasswordFormSchema = z.object({
    email: z
      .string({ message: t("required_field") })
      .email(t("invalid_email"))
      .min(1, t("required_field")),
  });
  type ForgotPasswordFormSchema = z.infer<typeof ForgotPasswordFormSchema>;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(ForgotPasswordFormSchema),
  });

  const forgotPassword = useMutation({
    mutationFn: async (json: ForgotPasswordFormSchema) => {
      const response = await controlApi.post("/forgot-password", json);
      return response.data;
    },
    onSuccess(data) {
      toast.success(data.message || t("forgot_password_success"));
      navigate({ to: "/auth/signin" });
    },
    async onError(error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message);
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
            {t("forgot_password")}
          </h1>

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((formData) => {
              if (forgotPassword.isPending) return;
              forgotPassword.mutate(formData);
            })}
          >
            <div>
              <input
                type="email"
                placeholder={t("email")}
                className={`w-full rounded-md border ${
                  isDark
                    ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                    : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={forgotPassword.isPending}
              className="bg-primary hover:bg-primary/90 w-full rounded-md py-3 font-medium text-white transition-colors disabled:opacity-50"
            >
              {forgotPassword.isPending ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                t("send")
              )}
            </button>

            {/* Link back to Sign In */}
            <div className="text-center">
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("remember_password")}{" "}
                <Link
                  to="/auth/signin"
                  className="text-primary hover:text-primary/90 font-medium"
                >
                  {t("login")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
