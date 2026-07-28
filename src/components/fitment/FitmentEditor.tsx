import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { useTranslation } from "@/lib/utils/translationLoader";

export interface Fitment {
  brand_id: number | null;
  brand_model_id: number | null;
  year_from: number | null;
  year_to: number | null;
}

interface BrandOption {
  id: number;
  title?: string;
  slug?: string;
}

/**
 * One row of the editor: a brand, the models picked under it, and the year span
 * they share. Sellers think in these terms; the API wants one row per model, so
 * a group fans out on submit.
 *
 * Adding a second group for the same brand is how per-model year spans and
 * non-contiguous years get expressed — no separate "advanced" mode needed.
 */
interface BrandGroup {
  key: string;
  brandId: number | null;
  modelIds: number[];
  allModels: boolean;
  yearFrom: string;
  yearTo: string;
}

let groupKeySeed = 0;
const nextKey = () => `fitment-${++groupKeySeed}`;

const emptyGroup = (): BrandGroup => ({
  key: nextKey(),
  brandId: null,
  modelIds: [],
  allModels: false,
  yearFrom: "",
  yearTo: "",
});

const toYear = (value: string): number | null => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

/** Fan the seller-facing groups out into the one-row-per-model API shape. */
export function buildFitments(
  groups: BrandGroup[],
  isUniversal: boolean,
): Fitment[] {
  if (isUniversal) {
    return [
      { brand_id: null, brand_model_id: null, year_from: null, year_to: null },
    ];
  }

  return groups.flatMap((group): Fitment[] => {
    if (group.brandId === null) return [];

    const years = {
      year_from: toYear(group.yearFrom),
      year_to: toYear(group.yearTo),
    };

    if (group.allModels || group.modelIds.length === 0) {
      return [{ brand_id: group.brandId, brand_model_id: null, ...years }];
    }

    return group.modelIds.map((modelId) => ({
      brand_id: group.brandId,
      brand_model_id: modelId,
      ...years,
    }));
  });
}

/**
 * Normalise either shape the API hands back into the editable one.
 *
 * A pending revision stores raw ids ({ brand_id, brand_model_id }), while a
 * saved variant is serialised for display ({ brand: {...}, brand_model: {...} }).
 */
export function toEditableFitments(rows: any[] | null | undefined): Fitment[] {
  return (rows ?? []).map((row) => ({
    brand_id: row.brand_id ?? row.brand?.id ?? null,
    brand_model_id: row.brand_model_id ?? row.brand_model?.id ?? null,
    year_from: row.year_from ?? null,
    year_to: row.year_to ?? null,
  }));
}

/**
 * Serialise fitments into the multipart body the API expects. Universal listings
 * go over as the is_universal shorthand rather than a hand-built null row.
 */
export function appendFitments(
  formData: FormData,
  fitments: Fitment[],
  isUniversal: boolean,
): void {
  if (isUniversal) {
    formData.append("is_universal", "1");
    return;
  }

  fitments.forEach((fitment, index) => {
    formData.append(`fitments[${index}][brand_id]`, String(fitment.brand_id));

    if (fitment.brand_model_id !== null) {
      formData.append(
        `fitments[${index}][brand_model_id]`,
        String(fitment.brand_model_id),
      );
    }
    if (fitment.year_from !== null) {
      formData.append(`fitments[${index}][year_from]`, String(fitment.year_from));
    }
    if (fitment.year_to !== null) {
      formData.append(`fitments[${index}][year_to]`, String(fitment.year_to));
    }
  });
}

/**
 * Client-side guard mirroring the server rule: a listing needs at least one
 * fitment, and every row needs its brand.
 */
export function validateFitments(
  fitments: Fitment[],
  isUniversal: boolean,
  t: (key: string) => string,
): string | null {
  if (isUniversal) return null;

  if (!fitments.length) {
    return t("fitment_required") || "Ən azı bir uyğunluq əlavə edin";
  }

  if (fitments.some((f) => f.brand_id === null)) {
    return t("fitment_brand_required") || "Hər uyğunluq üçün marka seçin";
  }

  const reversed = fitments.some(
    (f) => f.year_from !== null && f.year_to !== null && f.year_from > f.year_to,
  );

  if (reversed) {
    return t("fitment_year_order") || "İl aralığı düzgün deyil";
  }

  return null;
}

