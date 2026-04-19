import { useEffect, useRef, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  Loader2,
  Paperclip,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTicket, useReplyTicket, useCloseTicket } from "@/lib/queries/support";
import type { SupportTicketStatus } from "@/lib/queries/support";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/support/show/$ticketId/")({
  component: TicketDetailPage,
});

function statusBadge(status: SupportTicketStatus, label: string) {
  const styles: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    in_progress:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.open}`}
    >
      {label}
    </span>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TicketDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { ticketId } = Route.useParams();
  const id = Number(ticketId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [replyBody, setReplyBody] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);

  const { data: ticket, isLoading } = useTicket(id);
  const replyMutation = useReplyTicket();
  const closeMutation = useCloseTicket();

  useEffect(() => {
    if (ticket) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket?.messages?.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setReplyFiles((prev) => [...prev, ...selected].slice(0, 10));
    e.target.value = "";
  };

  const handleSendReply = async () => {
    if (!replyBody.trim()) return;

    replyMutation.mutate(
      { id, body: replyBody.trim(), files: replyFiles },
      {
        onSuccess: () => {
          setReplyBody("");
          setReplyFiles([]);
          toast.success(t("message_sent"));
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message ?? t("an_error_occurred"));
        },
      },
    );
  };

  const handleClose = () => {
    closeMutation.mutate(id, {
      onSuccess: () => toast.success(t("ticket_closed")),
      onError: (error: any) => {
        toast.error(error?.response?.data?.message ?? t("an_error_occurred"));
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!ticket) return null;

  const isClosed = ticket.status === "closed";

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-0 pt-5">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.navigate({ to: "/support" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{ticket.subject}</h1>
              {statusBadge(ticket.status, ticket.status_label)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span>#{ticket.id}</span>
              <span>
                {t("created_at")}: {ticket.created_at}
              </span>
            </div>
          </div>
        </div>

        {!isClosed && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700"
              onClick={handleClose}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {t("close_ticket")}
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-gray-50 p-4 dark:bg-gray-900/30">
        <div className="flex flex-col gap-4">
          {ticket.messages.map((msg) => {
            const isSeller = msg.sender_type === "seller";
            return (
              <div
                key={msg.id}
                className={`flex ${isSeller ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    isSeller
                      ? "rounded-tr-sm bg-blue-600 text-white"
                      : "rounded-tl-sm bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${isSeller ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {msg.sender_name}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.body}
                  </p>

                  {msg.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.files.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                            isSeller
                              ? "bg-blue-500/50 text-white hover:bg-blue-500/70"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          <Paperclip className="h-3 w-3 shrink-0" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="shrink-0 opacity-70">
                            {formatFileSize(file.size)}
                          </span>
                          <Download className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}

                  <p
                    className={`mt-1.5 text-right text-[10px] ${isSeller ? "text-blue-200" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {msg.created_at}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Box */}
      {isClosed ? (
        <div className="mt-3 rounded-lg border border-dashed bg-gray-50 py-3 text-center text-sm text-gray-500 dark:bg-gray-900/20">
          {t("ticket_is_closed")}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border bg-white p-3 dark:bg-gray-900/20">
          {replyFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {replyFiles.map((f, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-full border bg-gray-50 px-2 py-0.5 text-xs dark:bg-gray-800"
                >
                  <Paperclip className="h-3 w-3 text-gray-400" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={t("type_a_message")}
              rows={2}
              className="flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
            />
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={replyFiles.length >= 10}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-8 w-8"
                onClick={handleSendReply}
                disabled={replyMutation.isPending || !replyBody.trim()}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}
