import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useTranslation } from "@/lib/utils/translationLoader";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Loader2, Search, X, Link2, Plus } from "lucide-react";
import { useTranslationStore } from "@/store/translations";
import { FileInput } from "@/components/ui/file-input";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Badge } from "@/components/ui/badge";
import type { CatalogSearchItem } from "@/lib/queries/products";
import { searchCatalog } from "@/lib/queries/products";

export const Route = createFileRoute(
  "/_app/products/variants/$productId/add/"
)({
  component: AddProductVariantPage,
});

type Step = "search" | "add-new" | "attach";

function AddProductVariantPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId } = useParams({ from: "/_app/products/variants/$productId/add/" });
  const langs = useTranslationStore((state) => state.langs);

  // Step management — start directly on "add-new"; token fetched silently on mount
  const [step, setStep] = useState<Step>("add-new");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchToken, setSearchToken] = useState<string | null>(null);
  const [catalogResults, setCatalogResults] = useState<CatalogSearchItem[]>([]);
  const [selectedVariantForAttach, setSelectedVariantForAttach] = useState<CatalogSearchItem | null>(null);

  type SelectedModel = { id: number; title: string; brand_id: number; brand_title: string };

  // Shared state
  const [discountTypes, setDiscountTypes] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [brandModels, setBrandModels] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [brandModelsLoading, setBrandModelsLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);
  const [modelSelectValue, setModelSelectValue] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  // Image state for add-new
  const [mainImage, setMainImage] = useState<any>({});
  const [hoverImage, setHoverImage] = useState<any>({});
  const [images, setImages] = useState<any[]>([{}]);

  // Image state for attach
  const [attachImages, setAttachImages] = useState<any[]>([{}]);

  // ─── Validation schemas ───────────────────────────────────────────────────

  const addNewSchema = Yup.object().shape({
    year: Yup.number()
      .transform((value, originalValue) => (originalValue === "" ? undefined : value))
      .required(t("required_field")),
    oem_code: Yup.string().notRequired(),
    city_id: Yup.number().required(t("required_field")),
    stock: Yup.number().notRequired(),
    price: Yup.string().notRequired(),
    has_discount: Yup.boolean().notRequired(),
    discount: Yup.string().when("has_discount", {
      is: true,
      then: (schema) => schema.required(t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    discount_type: Yup.string().when("has_discount", {
      is: true,
      then: (schema) => schema.required(t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    discount_start_at: Yup.date().when("has_discount", {
      is: true,
      then: (schema) => schema.required(t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    discount_end_at: Yup.date().when("has_discount", {
      is: true,
      then: (schema) => schema.required(t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    brand_id: Yup.number().notRequired(),
    options: Yup.array()
      .of(
        Yup.object({
          option_id: Yup.number().required(t("required_field")),
          value: Yup.mixed().notRequired(),
          translations: Yup.array()
            .of(
              Yup.object({
                language_id: Yup.number().required(t("required_field")),
                translatable_value: Yup.string().notRequired(),
              })
            )
            .notRequired(),
        })
      )
      .notRequired(),
  });

  const attachSchema = Yup.object().shape({
    price: Yup.string().required(t("required_field")),
    stock: Yup.number().notRequired(),
    city_id: Yup.number().notRequired(),
    has_discount: Yup.boolean().notRequired(),
    discount: Yup.string().when("has_discount", {
      is: true,
      then: (schema) => schema.required(t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    discount_type: Yup.string().when("has_discount", {
      is: true,
      then: (schema) => schema.required(t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    discount_start_at: Yup.date().when("has_discount", {
      is: true,
      then: (schema) => schema.required(t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    discount_end_at: Yup.date().when("has_discount", {
      is: true,
      then: (schema) => schema.required(t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  // ─── Forms ───────────────────────────────────────────────────────────────

  const addNewForm = useForm({
    resolver: yupResolver(addNewSchema),
    defaultValues: {
      brand_id: undefined as number | undefined,
      year: "" as any,
      oem_code: "",
      city_id: undefined as number | undefined,
      stock: "" as any,
      price: "",
      has_discount: false,
      discount: "",
      discount_type: "",
      discount_start_at: undefined as Date | undefined,
      discount_end_at: undefined as Date | undefined,
      options: [] as any[],
    },
  });

  const attachForm = useForm({
    resolver: yupResolver(attachSchema),
    defaultValues: {
      price: "",
      stock: "" as any,
      city_id: undefined as number | undefined,
      has_discount: false,
      discount: "",
      discount_type: "",
      discount_start_at: undefined as Date | undefined,
      discount_end_at: undefined as Date | undefined,
    },
  });

  const hasDiscountAdd = addNewForm.watch("has_discount");
  const hasDiscountAttach = attachForm.watch("has_discount");
  const options = addNewForm.watch("options");
  const selectedBrandId = addNewForm.watch("brand_id");

  // ─── Load helper data ─────────────────────────────────────────────────────

  useEffect(() => {
    const fetchHelperData = async () => {
      setLoading(true);
      try {
        const [discountTypesRes, productOptionsRes, countriesRes, brandsRes] =
          await Promise.all([
            controlPrivateApi.get("/discount-types/list").catch(() => ({ data: { data: [] } })),
            controlPrivateApi.get("/product-options/list?with_items=yes").catch(() => ({ data: { data: [] } })),
            controlPrivateApi.get("/countries/list?with_cities=yes").catch(() => ({ data: { data: [] } })),
            controlPrivateApi.get("/brands/list").catch(() => ({ data: { data: [] } })),
          ]);

        setDiscountTypes(discountTypesRes.data.data || []);
        setProductOptions(productOptionsRes.data.data || []);
        setBrands(brandsRes.data.data || []);

        const allCities = (countriesRes.data.data || []).flatMap(
          (country: any) => country.cities || []
        );
        setCities(allCities);

        const requiredOptions = (productOptionsRes.data.data || []).filter(
          (option: any) => option.is_required
        );
        const initialOptions = requiredOptions.map((option: any) => ({
          option_id: option.id,
          option: option,
          value: option.is_translatable ? undefined : "",
          translations: option.is_translatable
            ? langs.map((lang: any) => ({
                language_id: lang.id,
                translatable_value: "",
              }))
            : undefined,
        }));
        addNewForm.setValue("options", initialOptions);
      } catch {
        toast.error(t("failed_to_load_data"));
      } finally {
        setLoading(false);
      }
    };

    fetchHelperData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langs]);

  // ─── Auto-fetch search token on mount ────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    searchCatalog({ product_id: Number(productId) })
      .then((result) => setSearchToken(result.search_token))
      .catch(() => {});
  }, [productId]);

  useEffect(() => {
    if (!selectedBrandId) {
      setBrandModels([]);
      setModelSelectValue("");
      return;
    }
    const fetchBrandModels = async () => {
      setBrandModelsLoading(true);
      try {
        const res = await controlPrivateApi.get(`/brands/${selectedBrandId}/models/list`);
        setBrandModels(res.data.data || []);
        setModelSelectValue("");
      } catch {
        setBrandModels([]);
      } finally {
        setBrandModelsLoading(false);
      }
    };
    fetchBrandModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrandId]);

  // ─── Catalog search ───────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setCatalogResults([]);
    setSearchToken(null);
    try {
      const result = await searchCatalog({ search: searchQuery, product_id: Number(productId) });
      setSearchToken(result.search_token);
      setCatalogResults(result.data || []);
    } catch {
      toast.error(t("error_loading_data"));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAttachClick = (item: CatalogSearchItem) => {
    if (item.already_attached) {
      toast.error(t("already_attached"));
      return;
    }
    setSelectedVariantForAttach(item);
    setStep("attach");
  };

  const handleAddNew = () => {
    if (!searchToken) {
      toast.error(t("search_required_before_add"));
      return;
    }
    setStep("add-new");
  };

  // ─── Image helpers ────────────────────────────────────────────────────────

  const handleMainImageChange = (newImage: any) => {
    setMainImage(newImage);
    addNewForm.setValue("main_image" as any, newImage);
  };

  const handleHoverImageChange = (newImage: any) => {
    setHoverImage(newImage);
    addNewForm.setValue("hover_image" as any, newImage);
  };

  const handleImageChange = (index: number, newImage: any) => {
    const newImages = [...images];
    newImages[index] = newImage;
    setImages(newImages);
  };

  const addImage = () => setImages([...images, {}]);
  const removeImage = (index: number) => {
    if (images.length > 1) setImages(images.filter((_, i) => i !== index));
  };

  const handleAttachImageChange = (index: number, newImage: any) => {
    const newImages = [...attachImages];
    newImages[index] = newImage;
    setAttachImages(newImages);
  };

  const addAttachImage = () => setAttachImages([...attachImages, {}]);
  const removeAttachImage = (index: number) => {
    if (attachImages.length > 1) setAttachImages(attachImages.filter((_, i) => i !== index));
  };

  // ─── Option helpers ───────────────────────────────────────────────────────

  const addOption = (productOption: any) => {
    const currentOptions = addNewForm.getValues("options") || [];
    const newOption = {
      option_id: productOption.id,
      option: productOption,
      value: productOption.is_translatable ? undefined : "",
      translations: productOption.is_translatable
        ? langs.map((lang: any) => ({
            language_id: lang.id,
            translatable_value: "",
          }))
        : undefined,
    };
    addNewForm.setValue("options", [...currentOptions, newOption]);
  };

  const removeOption = (index: number) => {
    const currentOptions = addNewForm.getValues("options") || [];
    const optionToRemove = currentOptions[index] as any;
    if (optionToRemove?.option?.is_required) {
      toast.error(t("cannot_remove_required_option"));
      return;
    }
    addNewForm.setValue(
      "options",
      currentOptions.filter((_, i) => i !== index)
    );
  };

  const getAvailableOptions = () => {
    const currentOptions = addNewForm.getValues("options") || [];
    const selectedOptionIds = currentOptions.map((opt: any) => opt.option_id);
    return productOptions.filter((option: any) => !selectedOptionIds.includes(option.id));
  };

  // ─── Submit: Add new variant ──────────────────────────────────────────────

  const onSubmitAddNew = async (data: any) => {
    if (!searchToken) {
      toast.error(t("search_required_before_add"));
      return;
    }
    if (pending) return;
    setPending(true);

    try {
      const formData = new FormData();

      const basicFields: any = {
        year: data.year,
        oem_code: data.oem_code || null,
        city_id: data.city_id,
        stock: data.stock,
        price: data.price,
        has_discount: data.has_discount,
      };

      if (data.has_discount) {
        basicFields.discount = data.discount || null;
        basicFields.discount_type = data.discount_type || null;
        basicFields.discount_start_at = data.discount_start_at
          ? new Date(data.discount_start_at).toISOString().split("T")[0]
          : null;
        basicFields.discount_end_at = data.discount_end_at
          ? new Date(data.discount_end_at).toISOString().split("T")[0]
          : null;
      }

      Object.keys(basicFields).forEach((key) => {
        if (basicFields[key] !== null && basicFields[key] !== undefined && basicFields[key] !== "") {
          const value =
            typeof basicFields[key] === "boolean"
              ? basicFields[key] ? "1" : "0"
              : basicFields[key];
          formData.append(key, value);
        }
      });

      selectedModels.forEach((m, index) => {
        formData.append(`brand_model_ids[${index}]`, String(m.id));
      });

      if (mainImage?.file) formData.append("main_image", mainImage.file);
      if (hoverImage?.file) formData.append("hover_image", hoverImage.file);

      images.forEach((image: any, index: number) => {
        if (image?.file) formData.append(`images[${index}]`, image.file);
      });

      if (data.options && data.options.length > 0) {
        data.options.forEach((option: any, index: number) => {
          if (option.option_id) {
            formData.append(`options[${index}][option_id]`, option.option_id);
            if (!option.option.is_translatable) {
              if (option.value !== null && option.value !== undefined && option.value !== "") {
                formData.append(`options[${index}][value]`, option.value);
              }
            } else if (option.translations && option.translations.length > 0) {
              option.translations.forEach((translation: any, transIndex: number) => {
                if (translation.language_id) {
                  formData.append(
                    `options[${index}][translations][${transIndex}][language_id]`,
                    translation.language_id
                  );
                }
                if (translation.translatable_value) {
                  formData.append(
                    `options[${index}][translations][${transIndex}][translatable_value]`,
                    translation.translatable_value
                  );
                }
              });
            }
          }
        });
      }

      const res = await controlPrivateApi.post(
        `/product-variants/add/${productId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Search-Token": searchToken,
          },
        }
      );
      toast.success(res.data.message || t("variant_added_successfully"));
      navigate({ to: `/products/variants/${productId}` });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("error_saving"));
    } finally {
      setPending(false);
    }
  };

  // ─── Submit: Attach to existing variant ───────────────────────────────────

  const onSubmitAttach = async (data: any) => {
    if (!searchToken || !selectedVariantForAttach) return;
    if (pending) return;
    setPending(true);

    try {
      const formData = new FormData();

      const basicFields: any = {
        price: data.price,
        stock: data.stock,
        city_id: data.city_id || null,
        has_discount: data.has_discount,
      };

      if (data.has_discount) {
        basicFields.discount = data.discount || null;
        basicFields.discount_type = data.discount_type || null;
        basicFields.discount_start_at = data.discount_start_at
          ? new Date(data.discount_start_at).toISOString().split("T")[0]
          : null;
        basicFields.discount_end_at = data.discount_end_at
          ? new Date(data.discount_end_at).toISOString().split("T")[0]
          : null;
      }

      Object.keys(basicFields).forEach((key) => {
        if (basicFields[key] !== null && basicFields[key] !== undefined && basicFields[key] !== "") {
          const value =
            typeof basicFields[key] === "boolean"
              ? basicFields[key] ? "1" : "0"
              : basicFields[key];
          formData.append(key, value);
        }
      });

      attachImages.forEach((image: any, index: number) => {
        if (image?.file) formData.append(`images[${index}]`, image.file);
      });

      const res = await controlPrivateApi.post(
        `/company-product-variants/attach/${selectedVariantForAttach.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Search-Token": searchToken,
          },
        }
      );
      toast.success(res.data.message || t("variant_attached_successfully"));
      navigate({ to: `/products/variants/${productId}` });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("error_saving"));
    } finally {
      setPending(false);
    }
  };

  // ─── Render: Step 1 — Catalog Search ─────────────────────────────────────

  if (step === "search") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/products/variants/$productId" params={{ productId }}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t("add_product_variant")}</h1>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("search_catalog")}</h2>
          <p className="text-sm text-muted-foreground">{t("search_catalog_description")}</p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search_by_title_or_oem")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()}>
              {searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {catalogResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("search_results")}</p>
              <div className="rounded-md border divide-y">
                {catalogResults.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title || item.slug}</span>
                        {item.already_attached && (
                          <Badge variant="secondary">{t("already_attached")}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {item.oem_code && <span>OEM: {item.oem_code}</span>}
                        {item.brand_models?.length > 0 && <span>{item.brand_models.map(m => m.title).join(", ")}</span>}
                        {item.year && <span>{item.year}</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={item.already_attached}
                      onClick={() => handleAttachClick(item)}
                    >
                      <Link2 className="mr-2 h-3 w-3" />
                      {t("attach")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchToken && (
            <div className="pt-2 border-t">
              <Button onClick={handleAddNew} variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {t("add_new_variant_not_found")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Step 2b — Attach form ───────────────────────────────────────

  if (step === "attach" && selectedVariantForAttach) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setStep("search")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t("attach_variant")}</h1>
        </div>

        <div className="rounded-lg border p-4 bg-muted/40 space-y-1">
          <p className="text-sm font-medium">{selectedVariantForAttach.title || selectedVariantForAttach.slug}</p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {selectedVariantForAttach.oem_code && (
              <span>OEM: {selectedVariantForAttach.oem_code}</span>
            )}
            {selectedVariantForAttach.brand_models?.length > 0 && (
              <span>{selectedVariantForAttach.brand_models.map(m => m.title).join(", ")}</span>
            )}
            {selectedVariantForAttach.year && <span>{selectedVariantForAttach.year}</span>}
          </div>
        </div>

        <form onSubmit={attachForm.handleSubmit(onSubmitAttach)} className="space-y-6">
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("listing_information")}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attach-price">{t("price")} *</Label>
                <Controller
                  name="price"
                  control={attachForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="attach-price"
                      type="number"
                      step="0.01"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  )}
                />
                {attachForm.formState.errors.price && (
                  <p className="text-sm text-destructive">{attachForm.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="attach-stock">{t("stock")}</Label>
                <Controller
                  name="stock"
                  control={attachForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id="attach-stock"
                      type="number"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attach-city">{t("city")}</Label>
                <Controller
                  name="city_id"
                  control={attachForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      placeholder={t("select_city")}
                      options={cities.map((city: any) => ({
                        value: city.id.toString(),
                        label: city.title,
                      }))}
                      disabled={loading}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("discount_settings")}</h2>

            <div className="flex items-center space-x-2">
              <Controller
                name="has_discount"
                control={attachForm.control}
                render={({ field }) => (
                  <Checkbox
                    id="attach-has_discount"
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="attach-has_discount">{t("has_discount")}</Label>
            </div>

            {hasDiscountAttach && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("discount")} *</Label>
                  <Controller
                    name="discount"
                    control={attachForm.control}
                    render={({ field }) => (
                      <Input {...field} type="number" step="0.01" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    )}
                  />
                  {attachForm.formState.errors.discount && (
                    <p className="text-sm text-destructive">{attachForm.formState.errors.discount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("discount_type")} *</Label>
                  <Controller
                    name="discount_type"
                    control={attachForm.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder={t("select")}
                        options={discountTypes.map((type: any) => ({
                          value: type.id.toString(),
                          label: type.title,
                        }))}
                        disabled={loading}
                      />
                    )}
                  />
                  {attachForm.formState.errors.discount_type && (
                    <p className="text-sm text-destructive">{attachForm.formState.errors.discount_type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("discount_start_date")} *</Label>
                  <Controller
                    name="discount_start_at"
                    control={attachForm.control}
                    render={({ field }) => (
                      <DatePickerInput value={field.value} onChange={field.onChange} placeholder={t("discount_start_date")} />
                    )}
                  />
                  {attachForm.formState.errors.discount_start_at && (
                    <p className="text-sm text-destructive">{attachForm.formState.errors.discount_start_at.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("discount_end_date")} *</Label>
                  <Controller
                    name="discount_end_at"
                    control={attachForm.control}
                    render={({ field }) => (
                      <DatePickerInput value={field.value} onChange={field.onChange} placeholder={t("discount_end_date")} />
                    )}
                  />
                  {attachForm.formState.errors.discount_end_at && (
                    <p className="text-sm text-destructive">{attachForm.formState.errors.discount_end_at.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("images")} ({t("optional")})</h2>
              <Button type="button" variant="outline" size="sm" onClick={addAttachImage}>
                {t("add_image")}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {attachImages.map((image, index) => (
                <div key={index} className="relative rounded-lg border p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{t("image")} {index + 1}</span>
                    {attachImages.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeAttachImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <FileInput
                    file={image}
                    setFile={(newImage: any) => handleAttachImageChange(index, newImage)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={pending || loading} size="lg">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("attach_variant")}
          </Button>
        </form>
      </div>
    );
  }

  // ─── Render: Step 2a — Add new variant form ───────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setStep("search")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("add_product_variant")}</h1>
      </div>

      <form onSubmit={addNewForm.handleSubmit(onSubmitAddNew)} className="space-y-6">
        {/* Images Section */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("images")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("main_image")} ({t("optional")})</Label>
              <FileInput file={mainImage} setFile={handleMainImageChange} />
            </div>

            <div className="space-y-2">
              <Label>{t("hover_image")} ({t("optional")})</Label>
              <FileInput file={hoverImage} setFile={handleHoverImageChange} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("additional_images")} ({t("optional")})</Label>
              <Button type="button" variant="outline" size="sm" onClick={addImage}>
                {t("add_image")}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative rounded-lg border p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{t("image")} {index + 1}</span>
                    {images.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <FileInput
                    file={image}
                    setFile={(newImage: any) => handleImageChange(index, newImage)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("basic_information")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand_id">{t("brand")}</Label>
              <Controller
                name="brand_id"
                control={addNewForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    placeholder={t("select_brand")}
                    options={brands.map((brand: any) => ({
                      value: brand.id.toString(),
                      label: brand.title || brand.slug,
                    }))}
                    disabled={loading}
                  />
                )}
              />
            </div>

            {/* Brand Model */}
            <div className="space-y-2">
              <Label>{t("brand_model")} *</Label>
              {selectedModels.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {selectedModels.map((model) => (
                    <div key={model.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted/30">
                      <span>
                        <span className="text-muted-foreground text-xs">{model.brand_title} · </span>
                        {model.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedModels((prev) => prev.filter((m) => m.id !== model.id))}
                        className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Select
                value={modelSelectValue}
                onValueChange={(value) => {
                  const model = brandModels.find((m: any) => m.id.toString() === value);
                  const brand = brands.find((b: any) => b.id === selectedBrandId);
                  if (!model || selectedModels.some((m) => m.id === model.id)) return;
                  setSelectedModels((prev) => [
                    ...prev,
                    { id: model.id, title: model.title, brand_id: selectedBrandId || 0, brand_title: brand?.title || "" },
                  ]);
                  setModelSelectValue("");
                }}
                placeholder={t("select_brand_model")}
                options={brandModels
                  .filter((m: any) => !selectedModels.some((sm) => sm.id === m.id))
                  .map((model: any) => ({ value: model.id.toString(), label: model.title }))}
                disabled={loading || brandModelsLoading || !selectedBrandId}
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">{t("year")} *</Label>
              <Controller
                name="year"
                control={addNewForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="year"
                    type="number"
                    placeholder={t("year")}
                    min={1900}
                    max={new Date().getFullYear()}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              />
              {addNewForm.formState.errors.year && (
                <p className="text-sm text-destructive">{addNewForm.formState.errors.year.message}</p>
              )}
            </div>

            {/* OEM Code */}
            <div className="space-y-2">
              <Label htmlFor="oem_code">{t("oem_code")}</Label>
              <Controller
                name="oem_code"
                control={addNewForm.control}
                render={({ field }) => (
                  <Input {...field} value={field.value ?? ""} id="oem_code" placeholder={t("oem_code")} />
                )}
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city_id">{t("city")} *</Label>
              <Controller
                name="city_id"
                control={addNewForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    placeholder={t("select_city")}
                    options={cities.map((city: any) => ({
                      value: city.id.toString(),
                      label: city.title,
                    }))}
                    disabled={loading}
                  />
                )}
              />
              {addNewForm.formState.errors.city_id && (
                <p className="text-sm text-destructive">{addNewForm.formState.errors.city_id.message}</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">{t("stock")}</Label>
              <Controller
                name="stock"
                control={addNewForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="stock"
                    type="number"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">{t("price")}</Label>
              <Controller
                name="price"
                control={addNewForm.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="price"
                    type="number"
                    step="0.01"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("discount_settings")}</h2>

          <div className="flex items-center space-x-2">
            <Controller
              name="has_discount"
              control={addNewForm.control}
              render={({ field }) => (
                <Checkbox
                  id="has_discount"
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="has_discount">{t("has_discount")}</Label>
          </div>

          {hasDiscountAdd && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">{t("discount")} *</Label>
                <Controller
                  name="discount"
                  control={addNewForm.control}
                  render={({ field }) => (
                    <Input {...field} id="discount" type="number" step="0.01" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  )}
                />
                {addNewForm.formState.errors.discount && (
                  <p className="text-sm text-destructive">{addNewForm.formState.errors.discount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_type">{t("discount_type")} *</Label>
                <Controller
                  name="discount_type"
                  control={addNewForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder={t("select")}
                      options={discountTypes.map((type: any) => ({
                        value: type.id.toString(),
                        label: type.title,
                      }))}
                      disabled={loading}
                    />
                  )}
                />
                {addNewForm.formState.errors.discount_type && (
                  <p className="text-sm text-destructive">{addNewForm.formState.errors.discount_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("discount_start_date")} *</Label>
                <Controller
                  name="discount_start_at"
                  control={addNewForm.control}
                  render={({ field }) => (
                    <DatePickerInput value={field.value} onChange={field.onChange} placeholder={t("discount_start_date")} />
                  )}
                />
                {addNewForm.formState.errors.discount_start_at && (
                  <p className="text-sm text-destructive">{addNewForm.formState.errors.discount_start_at.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("discount_end_date")} *</Label>
                <Controller
                  name="discount_end_at"
                  control={addNewForm.control}
                  render={({ field }) => (
                    <DatePickerInput value={field.value} onChange={field.onChange} placeholder={t("discount_end_date")} />
                  )}
                />
                {addNewForm.formState.errors.discount_end_at && (
                  <p className="text-sm text-destructive">{addNewForm.formState.errors.discount_end_at.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Options */}
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("product_options")}</h2>
            {getAvailableOptions().length > 0 && (
              <Select
                value=""
                onValueChange={(value) => {
                  const selectedOption = productOptions.find(
                    (opt: any) => opt.id === parseInt(value)
                  );
                  if (selectedOption) addOption(selectedOption);
                }}
                placeholder={t("add_option")}
                options={getAvailableOptions().map((option: any) => ({
                  value: option.id.toString(),
                  label: `${option.title}${option.is_required ? " *" : ""}`,
                }))}
              />
            )}
          </div>

          {options && options.length > 0 && (
            <div className="space-y-4">
              {(options as any[]).map((selectedOption: any, optionIndex: number) => {
                const productOption = selectedOption.option;
                return (
                  <div key={optionIndex} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {productOption?.title}
                        {productOption?.is_required && " *"}
                      </h3>
                      {!productOption?.is_required && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeOption(optionIndex)}
                        >
                          {t("remove")}
                        </Button>
                      )}
                    </div>

                    {!productOption?.is_translatable && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          {productOption?.has_items ? (
                            <Controller
                              name={`options.${optionIndex}.value` as any}
                              control={addNewForm.control}
                              render={({ field }) => (
                                <Select
                                  value={field.value?.toString() || ""}
                                  onValueChange={(v) => field.onChange(parseInt(v))}
                                  placeholder={productOption.title}
                                  options={(productOption.items || []).map((item: any) => ({
                                    value: item.id.toString(),
                                    label: item.title,
                                  }))}
                                />
                              )}
                            />
                          ) : (
                            <Controller
                              name={`options.${optionIndex}.value` as any}
                              control={addNewForm.control}
                              render={({ field }) => (
                                <Input
                                  {...field}
                                  value={(field.value as string) || ""}
                                  placeholder={productOption?.title}
                                />
                              )}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {productOption?.is_translatable && (
                      <div>
                        <p className="text-sm font-medium mb-2">{t("translations")}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {langs.map((lang: any, langIndex: number) => (
                            <div key={lang.id} className="space-y-2">
                              {productOption.has_items ? (
                                <Controller
                                  name={`options.${optionIndex}.translations.${langIndex}.translatable_value` as any}
                                  control={addNewForm.control}
                                  render={({ field }) => (
                                    <Select
                                      value={field.value?.toString() || ""}
                                      onValueChange={field.onChange}
                                      placeholder={`${productOption.title} (${lang.key})`}
                                      options={(productOption.items || []).map((item: any) => ({
                                        value: item.id.toString(),
                                        label: item.title,
                                      }))}
                                    />
                                  )}
                                />
                              ) : (
                                <Controller
                                  name={`options.${optionIndex}.translations.${langIndex}.translatable_value` as any}
                                  control={addNewForm.control}
                                  render={({ field }) => (
                                    <Input
                                      {...field}
                                      value={field.value || ""}
                                      placeholder={`${productOption.title} (${lang.key})`}
                                    />
                                  )}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button type="submit" disabled={pending || loading} size="lg">
          {(pending || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("add_product_variant")}
        </Button>
      </form>
    </div>
  );
}