/** Rebuild the grouped view from stored rows, for the edit form. */
export function groupFitments(fitments: Fitment[]): {
  groups: BrandGroup[];
  isUniversal: boolean;
} {
  if (!fitments?.length) {
    return { groups: [emptyGroup()], isUniversal: false };
  }

  if (fitments.some((f) => f.brand_id === null)) {
    return { groups: [emptyGroup()], isUniversal: true };
  }

  const byBrandAndYears = new Map<string, BrandGroup>();

  for (const fitment of fitments) {
    const yearFrom = fitment.year_from?.toString() ?? "";
    const yearTo = fitment.year_to?.toString() ?? "";
    const signature = `${fitment.brand_id}|${yearFrom}|${yearTo}`;

    let group = byBrandAndYears.get(signature);

    if (!group) {
      group = {
        key: nextKey(),
        brandId: fitment.brand_id,
        modelIds: [],
        allModels: false,
        yearFrom,
        yearTo,
      };
      byBrandAndYears.set(signature, group);
    }

    if (fitment.brand_model_id === null) {
      group.allModels = true;
    } else {
      group.modelIds.push(fitment.brand_model_id);
    }
  }

  return { groups: [...byBrandAndYears.values()], isUniversal: false };
}

interface FitmentEditorProps {
  brands: BrandOption[];
  value: Fitment[];
  onChange: (fitments: Fitment[], isUniversal: boolean) => void;
  disabled?: boolean;
  error?: string;
}

