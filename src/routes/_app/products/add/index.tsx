import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Loader2, Upload, X, Search, Link2, Plus } from "lucide-react";
import { useTranslationStore } from "@/store/translations";
import { FileInput } from "@/components/ui/file-input";
import { MultiSelect } from "@/components/ui/multi-select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { searchCatalog } from "@/lib/queries/products";
import type { CatalogSearchItem } from "@/lib/queries/products";

export const Route = createFileRoute("/_app/products/add/")({
  component: AddProductPage,
});

type AddStep = "search" | "attach" | "form";

function AddProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langs = useTranslationStore((state) => state.langs);

  // Search step state
  const [step, setStep] = useState<AddStep>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchToken, setSearchToken] = useState<string | null>(null);
  const [catalogResults, setCatalogResults] = useState<CatalogSearchItem[]>([]);
  const [selectedVariantForAttach, setSelectedVariantForAttach] = useState<CatalogSearchItem | null>(null);

  // Attach step state
  const [attachImages, setAttachImages] = useState<any[]>([{}]);
  const [attachPending, setAttachPending] = useState(false);

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

  const hasDiscountAttach = attachForm.watch("has_discount");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setCatalogResults([]);
    setSearchToken(null);
    try {
      const result = await searchCatalog({ search: searchQuery });
      setSearchToken(result.search_token);
      setCatalogResults(result.data || []);
    } catch {
      toast.error(t("error_loading_data"));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAttachClick = (item: CatalogSearchItem) => {
    setSelectedVariantForAttach(item);
    attachForm.reset({
      price: "",
      stock: "" as any,
      city_id: undefined,
      has_discount: false,
      discount: "",
      discount_type: "",
      discount_start_at: undefined,
      discount_end_at: undefined,
    });
    setAttachImages([{}]);
    setStep("attach");
  };

  const onSubmitAttach = async (data: any) => {
    if (!searchToken || !selectedVariantForAttach) return;
    if (attachPending) return;
    setAttachPending(true);

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
      navigate({ to: "/products" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("error_saving"));
    } finally {
      setAttachPending(false);
    }
  };

  const handleProceedToForm = () => {
    if (!searchToken) {
      toast.error(t("search_required_before_add"));
      return;
    }
    setStep("form");
  };

  // Validation schema
  const validationSchema = Yup.object().shape({
    slug: Yup.string().notRequired(),
    main_image: Yup.object()
      .test("has-file", t("required_field"), function (value: any) {
        return value && value.file && value.file instanceof File;
      })
      .required(t("required_field")),
    hover_image: Yup.object()
      .test("optional-file", t("invalid_file"), function (value: any) {
        if (!value || Object.keys(value).length === 0) return true;
        return value.file && value.file instanceof File;
      })
      .notRequired(),
    images: Yup.array()
      .of(
        Yup.object().test(
          "has-file",
          t("required_field"),
          function (value: any) {
            return value && value.file && value.file instanceof File;
          },
        ),
      )
      .test(
        "at-least-one",
        t("at_least_one_image_required"),
        function (value: any) {
          if (!value || !Array.isArray(value)) return false;
          return value.some(
            (image: any) => image && image.file && image.file instanceof File,
          );
        },
      )
      .required(t("required_field")),
    translations: Yup.array()
      .of(
        Yup.object({
          language_id: Yup.number().required(),
          title: Yup.string().notRequired(),
          description_short: Yup.string().notRequired(),
          description: Yup.string().notRequired(),
          delivery: Yup.string().notRequired(),
          note: Yup.string().notRequired(),
        }),
      )
      .required(),
    is_set: Yup.boolean().notRequired(),
    sets: Yup.array().when("is_set", {
      is: true,
      then: (schema) =>
        schema
          .of(
            Yup.object({
              product_variant_id: Yup.number().required(t("required_field")),
              quantity: Yup.number().required(t("required_field")),
            }),
          )
          .min(1, t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    price: Yup.number().notRequired(),
    brand_id: Yup.number().required(t("required_field")),
    categories: Yup.array().of(Yup.number()).required(t("required_field")),
    main_category_id: Yup.number().required(t("required_field")),
    stock: Yup.number().notRequired(),
    has_discount: Yup.boolean().notRequired(),
    discount: Yup.string().when("has_discount", {
      is: true,
      then: (schema: Yup.StringSchema) => schema.required(t("required_field")),
      otherwise: (schema: Yup.StringSchema) => schema.notRequired(),
    }),
    discount_type: Yup.string().when("has_discount", {
      is: true,
      then: (schema: Yup.StringSchema) => schema.required(t("required_field")),
      otherwise: (schema: Yup.StringSchema) => schema.notRequired(),
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
    oem_code: Yup.string().max(100).notRequired(),
    year: Yup.number()
      .transform((value, originalValue) =>
        originalValue === "" ? undefined : value,
      )
      .notRequired(),
    city_id: Yup.number().notRequired(),
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
              }),
            )
            .notRequired(),
        }),
      )
      .notRequired(),
  });

  type SelectedModel = { id: number; title: string; brand_id: number; brand_title: string };

  // State
  const [brands, setBrands] = useState<any[]>([]);
  const [brandModels, setBrandModels] = useState<any[]>([]);
  const [brandModelsLoading, setBrandModelsLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);
  const [modelSelectValue, setModelSelectValue] = useState<string>("");
  const [flattenedCategories, setFlattenedCategories] = useState<any[]>([]);
  const [discountTypes, setDiscountTypes] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("0");

  // Image states
  const [mainImage, setMainImage] = useState<any>({});
  const [hoverImage, setHoverImage] = useState<any>({});
  const [images, setImages] = useState<any[]>([{}]);

  // Form hook
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      slug: "",
      main_image: {},
      hover_image: {},
      images: [{}],
      translations: langs.map((lang: any) => ({
        language_id: lang.id,
        title: "",
        description_short: "",
        description: "",
        delivery: "",
        note: "",
      })),
      is_set: false,
      sets: [],
      price: 0,
      brand_id: undefined,
      oem_code: "",
      categories: [],
      main_category_id: undefined,
      stock: 0,
      has_discount: false,
      discount: "",
      discount_type: "",
      discount_start_at: undefined,
      discount_end_at: undefined,
      year: "" as any,
      city_id: undefined,
      options: [],
    },
  });

  // Watch values
  const isSet = watch("is_set");
  const hasDiscount = watch("has_discount");
  const selectedCategories = watch("categories");
  const selectedBrandId = watch("brand_id");
  const options = watch("options");
  const sets = watch("sets");

  // Auto-add a set when is_set is checked and no sets exist
  useEffect(() => {
    if (isSet && (!sets || sets.length === 0)) {
      setValue("sets", [{ product_variant_id: "", quantity: "" }]);
    }
  }, [isSet, sets, setValue]);

  // Fetch brand models when brand changes
  useEffect(() => {
    if (!selectedBrandId) {
      setBrandModels([]);
      setModelSelectValue("");
      return;
    }
    const fetchBrandModels = async () => {
      setBrandModelsLoading(true);
      try {
        const res = await controlPrivateApi.get(
          `/brands/${selectedBrandId}/models/list`,
        );
        setBrandModels(res.data.data || []);
        setModelSelectValue("");
      } catch {
        setBrandModels([]);
      } finally {
        setBrandModelsLoading(false);
      }
    };
    fetchBrandModels();
  }, [selectedBrandId]);

  // Image handlers
  const handleMainImageChange = (newImage: any) => {
    setMainImage(newImage);
    setValue("main_image", newImage);
  };

  const handleHoverImageChange = (newImage: any) => {
    setHoverImage(newImage);
    setValue("hover_image", newImage);
  };

  const handleMultipleImagesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const newImageObjects = files.map((file) => ({
        file: file,
        url: URL.createObjectURL(file),
      }));

      const existingImages = images.filter((img) => img && img.file);
      const updatedImages = [...existingImages, ...newImageObjects];

      setImages(updatedImages);
      setValue("images", updatedImages);
    }
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages.length > 0 ? newImages : [{}]);
    setValue("images", newImages.length > 0 ? newImages : [{}]);
  };

  // Option handlers
  const addOption = (productOption: any) => {
    const currentOptions = getValues("options") || [];
    const newOption = {
      option_id: productOption.id,
      option: productOption,
      value: productOption.is_translatable
        ? undefined
        : productOption.has_items
          ? ""
          : "",
      translations: productOption.is_translatable
        ? langs.map((lang: any) => ({
            language_id: lang.id,
            translatable_value: "",
          }))
        : undefined,
    };
    setValue("options", [...currentOptions, newOption]);
  };

  const removeOption = (index: number) => {
    const currentOptions = getValues("options") || [];
    const optionToRemove = currentOptions[index] as any;

    if (optionToRemove?.option?.is_required) {
      toast.error("Cannot remove required option");
      return;
    }

    setValue(
      "options",
      currentOptions.filter((_, i) => i !== index),
    );
  };

  const getAvailableOptions = () => {
    const currentOptions = options || [];
    const selectedOptionIds = currentOptions.map((opt: any) => opt.option_id);

    return productOptions.filter((option: any) => {
      return !selectedOptionIds.includes(option.id);
    });
  };

  // Sets handlers
  const addSet = () => {
    const currentSets = getValues("sets") || [];
    setValue("sets", [
      ...currentSets,
      { product_variant_id: "", quantity: "" },
    ]);
  };

  const removeSet = (index: number) => {
    const currentSets = getValues("sets") || [];
    setValue(
      "sets",
      currentSets.filter((_, i) => i !== index),
    );
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          brandsRes,
          categoriesRes,
          discountTypesRes,
          productOptionsRes,
          countriesRes,
        ] = await Promise.all([
          controlPrivateApi
            .get("/brands/list")
            .catch(() => ({ data: { data: [] } })),
          controlPrivateApi
            .get("/categories/list?with_subs=yes")
            .catch(() => ({ data: { data: [] } })),
          controlPrivateApi
            .get("/discount-types/list")
            .catch(() => ({ data: { data: [] } })),
          controlPrivateApi
            .get("/product-options/list?with_items=yes")
            .catch(() => ({ data: { data: [] } })),
          controlPrivateApi
            .get("/countries/list?with_cities=yes")
            .catch(() => ({ data: { data: [] } })),
        ]);

        setBrands(brandsRes.data.data || []);

        const categoryData = categoriesRes.data.data || [];

        // Flatten categories
        const flattened: any[] = [];
        categoryData.forEach((category: any) => {
          flattened.push({
            id: category.id,
            title: category.title,
            slug: category.slug,
            displayName: category.title || category.slug,
            isParent: true,
            level: 0,
          });

          if (category.subs && category.subs.length > 0) {
            category.subs.forEach((sub: any) => {
              flattened.push({
                id: sub.id,
                title: sub.title,
                slug: sub.slug,
                displayName: `── ${sub.title || sub.slug}`,
                isParent: false,
                level: 1,
                parentId: category.id,
              });
            });
          }
        });
        setFlattenedCategories(flattened);

        setDiscountTypes(discountTypesRes.data.data || []);
        setProductOptions(productOptionsRes.data.data || []);

        const allCities = (countriesRes.data.data || []).flatMap(
          (country: any) => country.cities || [],
        );
        setCities(allCities);

        // Automatically add required options
        const requiredOptions = (productOptionsRes.data.data || []).filter(
          (option: any) => option.is_required,
        );
        const initialOptions = requiredOptions.map((option: any) => ({
          option_id: option.id,
          option: option,
          value: option.is_translatable
            ? undefined
            : option.has_items
              ? ""
              : "",
          translations: option.is_translatable
            ? langs.map((lang: any) => ({
                language_id: lang.id,
                translatable_value: "",
              }))
            : undefined,
        }));
        setValue("options", initialOptions);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Clear main_category_id when categories change
  useEffect(() => {
    const currentMainCategory = getValues("main_category_id");
    if (
      currentMainCategory &&
      !selectedCategories?.includes(currentMainCategory)
    ) {
      setValue("main_category_id", "" as any);
    }
  }, [selectedCategories, getValues, setValue]);

  const onSubmit = async (data: any) => {
    if (!searchToken) {
      toast.error(t("search_required_before_add"));
      return;
    }
    if (pending) return;
    setPending(true);

    try {
      const formData = new FormData();

      // Basic fields
      const basicFields: any = {
        slug: data.slug || null,
        oem_code: data.oem_code || null,
        price: data.price || null,
        discount: data.discount || null,
        discount_type: data.discount_type || null,
        discount_start_at: data.discount_start_at
          ? (() => {
              const d = new Date(data.discount_start_at!);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            })()
          : null,
        discount_end_at: data.discount_end_at
          ? (() => {
              const d = new Date(data.discount_end_at!);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            })()
          : null,
        brand_id: data.brand_id,
        brand_model_ids: selectedModels.map((m) => m.id),
        categories: data.categories,
        main_category_id: data.main_category_id,
        year: data.year || null,
        city_id: data.city_id || null,
        stock: data.stock,
        is_set: data.is_set,
        has_discount: data.has_discount,
      };

      // Add to FormData
      Object.keys(basicFields).forEach((key) => {
        if (basicFields[key] !== null && basicFields[key] !== undefined) {
          if (Array.isArray(basicFields[key])) {
            basicFields[key].forEach((item: any, index: number) => {
              formData.append(`${key}[${index}]`, item);
            });
          } else {
            const value =
              typeof basicFields[key] === "boolean"
                ? basicFields[key]
                  ? "1"
                  : "0"
                : basicFields[key];
            formData.append(key, value);
          }
        }
      });

      // Handle sets
      if (data.sets && data.sets.length > 0) {
        data.sets.forEach((set: any, index: number) => {
          if (set.product_variant_id) {
            formData.append(
              `sets[${index}][product_variant_id]`,
              set.product_variant_id,
            );
          }
          if (set.quantity) {
            formData.append(`sets[${index}][quantity]`, set.quantity);
          }
        });
      }

      // Handle images
      if (data.main_image?.file) {
        formData.append("main_image", data.main_image.file);
      }

      if (data.hover_image?.file) {
        formData.append("hover_image", data.hover_image.file);
      }

      if (data.images && data.images.length > 0) {
        data.images.forEach((image: any, index: number) => {
          if (image?.file) {
            formData.append(`images[${index}]`, image.file);
          }
        });
      }

      // Handle translations
      const translationFields = [
        "title",
        "description_short",
        "description",
        "delivery",
        "note",
      ];

      langs.forEach((lang: any, index: number) => {
        const translation = data.translations[index];
        formData.append(`translations[${index}][language_id]`, lang.id);

        translationFields.forEach((field) => {
          if (translation && translation[field]) {
            formData.append(
              `translations[${index}][${field}]`,
              translation[field],
            );
          }
        });
      });

      // Handle options
      if (data.options && data.options.length > 0) {
        data.options.forEach((option: any, index: number) => {
          if (option.option_id) {
            formData.append(`options[${index}][option_id]`, option.option_id);

            if (!option.option.is_translatable) {
              // Non-translatable option
              if (
                option.value !== null &&
                option.value !== undefined &&
                option.value !== ""
              ) {
                formData.append(`options[${index}][value]`, option.value);
              }
            } else {
              // Translatable option
              if (option.translations && option.translations.length > 0) {
                option.translations.forEach(
                  (translation: any, transIndex: number) => {
                    if (translation.language_id) {
                      formData.append(
                        `options[${index}][translations][${transIndex}][language_id]`,
                        translation.language_id,
                      );
                    }
                    if (
                      translation.translatable_value !== null &&
                      translation.translatable_value !== undefined &&
                      translation.translatable_value !== ""
                    ) {
                      formData.append(
                        `options[${index}][translations][${transIndex}][translatable_value]`,
                        translation.translatable_value,
                      );
                    }
                  },
                );
              }
            }
          }
        });
      }

      const res = await controlPrivateApi.post("/products/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Search-Token": searchToken,
        },
      });

      toast.success(res.data.message);
      navigate({ to: "/products" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("error_saving_product"));
    } finally {
      setPending(false);
    }
  };

  // ── Step 1: Search catalog ────────────────────────────────────────────────
  if (step === "search") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t("add_product")}</h1>
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
                        {item.brand_models?.length > 0 && <span>{item.brand_models.map((m: any) => m.title).join(", ")}</span>}
                        {item.year && <span>{item.year}</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={item.already_attached}
                      onClick={() => !item.already_attached && handleAttachClick(item)}
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
              <Button onClick={handleProceedToForm} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {t("add_new_product_not_found")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Step 2: Attach form ───────────────────────────────────────────────────
  if (step === "attach" && selectedVariantForAttach) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setStep("search")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t("attach_variant")}</h1>
        </div>

        {/* Selected variant info */}
        <div className="rounded-lg border p-4 bg-muted/40 space-y-1">
          <p className="text-sm font-medium">
            {selectedVariantForAttach.title || selectedVariantForAttach.slug}
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {selectedVariantForAttach.oem_code && (
              <span>OEM: {selectedVariantForAttach.oem_code}</span>
            )}
            {selectedVariantForAttach.brand_models?.length > 0 && (
              <span>{selectedVariantForAttach.brand_models.map((m: any) => m.title).join(", ")}</span>
            )}
            {selectedVariantForAttach.year && <span>{selectedVariantForAttach.year}</span>}
          </div>
        </div>

        <form onSubmit={attachForm.handleSubmit(onSubmitAttach)} className="space-y-6">
          {/* Listing info */}
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
                  <p className="text-sm text-destructive">
                    {attachForm.formState.errors.price.message}
                  </p>
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

          {/* Discount */}
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
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    )}
                  />
                  {attachForm.formState.errors.discount && (
                    <p className="text-sm text-destructive">
                      {attachForm.formState.errors.discount.message}
                    </p>
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
                    <p className="text-sm text-destructive">
                      {attachForm.formState.errors.discount_type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("discount_start_date")} *</Label>
                  <Controller
                    name="discount_start_at"
                    control={attachForm.control}
                    render={({ field }) => (
                      <DatePickerInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("discount_start_date")}
                      />
                    )}
                  />
                  {attachForm.formState.errors.discount_start_at && (
                    <p className="text-sm text-destructive">
                      {attachForm.formState.errors.discount_start_at.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t("discount_end_date")} *</Label>
                  <Controller
                    name="discount_end_at"
                    control={attachForm.control}
                    render={({ field }) => (
                      <DatePickerInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("discount_end_date")}
                      />
                    )}
                  />
                  {attachForm.formState.errors.discount_end_at && (
                    <p className="text-sm text-destructive">
                      {attachForm.formState.errors.discount_end_at.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Seller images */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {t("images")} ({t("optional")})
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAttachImages([...attachImages, {}])}
              >
                {t("add_image")}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {attachImages.map((image, index) => (
                <div key={index} className="relative rounded-lg border p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">
                      {t("image")} {index + 1}
                    </span>
                    {attachImages.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setAttachImages(attachImages.filter((_, i) => i !== index))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <FileInput
                    file={image}
                    setFile={(newImage: any) => {
                      const updated = [...attachImages];
                      updated[index] = newImage;
                      setAttachImages(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("search")}
              disabled={attachPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" size="lg" disabled={attachPending || loading}>
              {attachPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("attach_variant")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ── Step 3: Product form ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setStep("search")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("add_product")}</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images Section */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("images")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Main Image */}
            <div className="space-y-2">
              <Label>{t("main_image")} *</Label>
              <FileInput file={mainImage} setFile={handleMainImageChange} />
              {errors.main_image && (
                <p className="text-sm text-destructive">
                  {errors.main_image.message}
                </p>
              )}
            </div>

            {/* Hover Image */}
            <div className="space-y-2">
              <Label>
                {t("hover_image")} ({t("optional")})
              </Label>
              <FileInput file={hoverImage} setFile={handleHoverImageChange} />
              {errors.hover_image && (
                <p className="text-sm text-destructive">
                  {errors.hover_image.message}
                </p>
              )}
            </div>
          </div>

          {/* Additional Images */}
          <div className="space-y-2">
            <Label>
              {t("additional_images")} * ({t("at_least_one_required")})
            </Label>
            {errors.images && (
              <p className="text-sm text-destructive mb-2">
                {errors.images.message}
              </p>
            )}
            <div className="mb-2">
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="multiple-images-upload"
                type="file"
                multiple
                onChange={handleMultipleImagesChange}
              />
              <label htmlFor="multiple-images-upload">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="cursor-pointer"
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {t("select_images")}
                  </span>
                </Button>
              </label>
            </div>
            {images.length > 0 && images[0]?.file && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative rounded-lg border p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">
                        {t("image")} {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {image.url && (
                      <img
                        src={image.url}
                        alt={`Preview ${index + 1}`}
                        className="h-32 w-full rounded object-cover"
                      />
                    )}
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {image.file?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("basic_information")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">{t("slug")}</Label>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="slug"
                    placeholder={t("slug")}
                  />
                )}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand_id">{t("brand")} *</Label>
              <Controller
                name="brand_id"
                control={control}
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
              {errors.brand_id && (
                <p className="text-sm text-destructive">
                  {errors.brand_id.message}
                </p>
              )}
            </div>

            {/* Brand Model */}
            <div className="space-y-2">
              <Label>{t("brand_model")}</Label>
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

            {/* OEM Code */}
            <div className="space-y-2">
              <Label htmlFor="oem_code">{t("oem_code")}</Label>
              <Controller
                name="oem_code"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="oem_code"
                    placeholder={t("oem_code")}
                  />
                )}
              />
              {errors.oem_code && (
                <p className="text-sm text-destructive">
                  {errors.oem_code.message}
                </p>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="categories">{t("categories")} *</Label>
              <Controller
                name="categories"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={flattenedCategories.map((cat: any) => ({
                      value: cat.id.toString(),
                      label: cat.displayName,
                    }))}
                    value={field.value?.map(String) || []}
                    onChange={(values) =>
                      field.onChange(values.map((v) => parseInt(v)))
                    }
                    placeholder={t("select_categories")}
                    disabled={loading}
                  />
                )}
              />
              {errors.categories && (
                <p className="text-sm text-destructive">
                  {errors.categories.message}
                </p>
              )}
            </div>

            {/* Main Category */}
            <div className="space-y-2">
              <Label htmlFor="main_category_id">{t("main_category")} *</Label>
              <Controller
                name="main_category_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    placeholder={t("select_main_category")}
                    options={
                      selectedCategories && selectedCategories.length > 0
                        ? flattenedCategories
                            .filter((cat: any) =>
                              selectedCategories.includes(cat.id),
                            )
                            .map((cat: any) => ({
                              value: cat.id.toString(),
                              label: cat.displayName,
                            }))
                        : []
                    }
                    disabled={
                      loading ||
                      !selectedCategories ||
                      selectedCategories.length === 0
                    }
                  />
                )}
              />
              {errors.main_category_id && (
                <p className="text-sm text-destructive">
                  {errors.main_category_id.message}
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">{t("stock")}</Label>
              <Controller
                name="stock"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="stock"
                    type="number"
                  />
                )}
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">{t("year")}</Label>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value || ""}
                    id="year"
                    type="number"
                    placeholder={t("year")}
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                )}
              />
              {errors.year && (
                <p className="text-sm text-destructive">
                  {errors.year.message}
                </p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city_id">{t("city")}</Label>
              <Controller
                name="city_id"
                control={control}
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
              {errors.city_id && (
                <p className="text-sm text-destructive">
                  {errors.city_id.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Product Type */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("product_type")}</h2>

          <div className="flex items-center space-x-2">
            <Controller
              name="is_set"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="is_set"
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="is_set">{t("is_product_set")}</Label>
          </div>

          {/* Sets Section (only if is_set is true) */}
          {isSet && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t("product_sets")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSet}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t("add_set")}
                </Button>
              </div>
              {sets &&
                sets.map((_: any, index: number) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("product")} *</Label>
                        <Controller
                          name={`sets.${index}.product_variant_id`}
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              value={field.value?.toString() || ""}
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              placeholder={t("search_product")}
                              searchEndpoint="/product-variants/list?is_set=no"
                              renderOption={(option: any) => (
                                <div className="flex items-center gap-2">
                                  {option.product?.main_image && (
                                    <img
                                      src={option.product.main_image}
                                      alt={option.product.title}
                                      className="h-8 w-8 rounded object-cover"
                                    />
                                  )}
                                  <span>
                                    {option.product?.title} ({option.slug})
                                  </span>
                                </div>
                              )}
                              getOptionLabel={(option: any) =>
                                `${option.product?.title} (${option.slug})`
                              }
                              getOptionValue={(option: any) =>
                                option.id.toString()
                              }
                            />
                          )}
                        />
                        {errors.sets?.[index] &&
                          (errors.sets[index] as any)?.product_variant_id && (
                            <p className="text-sm text-destructive">
                              {
                                (errors.sets[index] as any)?.product_variant_id
                                  ?.message
                              }
                            </p>
                          )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t("quantity")} *</Label>
                        <div className="flex gap-2">
                          <Controller
                            name={`sets.${index}.quantity`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                value={field.value || ""}
                                type="number"
                                className="flex-1"
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeSet(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors.sets?.[index] &&
                          (errors.sets[index] as any)?.quantity && (
                            <p className="text-sm text-destructive">
                              {(errors.sets[index] as any)?.quantity?.message}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {!isSet && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t("price")}</Label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id="price"
                      type="number"
                      step="0.01"
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Discount Settings */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("discount_settings")}</h2>

          <div className="flex items-center space-x-2">
            <Controller
              name="has_discount"
              control={control}
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

          {hasDiscount && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">{t("discount")} *</Label>
                <Controller
                  name="discount"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} id="discount" type="number" step="0.01" />
                  )}
                />
                {errors.discount && (
                  <p className="text-sm text-destructive">
                    {errors.discount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_type">{t("discount_type")} *</Label>
                <Controller
                  name="discount_type"
                  control={control}
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
                {errors.discount_type && (
                  <p className="text-sm text-destructive">
                    {errors.discount_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_start_at">
                  {t("discount_start_date")} *
                </Label>
                <Controller
                  name="discount_start_at"
                  control={control}
                  render={({ field }) => (
                    <DatePickerInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("select_date")}
                    />
                  )}
                />
                {errors.discount_start_at && (
                  <p className="text-sm text-destructive">
                    {errors.discount_start_at.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_end_at">
                  {t("discount_end_date")} *
                </Label>
                <Controller
                  name="discount_end_at"
                  control={control}
                  render={({ field }) => (
                    <DatePickerInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("select_date")}
                    />
                  )}
                />
                {errors.discount_end_at && (
                  <p className="text-sm text-destructive">
                    {errors.discount_end_at.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Translations */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("translations")}</h2>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {langs.map((lang: any, index: number) => (
                <TabsTrigger key={lang.id} value={index.toString()}>
                  {lang.key}
                </TabsTrigger>
              ))}
            </TabsList>

            {langs.map((lang: any, index: number) => (
              <TabsContent
                key={lang.id}
                value={index.toString()}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor={`title_${index}`}>
                    {t("title")} {index === 0 && "*"}
                  </Label>
                  <Controller
                    name={`translations.${index}.title`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        id={`title_${index}`}
                      />
                    )}
                  />
                  {errors.translations?.[index]?.title && (
                    <p className="text-sm text-destructive">
                      {errors.translations[index]?.title?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description_short_${index}`}>
                    {t("short_description")} {index === 0 && "*"}
                  </Label>
                  <Controller
                    name={`translations.${index}.description_short`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        value={field.value || ""}
                        id={`description_short_${index}`}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    )}
                  />
                  {errors.translations?.[index]?.description_short && (
                    <p className="text-sm text-destructive">
                      {errors.translations[index]?.description_short?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description_${index}`}>
                    {t("description")}
                  </Label>
                  <Controller
                    name={`translations.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        value={field.value || ""}
                        id={`description_${index}`}
                        rows={5}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`delivery_${index}`}>{t("delivery")}</Label>
                  <Controller
                    name={`translations.${index}.delivery`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        value={field.value || ""}
                        id={`delivery_${index}`}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`note_${index}`}>{t("note")}</Label>
                  <Controller
                    name={`translations.${index}.note`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        value={field.value || ""}
                        id={`note_${index}`}
                        rows={2}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    )}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Product Options Section */}
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("product_options")}</h2>
            {getAvailableOptions().length > 0 && (
              <Select
                value=""
                onValueChange={(value) => {
                  const selectedOption = productOptions.find(
                    (opt: any) => String(opt.id) === value,
                  );
                  if (selectedOption) {
                    addOption(selectedOption);
                  }
                }}
                placeholder={t("add_option")}
                options={getAvailableOptions().map((option: any) => ({
                  value: option.id.toString(),
                  label: `${option.title}${option.is_required ? " *" : ""}`,
                }))}
                className="w-[200px]"
              />
            )}
          </div>

          {options && options.length > 0 && (
            <div className="space-y-4">
              {options.map((selectedOption: any, optionIndex: number) => {
                const productOption = selectedOption.option;
                return (
                  <div
                    key={optionIndex}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {productOption.title}
                        {productOption.is_required && " *"}
                      </h3>
                      {!productOption.is_required && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeOption(optionIndex)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          {t("remove")}
                        </Button>
                      )}
                    </div>

                    {/* Non-translatable options */}
                    {!productOption.is_translatable && (
                      <div className="space-y-2">
                        {productOption.has_items ? (
                          <Controller
                            name={`options.${optionIndex}.value`}
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-2">
                                <Label>{productOption.title}</Label>
                                <Select
                                  value={field.value?.toString() || ""}
                                  onValueChange={field.onChange}
                                  placeholder={t("select")}
                                  options={productOption.items.map(
                                    (item: any) => ({
                                      value: item.id.toString(),
                                      label: item.title,
                                    }),
                                  )}
                                />
                                {errors.options?.[optionIndex]?.value && (
                                  <p className="text-sm text-destructive">
                                    {
                                      errors.options[optionIndex]?.value
                                        ?.message
                                    }
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        ) : (
                          <Controller
                            name={`options.${optionIndex}.value`}
                            control={control}
                            render={({ field }) => (
                              <div className="space-y-2">
                                <Label>{productOption.title}</Label>
                                <Input
                                  value={(field.value as string) || ""}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                />
                                {errors.options?.[optionIndex]?.value && (
                                  <p className="text-sm text-destructive">
                                    {
                                      errors.options[optionIndex]?.value
                                        ?.message
                                    }
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        )}
                      </div>
                    )}

                    {/* Translatable options */}
                    {productOption.is_translatable && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          {t("translations")}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {langs.map((lang: any, langIndex: number) => (
                            <div key={lang.id} className="space-y-2">
                              {productOption.has_items ? (
                                <Controller
                                  name={`options.${optionIndex}.translations.${langIndex}.translatable_value`}
                                  control={control}
                                  render={({ field }) => (
                                    <div className="space-y-2">
                                      <Label className="text-xs">
                                        {productOption.title} ({lang.key})
                                      </Label>
                                      <Select
                                        value={field.value?.toString() || ""}
                                        onValueChange={field.onChange}
                                        placeholder={t("select")}
                                        options={productOption.items.map(
                                          (item: any) => ({
                                            value: item.id.toString(),
                                            label: item.title,
                                          }),
                                        )}
                                      />
                                    </div>
                                  )}
                                />
                              ) : (
                                <Controller
                                  name={`options.${optionIndex}.translations.${langIndex}.translatable_value`}
                                  control={control}
                                  render={({ field }) => (
                                    <div className="space-y-2">
                                      <Label className="text-xs">
                                        {productOption.title} ({lang.key})
                                      </Label>
                                      <Input
                                        {...field}
                                        value={field.value || ""}
                                      />
                                    </div>
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

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setStep("search")}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={pending || loading}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("add_product")}
          </Button>
        </div>
      </form>
    </div>
  );
}
