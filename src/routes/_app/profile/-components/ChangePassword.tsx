import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePassword() {
  const { t } = useTranslation();

  // Form validation schema
  const changePasswordSchema = z
    .object({
      old_password: z.string().min(1, t("required_field")),
      password: z
        .string()
        .min(8, t("password_min_length"))
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          t("password_complexity"),
        ),
      password_confirmation: z.string().min(1, t("required_field")),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("passwords_do_not_match"),
      path: ["password_confirmation"],
    });

  type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

  // Initialize form with react-hook-form
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      const response = await controlPrivateApi.post(
        "/profile/change-password",
        {
          old_password: data.old_password,
          password: data.password,
          password_confirmation: data.password_confirmation,
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || t("password_changed_successfully"));
      form.reset();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || t("failed_to_change_password"),
      );
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl p-6">
      <div className="w-full">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="old_password">{t("current_password")} *</Label>
            <Input
              id="old_password"
              type="password"
              {...form.register("old_password")}
              className={
                form.formState.errors.old_password ? "border-red-500" : ""
              }
            />
            {form.formState.errors.old_password && (
              <p className="text-sm text-red-600">
                {form.formState.errors.old_password.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t("new_password")} *</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              className={form.formState.errors.password ? "border-red-500" : ""}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
            <p className="text-sm text-gray-500">
              {t("password_requirements")}
            </p>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">
              {t("confirm_new_password")} *
            </Label>
            <Input
              id="password_confirmation"
              type="password"
              {...form.register("password_confirmation")}
              className={
                form.formState.errors.password_confirmation
                  ? "border-red-500"
                  : ""
              }
            />
            {form.formState.errors.password_confirmation && (
              <p className="text-sm text-red-600">
                {form.formState.errors.password_confirmation.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end pt-4">
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="min-w-[140px]"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("updating")}
                </>
              ) : (
                t("update")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
