import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface City {
  id: number;
  title: string;
  country_id: number;
}

export interface StoreTranslation {
  language_id: number;
  title: string | null;
  info: string | null;
  address: string | null;
}

export interface WorkingHour {
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface StoreProfile {
  id: number;
  uuid: string;
  store_code: string;
  voen: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city_id: number | null;
  city: City | null;
  latitude: string | null;
  longitude: string | null;
  notification_phone: string | null;
  notification_phone_verified_at: string | null;
  verified_at: string | null;
  is_active: boolean;
  logo: string | null;
  banner: string | null;
  translations: StoreTranslation[];
  working_hours: WorkingHour[];
  avg_rating: number | null;
  review_count: number;
}

interface StoreProfileResponse {
  data: StoreProfile;
}

export interface UpdateStoreProfileRequest {
  translations: StoreTranslation[];
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  city_id?: number | null;
  latitude?: string | null;
  longitude?: string | null;
  logo?: File | null;
  banner?: File | null;
}

export interface UpdateWorkingHoursRequest {
  hours: WorkingHour[];
}

interface UpdateWorkingHoursResponse {
  data: {
    message: string;
    data: {
      working_hours: WorkingHour[];
    };
  };
}

// ─── API functions ─────────────────────────────────────────────────────────────

async function getStoreProfile() {
  const response = await controlPrivateApi.get("/store-profile/show");
  return (response.data as StoreProfileResponse).data;
}

async function updateStoreProfile(data: UpdateStoreProfileRequest) {
  const formData = new FormData();

  data.translations.forEach((translation, index) => {
    formData.append(
      `translations[${index}][language_id]`,
      String(translation.language_id),
    );
    if (translation.title !== null && translation.title !== undefined) {
      formData.append(`translations[${index}][title]`, translation.title);
    }
    if (translation.info !== null && translation.info !== undefined) {
      formData.append(`translations[${index}][info]`, translation.info);
    }
    if (translation.address !== null && translation.address !== undefined) {
      formData.append(`translations[${index}][address]`, translation.address);
    }
  });

  if (data.phone !== null && data.phone !== undefined) {
    formData.append("phone", data.phone);
  }
  if (data.email !== null && data.email !== undefined) {
    formData.append("email", data.email);
  }
  if (data.website !== null && data.website !== undefined) {
    formData.append("website", data.website);
  }
  if (data.city_id !== null && data.city_id !== undefined) {
    formData.append("city_id", String(data.city_id));
  }
  if (data.latitude !== null && data.latitude !== undefined) {
    formData.append("latitude", data.latitude);
  }
  if (data.longitude !== null && data.longitude !== undefined) {
    formData.append("longitude", data.longitude);
  }
  if (data.logo instanceof File) {
    formData.append("logo", data.logo);
  }
  if (data.banner instanceof File) {
    formData.append("banner", data.banner);
  }

  const response = await controlPrivateApi.post(
    "/store-profile/update",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

async function deleteStoreLogo() {
  const response = await controlPrivateApi.delete("/store-profile/logo");
  return response.data;
}

async function deleteStoreBanner() {
  const response = await controlPrivateApi.delete("/store-profile/banner");
  return response.data;
}

async function updateWorkingHours(data: UpdateWorkingHoursRequest) {
  const response = await controlPrivateApi.post(
    "/store-profile/working-hours",
    data,
  );
  return response.data as UpdateWorkingHoursResponse;
}

async function sendNotificationPhoneOtp(phone: string) {
  const response = await controlPrivateApi.post(
    "/store-profile/notification-phone/send-otp",
    { phone },
  );
  return response.data;
}

async function verifyNotificationPhone(data: { phone: string; otp: number }) {
  const response = await controlPrivateApi.post(
    "/store-profile/notification-phone/verify",
    data,
  );
  return response.data;
}

async function deleteNotificationPhone() {
  const response = await controlPrivateApi.delete(
    "/store-profile/notification-phone",
  );
  return response.data;
}

// ─── Query options ─────────────────────────────────────────────────────────────

export const storeProfileQueryOptions = () =>
  queryOptions({
    queryKey: ["store-profile"],
    queryFn: getStoreProfile,
    staleTime: 5 * 60 * 1000,
  });

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useStoreProfile() {
  return useQuery(storeProfileQueryOptions());
}

export function useUpdateStoreProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStoreProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-profile"] });
    },
  });
}

export function useDeleteStoreLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStoreLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-profile"] });
    },
  });
}

export function useDeleteStoreBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStoreBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-profile"] });
    },
  });
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkingHours,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-profile"] });
    },
  });
}

export function useSendNotificationPhoneOtp() {
  return useMutation({
    mutationFn: sendNotificationPhoneOtp,
  });
}

export function useVerifyNotificationPhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyNotificationPhone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-profile"] });
    },
  });
}

export function useDeleteNotificationPhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotificationPhone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-profile"] });
    },
  });
}
