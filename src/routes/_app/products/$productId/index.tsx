import { createFileRoute, Link } from "@tanstack/react-router";
import { useProduct } from "@/lib/queries/products";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/products/$productId/")({
  component: ProductShowPage,
});

function ProductShowPage() {
  const { productId } = Route.useParams();
  const { t } = useTranslation();
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
        <Link to={`/products/edit/${productId}`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">{t("details")}</TabsTrigger>
          <TabsTrigger value="variants">{t("variants")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="rounded-lg border p-6 space-y-4">
            {product.main_image && (
              <div className="mb-4">
                <img
                  src={product.main_image}
                  alt={product.title}
                  className="h-48 w-full rounded object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("title")}</p>
                <p className="font-medium">{product.title}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("slug")}</p>
                <p className="font-medium">{product.slug}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("sku")}</p>
                <p className="font-medium">{product.sku}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("brand")}</p>
                <p className="font-medium">{product.brand_title || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("category")}</p>
                <p className="font-medium">{product.category_title || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("stock")}</p>
                <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                  {product.stock}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("price")}</p>
                <p className="font-medium">${product.price}</p>
              </div>

              {product.discount_price && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("discount_price")}</p>
                  <p className="font-medium">${product.discount_price}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">{t("status")}</p>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? t("active") : t("inactive")}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t("featured")}</p>
                <Badge variant={product.is_featured ? "default" : "secondary"}>
                  {product.is_featured ? t("yes") : t("no")}
                </Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variants">
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              {t("variants_coming_soon")}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