export function FitmentEditor({
  brands,
  value,
  onChange,
  disabled,
  error,
}: FitmentEditorProps) {
  const { t } = useTranslation();

  const [groups, setGroups] = useState<BrandGroup[]>([emptyGroup()]);
  const [isUniversal, setIsUniversal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Models are per-brand, so each group keeps its own list.
  const [modelsByBrand, setModelsByBrand] = useState<
    Record<number, Array<{ id: number; title: string }>>
  >({});

  // Hydrate once from the incoming value; afterwards this component owns the
  // state, otherwise every keystroke would be overwritten by the parent.
  useEffect(() => {
    if (hydrated || !value?.length) return;
    const restored = groupFitments(value);
    setGroups(restored.groups);
    setIsUniversal(restored.isUniversal);
    setHydrated(true);
  }, [value, hydrated]);

  const brandIds = groups
    .map((group) => group.brandId)
    .filter((id): id is number => id !== null);

  useEffect(() => {
    const missing = brandIds.filter((id) => !(id in modelsByBrand));
    if (!missing.length) return;

    let cancelled = false;

    Promise.all(
      missing.map((id) =>
        controlPrivateApi
          .get(`/brands/${id}/models/list`)
          .then((res) => [id, res.data.data ?? []] as const)
          .catch(() => [id, []] as const),
      ),
    ).then((entries) => {
      if (cancelled) return;
      setModelsByBrand((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });

    return () => {
      cancelled = true;
    };
  }, [brandIds.join(","), modelsByBrand]);

  const emit = (nextGroups: BrandGroup[], nextUniversal: boolean) => {
    setGroups(nextGroups);
    setIsUniversal(nextUniversal);
    onChange(buildFitments(nextGroups, nextUniversal), nextUniversal);
  };

  const patchGroup = (key: string, patch: Partial<BrandGroup>) =>
    emit(
      groups.map((group) =>
        group.key === key ? { ...group, ...patch } : group,
      ),
      isUniversal,
    );

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_universal"
          checked={isUniversal}
          onCheckedChange={(checked) => emit(groups, checked === true)}
          disabled={disabled}
        />
        <Label htmlFor="is_universal" className="cursor-pointer font-normal">
          {t("universal_product_hint") ||
            "Bu məhsul bütün avtomobillərə uyğundur"}
        </Label>
      </div>

      {isUniversal ? (
        <p className="text-muted-foreground text-sm">
          {t("universal_product_note") ||
            "Məhsul bütün marka və modellərin axtarışında görünəcək."}
        </p>
      ) : (
        <>
          {groups.map((group) => {
            const models = group.brandId ? (modelsByBrand[group.brandId] ?? []) : [];
            const selected = models.filter((m) => group.modelIds.includes(m.id));

            return (
              <div key={group.key} className="space-y-3 rounded-md border p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Label>{t("brand")} *</Label>
                    <Select
                      value={group.brandId?.toString() ?? ""}
                      onValueChange={(v) =>
                        patchGroup(group.key, {
                          brandId: parseInt(v, 10),
                          modelIds: [],
                        })
                      }
                      placeholder={t("select_brand")}
                      options={brands.map((brand) => ({
                        value: brand.id.toString(),
                        label: brand.title || brand.slug || "",
                      }))}
                      disabled={disabled}
                    />
                  </div>
                  {groups.length > 1 && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive mt-8 transition-colors"
                      onClick={() =>
                        emit(
                          groups.filter((g) => g.key !== group.key),
                          isUniversal,
                        )
                      }
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("models") || "Modellər"}</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${group.key}-all-models`}
                        checked={group.allModels}
                        onCheckedChange={(checked) =>
                          patchGroup(group.key, {
                            allModels: checked === true,
                            modelIds: checked === true ? [] : group.modelIds,
                          })
                        }
                        disabled={disabled || !group.brandId}
                      />
                      <Label
                        htmlFor={`${group.key}-all-models`}
                        className="cursor-pointer text-xs font-normal"
                      >
                        {t("all_models") || "Bütün modellər"}
                      </Label>
                    </div>
                  </div>

                  {!group.allModels && (
                    <>
                      <Select
                        value=""
                        onValueChange={(v) => {
                          const id = parseInt(v, 10);
                          if (group.modelIds.includes(id)) return;
                          patchGroup(group.key, {
                            modelIds: [...group.modelIds, id],
                          });
                        }}
                        placeholder={t("select_brand_model")}
                        options={models
                          .filter((m) => !group.modelIds.includes(m.id))
                          .map((m) => ({
                            value: m.id.toString(),
                            label: m.title,
                          }))}
                        disabled={disabled || !group.brandId}
                      />
                      {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selected.map((model) => (
                            <span
                              key={model.id}
                              className="bg-muted inline-flex items-center gap-1 rounded px-2 py-1 text-xs"
                            >
                              {model.title}
                              <button
                                type="button"
                                onClick={() =>
                                  patchGroup(group.key, {
                                    modelIds: group.modelIds.filter(
                                      (id) => id !== model.id,
                                    ),
                                  })
                                }
                                className="text-muted-foreground hover:text-destructive"
                                disabled={disabled}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("years") || "İllər"}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1900}
                      max={currentYear + 1}
                      placeholder={t("year_from") || "İl (dən)"}
                      value={group.yearFrom}
                      onChange={(e) =>
                        patchGroup(group.key, { yearFrom: e.target.value })
                      }
                      disabled={disabled}
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="number"
                      min={1900}
                      max={currentYear + 1}
                      placeholder={t("year_to") || "İl (a qədər)"}
                      value={group.yearTo}
                      onChange={(e) =>
                        patchGroup(group.key, { yearTo: e.target.value })
                      }
                      disabled={disabled}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t("year_range_hint") ||
                      "Boş buraxsanız il məhdudiyyəti tətbiq olunmur."}
                  </p>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => emit([...groups, emptyGroup()], isUniversal)}
            disabled={disabled}
          >
            + {t("add_fitment") || "Uyğunluq əlavə et"}
          </Button>

          <p className="text-muted-foreground text-xs">
            {t("add_fitment_hint") ||
              "Fərqli marka, yaxud eyni markanın başqa il aralığı üçün ayrıca uyğunluq əlavə edin."}
          </p>
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
