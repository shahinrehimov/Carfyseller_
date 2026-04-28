import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Bell, Eye, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import DeleteModal from "@/components/ui/delete-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useSellerNotifications,
  useDeleteSellerNotification,
  useResendSellerNotification,
  type SellerNotification,
} from "@/lib/queries/push-notifications";
import { useTranslation } from "@/lib/utils/translationLoader";
import type { SellerNotificationStatus } from "@/lib/types/push-notification";

export const Route = createFileRoute("/_app/push-notifications/")({
  component: RouteComponent,
});

type ModalState =
  | { type: null }
  | { type: "delete"; data: SellerNotification }
  | { type: "resend"; data: SellerNotification };

function StatusBadge({ status, t }: { status: SellerNotificationStatus; t: (k: string) => string }) {
  const map: Record<SellerNotificationStatus, string> = {
    pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved:         "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    rejected:         "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    sending:          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    sent:             "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled:        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? map.cancelled}`}>
      {t(`status_${status}`)}
    </span>
  );
}

function RouteComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: null });

  const { data, isLoading, error } = useSellerNotifications(page);
  const deleteMutation = useDeleteSellerNotification();
  const resendMutation = useResendSellerNotification();

  const notifications = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const lastPage = data?.meta.last_page ?? 1;

  const canDelete = (n: SellerNotification) =>
    n.status === "pending_approval" || n.status === "rejected";
  const canResend = (n: SellerNotification) =>
    n.status === "sent" || n.status === "cancelled";

  const handleDelete = async () => {
    if (modal.type !== "delete") return;
    try {
      await deleteMutation.mutateAsync(modal.data.id);
      toast.success(t("deleted_successfully"));
      setModal({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleResend = async () => {
    if (modal.type !== "resend") return;
    try {
      const res = await resendMutation.mutateAsync(modal.data.id);
      toast.success(res.message || t("notification_sent_for_approval"));
      setModal({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const goToDetail = (id: number) =>
    router.navigate({
      to: "/push-notifications/show/$notificationId",
      params: { notificationId: String(id) },
    });

  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Bell className="h-12 w-12 text-gray-300" />
      <p className="text-lg text-gray-500">{t("no_data_found")}</p>
      <Button variant="outline" onClick={() => router.navigate({ to: "/push-notifications/add" })}>
        <Plus className="mr-2 h-4 w-4" />
        {t("create_first_notification")}
      </Button>
    </div>
  );

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>{t("title")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("target")}</TableHead>
          <TableHead>{t("channels")}</TableHead>
          <TableHead>{t("recipients")}</TableHead>
          <TableHead>{t("date")}</TableHead>
          <TableHead className="w-[100px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(8)].map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : notifications.length > 0 ? (
          notifications.map((n, index) => (
            <TableRow key={n.id}>
              <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
              <TableCell>
                <p className="font-medium line-clamp-1">{n.title}</p>
              </TableCell>
              <TableCell>
                <StatusBadge status={n.status} t={t} />
              </TableCell>
              <TableCell className="text-sm">
                {n.target_type === "bulk" ? t("target_bulk") : t("target_individual")}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {n.channels.map((ch) => (
                    <span key={ch} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium uppercase dark:bg-gray-800">
                      {ch}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>{n.total_recipients}</TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                {n.sent_at ?? n.created_at}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" title={t("view")}
                    onClick={() => goToDetail(n.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canResend(n) && (
                    <Button variant="ghost" size="icon" title={t("resend")}
                      onClick={() => setModal({ type: "resend", data: n })}>
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  {canDelete(n) && (
                    <Button variant="ghost" size="icon" title={t("delete")}
                      onClick={() => setModal({ type: "delete", data: n })}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={8}><NoData /></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        [...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse border-b border-border p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))
      ) : notifications.length > 0 ? (
        notifications.map((n) => (
          <Card key={n.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{n.title}</h3>
                <p className="text-xs text-gray-500">{n.created_at}</p>
              </div>
              <StatusBadge status={n.status} t={t} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {n.channels.map((ch) => (
                <span key={ch} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium uppercase dark:bg-gray-800">
                  {ch}
                </span>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {n.target_type === "bulk" ? t("target_bulk") : t("target_individual")}
              {" · "}{n.total_recipients} {t("recipients")}
            </p>
            <div className="mt-3 flex justify-end gap-1">
              <Button variant="outline" size="sm" onClick={() => goToDetail(n.id)}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                {t("view")}
              </Button>
              {canResend(n) && (
                <Button variant="ghost" size="icon" onClick={() => setModal({ type: "resend", data: n })}>
                  <RefreshCw className="h-4 w-4 text-green-600" />
                </Button>
              )}
              {canDelete(n) && (
                <Button variant="ghost" size="icon" onClick={() => setModal({ type: "delete", data: n })}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          </Card>
        ))
      ) : (
        <NoData />
      )}
    </div>
  );

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{t("an_error_occurred")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("push_notifications")}</h1>
        <Button onClick={() => router.navigate({ to: "/push-notifications/add" })}
          className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("new_notification")}
        </Button>
      </div>

      <div className="overflow-hidden p-0">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      <Pagination
        currentPage={page}
        totalPages={lastPage}
        pageSize={10}
        totalItems={total}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal isOpen={modal.type === "delete"} onClose={() => setModal({ type: null })}
        title={t("delete_notification")} size="sm">
        <DeleteModal
          closeModal={() => setModal({ type: null })}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>

      <Modal isOpen={modal.type === "resend"} onClose={() => setModal({ type: null })}
        title={t("resend_notification")} size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {t("resend_seller_notification_info")}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModal({ type: null })}>
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
