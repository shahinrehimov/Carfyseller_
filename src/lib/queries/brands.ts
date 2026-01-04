import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Brand {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface BrandsResponse {
  data: Array<Brand>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateBrandRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  slug?: string;
  sort: number;
  image: File;
}

interface UpdateBrandRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  slug?: string;
  sort: number;
  image?: File;
}

interface BrandsFilters {
  page: number;
  search?: string;
}

// API functions
async function getBrands(filters: BrandsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/brands/load?${queryParams}`);
  return response.data as BrandsResponse;
}

async function getBrand(id: number) {
  const response = await controlPrivateApi.get(`/brands/show/${id}`);
  return response.data.data as Brand;
}

async function createBrand(data: CreateBrandRequest) {
  const formData = new FormData();

  data.translations.forEach((translation, index) => {
    formData.append(`translations[${index}][language_id]`, String(translation.language_id));
    formData.append(`translations[${index}][title]`, translation.title);
  });

  if (data.slug) formData.append("slug", data.slug);
  formData.append("sort", String(data.sort));
  formData.append("image", data.image);

  const response = await controlPrivateApi.post("/brands/add", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function updateBrand(id: number, data: UpdateBrandRequest) {
  const formData = new FormData();

  data.translations.forEach((translation, index) => {
    formData.append(`translations[${index}][language_id]`, String(translation.language_id));
    formData.append(`translations[${index}][title]`, translation.title);
  });

  if (data.slug) formData.append("slug", data.slug);
  formData.append("sort", String(data.sort));
  if (data.image) formData.append("image", data.image);

  const response = await controlPrivateApi.post(`/brands/update/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function deleteBrand(id: number) {
  const response = await controlPrivateApi.delete(`/brands/delete/${id}`);
  return response.data;
}

async function deleteBrandImage(id: number) {
  const response = await controlPrivateApi.delete(`/brands/delete-image/${id}`);
  return response.data;
}

async function toggleBrandStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/brands/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

async function changeBrandSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(`/brands/change-sorting/${id}`, {
    sort,
  });
  return response.data;
}

// Query options
export const brandsQueryOptions = (filters: BrandsFilters) =>
  queryOptions({
    queryKey: ["brands", filters],
    queryFn: () => getBrands(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const brandQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["brand", id],
    queryFn: () => getBrand(id),
    enabled: !!id,
  });

// Hooks
export function useBrands(filters: BrandsFilters) {
  return useQuery(brandsQueryOptions(filters));
}

export function useBrand(id: number) {
  return useQuery(brandQueryOptions(id));
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBrandRequest }) => updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useDeleteBrandImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBrandImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useToggleBrandStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleBrandStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useChangeBrandSorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) => changeBrandSorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}
