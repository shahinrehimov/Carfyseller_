import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  Pencil,
  Trash2,
  Eye,
  Plus,
  ArrowLeft,
  History,
  RefreshCw,
} from "lucide-react";
import Modal from "@/components/ui/modal";
import DeleteModal from "@/components/ui/delete-modal";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/products/variants/$productId/")({
  component: ProductVariantsPage,
});

function ProductVariantsPage() {
  const { t } = useTranslation();
  const { productId } = useParams({ from: "/_app/products/variants/$productId/" });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, per_page: 10, last_page: 1 });
  const [loading, setLoading] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyVariant, setHistoryVariant] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [isResendConfirmOpen, setIsResendConfirmOpen] = useState(false);
  const [resendVariant, setResendVariant] = useState<any>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const fetchData = async (params?: { page?: number; search?: string }) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(params?.page ?? page),
        product_id: productId,
      });
      if (params?.search ?? search) {
        queryParams.append("search", params?.search ?? search);
      }
      const res = await controlPrivateApi.get(`/sellers/product-variants/load?${queryParams}`);
      setList(res.data.data || []);
      setMeta(res.data.meta || { total: 0, current_page: 1, per_page: 10, last_page: 1 });
    } catch {
      toast.error(t("error_loading_data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchData({ page: 1, search: value });
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await controlPrivateApi.post(`/sellers/product-variants/change-active-status/${id}`, {
        is_active: !currentStatus,
      });
      setList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_active: !currentStatus } : item
        )
      );
      toast.success(t("status_updated"));
    } catch {
      toast.error(t("error_updating_status"));
    }
  };

  const handleDeleteClick = (variant: any) => {
    setSelectedVariant(variant);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedVariant) return;
    setDeleteLoading(true);
    try {
      await controlPrivateApi.delete(`/sellers/product-variants/delete/${selectedVariant.id}`);
      toast.success(t("deleted_successfully"));
      setIsDeleteModalOpen(false);
      setSelectedVariant(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("error_deleting"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleHistoryClick = async (variant: any) => {
    setHistoryVariant(variant);
    setHistoryList([]);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await controlPrivateApi.get(
        `/sellers/product-variants/${variant.id}/approval-status/history`
      );
      setHistoryList(res.data.data || []);
    } catch {
      toast.error(t("error_loading_data"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleResendClick = (variant: any) => {
    setResendVariant(variant);
    setIsResendConfirmOpen(true);
  };

  const handleResendConfirm = async () => {
    if (!resendVariant) return;
    setResendLoading(true);
    try {
      await controlPrivateApi.post(
        `/sellers/product-variants/${resendVariant.id}/approval-status/resend`
      );
      toast.success(t("resend_success"));
      setIsResendConfirmOpen(false);
      setResendVariant(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("error_updating_status"));
    } finally {
      setResendLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US").format(price);

  const productTitle = list[0]?.product?.title;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {productTitle ? `${productTitle} - ${t("variants")}` : t("variants")}
          </h1>
        </div>
        <Link to="/products/variants/$productId/add" params={{ productId }}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>{t("image")}</TableHead>
              <TableHead>{t("slug")}</TableHead>
              <TableHead>{t("stock")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("final_price")}</TableHead>
              <TableHead>{t("approval_status")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : list.length > 0 ? (
              list.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{(page - 1) * meta.per_page + index + 1}</TableCell>
                  <TableCell>
                    {item.main_image ? (
                      <img
                        src={item.main_image}
                        alt={item.slug}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.slug}</TableCell>
                  <TableCell>
                    <Badge variant={item.stock > 0 ? "default" : "destructive"}>
                      {item.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    <span className="font-medium text-primary">
                      {formatPrice(item.price_final)}
                    </span>
                    {item.discount > 0 && (
                      <span className="ml-1 text-xs text-destructive">
                        -{item.discount}
                        {item.discount_type === "by_percentage" ? "%" : "$"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.approval_status === "approved"
                          ? "default"
                          : item.approval_status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {item.approval_status_label ?? item.approval_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => toggleStatus(item.id, item.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link to="/products/variants/$productId/show/$variantId" params={{ productId, variantId: String(item.id) }}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to="/products/variants/$productId/edit/$variantId" params={{ productId, variantId: String(item.id) }}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("history")}
                        onClick={() => handleHistoryClick(item)}
                      >
                        <History className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {item.approval_status === "rejected" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("resend")}
                          onClick={() => handleResendClick(item)}
                        >
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  {t("no_data_found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.total > 0 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {t("previous")}
          </Button>
          <span className="text-sm">
            {t("page")} {meta.current_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={list.length < meta.per_page}
          >
            {t("next")}
          </Button>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("delete_variant")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setIsDeleteModalOpen(false)}
          handleDelete={handleDelete}
          pending={deleteLoading}
        />
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`${historyVariant?.slug ?? ""} — ${t("history")}`}
        size="lg"
      >
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : historyList.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t("no_data_found")}
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>{t("approval_status")}</TableHead>
                  <TableHead>{t("message")}</TableHead>
                  <TableHead>{t("created_by")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyList.map((h, idx) => (
                  <TableRow key={h.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          h.approval_status === "approved"
                            ? "default"
                            : h.approval_status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {h.approval_status_label ?? h.approval_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {h.approval_status_message ?? "—"}
                    </TableCell>
                    <TableCell>{h.created_user}</TableCell>
                    <TableCell>{h.created_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Modal>

      {/* Resend Confirmation Modal */}
      <Modal
        isOpen={isResendConfirmOpen}
        onClose={() => !resendLoading && setIsResendConfirmOpen(false)}
        title={t("resend")}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("resend_confirm_message")}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsResendConfirmOpen(false)}
              disabled={resendLoading}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleResendConfirm} disabled={resendLoading}>
              {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("resend")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
