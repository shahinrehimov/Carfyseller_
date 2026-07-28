import { useTranslation } from "@/lib/utils/translationLoader";

/** Display shape returned by the API for a saved fitment rule. */
export interface DisplayFitment {
  brand: { id: number; title: string } | null;
  brand_model: { id: number; title: string } | null;
  year_from: number | null;
  year_to: number | null;
}

/**
 * A fitment reads as "fits this car", where a missing value means "all": no
 * brand fits every car, a brand without a model fits all of its models, and an
 * open year bound is unrestricted on that side.
 */
export function formatFitment(
  fitment: DisplayFitment,
  t: (key: string) => string,
): string {
  const car = fitment.brand
    ? [
        fitment.brand.title,
        fitment.brand_model?.title ?? (t("all_models") || "bütün modellər"),
      ]
        .filter(Boolean)
        .join(" ")
    : t("all_brands") || "bütün markalar";

  const { year_from: from, year_to: to } = fitment;

  if (from === null && to === null) return car;
  if (from !== null && to !== null)
    return from === to ? `${car} (${from})` : `${car} (${from}–${to})`;
  if (from !== null) return `${car} (${from}+)`;

  return `${car} (–${to})`;
}

interface FitmentSummaryProps {
  fitments?: DisplayFitment[] | null;
  isUniversal?: boolean;
  className?: string;
}

export function FitmentSummary({
  fitments,
  isUniversal,
  className,
}: FitmentSummaryProps) {
  const { t } = useTranslation();

  if (!fitments?.length) return null;

  // Universal listings show up in every brand and model search, so they are
  // called out rather than left to read as an ordinary rule.
  if (isUniversal) {
    return (
      <span className={className}>
        {t("universal_product") || "Universal — bütün avtomobillər"}
      </span>
    );
  }

  return (
    <span className={className}>
      {fitments.map((f) => formatFitment(f, t)).join(", ")}
    </span>
  );
}
