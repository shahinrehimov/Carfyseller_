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
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useTranslationStore } from "@/store/translations";
import { FileInput } from "@/components/ui/file-input";
import { DatePickerInput } from "@/components/ui/date-picker-input";

export const Route = createFileRoute(
  "/_app/products/variants/$productId/add/"
)({
  component: AddProductVariantPage,
});

function AddProductVariantPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId } = useParams({ from: "/_app/products/variants/$productId/add/" });
  const langs = useTranslationStore((state) => state.langs);

  const validationSchema = Yup.object().shape({
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
        return value.some((image: any) => image && image.file && image.file instanceof File);
      })
      .required(t("required_field")),
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
    brand_model_id: Yup.number().notRequired(),
    year: Yup.number()
      .transform((value, originalValue) => (originalValue === "" ? undefined : value))
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
              })
            )
            .notRequired(),
        })
      )
      .notRequired(),
  });

  const [discountTypes, setDiscountTypes] = useState<any[]>([]);
  const [productOptions, setProductOptions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [brandModels, setBrandModels] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [brandModelsLoading, setBrandModelsLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

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
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      main_image: {},
      hover_image: {},
      images: [{}],
      stock: "" as any,
      price: "",
      has_discount: false,
      discount: "",
      discount_type: "",
      discount_start_at: undefined,
      discount_end_at: undefined,
      brand_id: undefined,
      brand_model_id: undefined,
      year: "" as any,
      city_id: undefined,
      options: [],
    },
  });

  const hasDiscount = watch("has_discount");
  const options = watch("options");
  const selectedBrandId = watch("brand_id");

  useEffect(() => {
    if (!selectedBrandId) {
      setBrandModels([]);
      setValue("brand_model_id", undefined);
      return;
    }
    const fetchBrandModels = async () => {
      setBrandModelsLoading(true);
      try {
        const res = await controlPrivateApi.get(`/brands/${selectedBrandId}/models/list`);
        setBrandModels(res.data.data || []);
      } catch {
        setBrandModels([]);
      } finally {
        setBrandModelsLoading(false);
      }
    };
    setValue("brand_model_id", undefined);
    fetchBrandModels();
  }, [selectedBrandId, setValue]);

  useEffect(() => {
    const fetchData = async () => {
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
        setValue("options", initialOptions);
      } catch {
        toast.error(t("failed_to_load_data"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [langs, setValue]);

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

  const onSubmit = async (data: any) => {
    if (pending) return;
    setPending(true);

    try {
      const formData = new FormData();

      const basicFields: any = {
        stock: data.stock,
        price: data.price,
        has_discount: data.has_discount,
        year: data.year || null,
        city_id: data.city_id || null,
        brand_model_id: data.brand_model_id || null,
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
        if (basicFields[key] !== null && basicFields[key] !== undefined) {
          const value =
            typeof basicFields[key] === "boolean"
              ? basicFields[key] ? "1" : "0"
              : basicFields[key];
          formData.append(key, value);
        }
      });

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

      const res = await controlPrivateApi.post(
        `/product-variants/add/${productId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success(res.data.message);
      navigate({ to: `/products/variants/${productId}` });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("error_saving"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/products/variants/$productId" params={{ productId }}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("add_product_variant")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images Section */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("images")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("main_image")} *</Label>
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
              <Label>{t("additional_images")} * ({t("at_least_one_required")})</Label>
              <Button type="button" variant="outline" size="sm" onClick={addImage}>
                {t("add_image")}
              </Button>
            </div>
            {errors.images && (
              <p className="text-sm text-destructive">{(errors.images as any).message}</p>
            )}
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
                  {errors.images?.[index] && (
                    <p className="text-sm text-destructive mt-1">
                      {(errors.images[index] as any)?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("basic_information")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand_id">{t("brand")}</Label>
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
            </div>

            {/* Brand Model */}
            <div className="space-y-2">
              <Label htmlFor="brand_model_id">{t("brand_model")}</Label>
              <Controller
                name="brand_model_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    placeholder={t("select_brand_model")}
                    options={brandModels.map((model: any) => ({
                      value: model.id.toString(),
                      label: model.title,
                    }))}
                    disabled={loading || brandModelsLoading || !selectedBrandId}
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
              {errors.year && (
                <p className="text-sm text-destructive">{errors.year.message}</p>
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
                <p className="text-sm text-destructive">{errors.city_id.message}</p>
              )}
            </div>
          </div>
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
        </div>

        {/* Submit */}
        <Button type="submit" disabled={pending || loading} size="lg">
          {(pending || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("add_product_variant")}
        </Button>
      </form>
    </div>
  );
}
