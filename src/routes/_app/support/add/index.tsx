import { useRef, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket } from "@/lib/queries/support";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/support/add/")({
  component: AddTicketPage,
});

const schema = z.object({
  subject: z.string().min(1, "required_field").max(500),
  body: z.string().min(1, "required_field").max(5000),
});

type FormData = z.infer<typeof schema>;

function AddTicketPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const createMutation = useCreateTicket();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { subject: "", body: "" },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const combined = [...files, ...selected].slice(0, 10);
    setFiles(combined);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync({ subject: data.subject, body: data.body, files });
      toast.success(t("ticket_created_successfully"));
      router.navigate({ to: "/support" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? t("an_error_occurred"));
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 pt-5">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/support" })}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("new_ticket")}</h1>
      </div>

      <div className="w-full max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4 rounded-lg border p-6">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                {t("subject")} <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="subject"
                control={control}
                render={({ field }) => (
                  <Input
                    id="subject"
                    {...field}
                    placeholder={t("subject")}
                    className={errors.subject ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.subject && (
                <p className="text-sm text-red-500">
                  {t(errors.subject.message as string)}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">
                {t("message")} <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="body"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="body"
                    {...field}
                    placeholder={t("message")}
                    rows={6}
                    className={errors.body ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.body && (
                <p className="text-sm text-red-500">
                  {t(errors.body.message as string)}
                </p>
              )}
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label>{t("attachments")}</Label>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= 10}
                  className="flex w-fit items-center gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  {t("attach_files")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {files.length > 0 && (
                  <ul className="space-y-1">
                    {files.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                      >
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="flex-1 truncate">{f.name}</span>
                        <span className="shrink-0 text-gray-400">
                          {formatSize(f.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="shrink-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="min-w-[200px]"
            >
              {createMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </div>
              ) : (
                t("create_ticket")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
