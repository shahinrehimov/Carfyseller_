import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import {
  FitmentEditor,
  appendFitments,
  toEditableFitments,
  validateFitments,
  type Fitment,
} from "@/components/fitment/FitmentEditor";
import { useTranslation } from "@/lib/utils/translationLoader";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Clock, Loader2, X } from "lucide-react";
import { useTranslationStore } from "@/store/translations";
import { FileInput } from "@/components/ui/file-input";
import { DatePickerInput } from "@/components/ui/date-picker-input";

export const Route = createFileRoute(
  "/_app/products/variants/$productId/edit/$variantId/"
)({
  component: EditProductVariantPage,
});

function EditProductVariantPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId, variantId } = useParams({
    from: "/_app/products/variants/$productId/edit/$variantId/",
  });
  const langs = useTranslationStore((state) => state.langs);

  const validationSchema = Yup.object().shape({
    main_image: Yup.object()
      .test("optional-file", t("invalid_file"), function (value: any) {
        if (!value || Object.keys(value).length === 0) return true;
        return value.file && (value.file instanceof File || value.file === "show");
      })
      .notRequired(),
    hover_image: Yup.object()
      .test("optional-file", t("invalid_file"), function (value: any) {
        if (!value || Object.keys(value).length === 0) return true;
        return value.file && (value.file instanceof File || value.file === "show");
      })
      .notRequired(),
    images: Yup.array().notRequired(),
    stock: Yup.number().notRequired(),
    price: Yup.string().notRequired(),
    size_category: Yup.string().notRequired(),
    weight_gram: Yup.number()
      .typeError(t("required_field"))
      .notRequired()
      .min(1)
      .max(20000),
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
    oem_code: Yup.string().max(100).notRequired(),
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
              })
            )
            .notRequired(),
        })
      )
      .notRequired(),
  });


  const [cpv, setCpv] = useState<any>(null);
  const [isCreator, setIsCreator] = useState(true);
  const [discountTypes, setDiscountTypes] = useState<any[]>([]);
  const [sizeCategories, setSizeCategories] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [fitments, setFitments] = useState<Fitment[]>([]);
  const [isUniversal, setIsUniversal] = useState(false);
  const [fitmentError, setFitmentError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRevision, setPendingRevision] = useState<any>(null);
  const [showRevisionConfirm, setShowRevisionConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);

  const [mainImage, setMainImage] = useState<any>({});
  const [hoverImage, setHoverImage] = useState<any>({});
  const [images, setImages] = useState<any[]>([{}]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      main_image: {},
      hover_image: {},
      images: [{}],
      stock: 0,
      price: "",
      size_category: "",
      weight_gram: "" as any,
      has_discount: false,
      discount: "",
      discount_type: "",
      discount_start_at: undefined,
      discount_end_at: undefined,
      oem_code: "",
      city_id: undefined,
      options: [],
    },
  });

  const hasDiscount = watch("has_discount");
  const options = watch("options");
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [discountTypesRes, sizeCategoriesRes, productOptionsRes, cpvRes, countriesRes, brandsRes] =
          await Promise.all([
            controlPrivateApi.get("/discount-types/list").catch(() => ({ data: { data: [] } })),
            controlPrivateApi.get("/product-size-categories/list").catch(() => ({ data: { data: [] } })),
            controlPrivateApi.get("/product-options/list?with_items=yes").catch(() => ({ data: { data: [] } })),
            controlPrivateApi.get(`/company-product-variants/show/${variantId}`),
            controlPrivateApi.get("/countries/list?with_cities=yes").catch(() => ({ data: { data: [] } })),
            controlPrivateApi.get("/brands/list").catch(() => ({ data: { data: [] } })),
          ]);

        const cpvData = cpvRes.data.data;
        const pvId = cpvData?.variant?.id;
        const isCreatorVariant = cpvData?.variant?.is_creator ?? true;

        // Fetch pending revision if seller is the creator
        // revision = { id, status, data: {oem_code, fitments, options}, images: {main_image, hover_image, images:[]} }
        let revision: any = null;
        if (isCreatorVariant && pvId) {
          try {
            const revRes = await controlPrivateApi.get(`/product-variants/${pvId}/pending-revision`);
            revision = revRes.data.data?.data || null;
          } catch {
            // ignore
          }
        }

        const allBrands = brandsRes.data.data || [];
        setDiscountTypes(discountTypesRes.data.data || []);
        setSizeCategories(sizeCategoriesRes.data.data || []);
        setProductOptions(productOptionsRes.data.data || []);
        setBrands(allBrands);

        const allCities = (countriesRes.data.data || []).flatMap(
          (country: any) => country.cities || []
        );
        setCities(allCities);

        setCpv(cpvData);
        setIsCreator(isCreatorVariant);
        setPendingRevision(revision);

        const pv = cpvData.variant;

        // Prefer revision's proposed values for canonical fields, fall back to current variant
        const rd = revision?.data; // { oem_code, fitments, options }

        // A pending revision stores raw ids; a saved variant arrives serialised
        // for display. toEditableFitments accepts either shape.
        const initialFitments = toEditableFitments(
          rd?.fitments?.length ? rd.fitments : pv?.fitments,
        );
        setFitments(initialFitments);
        setIsUniversal(
          initialFitments.length > 0 &&
            initialFitments.every((f) => f.brand_id === null),
        );

        const formValues: any = {
          main_image: {},
          hover_image: {},
          images: [{}],
          // CPV fields (always from CPV, not affected by revision)
          stock: cpvData.stock ?? 0,
          price: cpvData.price?.toString() || "",
          size_category: cpvData.size_category?.value || cpvData.size_category || "",
          weight_gram: cpvData.weight_gram || "" as any,
          has_discount: cpvData.discount > 0,
          discount: cpvData.discount?.toString() || "",
          discount_type: cpvData.discount_type || "",
          discount_start_at: cpvData.discount_start_at
            ? new Date(cpvData.discount_start_at)
            : undefined,
          discount_end_at: cpvData.discount_end_at
            ? new Date(cpvData.discount_end_at)
            : undefined,
          city_id: cpvData.city?.id || undefined,
          // PV (canonical) fields — use revision's proposed values if pending revision exists
          oem_code: rd?.oem_code ?? pv?.oem_code ?? "",
          options:
            pv?.options?.map((opt: any) => ({
              option_id: opt.option.id,
              option: opt.option,
              value: opt.option.is_translatable ? undefined : opt.value,
              translations: opt.option.is_translatable
                ? opt.translations?.map((trans: any) => ({
                    language_id: trans.language_id,
                    translatable_value: trans.translatable_value || "",
                  })) ||
                  langs.map((lang: any) => ({
                    language_id: lang.id,
                    translatable_value: "",
                  }))
                : undefined,
            })) || [],
        };

        // Use revision images if pending revision exists, otherwise current variant images
        const mainImgUrl = revision?.images?.main_image || pv?.main_image;
        const hoverImgUrl = revision?.images?.hover_image || pv?.hover_image;
        const extraImgs = revision?.images?.images?.length
          ? revision.images.images.map((i: any) => ({ file: "show", url: i.url }))
          : pv?.images?.urls?.map((url: string) => ({ file: "show", url })) || [];

        if (mainImgUrl) {
          const img = { file: "show", url: mainImgUrl };
          setMainImage(img);
          formValues.main_image = img;
        }
        if (hoverImgUrl) {
          const img = { file: "show", url: hoverImgUrl };
          setHoverImage(img);
          formValues.hover_image = img;
        }
        if (extraImgs.length > 0) {
          setImages(extraImgs);
          formValues.images = extraImgs;
        }

        reset(formValues);
      } catch {
        toast.error(t("failed_to_load_data"));
      } finally {
        setLoading(false);
      }
    };

    if (variantId && langs.length > 0) {
      fetchData();
    }
  }, [variantId, langs, reset]);

  const handleMainImageChange = (newImage: any) => {
    setMainImage(newImage);
    setValue("main_image", newImage);
  };

  const handleHoverImageChange = (newImage: any) => {
    setHoverImage(newImage);
    setValue("hover_image", newImage);
  };

  const handleImageChange = (index: number, newImage: any) => {
    const newImages = [...images];
    newImages[index] = newImage;
    setImages(newImages);
    setValue("images", newImages);
  };

  const addImage = () => {
    const newImages = [...images, {}];
    setImages(newImages);
    setValue("images", newImages);
  };

  const removeImage = (index: number) => {
    if (images.length > 1) {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      setValue("images", newImages);
    }
  };

  const addOption = (productOption: any) => {
    const currentOptions = getValues("options") || [];
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
    setValue("options", [...currentOptions, newOption]);
  };

  const removeOption = (index: number) => {
    const currentOptions = getValues("options") || [];
    const optionToRemove = currentOptions[index] as any;
    if (optionToRemove?.option?.is_required) {
      toast.error(t("cannot_remove_required_option"));
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
    return productOptions.filter((option: any) => !selectedOptionIds.includes(option.id));
  };

  const doSubmit = async (data: any) => {
    if (isCreator) {
      const fitmentIssue = validateFitments(fitments, isUniversal, t);
      if (fitmentIssue) {
        setFitmentError(fitmentIssue);
        toast.error(fitmentIssue);
        return;
      }
    }
    if (pending) return;
    setPending(true);

    try {
      const formData = new FormData();

      const basicFields: any = isCreator
        ? {
            oem_code: data.oem_code || null,
          }
        : {
            has_discount: data.has_discount,
            city_id: data.city_id || null,
            size_category: data.size_category,
            weight_gram: data.weight_gram,
            stock: data.stock,
            price: data.price || null,
          };

      if (!isCreator && data.has_discount) {
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
        if (basicFields[key] !== null && basicFields[key] !== undefined) {
          const value =
            typeof basicFields[key] === "boolean"
              ? basicFields[key] ? "1" : "0"
              : basicFields[key];
          formData.append(key, value);
        }
      });

      if (isCreator) {
        appendFitments(formData, fitments, isUniversal);
      }

      if (data.main_image?.file && data.main_image.file !== "show") {
        formData.append("main_image", data.main_image.file);
      }
      if (data.hover_image?.file && data.hover_image.file !== "show") {
        formData.append("hover_image", data.hover_image.file);
      }
      if (data.images && data.images.length > 0) {
        const validImages = data.images.filter(
          (image: any) => image?.file && image.file !== "show"
        );
        validImages.forEach((image: any, index: number) => {
          formData.append(`images[${index}]`, image.file);
        });
      }

      if (data.options && data.options.length > 0) {
        data.options.forEach((option: any, index: number) => {
          if (option.option_id) {
            formData.append(`options[${index}][option_id]`, option.option_id);
            if (!option.option.is_translatable) {
              if (option.value !== null && option.value !== undefined && option.value !== "") {
                formData.append(`options[${index}][value]`, option.value);
              }
            } else {
              if (option.translations && option.translations.length > 0) {
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
          }
        });
      }

      let res;
      if (isCreator) {
        const pvId = cpv?.variant?.id;
        res = await controlPrivateApi.post(
          `/product-variants/update/${pvId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (res.data.data?.pending_revision) {
          toast.success(res.data.data.message || t("revision_pending_approval"));
          setPendingRevision({ status: "pending" });
          return;
        }
      } else {
        res = await controlPrivateApi.post(
          `/company-product-variants/update/${variantId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }
      toast.success(res.data.message || t("variant_updated_successfully"));
      navigate({ to: `/products/variants/${productId}` });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || t("failed_to_update_variant")
      );
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (data: any) => {
    // If creator and has an existing pending revision, ask for confirmation first
    if (isCreator && pendingRevision?.status === "pending") {
      setPendingSubmitData(data);
      setShowRevisionConfirm(true);
      return;
    }
    doSubmit(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cpv && !loading) {
    return (
      <div className="rounded-lg border border-destructive p-4 text-destructive">
        {t("variant_not_found")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t("edit_product_variant")}</h1>
      </div>

      {/* Pending revision banner */}
      {isCreator && pendingRevision?.status === "pending" && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
          <Clock className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {t("pending_revision_notice") || "Dəyişiklikləriniz admin təsdiqi gözləyir. Forma hazırda pending dəyişiklikləri əks etdirir."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images Section — only for creator */}
        {isCreator && <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("images")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("main_image")} ({t("optional")})</Label>
              <FileInput file={mainImage} setFile={handleMainImageChange} />
              {errors.main_image && (
                <p className="text-sm text-destructive">{errors.main_image.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("hover_image")} ({t("optional")})</Label>
              <FileInput file={hoverImage} setFile={handleHoverImageChange} />
              {errors.hover_image && (
                <p className="text-sm text-destructive">{errors.hover_image.message}</p>
              )}
            </div>
          </div>

          {/* Additional Images */}
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
                    <span className="text-xs font-medium">
                      {t("image")} {index + 1}
                    </span>
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
        </div>}

        {/* Basic Information */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("basic_information")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stock — only for non-creator */}
            {!isCreator && <div className="space-y-2">
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
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              />
            </div>}

            {/* Price — only for non-creator */}
            {!isCreator && <div className="space-y-2">
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
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              />
            </div>}

            {/* Fitment — only for creator */}
            {isCreator && <div className="space-y-2 md:col-span-2">
              <Label>{t("fitment") || "Uyğunluq"} *</Label>
              <FitmentEditor
                brands={brands}
                value={fitments}
                onChange={(next, universal) => {
                  setFitments(next);
                  setIsUniversal(universal);
                  setFitmentError(null);
                }}
                disabled={loading}
                error={fitmentError ?? undefined}
              />
            </div>}


            {/* City — only for non-creator */}
            {!isCreator && <div className="space-y-2">
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
                <p className="text-sm text-destructive">{errors.city_id.message}</p>
              )}
            </div>}

            {/* Size Category — only for non-creator */}
            {!isCreator && <div className="space-y-2">
              <Label htmlFor="size_category">{t("size_category")} *</Label>
              <Controller
                name="size_category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder={t("select")}
                    options={sizeCategories.map((cat: any) => ({
                      value: cat.id,
                      label: cat.title,
                    }))}
                    disabled={loading}
                  />
                )}
              />
              {errors.size_category && (
                <p className="text-sm text-destructive">{errors.size_category.message}</p>
              )}
            </div>}

            {/* Weight — only for non-creator */}
            {!isCreator && <div className="space-y-2">
              <Label htmlFor="weight_gram">{t("weight_gram")} *</Label>
              <Controller
                name="weight_gram"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="weight_gram"
                    type="number"
                    min={1}
                    max={20000}
                    placeholder="e.g. 1500"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              />
              {errors.weight_gram && (
                <p className="text-sm text-destructive">{errors.weight_gram.message}</p>
              )}
            </div>}
          </div>
        </div>

        {/* Discount Settings — only for non-creator */}
        {!isCreator && <div className="rounded-lg border p-6 space-y-4">
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
                    <Input {...field} id="discount" type="number" step="0.01" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
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
                <Label>{t("discount_start_date")} *</Label>
                <Controller
                  name="discount_start_at"
                  control={control}
                  render={({ field }) => (
                    <DatePickerInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("discount_start_date")}
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
                <Label>{t("discount_end_date")} *</Label>
                <Controller
                  name="discount_end_at"
                  control={control}
                  render={({ field }) => (
                    <DatePickerInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("discount_end_date")}
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
        </div>}

        {/* Product Options — only for creator */}
        {isCreator && <div className="rounded-lg border p-6 space-y-4">
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
                              name={`options.${optionIndex}.value`}
                              control={control}
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
                              name={`options.${optionIndex}.value`}
                              control={control}
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
                                  name={`options.${optionIndex}.translations.${langIndex}.translatable_value`}
                                  control={control}
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
                                  name={`options.${optionIndex}.translations.${langIndex}.translatable_value`}
                                  control={control}
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
        </div>}

        {/* Submit */}
        <Button type="submit" disabled={pending || loading} size="lg">
          {(pending || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("update_product_variant")}
        </Button>
      </form>

      {/* Confirmation dialog — re-submit with existing pending revision */}
      {showRevisionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg border bg-white p-6 shadow-lg dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
              <div>
                <h3 className="font-semibold">
                  {t("pending_revision_exists") || "Gözləyən dəyişiklik var"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t("pending_revision_confirm_replace") ||
                    "Artıq admin təsdiqi gözləyən bir dəyişikliyiniz var. Yeni dəyişiklik göndərsəniz köhnəsi silinəcək. Davam etmək istəyirsinizmi?"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRevisionConfirm(false);
                  setPendingSubmitData(null);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={() => {
                  setShowRevisionConfirm(false);
                  doSubmit(pendingSubmitData);
                  setPendingSubmitData(null);
                }}
              >
                {t("yes_send") || "Bəli, göndər"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
