import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
interface Language {
  id: number;
  key: string;
  title: string;
  is_active: boolean;
}

interface LanguagesResponse {
  data: Array<Language>;
  meta: {
    total: number;
  };
}

interface CreateLanguageRequest {
  key: string;
  title: string;
}

interface UpdateLanguageRequest {
  key: string;
  title: string;
}

interface LanguagesFilters {
  page: number;
  limit: number;
  search?: string;
}

// API functions
async function getLanguages(filters: LanguagesFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/languages/load?${queryParams}`,
  );
  return response.data as LanguagesResponse;
}

async function getLanguage(id: number) {
  const response = await controlPrivateApi.get(`/languages/show/${id}`);
  return response.data.data as Language;
}

async function createLanguage(data: CreateLanguageRequest) {
  const response = await controlPrivateApi.post("/languages/add", data);
  return response.data;
}

async function updateLanguage(id: number, data: UpdateLanguageRequest) {
  const response = await controlPrivateApi.post(
    `/languages/update/${id}`,
    data,
  );
  return response.data;
}

async function deleteLanguage(id: number) {
  const response = await controlPrivateApi.delete(`/languages/delete/${id}`);
  return response.data;
}

async function toggleLanguageStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(
    `/languages/change-active-status/${id}`,
    {
      is_active: !isActive,
    },
  );
  return response.data;
}

// Query options
export const languagesQueryOptions = (filters: LanguagesFilters) =>
  queryOptions({
    queryKey: ["languages", filters],
    queryFn: () => getLanguages(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const languageQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["language", id],
    queryFn: () => getLanguage(id),
    enabled: !!id,
  });

// Hooks
export function useLanguages(filters: LanguagesFilters) {
  return useQuery(languagesQueryOptions(filters));
}

export function useLanguage(id: number) {
  return useQuery(languageQueryOptions(id));
}

export function useCreateLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLanguage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
    },
  });
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLanguageRequest }) =>
      updateLanguage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
    },
  });
}

export function useDeleteLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLanguage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
    },
  });
}

export function useToggleLanguageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleLanguageStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["languages"] });
    },
  });
}
