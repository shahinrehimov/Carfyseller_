import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Card } from "@/components/ui/card";
import Pagination from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSellerOrders } from "@/lib/queries/orders";
import { FitmentSelectionBadge } from "@/components/fitment/FitmentSelectionToggle";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/orders/")({
  component: RouteComponent,
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

function RouteComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, error } = useSellerOrders({ page, limit });

  const orders = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / limit));

  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-lg text-gray-500">
        {t("no_data_found", "Məlumat tapılmadı")}
      </p>
    </div>
  );

  const orderStatusBadge = (status: string) => (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${orderStatusClass(status)}`}
    >
      {t(`order_status_${status}`, status.replace(/_/g, " "))}
    </span>
  );

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>{t("order", "Sifariş")}</TableHead>
          <TableHead>{t("order_status", "Sifariş statusu")}</TableHead>
          <TableHead>{t("items", "Məhsullar")}</TableHead>
          <TableHead className="text-right">{t("subtotal", "Cəm")}</TableHead>
          <TableHead>{t("date", "Tarix")}</TableHead>
          <TableHead className="w-[80px]">{t("actions", "Əməliyyat")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(7)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : orders.length > 0 ? (
          orders.map((order, index) => {
            const subtotal = order.items.reduce((acc, it) => acc + it.amount_final, 0);
            return (
              <TableRow key={order.id}>
                <TableCell>
                  {(page - 1) * limit + index + 1}
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm font-medium">#{order.id}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {order.uuid.slice(0, 8)}…
                  </div>
                </TableCell>
                <TableCell>{orderStatusBadge(order.status)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.items.length}{" "}
                    {t("items_count", "məhsul")}
                  </div>
                  {order.items[0] && (
                    <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500">
                      {order.items[0].product_variant.title}
                    </p>
                  )}
                  <div className="mt-1 flex max-w-[220px] flex-col gap-1">
                    {order.items.map((item) => (
                      <FitmentSelectionBadge
                        key={item.id}
                        selection={item.fitment_selection}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatAZN(subtotal)}
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {order.created_at}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      router.navigate({
                        to: "/orders/show/$orderUuid",
                        params: { orderUuid: order.uuid },
                      })
                    }
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={7}>
              <NoData />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        [...Array(5)].map((_, index) => (
          <div
            key={index}
            className="animate-pulse border-b border-border p-4 dark:border-gray-800"
          >
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))
      ) : orders.length > 0 ? (
        orders.map((order) => {
          const subtotal = order.items.reduce((acc, it) => acc + it.amount_final, 0);
          return (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-mono text-base font-semibold">#{order.id}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {order.created_at}
                  </p>
                </div>
                {orderStatusBadge(order.status)}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {order.items.length} {t("items_count", "məhsul")} · {formatAZN(subtotal)}
              </p>
              {order.items[0] && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {order.items[0].product_variant.title}
                </p>
              )}
              <div className="mt-1 flex flex-col gap-1">
                {order.items.map((item) => (
                  <FitmentSelectionBadge
                    key={item.id}
                    selection={item.fitment_selection}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.navigate({
                      to: "/orders/show/$orderUuid",
                      params: { orderUuid: order.uuid },
                    })
                  }
                >
                  {t("details", "Ətraflı")}
                </Button>
              </div>
            </Card>
          );
        })
      ) : (
        <NoData />
      )}
    </div>
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <p className="text-red-600">
            {t("error_loading_orders", "Sifarişlər yüklənmədi")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {t("orders", "Sifarişlər")}
        </h1>
      </div>

      <div className="overflow-hidden p-0">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      <Pagination
        currentPage={page}
        totalPages={lastPage}
        pageSize={limit}
        totalItems={total}
        onPageChange={setPage}
        onPageSizeChange={() => {}}
        showPageSizeSelector={false}
        disabled={isLoading}
      />
    </div>
  );
}
