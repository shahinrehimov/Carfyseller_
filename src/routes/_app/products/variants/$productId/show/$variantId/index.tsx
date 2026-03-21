import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { useTranslation } from "@/lib/utils/translationLoader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute(
  "/_app/products/variants/$productId/show/$variantId/"
)({
  component: ShowProductVariantPage,
});

function ShowProductVariantPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId, variantId } = useParams({
    from: "/_app/products/variants/$productId/show/$variantId/",
  });

  const [cpv, setCpv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        setLoading(true);
        const res = await controlPrivateApi.get(`/company-product-variants/show/${variantId}`);
        setCpv(res.data.data);
      } catch {
        toast.error(t("error_loading_data"));
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [variantId]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

  const formatDate = (dateString: string) =>
    dateString ? new Date(dateString).toLocaleDateString() : "-";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cpv) {
    return (
      <div className="rounded-lg border border-destructive p-4 text-destructive">
        {t("variant_not_found")}
      </div>
    );
  }

  const variant = cpv.variant;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/products/variants/$productId" params={{ productId }}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {variant?.title || variant?.slug}
            </h1>
            {variant?.product?.title && (
              <p className="text-sm text-muted-foreground">{variant.product.title}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate({ to: `/products/variants/${productId}/edit/${variantId}` })}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {t("edit")}
        </Button>
      </div>

      {/* Images */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("images")}</h2>

        {/* Canonical images */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">{t("canonical_images")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("main_image")}</p>
              {variant?.main_image ? (
                <img
                  src={variant.main_image}
                  alt={t("main_image")}
                  className="h-48 w-full rounded-lg object-cover border"
                />
              ) : (
                <div className="h-48 w-full rounded-lg bg-muted flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">{t("no_main_image")}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("hover_image")}</p>
              {variant?.hover_image ? (
                <img
                  src={variant.hover_image}
                  alt={t("hover_image")}
                  className="h-48 w-full rounded-lg object-cover border"
                />
              ) : (
                <div className="h-48 w-full rounded-lg bg-muted flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">{t("no_hover_image")}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{t("gallery_images")}</p>
              {variant?.images?.urls && variant.images.urls.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {variant.images.urls.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${t("gallery_image")} ${index + 1}`}
                      className="h-20 w-full rounded object-cover border"
                    />
                  ))}
                </div>
              ) : (
                <div className="h-48 w-full rounded-lg bg-muted flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">{t("no_gallery_images")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seller images */}
        {cpv.seller_images && cpv.seller_images.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">{t("seller_images")}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cpv.seller_images.map((img: any) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={t("seller_image")}
                  className="h-24 w-full rounded-lg object-cover border"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CPV Info */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("listing_information")}</h2>
        <div className="rounded-md border">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-1/3">{t("status")}</TableCell>
                <TableCell>
                  <Badge variant={cpv.is_active ? "default" : "secondary"}>
                    {cpv.is_active ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("approval_status")}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      cpv.approval_status === "approved"
                        ? "default"
                        : cpv.approval_status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {cpv.approval_status_label ?? cpv.approval_status}
                  </Badge>
                  {cpv.approval_status_message && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cpv.approval_status_message}
                    </p>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("stock")}</TableCell>
                <TableCell>
                  <Badge variant={cpv.stock > 0 ? "default" : "destructive"}>
                    {cpv.stock}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("price")}</TableCell>
                <TableCell>{formatPrice(cpv.price)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("final_price")}</TableCell>
                <TableCell>
                  <span className="font-semibold text-primary">
                    {formatPrice(cpv.price_final)}
                  </span>
                  {cpv.discount > 0 && (
                    <span className="ml-2 text-sm text-destructive">
                      -{cpv.discount}
                      {cpv.discount_type === "by_percentage" ? "%" : "$"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
              {cpv.discount > 0 && (
                <TableRow>
                  <TableCell className="font-medium">{t("discount_period")}</TableCell>
                  <TableCell>
                    {formatDate(cpv.discount_start_at)} — {formatDate(cpv.discount_end_at)}
                  </TableCell>
                </TableRow>
              )}
              {cpv.city && (
                <TableRow>
                  <TableCell className="font-medium">{t("city")}</TableCell>
                  <TableCell>{cpv.city.title}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium">{t("created_date")}</TableCell>
                <TableCell>{formatDate(cpv.created_date)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Variant (canonical) Info */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("variant_information")}</h2>
        <div className="rounded-md border">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-1/3">Slug</TableCell>
                <TableCell>{variant?.slug || "-"}</TableCell>
              </TableRow>
              {variant?.oem_code && (
                <TableRow>
                  <TableCell className="font-medium">{t("oem_code")}</TableCell>
                  <TableCell>{variant.oem_code}</TableCell>
                </TableRow>
              )}
              {variant?.year && (
                <TableRow>
                  <TableCell className="font-medium">{t("year")}</TableCell>
                  <TableCell>{variant.year}</TableCell>
                </TableRow>
              )}
              {variant?.brand_models?.length > 0 && (
                <TableRow>
                  <TableCell className="font-medium">{t("brand_model")}</TableCell>
                  <TableCell>{variant.brand_models.map((m: any) => m.title).join(", ")}</TableCell>
                </TableRow>
              )}
              {variant?.product && (
                <TableRow>
                  <TableCell className="font-medium">{t("product")}</TableCell>
                  <TableCell>{variant.product.title}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Product Options */}
      {variant?.options && variant.options.length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("product_options")}</h2>
          <div className="space-y-3">
            {variant.options.map((productOption: any) => (
              <div key={productOption.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{productOption.option?.title}</span>
                  {productOption.option?.is_required && (
                    <Badge variant="destructive" className="text-xs">
                      {t("required")}
                    </Badge>
                  )}
                </div>

                {productOption.value !== null && productOption.value !== undefined && (
                  <div>
                    {productOption.option?.has_items ? (
                      (() => {
                        const selectedItem = productOption.option?.items?.find(
                          (item: any) => item.id === productOption.value
                        );
                        return selectedItem ? (
                          <Badge>{selectedItem.title}</Badge>
                        ) : (
                          <span className="text-sm">{productOption.value}</span>
                        );
                      })()
                    ) : (
                      <span className="text-sm">{productOption.value}</span>
                    )}
                  </div>
                )}

                {productOption.option?.is_translatable && productOption.translations && (
                  <div className="flex flex-wrap gap-2">
                    {productOption.translations.map((trans: any) => (
                      <Badge key={trans.language_id} variant="outline">
                        {trans.translatable_value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
