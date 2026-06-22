import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { searchCatalog, useAttachProductVariant } from "@/lib/queries/products";
import type { CatalogSearchItem } from "@/lib/queries/products";
import { useCountries, useCities, useProductSizeCategories } from "@/lib/queries/countries";
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
import { Label } from "@/components/ui/label";
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
  Link2,
  Image as ImageIcon,
  CheckCircle,
  DollarSign,
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

// ─── Attach Form ──────────────────────────────────────────────────────────────

interface AttachFormState {
  price: string;
  stock: string;
  has_discount: boolean;
  discount_type: string;
  discount: string;
  discount_start_at: string;
  discount_end_at: string;
  country_id: string;
  city_id: string;
  size_category_id: string;
  weight_gram: string;
}

const defaultAttachForm: AttachFormState = {
  price: "",
  stock: "",
  has_discount: false,
  discount_type: "by_percentage",
  discount: "",
  discount_start_at: "",
  discount_end_at: "",
  country_id: "",
  city_id: "",
  size_category_id: "",
  weight_gram: "",
};

function AttachForm({
  variant,
  searchToken,
  onCancel,
  onSuccess,
}: {
  variant: CatalogSearchItem;
  searchToken: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<AttachFormState>(defaultAttachForm);
  const attachMutation = useAttachProductVariant();

  const { data: countries } = useCountries();
  const { data: cities } = useCities(
    form.country_id ? Number(form.country_id) : null,
  );
  const { data: sizeCategories } = useProductSizeCategories();

  const set = (field: keyof AttachFormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.price) {
      toast.error(t("price_required") || "Price is required");
      return;
    }

    const fd = new FormData();
    fd.append("price", form.price);
    fd.append("stock", form.stock || "0");
    fd.append("has_discount", form.has_discount ? "1" : "0");
    if (form.has_discount) {
      fd.append("discount_type", form.discount_type);
      fd.append("discount", form.discount);
      if (form.discount_start_at)
        fd.append("discount_start_at", form.discount_start_at);
      if (form.discount_end_at)
        fd.append("discount_end_at", form.discount_end_at);
    }
    if (form.city_id) fd.append("city_id", form.city_id);
    if (form.size_category_id) fd.append("size_category", form.size_category_id);
    if (form.weight_gram) fd.append("weight_gram", form.weight_gram);

    try {
      await attachMutation.mutateAsync({
        variantId: variant.id,
        data: fd,
        searchToken,
      });
      toast.success(t("attached_successfully") || "Attached successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("error_occurred"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Variant info */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-sm font-medium">{variant.title || variant.slug}</p>
        {variant.oem_code && (
          <p className="text-xs text-muted-foreground">
            OEM: {variant.oem_code}
          </p>
        )}
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="attach-price">{t("price")} *</Label>
          <Input
            id="attach-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="attach-stock">{t("stock")}</Label>
          <Input
            id="attach-stock"
            type="number"
            min="0"
            placeholder="0"
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
          />
        </div>
      </div>

      {/* Country / City */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("country")}</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.country_id}
            onChange={(e) => {
              set("country_id", e.target.value);
              set("city_id", "");
            }}
          >
            <option value="">{t("select_country")}</option>
            {countries?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>{t("city")}</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.city_id}
            onChange={(e) => set("city_id", e.target.value)}
            disabled={!form.country_id}
          >
            <option value="">{t("select_city")}</option>
            {cities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Size Category & Weight */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("size_category")}</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.size_category_id}
            onChange={(e) => set("size_category_id", e.target.value)}
          >
            <option value="">{t("select_size_category")}</option>
            {sizeCategories?.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="attach-weight">{t("weight_gram")}</Label>
          <Input
            id="attach-weight"
            type="number"
            min="0"
            step="0.01"
            value={form.weight_gram}
            onChange={(e) => set("weight_gram", e.target.value)}
          />
        </div>
      </div>

      {/* Has Discount */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="attach-has-discount"
          checked={form.has_discount}
          onChange={(e) => set("has_discount", e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="attach-has-discount" className="cursor-pointer">
          {t("has_discount")}
        </Label>
      </div>

      {form.has_discount && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("discount_type")}</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.discount_type}
                onChange={(e) => set("discount_type", e.target.value)}
              >
                <option value="by_percentage">{t("percentage") || "%"}</option>
                <option value="by_amount">
                  {t("fixed_amount") || "Fixed"}
                </option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("discount")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => set("discount", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("discount_start_at")}</Label>
              <Input
                type="date"
                value={form.discount_start_at}
                onChange={(e) => set("discount_start_at", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("discount_end_at")}</Label>
              <Input
                type="date"
                value={form.discount_end_at}
                onChange={(e) => set("discount_end_at", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={attachMutation.isPending}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={attachMutation.isPending}>
          {attachMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {t("attach")}
        </Button>
      </div>
    </form>
  );
}

// ─── Pricing Modal ────────────────────────────────────────────────────────────

function PricingModal({
  item,
  onClose,
  onSuccess,
}: {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    price: item.price?.toString() || "",
    stock: item.stock?.toString() || "",
    has_discount: item.discount > 0,
    discount_type: item.discount_type || "by_percentage",
    discount: item.discount?.toString() || "",
    discount_start_at: item.discount_start_at
      ? item.discount_start_at.substring(0, 10)
      : "",
    discount_end_at: item.discount_end_at
      ? item.discount_end_at.substring(0, 10)
      : "",
    country_id: item.city?.country_id?.toString() || "",
    city_id: item.city?.id?.toString() || "",
    size_category_id: item.size_category?.id?.toString() || "",
    weight_gram: item.weight_gram?.toString() || "",
  });

  const { data: countries } = useCountries();
  const { data: cities } = useCities(
    form.country_id ? Number(form.country_id) : null,
  );
  const { data: sizeCategories } = useProductSizeCategories();

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const fd = new FormData();
      fd.append("price", form.price);
      fd.append("stock", form.stock || "0");
      fd.append("has_discount", form.has_discount ? "1" : "0");
      if (form.has_discount) {
        fd.append("discount_type", form.discount_type);
        fd.append("discount", form.discount);
        if (form.discount_start_at)
          fd.append("discount_start_at", form.discount_start_at);
        if (form.discount_end_at)
          fd.append("discount_end_at", form.discount_end_at);
      }
      if (form.city_id) fd.append("city_id", form.city_id);
      if (form.size_category_id) fd.append("size_category", form.size_category_id);
      if (form.weight_gram) fd.append("weight_gram", form.weight_gram);

      await controlPrivateApi.post(
        `/company-product-variants/update/${item.id}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      toast.success(t("updated_successfully") || "Updated successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("error_occurred"));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="p-price">{t("price")} *</Label>
          <Input
            id="p-price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-stock">{t("stock")}</Label>
          <Input
            id="p-stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("country")}</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.country_id}
            onChange={(e) => {
              set("country_id", e.target.value);
              set("city_id", "");
            }}
          >
            <option value="">{t("select_country")}</option>
            {countries?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>{t("city")}</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.city_id}
            onChange={(e) => set("city_id", e.target.value)}
            disabled={!form.country_id}
          >
            <option value="">{t("select_city")}</option>
            {cities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t("size_category")}</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.size_category_id}
            onChange={(e) => set("size_category_id", e.target.value)}
          >
            <option value="">{t("select_size_category")}</option>
            {sizeCategories?.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="p-weight">{t("weight_gram")}</Label>
          <Input
            id="p-weight"
            type="number"
            min="0"
            step="0.01"
            value={form.weight_gram}
            onChange={(e) => set("weight_gram", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="p-has-discount"
          checked={form.has_discount}
          onChange={(e) => set("has_discount", e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="p-has-discount" className="cursor-pointer">
          {t("has_discount")}
        </Label>
      </div>

      {form.has_discount && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("discount_type")}</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.discount_type}
                onChange={(e) => set("discount_type", e.target.value)}
              >
                <option value="by_percentage">{t("percentage") || "%"}</option>
                <option value="by_amount">
                  {t("fixed_amount") || "Fixed"}
                </option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("discount")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => set("discount", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("discount_start_at")}</Label>
              <Input
                type="date"
                value={form.discount_start_at}
                onChange={(e) => set("discount_start_at", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("discount_end_at")}</Label>
              <Input
                type="date"
                value={form.discount_end_at}
                onChange={(e) => set("discount_end_at", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

// ─── Catalog Modal ────────────────────────────────────────────────────────────

function CatalogModal({
  productId,
  onAttachSuccess,
}: {
  productId: string;
  onAttachSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CatalogSearchItem[]>([]);
  const [searchToken, setSearchToken] = useState("");
  const [selectedForAttach, setSelectedForAttach] =
    useState<CatalogSearchItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const doFetch = async (searchValue: string) => {
      setLoading(true);
      try {
        const res = await searchCatalog({
          product_id: Number(productId),
          search: searchValue || undefined,
        });
        if (!cancelled) {
          setResults(res.data);
          setSearchToken(res.search_token);
        }
      } catch {
        if (!cancelled) toast.error(t("error_loading_data"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!search) {
      doFetch("");
      return () => {
        cancelled = true;
      };
    }
    const timer = setTimeout(() => doFetch(search), 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, productId, refreshKey]);

  if (selectedForAttach) {
    return (
      <div>
        <button
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setSelectedForAttach(null)}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </button>
        <AttachForm
          variant={selectedForAttach}
          searchToken={searchToken}
          onCancel={() => setSelectedForAttach(null)}
          onSuccess={() => {
            setSelectedForAttach(null);
            setRefreshKey((k) => k + 1);
            onAttachSuccess();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : results.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("no_data_found")}
        </p>
      ) : (
        <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
          {results.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                item.already_attached
                  ? "bg-muted/40 opacity-70"
                  : "bg-background"
              }`}
            >
              {/* Image */}
              <div className="shrink-0">
                {item.main_image ? (
                  <img
                    src={item.main_image}
                    alt={item.slug}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.title || item.slug}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {item.oem_code && <span>OEM: {item.oem_code}</span>}
                  {item.brand_models?.length > 0 && <span>{item.brand_models.map((m: any) => m.title).join(", ")}</span>}
                  {item.year && <span>{item.year}</span>}
                </div>
                {item.already_attached && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    {t("already_attached") || "Qoşulsunuz"}
                    {item.seller_listing && (
                      <span className="ml-1 text-muted-foreground">
                        · {item.seller_listing.price_final} ₼ · {t("stock")}:{" "}
                        {item.seller_listing.stock}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="shrink-0">
                {item.already_attached ? (
                  <Badge variant="outline" className="text-xs">
                    {t("attached") || "Qoşulub"}
                  </Badge>
                ) : (
                  <Button size="sm" onClick={() => setSelectedForAttach(item)}>
                    <Link2 className="mr-1.5 h-3.5 w-3.5" />
                    {t("attach") || "Qoşul"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ProductVariantsPage() {
  const { t } = useTranslation();
  const { productId } = useParams({
    from: "/_app/products/variants/$productId/",
  });

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    current_page: 1,
    per_page: 10,
    last_page: 1,
  });
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

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPricingItem, setSelectedPricingItem] = useState<any>(null);

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
      const res = await controlPrivateApi.get(
        `/company-product-variants/load?${queryParams}`,
      );
      setList(res.data.data || []);
      setMeta(
        res.data.meta || {
          total: 0,
          current_page: 1,
          per_page: 10,
          last_page: 1,
        },
      );
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
      await controlPrivateApi.post(
        `/company-product-variants/change-active-status/${id}`,
        {
          is_active: !currentStatus,
        },
      );
      setList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_active: !currentStatus } : item,
        ),
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
      await controlPrivateApi.delete(
        `/company-product-variants/detach/${selectedVariant.id}`,
      );
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
        `/company-product-variants/${variant.id}/approval-status/history`,
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
        `/company-product-variants/${resendVariant.id}/approval-status/resend`,
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

  const productTitle = list[0]?.variant?.product?.title;

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
            {productTitle
              ? `${productTitle} — ${t("variants")}`
              : t("variants")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCatalogModalOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            {t("attach_other_variants") || "Digər variantlara qoşul"}
          </Button>
          <Link to="/products/variants/$productId/add" params={{ productId }}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("add")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("search")}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>{t("image")}</TableHead>
              <TableHead>{t("variant")}</TableHead>
              <TableHead>{t("oem_code")}</TableHead>
              <TableHead>{t("city")}</TableHead>
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
                <TableCell colSpan={11} className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : list.length > 0 ? (
              list.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {(page - 1) * meta.per_page + index + 1}
                  </TableCell>
                  <TableCell>
                    {item.variant?.main_image ||
                    item.seller_images?.[0]?.url ? (
                      <img
                        src={
                          item.variant?.main_image || item.seller_images[0]?.url
                        }
                        alt={item.variant?.slug}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[160px]">
                    <div className="truncate font-medium">
                      {item.variant?.title || item.variant?.slug}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.variant?.slug}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.variant?.oem_code || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.city?.title || "—"}
                  </TableCell>
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
                        {item.discount_type === "by_percentage" ? "%" : "₼"}
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
                      onCheckedChange={() =>
                        toggleStatus(item.id, item.is_active)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Link
                        to="/products/variants/$productId/show/$variantId"
                        params={{ productId, variantId: String(item.id) }}
                      >
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {item.variant?.is_creator && (
                        <Link
                          to="/products/variants/$productId/edit/$variantId"
                          params={{ productId, variantId: String(item.id) }}
                        >
                          <Button variant="ghost" size="icon" title={t("edit")}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("pricing") || "Qiymət / Stok"}
                        onClick={() => {
                          setSelectedPricingItem(item);
                          setIsPricingModalOpen(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 text-blue-500" />
                      </Button>
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
                <TableCell colSpan={11} className="text-center">
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

      {/* Pricing Modal */}
      <Modal
        isOpen={isPricingModalOpen}
        onClose={() => {
          setIsPricingModalOpen(false);
          setSelectedPricingItem(null);
        }}
        title={t("pricing") || "Qiymət / Stok"}
        size="sm"
      >
        {selectedPricingItem && (
          <PricingModal
            item={selectedPricingItem}
            onClose={() => {
              setIsPricingModalOpen(false);
              setSelectedPricingItem(null);
            }}
            onSuccess={() => {
              setIsPricingModalOpen(false);
              setSelectedPricingItem(null);
              fetchData();
            }}
          />
        )}
      </Modal>

      {/* Catalog Modal */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title={t("attach_other_variants") || "Digər variantlara qoşul"}
        size="lg"
      >
        <CatalogModal
          productId={productId}
          onAttachSuccess={() => fetchData()}
        />
      </Modal>

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
        title={`${historyVariant?.variant?.slug ?? ""} — ${t("history")}`}
        size="lg"
      >
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : historyList.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
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
              {resendLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("resend")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
