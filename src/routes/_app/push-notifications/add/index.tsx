import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useCreateSellerNotification,
  useTargetingPreview,
} from "@/lib/queries/push-notifications";
import { useLangs } from "@/lib/queries/langs";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/push-notifications/add/")({
  component: RouteComponent,
});

const translationSchema = z.object({
  language_id: z.number(),
  title: z.string().min(1),
  body: z.string().min(1),
});

const schema = z.object({
  target_type: z.enum(["bulk", "individual"]),
  user_ids: z.string().optional(),
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

type FormData = z.infer<typeof schema>;

function RouteComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: langs = [] } = useLangs();

  const TARGET_TYPE_OPTIONS = [
    { value: "bulk", label: t("target_bulk_my_customers") },
    { value: "individual", label: t("target_individual_label") },
  ];

  const ACTION_TYPE_OPTIONS = [
    { value: "none", label: t("action_none") },
    { value: "order", label: t("action_order") },
    { value: "product", label: t("action_product") },
    { value: "category", label: t("action_category") },
    { value: "url", label: t("action_url") },
  ];

  const { data: previewData, isLoading: previewLoading } =
    useTargetingPreview();
  const createMutation = useCreateSellerNotification();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      target_type: "bulk",
      user_ids: "",
      channels: { in_app: true, push: true, sms: false, email: false },
      action_type: "none",
      action_id: "",
      translations: [],
    },
  });

  useEffect(() => {
    if (langs.length > 0) {
      form.reset({
        target_type: "bulk",
        user_ids: "",
        channels: { in_app: true, push: true, sms: false, email: false },
        action_type: "none",
        action_id: "",
        translations: langs.map((lang: any) => ({
          language_id: lang.id,
          title: "",
          body: "",
        })),
      });
    }
  }, [langs]);

  const { fields } = useFieldArray({
    control: form.control,
    name: "translations",
  });
  const targetType = form.watch("target_type");
  const actionType = form.watch("action_type");

  const onSubmit = async (data: FormData) => {
    const channels = Object.entries(data.channels)
      .filter(([, v]) => v)
      .map(([k]) => k) as string[];

    if (channels.length === 0) {
      toast.error(t("select_at_least_one_channel"));
      return;
    }

    let target_filters: { user_ids?: number[] } | null = null;
    if (data.target_type === "individual") {
      const ids = (data.user_ids ?? "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Boolean);
      if (ids.length === 0) {
        toast.error(t("enter_at_least_one_user_id"));
        return;
      }
      target_filters = { user_ids: ids };
    }

    try {
      const response = await createMutation.mutateAsync({
        target_type: data.target_type,
        target_filters,
        channels: channels as any,
        action_type: data.action_type,
        action_id: data.action_id || null,
        translations: data.translations,
      });
      toast.success(response?.message || t("notification_sent_for_approval"));
      router.navigate({ to: "/push-notifications" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/push-notifications" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{t("new_notification")}</h1>
      </div>

      <div className="mx-auto max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Translations */}
            <div className="space-y-4 rounded-xl border bg-white p-5 dark:bg-gray-900/20">
              <h2 className="text-base font-semibold">
                {t("notification_text")}
              </h2>
              {fields.map((field, i) => {
                const lang = langs[i] as any;
                return (
                  <div
                    key={field.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {lang?.title ?? lang?.key?.toUpperCase()}
                    </p>
                    <FormField
                      control={form.control}
                      name={`translations.${i}.title`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>{t("title")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("notification_title_placeholder")}
                              {...f}
                            />
                          </FormControl>
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
                          <FormControl>
                            <Textarea
                              placeholder={t("notification_body_placeholder")}
                              rows={2}
                              {...f}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                );
              })}
            </div>

            {/* Target */}
            <div className="space-y-4 rounded-xl border bg-white p-5 dark:bg-gray-900/20">
              <h2 className="text-base font-semibold">{t("target")}</h2>
              <FormField
                control={form.control}
                name="target_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("target_type")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TARGET_TYPE_OPTIONS}
                        placeholder={t("select")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {targetType === "bulk" && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <Users className="h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    {previewLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-700">
                          {t("loading")}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-bold">
                          {previewData?.count ?? 0}
                        </span>{" "}
                        {t("customers_will_receive")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {targetType === "individual" && (
                <FormField
                  control={form.control}
                  name="user_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("user_ids_comma_separated")}</FormLabel>
                      <FormControl>
                        <Input placeholder="101, 205, 318" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Channels */}
            <div className="space-y-3 rounded-xl border bg-white p-5 dark:bg-gray-900/20">
              <h2 className="text-base font-semibold">{t("channels")}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["in_app", "push", "sms", "email"] as const).map((ch) => (
                  <FormField
                    key={ch}
                    control={form.control}
                    name={`channels.${ch}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2 rounded-lg border p-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal uppercase text-xs">
                            {ch}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-3 rounded-xl border bg-white p-5 dark:bg-gray-900/20">
              <h2 className="text-base font-semibold">{t("tap_action")}</h2>
              <FormField
                control={form.control}
                name="action_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("action_type")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        options={ACTION_TYPE_OPTIONS}
                        placeholder={t("select")}
                      />
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
                        {actionType === "order" && t("order_uuid")}
                        {actionType === "product" && t("product_slug")}
                        {actionType === "category" && t("category_slug")}
                        {actionType === "url" && "URL"}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.navigate({ to: "/push-notifications" })}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("send_for_approval")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
