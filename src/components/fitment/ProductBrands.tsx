import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/utils/translationLoader";
import type { ProductBrand } from "@/lib/queries/products";

interface ProductBrandsProps {
  brands?: ProductBrand[] | null;
  isUniversal?: boolean;
  /** Renders as plain text instead of badges. */
  inline?: boolean;
  className?: string;
}

/**
 * A product's car brands now come from its variants' fitment rules, so there can
 * be several — or none at all when the product fits every car. An empty list is
 * spelled out rather than left blank, which would read as missing data.
 */
export function ProductBrands({
  brands,
  isUniversal,
  inline = false,
  className,
}: ProductBrandsProps) {
  const { t } = useTranslation();

  if (isUniversal) {
    const label = t("all_brands") || "Bütün markalar";

    return inline ? (
      <span className={className}>{label}</span>
    ) : (
      <Badge variant="secondary" className={className}>
        {label}
      </Badge>
    );
  }

  if (!brands?.length) {
    return <span className={className}>-</span>;
  }

  if (inline) {
    return (
      <span className={className}>{brands.map((b) => b.title).join(", ")}</span>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
      {brands.map((brand) => (
        <Badge key={brand.id} variant="outline">
          {brand.title}
        </Badge>
      ))}
    </div>
  );
}
