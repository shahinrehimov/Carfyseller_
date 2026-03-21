import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { controlApi } from "@/lib/axios/controlApi";
import { useTheme } from "@/components/themes/provider";
import { useTranslation } from "@/lib/utils/translationLoader";
import { Link } from "@tanstack/react-router";
import LocationPickerModal from "@/components/ui/location-picker-modal";
import { useCountries, useCities } from "@/lib/queries/countries";

const registerPageSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/register")({
  component: RouteComponent,
  validateSearch: zodValidator(registerPageSchema),
});

const RegisterFormSchema = z
  .object({
    // Company fields
    voen: z.string().min(1, "VOEN is required"),
    company_phone: z.string().min(1, "Company phone is required"),
    company_email: z.string().email("Invalid email format"),
    latitude: z.number(),
    longitude: z.number(),
    city_id: z.number({ required_error: "City is required" }).min(1, "City is required"),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),

    // Company translations (main language)
    company_title: z.string().min(1, "Company name is required"),
    company_info: z.string().optional(),
    company_address: z.string().min(1, "Company address is required"),

    // Admin fields
    username: z.string().min(3, "Username must be at least 3 characters"),
    admin_email: z.string().email("Invalid email format"),
    name: z.string().min(1, "First name is required"),
    surname: z.string().min(1, "Last name is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z
      .string()
      .min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type RegisterFormSchema = z.infer<typeof RegisterFormSchema>;

function RouteComponent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  }>({
    lat: 40.4093,
    lng: 49.8671,
  });
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  const { data: countries = [] } = useCountries();
  const { data: cities = [] } = useCities(selectedCountryId);

  const form = useForm<RegisterFormSchema>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      latitude: 40.4093,
      longitude: 49.8671,
    },
  });

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setSelectedLocation({ lat, lng, address });
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
    if (address && !form.getValues("company_address")) {
      form.setValue("company_address", address);
    }
  };

  const register = useMutation({
    mutationFn: async (formData: RegisterFormSchema) => {
      // Transform form data to API payload format
      const payload = {
        device_type: "web",
        company: {
          voen: formData.voen,
          phone: formData.company_phone,
          email: formData.company_email,
          latitude: formData.latitude,
          longitude: formData.longitude,
          city_id: formData.city_id,
          website: formData.website || null,
          translations: [
            {
              language_id: 1,
              title: formData.company_title,
              info: formData.company_info || null,
              address: formData.company_address,
            },
            {
              language_id: 2,
              title: null,
              info: null,
              address: null,
            },
            {
              language_id: 3,
              title: null,
              info: null,
              address: null,
            },
          ],
        },
        admin: {
          username: formData.username,
          email: formData.admin_email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          name: formData.name,
          surname: formData.surname,
        },
      };

      const response = await controlApi.post("/register", payload);
      return response.data;
    },
    onSuccess() {
      toast.success(t("registration_successful"));
      navigate({ to: "/auth/signin" });
    },
    async onError(error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data.message || t("registration_failed"));
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
        </div>

        {/* Form Container with Border */}
        <div
          className={`rounded-lg border ${
            isDark
              ? "border-gray-700 bg-gray-800/50"
              : "border-gray-200 bg-white"
          } p-8 shadow-sm`}
        >
          <h1
            className={`mb-6 text-center text-2xl font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {t("register_company")}
          </h1>

          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((formData) => {
              if (register.isPending) return;
              register.mutate(formData);
            })}
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h2
                  className={`mb-4 text-lg font-medium ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {t("company_information")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder={`${t("company_name")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("company_title")}
                    />
                    {form.formState.errors.company_title && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.company_title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={`${t("voen")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("voen")}
                    />
                    {form.formState.errors.voen && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.voen.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={`${t("phone")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("company_phone")}
                    />
                    {form.formState.errors.company_phone && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.company_phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder={`${t("email")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("company_email")}
                    />
                    {form.formState.errors.company_email && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.company_email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={`${t("address")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("company_address")}
                    />
                    {form.formState.errors.company_address && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.company_address.message}
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div>
                    <select
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white"
                          : "border-gray-300 bg-white text-black"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      value={selectedCountryId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setSelectedCountryId(val);
                        form.setValue("city_id", undefined as unknown as number);
                      }}
                    >
                      <option value="">{t("select_country")}</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <select
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white"
                          : "border-gray-300 bg-white text-black"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
                      disabled={!selectedCountryId}
                      {...form.register("city_id", { valueAsNumber: true })}
                    >
                      <option value="">{t("select_city")}</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                    {form.formState.errors.city_id && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.city_id.message}
                      </p>
                    )}
                  </div>

                  {/* Map Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsMapOpen(true)}
                      className={`flex w-full items-center justify-center gap-2 rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      } px-4 py-3 transition-colors`}
                    >
                      <MapPin className="h-5 w-5" />
                      {selectedLocation.address
                        ? t("change_location")
                        : t("select_location_on_map")}
                    </button>
                    {selectedLocation.address && (
                      <p
                        className={`mt-2 text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {t("selected")}: {selectedLocation.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <textarea
                      placeholder={`${t("company_info")} (${t("optional")})`}
                      rows={3}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("company_info")}
                    />
                  </div>

                  <div>
                    <input
                      type="url"
                      placeholder={`${t("website")} (${t("optional")})`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("website")}
                    />
                    {form.formState.errors.website && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.website.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h2
                  className={`mb-4 text-lg font-medium ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {t("admin_account")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder={`${t("name")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={`${t("surname")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("surname")}
                    />
                    {form.formState.errors.surname && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.surname.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder={`${t("username")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("username")}
                    />
                    {form.formState.errors.username && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="email"
                      placeholder={`${t("email")} *`}
                      className={`w-full rounded-md border ${
                        isDark
                          ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                          : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                      } focus:border-primary px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      {...form.register("admin_email")}
                    />
                    {form.formState.errors.admin_email && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.admin_email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={`${t("password")} *`}
                        className={`w-full rounded-md border ${
                          isDark
                            ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                            : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                        } focus:border-primary px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        {...form.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                          isDark
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {form.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <input
                        type={showPasswordConfirm ? "text" : "password"}
                        placeholder={`${t("confirm_password")} *`}
                        className={`w-full rounded-md border ${
                          isDark
                            ? "border-gray-600 bg-gray-800 text-white placeholder:text-gray-400"
                            : "border-gray-300 bg-white text-black placeholder:text-gray-500"
                        } focus:border-primary px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        {...form.register("password_confirmation")}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswordConfirm(!showPasswordConfirm)
                        }
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                          isDark
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {showPasswordConfirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {form.formState.errors.password_confirmation && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.password_confirmation.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={register.isPending}
              className="bg-primary hover:bg-primary/90 w-full rounded-md py-3 font-medium text-white transition-colors disabled:opacity-50"
            >
              {register.isPending ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                t("register")
              )}
            </button>

            {/* Link to Login */}
            <div className="text-center">
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {t("already_have_account")}{" "}
                <Link
                  to="/auth/signin"
                  className="text-primary hover:text-primary/90 font-medium"
                >
                  {t("sign_in")}
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Location Picker Modal */}
        <LocationPickerModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onSelectLocation={handleLocationSelect}
          initialLat={selectedLocation.lat}
          initialLng={selectedLocation.lng}
          title={t("select_location")}
        />
      </div>
    </div>
  );
}
