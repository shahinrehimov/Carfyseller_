import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Modal from "@/components/ui/modal";
import {
  getAllowedNextItemStatuses,
  useBulkUpdateOrderItemStatus,
  useSellerOrderDetail,
  useUpdateOrderItemStatus,
  type OrderItemStatus,
} from "@/lib/queries/orders";
import { isAxiosError } from "axios";
import { useTranslation } from "@/lib/utils/translationLoader";

function apiErrorMessage(e: unknown): string | undefined {
  if (!isAxiosError(e) || e.response?.data == null) return undefined;
  const d = e.response.data as { message?: string };
  return d.message;
}

export const Route = createFileRoute("/_app/orders/show/$orderUuid/")({
  component: OrderShowPage,
});

function formatAZN(value: number) {
  return new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: "AZN",
  }).format(value);
}

function orderStatusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  if (s.includes("deliver") || s.includes("courier") || s === "complete")
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (s.includes("process") || s === "pending")
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

function itemStatusClass(status: OrderItemStatus) {
  switch (status) {
    case "canceled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "handed_to_courier":
    case "ready_for_delivery":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  }
}

function itemStatusOptions(
  t: (k: string, f?: string) => string,
  next: OrderItemStatus[],
): SelectOption[] {
  return next.map((s) => ({
    value: s,
    label: t(`item_status_${s}`, s.replace(/_/g, " ")),
  }));
}

function OrderShowPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { orderUuid } = Route.useParams();

  const { data: order, isLoading, error } = useSellerOrderDetail(orderUuid);
  const updateItem = useUpdateOrderItemStatus();
  const bulkUpdate = useBulkUpdateOrderItemStatus();

  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderItemStatus | "">("");
  const [cancelModal, setCancelModal] = useState<{ itemIds: number[] } | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const isBusy = updateItem.isPending || bulkUpdate.isPending;

  const itemLabel = (s: OrderItemStatus) => t(`item_status_${s}`, s.replace(/_/g, " "));

  const toggleItem = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAll = (ids: number[]) => {
    const activeIds = ids.filter(
      (id) => order?.items.find((i) => i.id === id)?.status !== "canceled",
    );
    setSelected((prev) => {
      if (activeIds.length === 0) return new Set();
      const allOn = activeIds.every((id) => prev.has(id));
      if (allOn) return new Set();
      return new Set(activeIds);
    });
  };

  const runCancel = (itemIds: number[]) => {
    const reason = cancelReason.trim();
    if (!reason) {
      toast.error(t("cancel_reason_required", "Ləğv səbəbi mütləqdir"));
      return;
    }
    if (itemIds.length === 1) {
      updateItem.mutate(
        {
          orderItemId: itemIds[0]!,
          orderUuid,
          payload: { status: "canceled", cancel_reason: reason },
        },
        {
          onSuccess: (res: { data?: { message?: string } } | any) => {
            toast.success(
              res?.data?.message ?? t("status_updated", "Status yeniləndi"),
            );
            setCancelModal(null);
            setCancelReason("");
            setSelected(new Set());
          },
          onError: (e) => {
            toast.error(
              apiErrorMessage(e) ?? t("an_error_occurred", "Xəta baş verdi"),
            );
          },
        },
      );
    } else {
      bulkUpdate.mutate(
        { orderUuid, payload: { item_ids: itemIds, status: "canceled", cancel_reason: reason } },
        {
          onSuccess: (res: { data?: { message?: string } } | any) => {
            toast.success(
              res?.data?.message ?? t("status_updated", "Status yeniləndi"),
            );
            setCancelModal(null);
            setCancelReason("");
            setSelected(new Set());
            setBulkStatus("");
          },
          onError: (e) => {
            toast.error(
              apiErrorMessage(e) ?? t("an_error_occurred", "Xəta baş verdi"),
            );
          },
        },
      );
    }
  };

  const handleItemNextStatus = (itemId: number, status: OrderItemStatus) => {
    if (!order) return;
    if (status === "canceled") {
      setCancelModal({ itemIds: [itemId] });
      setCancelReason("");
      return;
    }
    updateItem.mutate(
      { orderItemId: itemId, orderUuid, payload: { status, cancel_reason: null } },
      {
        onSuccess: (res: { data?: { message?: string } } | any) => {
          toast.success(
            res?.data?.message ?? t("status_updated", "Status yeniləndi"),
          );
        },
        onError: (e) => {
          toast.error(
            apiErrorMessage(e) ?? t("an_error_occurred", "Xəta baş verdi"),
          );
        },
      },
    );
  };

  const handleBulkApply = () => {
    if (!order || !bulkStatus) return;
    const ids = [...selected];
    if (ids.length === 0) {
      toast.error(t("select_items", "Məhsul seçin"));
      return;
    }
    if (bulkStatus === "canceled") {
      setCancelModal({ itemIds: ids });
      setCancelReason("");
      return;
    }
    bulkUpdate.mutate(
      { orderUuid, payload: { item_ids: ids, status: bulkStatus, cancel_reason: null } },
      {
        onSuccess: (res: { data?: { message?: string } } | any) => {
          toast.success(
            res?.data?.message ?? t("status_updated", "Status yeniləndi"),
          );
          setSelected(new Set());
          setBulkStatus("");
        },
        onError: (e) => {
          toast.error(
            apiErrorMessage(e) ?? t("an_error_occurred", "Xəta baş verdi"),
          );
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => router.navigate({ to: "/orders" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-center text-red-600">
          {t("order_not_found", "Sifariş tapılmadı")}
        </p>
      </div>
    );
  }

  const activeItems = order.items.filter((i) => i.status !== "canceled");
  const canSelectAll = activeItems.map((i) => i.id);
  const allSelected =
    canSelectAll.length > 0 && canSelectAll.every((id) => selected.has(id));

  const bulkOptions = (): SelectOption[] => {
    const raw: OrderItemStatus[] = [
      "processing",
      "ready_for_delivery",
      "canceled",
    ];
    if (order.status === "courier_assigned")
      raw.splice(2, 0, "handed_to_courier");
    return itemStatusOptions(t, raw);
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.navigate({ to: "/orders" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">
                {t("order", "Sifariş")} #{order.id}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusClass(order.status)}`}
              >
                {t(`order_status_${order.status}`, order.status.replace(/_/g, " "))}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {order.uuid}
            </p>
            {order.created_at && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("created_at", "Yaradılıb")}: {order.created_at}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 dark:border-gray-800">
        <h2 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
          {t("shipping", "Çatdırılma")}
        </h2>
        <div className="flex flex-wrap items-baseline gap-4 text-sm">
          <span>
            {t("shipping_amount", "Çatdırılma haqqı")}:{" "}
            <span className="font-medium tabular-nums">{formatAZN(order.shipping)}</span>
          </span>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-end dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("selected_count", "Seçilib")}: {selected.size}
          </p>
          <div className="flex flex-1 flex-col gap-2 sm:max-w-md sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label className="mb-1.5 block text-xs">
                {t("bulk_new_status", "Yeni status")}
              </Label>
              <Select
                value={bulkStatus}
                onValueChange={(v) => setBulkStatus(v as OrderItemStatus)}
                placeholder={t("select_status", "Status seçin")}
                options={bulkOptions()}
                className="w-full"
                disabled={isBusy}
              />
            </div>
            <Button onClick={handleBulkApply} disabled={isBusy || !bulkStatus}>
              {bulkUpdate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {t("apply", "Tətbiq et")}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleAll(canSelectAll)}
                  disabled={isBusy || canSelectAll.length === 0}
                  aria-label={t("select_all", "Hamısını seç")}
                />
              </TableHead>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>{t("product", "Məhsul")}</TableHead>
              <TableHead className="w-[80px]">{t("quantity", "Say")}</TableHead>
              <TableHead className="w-[100px] text-right">{t("price", "Qiymət")}</TableHead>
              <TableHead className="w-[110px] text-right">
                {t("subtotal", "Cəm")}
              </TableHead>
              <TableHead className="w-[140px]">{t("status", "Status")}</TableHead>
              <TableHead className="min-w-[200px]">
                {t("change_status", "Statusu dəyiş")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item, index) => {
              const next = getAllowedNextItemStatuses(item.status, order.status);
              const canSelect = item.status !== "canceled";
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                      disabled={isBusy || !canSelect}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <div className="max-w-md font-medium">{item.product_variant.title}</div>
                    {item.cancel_reason && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {t("cancel_reason", "Səbəb")}: {item.cancel_reason}
                      </p>
                    )}
                    {item.status_history && item.status_history.length > 0 && (
                      <details className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <summary className="cursor-pointer select-none text-gray-600 dark:text-gray-300">
                          {t("status_history", "Status tarixçəsi")}
                        </summary>
                        <ul className="mt-1 list-inside list-disc space-y-0.5 pl-0">
                          {item.status_history.map((h, i) => (
                            <li key={i}>
                              {itemLabel(h.status)} — {h.created_at}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAZN(item.amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatAZN(item.amount_final)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${itemStatusClass(item.status)}`}
                    >
                      {itemLabel(item.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {next.length > 0 ? (
                      <Select
                        value=""
                        onValueChange={(v) =>
                          handleItemNextStatus(item.id, v as OrderItemStatus)
                        }
                        placeholder={t("change_status", "Statusu dəyiş")}
                        options={itemStatusOptions(t, next)}
                        className="w-full min-w-[180px]"
                        disabled={isBusy}
                      />
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={!!cancelModal}
        onClose={() => {
          if (!isBusy) {
            setCancelModal(null);
            setCancelReason("");
          }
        }}
        title={t("cancel_item", "Məhsulu ləğv et")}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("cancel_reason_hint", "Ləğv səbəbi tələb olunur.")}
          </p>
          <div>
            <Label htmlFor="cancel-reason">
              {t("cancel_reason", "Ləğv səbəbi")}
            </Label>
            <Textarea
              id="cancel-reason"
              className="mt-1.5"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={isBusy}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!isBusy) {
                  setCancelModal(null);
                  setCancelReason("");
                }
              }}
            >
              {t("close", "Bağla")}
            </Button>
            <Button
              onClick={() => cancelModal && runCancel(cancelModal.itemIds)}
              disabled={isBusy}
            >
              {updateItem.isPending || bulkUpdate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {t("confirm", "Təsdiq et")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
