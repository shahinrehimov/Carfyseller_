import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Eye, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Pagination from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTickets } from "@/lib/queries/support";
import type { SupportTicketStatus } from "@/lib/queries/support";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/support/")({
  component: SupportPage,
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.open}`}
    >
      {label}
    </span>
  );
}

function SupportPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [filters, setFilters] = useState<{
    page: number;
    status: string;
    search: string;
  }>({ page: 1, status: "", search: "" });

  const { data, isLoading } = useTickets({
    status: filters.status || undefined,
    search: filters.search || undefined,
    limit: 10,
  });

  const tickets = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const lastPage = data?.meta.last_page ?? 1;

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("support")}</h1>
        <Button
          onClick={() => router.navigate({ to: "/support/add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_ticket")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t("search")}
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
          }
          className="w-full max-w-sm"
        />
        <Select
          value={filters.status === "" ? "all" : filters.status}
          onValueChange={(val) =>
            setFilters((prev) => ({
              ...prev,
              status: val === "all" ? "" : val,
              page: 1,
            }))
          }
          className="w-full sm:w-[180px]"
          options={[
            { value: "all", label: t("all") },
            { value: "open", label: t("open") },
            { value: "in_progress", label: t("in_progress") },
            { value: "closed", label: t("closed") },
          ]}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>{t("subject")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("messages")}</TableHead>
            <TableHead>{t("last_message_at")}</TableHead>
            <TableHead>{t("date")}</TableHead>
            <TableHead className="w-[80px]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(7)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : tickets.length > 0 ? (
            tickets.map((ticket, index) => (
              <TableRow key={ticket.id}>
                <TableCell>{(filters.page - 1) * 10 + index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ticket.subject}</span>
                    {ticket.unread_count > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                        {ticket.unread_count}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {statusBadge(ticket.status, ticket.status_label)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {ticket.messages_count}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {ticket.last_message_at ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {ticket.created_at}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      router.navigate({
                        to: "/support/show/$ticketId",
                        params: { ticketId: String(ticket.id) },
                      })
                    }
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-gray-500"
              >
                {t("no_data_found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination
        currentPage={filters.page}
        totalPages={lastPage}
        pageSize={10}
        totalItems={total}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />
    </div>
  );
}
