import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRedirectBack } from "./-utils";
import { controlApi } from "@/lib/axios/controlApi";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/components/themes/provider";
import { useTranslation } from "@/lib/utils/translationLoader";

const loginPageSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/signin")({
  component: RouteComponent,
  validateSearch: zodValidator(loginPageSchema),
});

function RouteComponent() {
  const searchParams = Route.useSearch();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const redirect = useRedirectBack(searchParams.redirect);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const LoginFormSchema = z.object({
    username: z
      .string({ message: t("required_field") })
      .min(1, t("required_field")),
    password: z
      .string({ message: t("required_field") })
      .min(1, t("required_field")),
  });
  type LoginFormSchema = z.infer<typeof LoginFormSchema>;

  const form = useForm({
    resolver: zodResolver(LoginFormSchema),
  });

  const login = useMutation({
    mutationFn: async (json: LoginFormSchema) => {
      const response = await controlApi.post("/login", {
        ...json,
        device_type: "web",
      });
      return response.data;
    },
    onSuccess(data) {
      useAuthStore.getState().setAuth(data.data, data.data.token);
      if (data.data.password_must_change) {
        navigate({ to: "/change-password" });
      } else {
        redirect();
      }
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
            {t("login")}
          </h1>

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((formData) => {
              if (login.isPending) return;
              login.mutate(formData);
            })}
          >
            <div>
              <input
                type="text"
                placeholder={t("username")}
                className={`w-full rounded-md border ${
                  isDark
                    ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                    : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

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

            <button
              type="submit"
              disabled={login.isPending}
              className="bg-primary hover:bg-primary/90 w-full rounded-md py-3 font-medium text-white transition-colors disabled:opacity-50"
            >
              {login.isPending ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                t("login")
              )}
            </button>

            {/* Link to Forgot Password */}
            <div className="text-center">
              <Link
                to="/auth/forgot-password"
                className="text-primary hover:text-primary/90 text-sm font-medium"
              >
                {t("forgot_password")}
              </Link>
            </div>

            {/* Link to Register */}
            <div className="text-center">
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("dont_have_account")}{" "}
                <Link
                  to="/auth/register"
                  className="text-primary hover:text-primary/90 font-medium"
                >
                  {t("register")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
