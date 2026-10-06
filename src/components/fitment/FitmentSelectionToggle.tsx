import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Fitment } from "./FitmentEditor";

export interface FitmentSelection {
  brand: { id: number; title: string } | null;
  brand_model: { id: number; title: string } | null;
}

export function fitmentSelectionLabel(
  selection?: FitmentSelection | null,
): string {
  if (!selection?.brand?.title) return "";
  return selection.brand_model?.title
    ? `${selection.brand.title} ${selection.brand_model.title}`
    : selection.brand.title;
}

export function FitmentSelectionBadge({
  selection,
}: {
  selection?: FitmentSelection | null;
}) {
  const label = fitmentSelectionLabel(selection);
  if (!label) return null;

  return (
    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      🚗 {label} üçün
    </span>
  );
}

/** Universal, or a brand row without a model, means the customer sees more than one car. */
export function isSingleCarFitment(
  fitments: Fitment[],
  isUniversal: boolean,
): boolean {
  if (isUniversal) return false;
  if (fitments.length !== 1) return false;
  const [fitment] = fitments;
  return Boolean(fitment?.brand_id && fitment?.brand_model_id);
}

export function appendRequiresFitmentSelection(
  formData: FormData,
  value: boolean,
) {
  formData.append("requires_fitment_selection", value ? "1" : "0");
}

export function FitmentSelectionToggle({
  checked,
  onCheckedChange,
  fitments,
  isUniversal,
  disabled,
  t,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  fitments: Fitment[];
  isUniversal: boolean;
  disabled?: boolean;
  t: (key: string, fallback?: string) => string;
}) {
  const singleCar = checked && isSingleCarFitment(fitments, isUniversal);

  return (
    <div className="space-y-2 rounded-md border border-dashed p-3">
      <div className="flex items-start gap-2">
        <Checkbox
          id="requires_fitment_selection"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          disabled={disabled}
        />
        <div className="space-y-1">
          <Label htmlFor="requires_fitment_selection" className="cursor-pointer">
            {t(
              "requires_fitment_selection",
              "Müştəri sifariş zamanı maşını seçsin (marka + model)",
            )}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "requires_fitment_selection_help",
              "Hər maşın üçün ayrıca fiziki hissə satılır, qiymət və stok ortaqdır.",
            )}
          </p>
        </div>
      </div>
      {singleCar && (
        <p className="text-xs text-amber-700">
          {t(
            "requires_fitment_selection_single",
            "Müştəri yalnız bu bir maşını görəcək.",
          )}
        </p>
      )}
    </div>
  );
}
