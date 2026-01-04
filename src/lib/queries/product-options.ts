import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface ProductOption {
  id: number;
  title: string;
  is_required: boolean;
  sort: number;
  is_active: boolean;
  items_count: number;
  created_user: string;
  created_date: string;
}

export interface ProductOptionItem {
  id: number;
  product_option_id: number;
  title: string;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface ProductOptionsResponse {
  data: Array<ProductOption>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface ProductOptionItemsResponse {
  data: Array<ProductOptionItem>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateProductOptionRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  is_required: boolean;
  sort: number;
}

interface UpdateProductOptionRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  is_required: boolean;
  sort: number;
}

interface CreateProductOptionItemRequest {
  product_option_id: number;
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  sort: number;
}

interface UpdateProductOptionItemRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  sort: number;
}

interface ProductOptionsFilters {
  page: number;
  search?: string;
}

interface ProductOptionItemsFilters {
  page: number;
  product_option_id: number;
}

// API functions - Product Options
async function getProductOptions(filters: ProductOptionsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/product-options/load?${queryParams}`);
  return response.data as ProductOptionsResponse;
}

async function getProductOption(id: number) {
  const response = await controlPrivateApi.get(`/product-options/show/${id}`);
  return response.data.data as ProductOption;
}

async function createProductOption(data: CreateProductOptionRequest) {
  const response = await controlPrivateApi.post("/product-options/add", data);
  return response.data;
}

async function updateProductOption(id: number, data: UpdateProductOptionRequest) {
  const response = await controlPrivateApi.post(`/product-options/update/${id}`, data);
  return response.data;
}

async function deleteProductOption(id: number) {
  const response = await controlPrivateApi.delete(`/product-options/delete/${id}`);
  return response.data;
}

async function toggleProductOptionStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/product-options/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

async function changeProductOptionSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(`/product-options/change-sorting/${id}`, {
    sort,
  });
  return response.data;
}

// API functions - Product Option Items
async function getProductOptionItems(filters: ProductOptionItemsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/product-option-items/load?${queryParams}`);
  return response.data as ProductOptionItemsResponse;
}

async function getProductOptionItem(id: number) {
  const response = await controlPrivateApi.get(`/product-option-items/show/${id}`);
  return response.data.data as ProductOptionItem;
}

async function createProductOptionItem(data: CreateProductOptionItemRequest) {
  const response = await controlPrivateApi.post("/product-option-items/add", data);
  return response.data;
}

async function updateProductOptionItem(id: number, data: UpdateProductOptionItemRequest) {
  const response = await controlPrivateApi.post(`/product-option-items/update/${id}`, data);
  return response.data;
}

async function deleteProductOptionItem(id: number) {
  const response = await controlPrivateApi.delete(`/product-option-items/delete/${id}`);
  return response.data;
}

async function toggleProductOptionItemStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(
    `/product-option-items/change-active-status/${id}`,
    {
      is_active: !isActive,
    }
  );
  return response.data;
}

async function changeProductOptionItemSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(`/product-option-items/change-sorting/${id}`, {
    sort,
  });
  return response.data;
}

// Query options - Product Options
export const productOptionsQueryOptions = (filters: ProductOptionsFilters) =>
  queryOptions({
    queryKey: ["productOptions", filters],
    queryFn: () => getProductOptions(filters),
    staleTime: 5 * 60 * 1000,
  });

export const productOptionQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["productOption", id],
    queryFn: () => getProductOption(id),
    enabled: !!id,
  });

// Query options - Product Option Items
export const productOptionItemsQueryOptions = (filters: ProductOptionItemsFilters) =>
  queryOptions({
    queryKey: ["productOptionItems", filters],
    queryFn: () => getProductOptionItems(filters),
    staleTime: 5 * 60 * 1000,
  });

export const productOptionItemQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["productOptionItem", id],
    queryFn: () => getProductOptionItem(id),
    enabled: !!id,
  });

// Hooks - Product Options
export function useProductOptions(filters: ProductOptionsFilters) {
  return useQuery(productOptionsQueryOptions(filters));
}

export function useProductOption(id: number) {
  return useQuery(productOptionQueryOptions(id));
}

export function useCreateProductOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useUpdateProductOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductOptionRequest }) =>
      updateProductOption(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useDeleteProductOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProductOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useToggleProductOptionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleProductOptionStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useChangeProductOptionSorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      changeProductOptionSorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

// Hooks - Product Option Items
export function useProductOptionItems(filters: ProductOptionItemsFilters) {
  return useQuery(productOptionItemsQueryOptions(filters));
}

export function useProductOptionItem(id: number) {
  return useQuery(productOptionItemQueryOptions(id));
}

export function useCreateProductOptionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductOptionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useUpdateProductOptionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductOptionItemRequest }) =>
      updateProductOptionItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
    },
  });
}

export function useDeleteProductOptionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProductOptionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useToggleProductOptionItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleProductOptionItemStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
    },
  });
}

export function useChangeProductOptionItemSorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      changeProductOptionItemSorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
    },
  });
}
