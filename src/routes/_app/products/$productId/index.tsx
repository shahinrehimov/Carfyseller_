import { createFileRoute, Link } from "@tanstack/react-router";
import { useProduct } from "@/lib/queries/products";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslationStore } from "@/store/translations";

export const Route = createFileRoute("/_app/products/$productId/")({
  component: ProductShowPage,
});

function ProductShowPage() {
  const { productId } = Route.useParams();
  const { t } = useTranslation();
  const langs = useTranslationStore((state) => state.langs);
  const { data: product, isLoading } = useProduct(parseInt(productId));

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center">
        <p>{t("product_not_found")}</p>
      </div>
    );
  }

  const defaultVariant = product.variants?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t("product_details")}</h1>
        </div>
        <Link to="/products/edit/$productId" params={{ productId }}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </Button>
        </Link>
      </div>

      {/* Images */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("images")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.main_image && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("main_image")}</p>
              <img
                src={product.main_image}
                alt="main"
                className="h-48 w-full rounded-lg border object-contain bg-muted/30"
              />
            </div>
          )}
          {product.hover_image && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("hover_image")}</p>
              <img
                src={product.hover_image}
                alt="hover"
                className="h-48 w-full rounded-lg border object-contain bg-muted/30"
              />
            </div>
          )}
        </div>

        {product.images?.urls && product.images.urls.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("additional_images")}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {product.images.urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`image-${i + 1}`}
                  className="h-32 w-full rounded-lg border object-contain bg-muted/30"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("basic_information")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("slug")}</p>
            <p className="font-medium">{product.slug || "-"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{t("brand")}</p>
            <p className="font-medium">{product.brand?.title || "-"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{t("main_category")}</p>
            <p className="font-medium">{product.main_category?.title || "-"}</p>
          </div>

          {product.categories && product.categories.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">{t("categories")}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {product.categories.map((cat) => (
                  <Badge key={cat.id} variant="secondary">
                    {cat.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">{t("status")}</p>
            <Badge variant={product.is_active ? "default" : "secondary"}>
              {product.is_active ? t("active") : t("inactive")}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{t("is_product_set")}</p>
            <Badge variant={product.is_set ? "default" : "secondary"}>
              {product.is_set ? t("yes") : t("no")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Price & Stock (only for non-set products) */}
      {!product.is_set && (
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("price_and_stock")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("price")}</p>
              <p className="font-medium">
                {product.price != null ? product.price : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("stock")}</p>
              <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                {product.stock}
              </Badge>
            </div>

            {product.has_discount && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">{t("discount")}</p>
                  <p className="font-medium">{product.discount ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("discount_type")}</p>
                  <p className="font-medium">{product.discount_type || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("discount_start_date")}</p>
                  <p className="font-medium">{product.discount_start_at || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("discount_end_date")}</p>
                  <p className="font-medium">{product.discount_end_at || "-"}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Set Products */}
      {product.is_set && defaultVariant?.sets && defaultVariant.sets.length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("product_sets")}</h2>
          <div className="space-y-3">
            {defaultVariant.sets.map((setItem) => (
              <div
                key={setItem.id}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                {setItem.product.main_image && (
                  <img
                    src={setItem.product.main_image}
                    alt={setItem.product.title}
                    className="h-14 w-14 rounded object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{setItem.product.title}</p>
                  <p className="text-sm text-muted-foreground">{setItem.slug}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-muted-foreground">{t("quantity")}</p>
                  <p className="font-semibold">{setItem.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Translations */}
      {product.translations && product.translations.length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("translations")}</h2>
          <Tabs defaultValue="0">
            <TabsList>
              {product.translations.map((tr, index) => {
                const lang = langs.find((l: any) => l.id === tr.language_id);
                return (
                  <TabsTrigger key={index} value={index.toString()}>
                    {lang?.key || tr.language_id}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {product.translations.map((tr, index) => (
              <TabsContent key={index} value={index.toString()} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("title")}</p>
                    <p className="font-medium">{tr.title || "-"}</p>
                  </div>
                  {tr.description_short && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("short_description")}</p>
                      <p className="text-sm whitespace-pre-wrap">{tr.description_short}</p>
                    </div>
                  )}
                  {tr.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("description")}</p>
                      <p className="text-sm whitespace-pre-wrap">{tr.description}</p>
                    </div>
                  )}
                  {tr.delivery && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("delivery")}</p>
                      <p className="text-sm whitespace-pre-wrap">{tr.delivery}</p>
                    </div>
                  )}
                  {tr.note && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("note")}</p>
                      <p className="text-sm whitespace-pre-wrap">{tr.note}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
