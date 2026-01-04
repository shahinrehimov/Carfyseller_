import { createFileRoute } from "@tanstack/react-router";
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

  const login = useMutation({
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
    <div className="mx-auto w-full max-w-sm py-8">
      <div className="text-center mb-6">
        <h2
          className={`text-2xl font-bold ${isDark ? "text-white" : "text-black"}`}
        >
          {t("forgot_password")}
        </h2>
      </div>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((formData) => {
          if (login.isPending) return;
          login.mutate(formData);
        })}
      >
        <div className="space-y-5">
          <input
            type="text"
            placeholder={t("email")}
            className={`w-full rounded-md border ${
              isDark
                ? "border-gray-600 bg-gray-800 text-white"
                : "border-gray-300 bg-white text-black"
            } px-4 py-3 focus:border-primary focus:outline-none`}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-md bg-primary py-3 font-medium text-white transition-colors hover:bg-primary/90"
        >
          {login.isPending ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            t("send")
          )}
        </button>
      </form>
    </div>
  );
}
