import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Trash2, Star, MapPin, BellRing, CheckCircle2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "@/components/ui/image-uploader";
import LocationPickerModal from "@/components/ui/location-picker-modal";
import { Select } from "@/components/ui/select";
import { TimeInput24 } from "@/components/ui/time-input-24";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useCountries, useCities } from "@/lib/queries/countries";
import {
  useStoreProfile,
  useUpdateStoreProfile,
  useDeleteStoreLogo,
  useDeleteStoreBanner,
  useUpdateWorkingHours,
  useSendNotificationPhoneOtp,
  useVerifyNotificationPhone,
  useDeleteNotificationPhone,
  type StoreProfile,
  type WorkingHour,
} from "@/lib/queries/store-profile";

export const Route = createFileRoute("/_app/store/")({
  component: StoreProfilePage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const LANG_LABELS: Record<number, string> = { 1: "AZ", 2: "EN", 3: "RU" };
const DEFAULT_LANG_IDS = [1, 2, 3];

const DAY_NAMES: Record<number, string> = {
  1: "Bazar ertəsi",
  2: "Çərşənbə axşamı",
  3: "Çərşənbə",
  4: "Cümə axşamı",
  5: "Cümə",
  6: "Şənbə",
  7: "Bazar",
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const translationSchema = z.object({
  language_id: z.number(),
  title: z.string().nullable().optional(),
  info: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

const profileSchema = z.object({
  translations: z.array(translationSchema).length(3),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  city_id: z.number().nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
});

const workingHourSchema = z.object({
  day_of_week: z.number(),
  is_closed: z.boolean(),
  open_time: z.string().nullable(),
  close_time: z.string().nullable(),
});

const workingHoursSchema = z.object({
  hours: z.array(workingHourSchema).length(7),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type WorkingHoursFormData = z.infer<typeof workingHoursSchema>;

interface FileData {
  file?: File | null | string;
  preview?: string;
}

// ─── Default working hours ────────────────────────────────────────────────────

function buildDefaultHours(existing: WorkingHour[]): WorkingHour[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    const found = existing.find((h) => h.day_of_week === day);
    return (
      found ?? {
        day_of_week: day,
        is_closed: day === 7,
        open_time: day === 7 ? null : "09:00",
        close_time: day === 7 ? null : "18:00",
      }
    );
  });
}

function toLocalPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/^(\+994|994)/, "").replace(/\D/g, "").slice(0, 9);
}

// ─── Component ────────────────────────────────────────────────────────────────

function StoreProfilePage() {
  const { t } = useTranslation();
  const { data: profile, isLoading, error } = useStoreProfile();

  const updateProfile = useUpdateStoreProfile();
  const deleteLogo = useDeleteStoreLogo();
  const deleteBanner = useDeleteStoreBanner();
  const updateHours = useUpdateWorkingHours();

  const [logoFile, setLogoFile] = useState<FileData>({});
  const [bannerFile, setBannerFile] = useState<FileData>({});
  const [activeLang, setActiveLang] = useState<number>(1);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  }>({ lat: 40.4093, lng: 49.8671 });
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  const { data: countries = [] } = useCountries();
  const { data: cities = [] } = useCities(selectedCountryId);

  // ── Profile form ────────────────────────────────────────────────────────────

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      translations: DEFAULT_LANG_IDS.map((id) => ({
        language_id: id,
        title: "",
        info: "",
        address: "",
      })),
      phone: "",
      email: "",
      website: "",
      city_id: null,
      latitude: "",
      longitude: "",
    },
  });

  // ── Working hours form ──────────────────────────────────────────────────────

  const hoursForm = useForm<WorkingHoursFormData>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: {
      hours: buildDefaultHours([]),
    },
  });

  // ── Populate forms when data loads ──────────────────────────────────────────

  useEffect(() => {
    if (!profile) return;

    const translationsWithDefaults = DEFAULT_LANG_IDS.map((langId) => {
      const found = profile.translations.find((t) => t.language_id === langId);
      return {
        language_id: langId,
        title: found?.title ?? "",
        info: found?.info ?? "",
        address: found?.address ?? "",
      };
    });

    const lat = profile.latitude ? parseFloat(profile.latitude) : 40.4093;
    const lng = profile.longitude ? parseFloat(profile.longitude) : 49.8671;
    setSelectedLocation({ lat, lng });

    if (profile.city?.country_id) {
      setSelectedCountryId(profile.city.country_id);
    }

    profileForm.reset({
      translations: translationsWithDefaults,
      phone: toLocalPhone(profile.phone),
      email: profile.email ?? "",
      website: profile.website ?? "",
      city_id: profile.city_id ?? null,
      latitude: profile.latitude ?? "",
      longitude: profile.longitude ?? "",
    });

    if (profile.logo) {
      setLogoFile({ file: profile.logo, preview: profile.logo });
    }
    if (profile.banner) {
      setBannerFile({ file: profile.banner, preview: profile.banner });
    }

    hoursForm.reset({
      hours: buildDefaultHours(profile.working_hours),
    });
  }, [profile]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(
      {
        translations: data.translations.map((tr) => ({
          language_id: tr.language_id,
          title: tr.title ?? null,
          info: tr.info ?? null,
          address: tr.address ?? null,
        })),
        phone: data.phone ?? null,
        email: data.email ?? null,
        website: data.website ?? null,
        city_id: data.city_id ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        logo: logoFile.file instanceof File ? logoFile.file : undefined,
        banner: bannerFile.file instanceof File ? bannerFile.file : undefined,
      },
      {
        onSuccess: () => toast.success(t("saved_successfully")),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? t("error_occurred")),
      },
    );
  };

  const onHoursSubmit = (data: WorkingHoursFormData) => {
    updateHours.mutate(
      { hours: data.hours },
      {
        onSuccess: () => toast.success(t("saved_successfully")),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? t("error_occurred")),
      },
    );
  };

  const handleDeleteLogo = () => {
    deleteLogo.mutate(undefined, {
      onSuccess: () => {
        setLogoFile({});
        toast.success(t("deleted_successfully"));
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? t("error_occurred")),
    });
  };

  const handleDeleteBanner = () => {
    deleteBanner.mutate(undefined, {
      onSuccess: () => {
        setBannerFile({});
        toast.success(t("deleted_successfully"));
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? t("error_occurred")),
    });
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setSelectedLocation({ lat, lng, address });
    profileForm.setValue("latitude", String(lat));
    profileForm.setValue("longitude", String(lng));
  };

  // ── States ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-600">{t("error_occurred")}</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const translationIndex = DEFAULT_LANG_IDS.indexOf(activeLang);

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("store_profile")}</h1>
          {profile && (
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                {profile.store_code}
              </span>
              {profile.avg_rating !== null && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {profile.avg_rating} ({profile.review_count})
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  profile.is_active
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {profile.is_active ? t("active") : t("inactive")}
              </span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t("profile_info")}</TabsTrigger>
          <TabsTrigger value="hours">{t("working_hours")}</TabsTrigger>
          <TabsTrigger value="notifications">Bildiriş nömrəsi</TabsTrigger>
        </TabsList>

        {/* ── Tab: Profile info ─────────────────────────────────────────── */}
        <TabsContent value="info">
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="mt-6 space-y-8 max-w-2xl"
          >
            {/* Logo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("logo")}</Label>
                {(logoFile.file || profile?.logo) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={handleDeleteLogo}
                    disabled={deleteLogo.isPending}
                  >
                    {deleteLogo.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <ImageUploader file={logoFile} setFile={setLogoFile} />
            </div>

            {/* Banner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("banner")}</Label>
                {(bannerFile.file || profile?.banner) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={handleDeleteBanner}
                    disabled={deleteBanner.isPending}
                  >
                    {deleteBanner.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <ImageUploader file={bannerFile} setFile={setBannerFile} />
            </div>

            {/* Translations */}
            <div className="space-y-4">
              <Label>{t("translations")}</Label>

              {/* Language selector */}
              <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                {DEFAULT_LANG_IDS.map((langId) => (
                  <button
                    key={langId}
                    type="button"
                    onClick={() => setActiveLang(langId)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeLang === langId
                        ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {LANG_LABELS[langId]}
                  </button>
                ))}
              </div>

              {translationIndex !== -1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>
                      {t("store_name")} ({LANG_LABELS[activeLang]})
                    </Label>
                    <Controller
                      name={`translations.${translationIndex}.title`}
                      control={profileForm.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder={t("store_name")}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      {t("about_store")} ({LANG_LABELS[activeLang]})
                    </Label>
                    <Controller
                      name={`translations.${translationIndex}.info`}
                      control={profileForm.control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          rows={4}
                          placeholder={t("about_store")}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      {t("address")} ({LANG_LABELS[activeLang]})
                    </Label>
                    <Controller
                      name={`translations.${translationIndex}.address`}
                      control={profileForm.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder={t("address")}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("phone")}</Label>
                <Controller
                  name="phone"
                  control={profileForm.control}
                  render={({ field }) => (
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                        +994
                      </span>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                          field.onChange(digits);
                        }}
                        inputMode="numeric"
                        placeholder="501234567"
                        className="rounded-l-none"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("email")}</Label>
                <Controller
                  name="email"
                  control={profileForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="email"
                      placeholder="store@example.com"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("website")}</Label>
                <Controller
                  name="website"
                  control={profileForm.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="url"
                      placeholder="https://example.com"
                    />
                  )}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Country */}
                <div className="space-y-1.5">
                  <Label>{t("country")}</Label>
                  <Select
                    value={selectedCountryId ? String(selectedCountryId) : ""}
                    onValueChange={(val) => {
                      const id = val ? Number(val) : null;
                      setSelectedCountryId(id);
                      profileForm.setValue("city_id", null);
                    }}
                    placeholder={t("select_country")}
                    options={countries.map((c) => ({
                      value: String(c.id),
                      label: c.title,
                    }))}
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <Label>{t("city")}</Label>
                  <Controller
                    name="city_id"
                    control={profileForm.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val) =>
                          field.onChange(val ? Number(val) : null)
                        }
                        placeholder={t("select_city")}
                        disabled={!selectedCountryId || cities.length === 0}
                        options={cities.map((c) => ({
                          value: String(c.id),
                          label: c.title,
                        }))}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("location")}</Label>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="flex w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-left">
                    {selectedLocation.address
                      ? selectedLocation.address
                      : selectedLocation.lat !== 40.4093 ||
                          selectedLocation.lng !== 49.8671
                        ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
                        : t("select_location_on_map")}
                  </span>
                </button>
                {(selectedLocation.lat !== 40.4093 ||
                  selectedLocation.lng !== 49.8671) && (
                  <p className="text-xs text-muted-foreground">
                    {selectedLocation.lat.toFixed(6)},{" "}
                    {selectedLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="min-w-[130px]"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("save")
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Tab: Working hours ────────────────────────────────────────── */}
        <TabsContent value="hours">
          <form
            onSubmit={hoursForm.handleSubmit(onHoursSubmit)}
            className="mt-6 space-y-3 max-w-2xl"
          >
            {Array.from({ length: 7 }, (_, i) => i).map((i) => {
              const isClosed = hoursForm.watch(`hours.${i}.is_closed`);

              return (
                <div
                  key={i}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:flex-row sm:items-center"
                >
                  {/* Day name */}
                  <span className="w-40 shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {DAY_NAMES[i + 1]}
                  </span>

                  {/* Closed toggle */}
                  <div className="flex items-center gap-2">
                    <Controller
                      name={`hours.${i}.is_closed`}
                      control={hoursForm.control}
                      render={({ field }) => (
                        <Switch
                          checked={!field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(!checked);
                            if (!checked) {
                              hoursForm.setValue(
                                `hours.${i}.open_time`,
                                null,
                              );
                              hoursForm.setValue(
                                `hours.${i}.close_time`,
                                null,
                              );
                            } else {
                              hoursForm.setValue(
                                `hours.${i}.open_time`,
                                "09:00",
                              );
                              hoursForm.setValue(
                                `hours.${i}.close_time`,
                                "18:00",
                              );
                            }
                          }}
                        />
                      )}
                    />
                    <span className="text-sm text-gray-500">
                      {isClosed ? t("closed") : t("open")}
                    </span>
                  </div>

                  {/* Time inputs */}
                  {!isClosed && (
                    <div className="flex flex-1 items-center gap-2">
                      <Controller
                        name={`hours.${i}.open_time`}
                        control={hoursForm.control}
                        render={({ field }) => (
                          <TimeInput24
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <span className="text-gray-400">—</span>
                      <Controller
                        name={`hours.${i}.close_time`}
                        control={hoursForm.control}
                        render={({ field }) => (
                          <TimeInput24
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateHours.isPending}
                className="min-w-[130px]"
              >
                {updateHours.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("save")
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Tab: Notification phone ───────────────────────────────────── */}
        <TabsContent value="notifications">
          {profile && <NotificationPhoneTab profile={profile} />}
        </TabsContent>
      </Tabs>

      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelect}
        initialLat={selectedLocation.lat}
        initialLng={selectedLocation.lng}
        title={t("select_location")}
      />
    </div>
  );
}

// ─── Notification phone tab ─────────────────────────────────────────────────────

function NotificationPhoneTab({ profile }: { profile: StoreProfile }) {
  const isVerified = Boolean(
    profile.notification_phone && profile.notification_phone_verified_at,
  );

  const sendOtp = useSendNotificationPhoneOtp();
  const verify = useVerifyNotificationPhone();
  const remove = useDeleteNotificationPhone();

  // Local 9-digit part; stored value is "994XXXXXXXXX".
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  // Show the entry form even when a verified number exists (to change it).
  const [editing, setEditing] = useState(false);

  const fullPhone = `994${phone}`;
  const storedLocal = toLocalPhone(profile.notification_phone);

  const handleSendOtp = () => {
    if (phone.length !== 9) {
      toast.error("Nömrə 9 rəqəm olmalıdır");
      return;
    }
    sendOtp.mutate(fullPhone, {
      onSuccess: () => {
        setOtpSent(true);
        toast.success("Təsdiq kodu göndərildi");
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? "Xəta baş verdi"),
    });
  };

  const handleVerify = () => {
    if (otp.length !== 4) {
      toast.error("Kod 4 rəqəm olmalıdır");
      return;
    }
    verify.mutate(
      { phone: fullPhone, otp: Number(otp) },
      {
        onSuccess: () => {
          setOtpSent(false);
          setEditing(false);
          setPhone("");
          setOtp("");
          toast.success("Bildiriş nömrəsi təsdiqləndi");
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? "Kod yanlışdır"),
      },
    );
  };

  const handleRemove = () => {
    remove.mutate(undefined, {
      onSuccess: () => {
        setEditing(false);
        setOtpSent(false);
        toast.success("Bildiriş nömrəsi silindi");
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? "Xəta baş verdi"),
    });
  };

  const showForm = !isVerified || editing;

  return (
    <div className="mt-6 max-w-xl space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Mağazanıza yeni sifariş gələndə bu nömrəyə SMS bildiriş göndərəcəyik.
          Nömrə SMS kodu ilə təsdiqlənməlidir.
        </p>
      </div>

      {/* Verified state */}
      {isVerified && !editing && (
        <div className="flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                +994 {storedLocal}
              </p>
              <p className="text-xs text-green-700/80 dark:text-green-400/80">
                Təsdiqlənib
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(true);
                setPhone("");
                setOtp("");
                setOtpSent(false);
              }}
            >
              Dəyiş
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={handleRemove}
              disabled={remove.isPending}
            >
              {remove.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Entry form */}
      {showForm && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bildiriş nömrəsi</Label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                +994
              </span>
              <Input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 9));
                  setOtpSent(false);
                  setOtp("");
                }}
                inputMode="numeric"
                placeholder="501234567"
                className="rounded-l-none"
                disabled={otpSent}
              />
            </div>
          </div>

          {!otpSent ? (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={sendOtp.isPending || phone.length !== 9}
                className="min-w-[130px]"
              >
                {sendOtp.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Göndərilir
                  </>
                ) : (
                  "Kod göndər"
                )}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setPhone("");
                    setOtp("");
                  }}
                >
                  Ləğv et
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Təsdiq kodu</Label>
                <Input
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  inputMode="numeric"
                  placeholder="1234"
                  className="w-40 tracking-[0.4em]"
                />
                <p className="text-xs text-muted-foreground">
                  +994 {phone} nömrəsinə göndərilən 4 rəqəmli kodu daxil edin.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleVerify}
                  disabled={verify.isPending || otp.length !== 4}
                  className="min-w-[130px]"
                >
                  {verify.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Təsdiqlənir
                    </>
                  ) : (
                    "Təsdiqlə"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSendOtp}
                  disabled={sendOtp.isPending}
                >
                  Yenidən göndər
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
