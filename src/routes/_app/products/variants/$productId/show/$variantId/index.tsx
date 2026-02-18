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

  const [variant, setVariant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        setLoading(true);
        const res = await controlPrivateApi.get(`/product-variants/show/${variantId}`);
        setVariant(res.data.data);
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

  if (!variant) {
    return (
      <div className="rounded-lg border border-destructive p-4 text-destructive">
        {t("variant_not_found")}
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">{t("product_variant_details")}</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Image */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("main_image")}</p>
            {variant.main_image ? (
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

          {/* Hover Image */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("hover_image")}</p>
            {variant.hover_image ? (
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

          {/* Gallery Images */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("gallery_images")}</p>
            {variant.images?.urls && variant.images.urls.length > 0 ? (
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

      {/* Basic Info */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("basic_information")}</h2>
        <div className="rounded-md border">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-1/3">ID</TableCell>
                <TableCell>{variant.id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Slug</TableCell>
                <TableCell>{variant.slug || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("status")}</TableCell>
                <TableCell>
                  <Badge variant={variant.is_active ? "default" : "secondary"}>
                    {variant.is_active ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("stock")}</TableCell>
                <TableCell>
                  <Badge variant={variant.stock > 0 ? "default" : "destructive"}>
                    {variant.stock}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("price")}</TableCell>
                <TableCell>{formatPrice(variant.price)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">{t("final_price")}</TableCell>
                <TableCell>
                  <span className="font-semibold text-primary">
                    {formatPrice(variant.price_final)}
                  </span>
                  {variant.discount > 0 && (
                    <span className="ml-2 text-sm text-destructive">
                      -{variant.discount}
                      {variant.discount_type === "by_percentage" ? "%" : "$"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
              {variant.year && (
                <TableRow>
                  <TableCell className="font-medium">{t("year")}</TableCell>
                  <TableCell>{variant.year}</TableCell>
                </TableRow>
              )}
              {variant.city && (
                <TableRow>
                  <TableCell className="font-medium">{t("city")}</TableCell>
                  <TableCell>{variant.city?.title || "-"}</TableCell>
                </TableRow>
              )}
              {variant.brand_model && (
                <TableRow>
                  <TableCell className="font-medium">{t("brand_model")}</TableCell>
                  <TableCell>{variant.brand_model?.title || "-"}</TableCell>
                </TableRow>
              )}
              {variant.discount > 0 && (
                <>
                  <TableRow>
                    <TableCell className="font-medium">{t("discount_period")}</TableCell>
                    <TableCell>
                      {formatDate(variant.discount_start_at)} - {formatDate(variant.discount_end_at)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Product Options */}
      {variant.options && variant.options.length > 0 && (
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
