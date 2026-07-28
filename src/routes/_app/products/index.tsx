import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useProducts, useDeleteProduct } from "@/lib/queries/products";
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
import { Loader2, Search, Pencil, Trash2, Eye, Plus, Layers } from "lucide-react";
import Modal from "@/components/ui/modal";
import DeleteModal from "@/components/ui/delete-modal";
import { ProductBrands } from "@/components/fitment/ProductBrands";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useProducts({ page, search });
  const deleteProductMutation = useDeleteProduct();

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleDeleteClick = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedProduct) return;

    deleteProductMutation.mutate(selectedProduct.id, {
      onSuccess: () => {
        toast.success(t("product_deleted_successfully"));
        setIsDeleteModalOpen(false);
        setSelectedProduct(null);
        refetch();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || t("error_deleting_product"),
        );
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("products")}</h1>
        <Link to="/products/add">
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
            onChange={(e) => setSearch(e.target.value)}
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
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("brand")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("is_product_set")}</TableHead>
              <TableHead>{t("variants")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                  <TableCell>
                    {product.main_image ? (
                      <img
                        src={product.main_image}
                        alt={product.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {product.title}
                  </TableCell>
                  <TableCell>
                    <ProductBrands
                      brands={product.brands}
                      isUniversal={product.is_universal}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.main_category?.title && (
                        <Badge variant="outline">
                          {product.main_category.title}
                        </Badge>
                      )}
                      {product.categories
                        ?.filter((cat) => cat.id !== product.main_category?.id)
                        .map((cat) => (
                          <Badge key={cat.id} variant="secondary">
                            {cat.title}
                          </Badge>
                        ))}
                      {!product.main_category && (!product.categories || product.categories.length === 0) && "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={product.is_set ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}>
                      {product.is_set ? t("yes") : t("no")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {product.variants_count ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                    >
                      {product.is_active ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link to="/products/$productId" params={{ productId: String(product.id) }}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {product.is_creator && (
                        <Link to="/products/edit/$productId" params={{ productId: String(product.id) }}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Link to="/products/variants/$productId" params={{ productId: String(product.id) }}>
                        <Button variant="ghost" size="icon" title={t("variants")}>
                          <Layers className="h-4 w-4" />
                        </Button>
                      </Link>
                      {product.is_creator && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
      {data && data.meta.total > 0 && (
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
            {t("page")} {data.meta.current_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data || data.data.length < data.meta.per_page}
          >
            {t("next")}
          </Button>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("delete_product")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setIsDeleteModalOpen(false)}
          handleDelete={handleDelete}
          pending={deleteProductMutation.isPending}
        />
      </Modal>
    </div>
  );
}
