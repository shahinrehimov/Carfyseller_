import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/products/edit/$productId/")({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("edit_product")}</h1>
      </div>

      <div className="rounded-lg border p-6">
        <p>Edit Product #{productId} - Coming Soon</p>
      </div>
    </div>
  );
}
