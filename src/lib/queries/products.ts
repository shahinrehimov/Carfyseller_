import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Product {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  main_image: string | null;
  hover_image: string | null;
  images: { urls: string[]; media_ids: number[] };
  is_set: boolean;
  brand_id: number | null;
  brand: {
    id: number;
    uuid: string;
    slug: string;
    title: string;
  } | null;
  main_category: {
    id: number;
    uuid: string;
    slug: string;
    title: string;
    parent: null | { id: number; uuid: string; slug: string; title: string };
  } | null;
  categories: Array<{
    id: number;
    uuid: string;
    slug: string;
    title: string;
  }>;
  groups: Array<any>;
  variants_count: number;
  variants: Array<{
    id: number;
    uuid: string;
    slug: string;
    is_set: boolean;
    is_default: boolean;
    sets?: Array<{
      id: number;
      uuid: string;
      slug: string;
      quantity: number;
      product: {
        id: number;
        title: string;
        main_image: string | null;
        slug: string;
      };
    }>;
  }>;
  translations: Array<{
    language_id: number;
    title: string;
    description_short: string;
    description: string;
    delivery: string;
    note: string;
  }>;
  price: number | null;
  stock: number;
  has_discount: boolean;
  discount: number | null;
  discount_type: string | null;
  discount_start_at: string | null;
  discount_end_at: string | null;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: number;
  discount_price: number | null;
  stock: number;
  is_active: boolean;
  created_date: string;
}

interface ProductsResponse {
  data: Array<Product>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface ProductVariantsResponse {
  data: Array<ProductVariant>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface ProductsFilters {
  page: number;
  search?: string;
}

interface ProductVariantsFilters {
  page: number;
  product_id: number;
}

// API functions - Products
async function getProducts(filters: ProductsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/products/load?${queryParams}`);
  return response.data as ProductsResponse;
}

async function getProduct(id: number) {
  const response = await controlPrivateApi.get(`/products/show/${id}`);
  return response.data.data as Product;
}

async function deleteProduct(id: number) {
  const response = await controlPrivateApi.delete(`/products/delete/${id}`);
  return response.data;
}

async function toggleProductStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/products/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

async function toggleProductFeatured(id: number, isFeatured: boolean) {
  const response = await controlPrivateApi.post(`/products/change-featured-status/${id}`, {
    is_featured: !isFeatured,
  });
  return response.data;
}

// API functions - Product Variants
async function getProductVariants(filters: ProductVariantsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/product-variants/load?${queryParams}`);
  return response.data as ProductVariantsResponse;
}

async function getProductVariant(id: number) {
  const response = await controlPrivateApi.get(`/product-variants/show/${id}`);
  return response.data.data as ProductVariant;
}

async function deleteProductVariant(id: number) {
  const response = await controlPrivateApi.delete(`/product-variants/delete/${id}`);
  return response.data;
}

async function toggleProductVariantStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/product-variants/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

// Query options - Products
export const productsQueryOptions = (filters: ProductsFilters) =>
  queryOptions({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });

export const productQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

// Query options - Product Variants
export const productVariantsQueryOptions = (filters: ProductVariantsFilters) =>
  queryOptions({
    queryKey: ["productVariants", filters],
    queryFn: () => getProductVariants(filters),
    staleTime: 5 * 60 * 1000,
  });

export const productVariantQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["productVariant", id],
    queryFn: () => getProductVariant(id),
    enabled: !!id,
  });

// Hooks - Products
export function useProducts(filters: ProductsFilters) {
  return useQuery(productsQueryOptions(filters));
}

export function useProduct(id: number) {
  return useQuery(productQueryOptions(id));
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleProductStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useToggleProductFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: number; isFeatured: boolean }) =>
      toggleProductFeatured(id, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Hooks - Product Variants
export function useProductVariants(filters: ProductVariantsFilters) {
  return useQuery(productVariantsQueryOptions(filters));
}

export function useProductVariant(id: number) {
  return useQuery(productVariantQueryOptions(id));
}

export function useDeleteProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProductVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useToggleProductVariantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleProductVariantStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
    },
  });
}
