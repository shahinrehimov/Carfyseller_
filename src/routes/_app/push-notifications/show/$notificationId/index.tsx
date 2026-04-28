import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Edit2, Loader2, RefreshCw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Modal from "@/components/ui/modal";
import DeleteModal from "@/components/ui/delete-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useSellerNotification,
  useUpdateSellerNotification,
  useDeleteSellerNotification,
  useResendSellerNotification,
} from "@/lib/queries/push-notifications";
import { useLangs } from "@/lib/queries/langs";
import { useTranslation } from "@/lib/utils/translationLoader";
import type { SellerNotificationStatus } from "@/lib/types/push-notification";

export const Route = createFileRoute(
  "/_app/push-notifications/show/$notificationId/",
)({
  component: RouteComponent,
});

const translationSchema = z.object({
  language_id: z.number(),
  title: z.string().min(1),
  body: z.string().min(1),
});

const editSchema = z.object({
  channels: z.object({
    in_app: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
    email: z.boolean(),
  }),
  action_type: z.enum(["none", "order", "product", "category", "url"]),
  action_id: z.string().optional(),
  translations: z.array(translationSchema).min(1),
});

type EditFormData = z.infer<typeof editSchema>;

function RouteComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { notificationId } = Route.useParams();
  const notificationIdNum = Number(notificationId);
  const { data: langs = [] } = useLangs();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

  const ACTION_TYPE_OPTIONS = [
    { value: "none",     label: t("action_none") },
    { value: "order",    label: t("action_order") },
    { value: "product",  label: t("action_product") },
    { value: "category", label: t("action_category") },
    { value: "url",      label: t("action_url") },
  ];

  const STATUS_CLASSES: Record<SellerNotificationStatus, string> = {
    pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved:         "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    rejected:         "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    sending:          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    sent:             "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled:        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  const { data: notification, isLoading } = useSellerNotification(notificationIdNum);
  const updateMutation = useUpdateSellerNotification();
  const deleteMutation = useDeleteSellerNotification();
  const resendMutation = useResendSellerNotification();

  const canEdit   = notification && (notification.status === "pending_approval" || notification.status === "rejected");
  const canDelete = notification && (notification.status === "pending_approval" || notification.status === "rejected");
  const canResend = notification && (notification.status === "sent" || notification.status === "cancelled");

  const getLangLabel = (languageId: number) => {
    const lang = (langs as any[]).find((l) => l.id === languageId);
    return lang?.title ?? lang?.key?.toUpperCase() ?? `Lang ${languageId}`;
  };

  const buildTranslationsFromLangs = () =>
    (langs as any[]).map((lang) => {
      const existing = notification?.translations.find((tr) => tr.language_id === lang.id);
      return existing ?? { language_id: lang.id, title: "", body: "" };
    });

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: notification
      ? {
          channels: {
            in_app: notification.channels.includes("in_app"),
            push:   notification.channels.includes("push"),
            sms:    notification.channels.includes("sms"),
            email:  notification.channels.includes("email"),
          },
          action_type: (notification.action_type ?? "none") as any,
          action_id: notification.action_id ?? "",
          translations: langs.length > 0 ? buildTranslationsFromLangs() : notification.translations,
        }
      : undefined,
  });

  const { fields } = useFieldArray({ control: form.control, name: "translations" });
  const actionType = form.watch("action_type");

  const handleEdit = async (data: EditFormData) => {
    const channels = Object.entries(data.channels)
      .filter(([, v]) => v)
      .map(([k]) => k) as string[];

    if (channels.length === 0) {
      toast.error(t("select_at_least_one_channel"));
      return;
    }

    try {
      const res = await updateMutation.mutateAsync({
        id: notificationIdNum,
        data: {
          channels: channels as any,
          action_type: data.action_type,
          action_id: data.action_id || null,
          translations: data.translations,
        },
      });
      toast.success(res.message || t("saved_successfully"));
      setShowEditForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(notificationIdNum);
      toast.success(t("deleted_successfully"));
      router.navigate({ to: "/push-notifications" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendMutation.mutateAsync(notificationIdNum);
      toast.success(res.message || t("notification_sent_for_approval"));
      setShowResendModal(false);
      router.navigate({ to: "/push-notifications" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!notification) return null;

  const statusClass = STATUS_CLASSES[notification.status] ?? "bg-gray-100 text-gray-700";
  const statusLabel = t(`status_${notification.status}`);

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm"
            onClick={() => router.navigate({ to: "/push-notifications" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{t("notification_detail")}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-gray-400">#{notification.id}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setShowEditForm((v) => !v)}>
              <Edit2 className="mr-1.5 h-3.5 w-3.5" />
              {showEditForm ? t("close") : t("edit")}
            </Button>
          )}
          {canResend && (
            <Button variant="outline" size="sm" onClick={() => setShowResendModal(true)}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              {t("resend")}
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {t("delete")}
            </Button>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {notification.rejection_reason && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {t("status_rejected")}
            </p>
            <p className="mt-0.5 text-sm text-red-800 dark:text-red-300">
              {notification.rejection_reason}
            </p>
          </div>
        </div>
      )}

      {/* Detail view */}
      {!showEditForm && (
        <div className="rounded-xl border bg-white p-5 space-y-5 dark:bg-gray-900/20">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t("notification_text")}
            </h2>
            {notification.translations.map((tr) => (
              <div key={tr.language_id} className="rounded-lg border p-3 space-y-0.5">
                <p className="text-xs text-gray-500">{getLangLabel(tr.language_id)}</p>
                <p className="font-medium">{tr.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tr.body}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">{t("target_type")}</p>
              <p className="font-medium">
                {notification.target_type === "bulk" ? t("target_bulk") : t("target_individual")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("recipients")}</p>
              <p className="font-medium">{notification.total_recipients}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("channels")}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {notification.channels.map((ch) => (
                  <span key={ch} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs uppercase dark:bg-gray-800">
                    {ch}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("action_type")}</p>
              <p className="font-medium">{notification.action_type}</p>
              {notification.action_id && (
                <p className="text-xs text-gray-400 truncate">{notification.action_id}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("created_at")}</p>
              <p className="font-medium">{notification.created_at}</p>
            </div>
            {notification.sent_at && (
              <div>
                <p className="text-xs text-gray-500">{t("sent_at")}</p>
                <p className="font-medium">{notification.sent_at}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit form */}
      {showEditForm && canEdit && (
        <div className="rounded-xl border bg-white p-5 dark:bg-gray-900/20">
          <h2 className="mb-4 text-base font-semibold">{t("edit_notification")}</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-5">
              <div className="space-y-3">
                {fields.map((field, i) => {
                  const langId = form.getValues(`translations.${i}.language_id`);
                  return (
                    <div key={field.id} className="rounded-lg border p-3 space-y-2">
                      <p className="text-xs text-gray-500">{getLangLabel(langId)}</p>
                      <FormField
                        control={form.control}
                        name={`translations.${i}.title`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>{t("title")}</FormLabel>
                            <FormControl><Input {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`translations.${i}.body`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>{t("body")}</FormLabel>
                            <FormControl><Textarea rows={2} {...f} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">{t("channels")}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["in_app", "push", "sms", "email"] as const).map((ch) => (
                    <FormField key={ch} control={form.control} name={`channels.${ch}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2 rounded-lg border p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="cursor-pointer font-normal uppercase text-xs">{ch}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="action_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("action_type")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}
                        options={ACTION_TYPE_OPTIONS} placeholder={t("select")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {actionType !== "none" && (
                <FormField
                  control={form.control}
                  name="action_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {actionType === "order"    && t("order_uuid")}
                        {actionType === "product"  && t("product_slug")}
                        {actionType === "category" && t("category_slug")}
                        {actionType === "url"      && "URL"}
                      </FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1"
                  onClick={() => setShowEditForm(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("save")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        title={t("delete_notification")} size="sm">
        <DeleteModal
          closeModal={() => setShowDeleteModal(false)}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>

      <Modal isOpen={showResendModal} onClose={() => setShowResendModal(false)}
        title={t("resend_notification")} size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {t("resend_seller_notification_info")}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowResendModal(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleResend} disabled={resendMutation.isPending}>
              {resendMutation.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <RefreshCw className="mr-2 h-4 w-4" />}
              {t("resend")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
