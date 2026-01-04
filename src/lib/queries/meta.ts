import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Meta {
  id: number;
  page: string;
  page_title: string;
  page_key: string;
  title: string;
  description: string;
  created_user: string;
  created_date: string;
  translations?: Array<{
    language_id: number;
    title: string;
    description: string;
    keywords?: string;
  }>;
}

interface MetaResponse {
  data: Array<Meta>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateMetaRequest {
  page: string;
  translations: Array<{
    language_id: number;
    title: string;
    description?: string;
    keywords?: string;
  }>;
}

interface UpdateMetaRequest {
  page: string;
  translations: Array<{
    language_id: number;
    title: string;
    description?: string;
    keywords?: string;
  }>;
}

interface MetaFilters {
  page: number;
}

// API functions
async function getMetaList(filters: MetaFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/metas/load?${queryParams}`);
  return response.data as MetaResponse;
}

async function getMeta(id: number) {
  const response = await controlPrivateApi.get(`/metas/show/${id}`);
  return response.data.data as Meta;
}

async function createMeta(data: CreateMetaRequest) {
  const response = await controlPrivateApi.post("/metas/add", data);
  return response.data;
}

async function updateMeta(id: number, data: UpdateMetaRequest) {
  const response = await controlPrivateApi.post(`/metas/update/${id}`, data);
  return response.data;
}

async function deleteMeta(id: number) {
  const response = await controlPrivateApi.delete(`/metas/delete/${id}`);
  return response.data;
}

// Query options
export const metaListQueryOptions = (filters: MetaFilters) =>
  queryOptions({
    queryKey: ["metaList", filters],
    queryFn: () => getMetaList(filters),
    staleTime: 5 * 60 * 1000,
  });

export const metaQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["meta", id],
    queryFn: () => getMeta(id),
    enabled: !!id,
  });

// Hooks
export function useMetaList(filters: MetaFilters) {
  return useQuery(metaListQueryOptions(filters));
}

export function useMeta(id: number) {
  return useQuery(metaQueryOptions(id));
}

export function useCreateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metaList"] });
    },
  });
}

export function useUpdateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMetaRequest }) =>
      updateMeta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metaList"] });
    },
  });
}

export function useDeleteMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metaList"] });
    },
  });
}
