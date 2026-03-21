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
  uuid?: string;
  slug: string;
  title: string;
  oem_code: string | null;
  year: number | null;
  brand_model: { id: number; title: string } | null;
  options: Array<{
    id: number;
    option: {
      id: number;
      title: string;
      is_required: boolean;
      is_translatable: boolean;
      has_items: boolean;
      items?: Array<{ id: number; title: string }>;
    };
    value: any;
    translations?: Array<{ language_id: number; translatable_value: string }>;
  }>;
  main_image: string | null;
  hover_image: string | null;
  images: { urls: string[]; media_ids: number[] } | null;
  price: string | null;
  price_final: string | null;
  stock: number;
  discount: string | null;
  discount_type: string | null;
  discount_start_at: string | null;
  discount_end_at: string | null;
  city: { id: number; title: string } | null;
  is_active: boolean;
  approval_status: string;
  approval_status_label?: string;
  product: { id: number; title: string; brand?: { id: number; title: string } } | null;
  created_date: string;
}

export interface CatalogSearchItem {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  oem_code: string | null;
  year: number | null;
  brand_model: { id: number; title: string } | null;
  options: Array<any>;
  is_creator: boolean;
  already_attached: boolean;
  seller_listing: {
    id: number;
    uuid: string;
    price: number;
    price_final: number;
    stock: number;
    discount_type: string | null;
    discount: number;
    discount_start_at: string | null;
    discount_end_at: string | null;
    city_id: number | null;
    is_active: boolean;
    approval_status: string;
  } | null;
  main_image: string | null;
  hover_image: string | null;
  product: {
    id: number;
    uuid: string;
    slug: string;
    title: string;
    main_image: string | null;
    hover_image: string | null;
    is_set: boolean;
    is_active: boolean;
    created_date: string;
  } | null;
  is_set: boolean;
  stock: number;
  price: number;
  price_final: number;
  discount_type: string | null;
  discount_type_title: string | null;
  discount: number;
  is_default: boolean;
  is_active: boolean;
  approval_status: string;
  approval_status_label: string;
  approval_status_message: string | null;
  created_date: string;
}

export interface CatalogSearchResponse {
  search_token: string;
  data: CatalogSearchItem[];
}

export interface CompanyProductVariant {
  id: number;
  uuid: string;
  variant: {
    id: number;
    uuid: string;
    slug: string;
    oem_code: string | null;
    title: string;
    main_image: string | null;
    hover_image: string | null;
    is_set: boolean;
    brand_model: { id: number; title: string } | null;
    year: number | null;
    product: {
      id: number;
      uuid: string;
      slug: string;
      title: string;
      main_image: string | null;
      hover_image: string | null;
      is_set: boolean;
      is_active: boolean;
      created_date: string;
    } | null;
  };
  stock: number;
  price: number;
  price_final: number;
  discount: number | null;
  discount_type: string | null;
  discount_type_title: string | null;
  discount_start_at: string | null;
  discount_end_at: string | null;
  city: { id: number; title: string; country_id?: number } | null;
  approval_status: string;
  approval_status_label?: string;
  approval_status_message: string | null;
  is_active: boolean;
  seller_images: Array<{ id: number; url: string }>;
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

interface CompanyProductVariantsResponse {
  data: Array<CompanyProductVariant>;
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
  product_id?: number;
  search?: string;
  oem_code?: string;
  limit?: number;
}

interface CompanyProductVariantsFilters {
  page: number;
  search?: string;
  product_id?: number;
  approval_status?: string;
  limit?: number;
}

interface CatalogSearchFilters {
  search?: string;
  brand_model_id?: number;
  year?: number;
  oem_code?: string;
  product_id?: number;
  limit?: number;
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

// API functions - Product Variants (Catalog)
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
  const response = await controlPrivateApi.post(
    `/product-variants/change-active-status/${id}`,
    { is_active: !isActive }
  );
  return response.data;
}

export async function searchCatalog(filters: CatalogSearchFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/product-variants/search-catalog?${queryParams}`
  );
  return response.data as CatalogSearchResponse;
}

// API functions - Company Product Variants (Listings)
async function getCompanyProductVariants(filters: CompanyProductVariantsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/company-product-variants/load?${queryParams}`
  );
  return response.data as CompanyProductVariantsResponse;
}

async function getCompanyProductVariant(id: number) {
  const response = await controlPrivateApi.get(`/company-product-variants/show/${id}`);
  return response.data.data as CompanyProductVariant;
}

async function detachCompanyProductVariant(id: number) {
  const response = await controlPrivateApi.delete(
    `/company-product-variants/detach/${id}`
  );
  return response.data;
}

async function toggleCompanyProductVariantStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(
    `/company-product-variants/change-active-status/${id}`,
    { is_active: !isActive }
  );
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

// Query options - Company Product Variants
export const companyProductVariantsQueryOptions = (filters: CompanyProductVariantsFilters) =>
  queryOptions({
    queryKey: ["companyProductVariants", filters],
    queryFn: () => getCompanyProductVariants(filters),
    staleTime: 5 * 60 * 1000,
  });

export const companyProductVariantQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["companyProductVariant", id],
    queryFn: () => getCompanyProductVariant(id),
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

// Hooks - Company Product Variants
export function useCompanyProductVariants(filters: CompanyProductVariantsFilters) {
  return useQuery(companyProductVariantsQueryOptions(filters));
}

export function useCompanyProductVariant(id: number) {
  return useQuery(companyProductVariantQueryOptions(id));
}

export function useDetachCompanyProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: detachCompanyProductVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProductVariants"] });
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
    },
  });
}

export function useToggleCompanyProductVariantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleCompanyProductVariantStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProductVariants"] });
    },
  });
}

export function useAttachProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ variantId, data }: { variantId: number; data: FormData }) => {
      const response = await controlPrivateApi.post(
        `/company-product-variants/attach/${variantId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProductVariants"] });
    },
  });
}
