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
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { useTranslationStore } from "@/store/translations";
import { FileInput } from "@/components/ui/file-input";
import { MultiSelect } from "@/components/ui/multi-select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Autocomplete } from "@/components/ui/autocomplete";

export const Route = createFileRoute("/_app/products/add/")({
  component: AddProductPage,
});

function AddProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langs = useTranslationStore((state) => state.langs);

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
        Yup.object().test("has-file", t("required_field"), function (value: any) {
          return value && value.file && value.file instanceof File;
        })
      )
      .test("at-least-one", t("at_least_one_image_required"), function (value: any) {
        if (!value || !Array.isArray(value)) return false;
        return value.some(
          (image: any) => image && image.file && image.file instanceof File
        );
      })
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
        })
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
            })
          )
          .min(1, t("required_field")),
      otherwise: (schema) => schema.notRequired(),
    }),
    price: Yup.number().notRequired(),
    uuid_1c: Yup.string().notRequired(),
    variant_uuid_1c: Yup.string().notRequired(),
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

  // State
  const [brands, setBrands] = useState<any[]>([]);
  const [flattenedCategories, setFlattenedCategories] = useState<any[]>([]);
  const [discountTypes, setDiscountTypes] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
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
      uuid_1c: "",
      variant_uuid_1c: "",
      brand_id: undefined,
      categories: [],
      main_category_id: undefined,
      stock: 0,
      has_discount: false,
      discount: "",
      discount_type: "",
      discount_start_at: undefined,
      discount_end_at: undefined,
      options: [],
    },
  });

  // Watch values
  const isSet = watch("is_set");
  const hasDiscount = watch("has_discount");
  const selectedCategories = watch("categories");
  const options = watch("options");
  const sets = watch("sets");

  // Auto-add a set when is_set is checked and no sets exist
  useEffect(() => {
    if (isSet && (!sets || sets.length === 0)) {
      setValue("sets", [{ product_variant_id: "", quantity: "" }]);
    }
  }, [isSet, sets, setValue]);

  // Image handlers
  const handleMainImageChange = (newImage: any) => {
    setMainImage(newImage);
    setValue("main_image", newImage);
  };

  const handleHoverImageChange = (newImage: any) => {
    setHoverImage(newImage);
    setValue("hover_image", newImage);
  };

  const handleMultipleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      currentOptions.filter((_, i) => i !== index)
    );
  };

  const getAvailableOptions = () => {
    const currentOptions = getValues("options") || [];
    const selectedOptionIds = currentOptions.map((opt: any) => opt.option_id);

    return productOptions.filter((option: any) => {
      if (option.is_required) {
        return !selectedOptionIds.includes(option.id);
      }
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
      currentSets.filter((_, i) => i !== index)
    );
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [brandsRes, categoriesRes, discountTypesRes, productOptionsRes] = await Promise.all([
          controlPrivateApi.get("/brands/list").catch(() => ({ data: { data: [] } })),
          controlPrivateApi.get("/categories/list?with_subs=yes").catch(() => ({ data: { data: [] } })),
          controlPrivateApi.get("/discount-types/list").catch(() => ({ data: { data: [] } })),
          controlPrivateApi.get("/product-options/list?with_items=yes").catch(() => ({ data: { data: [] } })),
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

        // Automatically add required options
        const requiredOptions = (productOptionsRes.data.data || []).filter(
          (option: any) => option.is_required
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
    if (currentMainCategory && !selectedCategories?.includes(currentMainCategory)) {
      setValue("main_category_id", "" as any);
    }
  }, [selectedCategories, getValues, setValue]);

  const onSubmit = async (data: any) => {
    if (pending) return;
    setPending(true);

    try {
      const formData = new FormData();

      // Basic fields
      const basicFields: any = {
        slug: data.slug || null,
        price: data.price || null,
        discount: data.discount || null,
        discount_type: data.discount_type || null,
        discount_start_at: data.discount_start_at
          ? new Date(data.discount_start_at).toLocaleDateString("en-GB")
          : null,
        discount_end_at: data.discount_end_at
          ? new Date(data.discount_end_at).toLocaleDateString("en-GB")
          : null,
        brand_id: data.brand_id,
        categories: data.categories,
        main_category_id: data.main_category_id,
        stock: data.stock,
        is_set: data.is_set,
        has_discount: data.has_discount,
      };

      if (!data.is_set) {
        basicFields.uuid_1c = data.uuid_1c || "";
        basicFields.variant_uuid_1c = data.variant_uuid_1c || "";
      }

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
              set.product_variant_id
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
            formData.append(`translations[${index}][${field}]`, translation[field]);
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
                option.translations.forEach((translation: any, transIndex: number) => {
                  if (translation.language_id) {
                    formData.append(
                      `options[${index}][translations][${transIndex}][language_id]`,
                      translation.language_id
                    );
                  }
                  if (
                    translation.translatable_value !== null &&
                    translation.translatable_value !== undefined &&
                    translation.translatable_value !== ""
                  ) {
                    formData.append(
                      `options[${index}][translations][${transIndex}][translatable_value]`,
                      translation.translatable_value
                    );
                  }
                });
              }
            }
          }
        });
      }

      const res = await controlPrivateApi.post("/products/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
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
              <Label>{t("hover_image")} ({t("optional")})</Label>
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
            <Label>{t("additional_images")} * ({t("at_least_one_required")})</Label>
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
                <Button type="button" variant="outline" asChild className="cursor-pointer">
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
                <p className="text-sm text-destructive">{errors.slug.message}</p>
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
                <p className="text-sm text-destructive">{errors.brand_id.message}</p>
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
                <p className="text-sm text-destructive">{errors.categories.message}</p>
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
                            .filter((cat: any) => selectedCategories.includes(cat.id))
                            .map((cat: any) => ({
                              value: cat.id.toString(),
                              label: cat.displayName,
                            }))
                        : []
                    }
                    disabled={loading || !selectedCategories || selectedCategories.length === 0}
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
                    value={field.value || 0}
                    id="stock"
                    type="number"
                    disabled
                    readOnly
                  />
                )}
              />
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
                <Button type="button" variant="outline" size="sm" onClick={addSet}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("add_set")}
                </Button>
              </div>
              {sets && sets.map((_: any, index: number) => (
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
                            onValueChange={(value) => field.onChange(parseInt(value))}
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
                            getOptionValue={(option: any) => option.id.toString()}
                          />
                        )}
                      />
                      {errors.sets?.[index] && (errors.sets[index] as any)?.product_variant_id && (
                        <p className="text-sm text-destructive">
                          {(errors.sets[index] as any)?.product_variant_id?.message}
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
                      {errors.sets?.[index] && (errors.sets[index] as any)?.quantity && (
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
                      value={field.value || 0}
                      id="price"
                      type="number"
                      step="0.01"
                      disabled
                      readOnly
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uuid_1c">UUID 1C</Label>
                <Controller
                  name="uuid_1c"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} id="uuid_1c" />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant_uuid_1c">Variant UUID 1C</Label>
                <Controller
                  name="variant_uuid_1c"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} id="variant_uuid_1c" />
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
                  <p className="text-sm text-destructive">{errors.discount.message}</p>
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
                  <p className="text-sm text-destructive">{errors.discount_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_start_at">{t("discount_start_date")} *</Label>
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
                <Label htmlFor="discount_end_at">{t("discount_end_date")} *</Label>
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
              <TabsContent key={lang.id} value={index.toString()} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`title_${index}`}>{t("title")} {index === 0 && "*"}</Label>
                  <Controller
                    name={`translations.${index}.title`}
                    control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value || ""} id={`title_${index}`} />
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
                  <Label htmlFor={`description_${index}`}>{t("description")}</Label>
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
                    (opt: any) => opt.id === parseInt(value)
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
                  <div key={optionIndex} className="rounded-lg border p-4 space-y-4">
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
                                  options={productOption.items.map((item: any) => ({
                                    value: item.id.toString(),
                                    label: item.title,
                                  }))}
                                />
                                {errors.options?.[optionIndex]?.value && (
                                  <p className="text-sm text-destructive">
                                    {errors.options[optionIndex]?.value?.message}
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
                                    {errors.options[optionIndex]?.value?.message}
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
                        <Label className="text-sm font-medium">{t("translations")}</Label>
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
                                        options={productOption.items.map((item: any) => ({
                                          value: item.id.toString(),
                                          label: item.title,
                                        }))}
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
                                      <Input {...field} value={field.value || ""} />
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
          <Link to="/products">
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </Link>
          <Button type="submit" disabled={pending || loading}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("add_product")}
          </Button>
        </div>
      </form>
    </div>
  );
}
