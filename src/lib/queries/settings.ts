import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Setting {
  id: number;
  key: string;
  type: string;
  value: string;
  created_user: string;
  created_date: string;
}

interface SettingsResponse {
  data: Array<Setting>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateSettingRequest {
  key: string;
  value: string;
}

interface UpdateSettingRequest {
  key: string;
  value: string;
}

interface SettingsFilters {
  page: number;
}

// API functions
async function getSettings(filters: SettingsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/settings/load?${queryParams}`);
  return response.data as SettingsResponse;
}

async function getSetting(key: string) {
  const response = await controlPrivateApi.get(`/settings/show/${key}`);
  return response.data.data as Setting;
}

async function createSetting(data: CreateSettingRequest | FormData) {
  const response = await controlPrivateApi.post("/settings/add", data);
  return response.data;
}

async function updateSetting(
  key: string,
  data: UpdateSettingRequest | FormData,
) {
  const response = await controlPrivateApi.post(
    `/settings/update/${key}`,
    data,
  );
  return response.data;
}

async function deleteSetting(key: string) {
  const response = await controlPrivateApi.delete(`/settings/delete/${key}`);
  return response.data;
}

// Query options
export const settingsQueryOptions = (filters: SettingsFilters) =>
  queryOptions({
    queryKey: ["settings", filters],
    queryFn: () => getSettings(filters),
    staleTime: 5 * 60 * 1000,
  });

export const settingQueryOptions = (key: string) =>
  queryOptions({
    queryKey: ["setting", key],
    queryFn: () => getSetting(key),
    enabled: !!key,
  });

// Hooks
export function useSettings(filters: SettingsFilters) {
  return useQuery(settingsQueryOptions(filters));
}

export function useSetting(key: string) {
  return useQuery(settingQueryOptions(key));
}

export function useCreateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      data,
    }: {
      key: string;
      data: UpdateSettingRequest | FormData;
    }) => updateSetting(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
