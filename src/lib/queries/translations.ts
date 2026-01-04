import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
interface Translation {
  key: string;
  group: string;
  [key: string]: string; // For dynamic language fields like lang_en, lang_fr, etc.
}

interface Language {
  id: number;
  key: string;
  title: string;
  is_active: boolean;
}

interface TranslationsResponse {
  data: {
    translations: Array<Translation>;
    languages: Array<Language>;
  };
}

interface CreateTranslationRequest {
  key: string;
  group: string;
  translations: Array<{
    language_id: number;
    text: string;
  }>;
}

interface UpdateTranslationRequest {
  translations: Array<{
    language_id: number;
    group: string;
    key: string;
    text: string;
  }>;
}

interface TranslationsFilters {
  group?: string;
  key?: string;
  text?: string;
}

// API functions
async function getTranslations(filters: TranslationsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/translations/load?${queryParams}`,
  );
  return response.data as TranslationsResponse;
}

async function createTranslation(data: CreateTranslationRequest) {
  const response = await controlPrivateApi.post("/translations/add", data);
  return response.data;
}

async function updateTranslation(
  group: string,
  key: string,
  data: UpdateTranslationRequest,
) {
  const response = await controlPrivateApi.post(
    `/translations/update/${group}/${key}`,
    data,
  );
  return response.data;
}

async function deleteTranslation(group: string, key: string) {
  const response = await controlPrivateApi.delete(
    `/translations/delete/${group}/${key}`,
  );
  return response.data;
}

// Query options
export const translationsQueryOptions = (filters: TranslationsFilters) =>
  queryOptions({
    queryKey: ["translations", filters],
    queryFn: () => getTranslations(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

// Hooks
export function useTranslations(filters: TranslationsFilters) {
  return useQuery(translationsQueryOptions(filters));
}

export function useCreateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTranslation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
    },
  });
}

export function useUpdateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      group,
      key,
      data,
    }: {
      group: string;
      key: string;
      data: UpdateTranslationRequest;
    }) => updateTranslation(group, key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
    },
  });
}

export function useDeleteTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ group, key }: { group: string; key: string }) =>
      deleteTranslation(group, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
    },
  });
}
