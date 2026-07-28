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
  is_creator: boolean;
  created_user: string;
  created_date: string;
}

/**
 * One "fits this car" rule. null means "all": no brand fits every car, a brand
 * without a model fits all of its models, and an open year bound is
 * unrestricted on that side.
 */
export interface DisplayFitment {
  brand: { id: number; title: string } | null;
  brand_model: { id: number; title: string } | null;
  year_from: number | null;
  year_to: number | null;
}

export interface CatalogSearchItem {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  oem_code: string | null;
  /** @deprecated use year_from / year_to */
  year: number | null;
  year_from: number | null;
  year_to: number | null;
  /** @deprecated derived from fitments */
  brand_models: Array<{ id: number; title: string; brand_id?: number }>;
  fitments: DisplayFitment[];
  is_universal: boolean;
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
    main_category: {
      id: number;
      uuid: string;
      slug: string;
      title: string;
    } | null;
    categories: Array<{
      id: number;
      uuid: string;
      slug: string;
      title: string;
    }>;
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

interface ProductsResponse {
  data: Array<Product>;
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

// API functions - Catalog search (for attaching seller listings)
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

// Hooks - Company Product Variants (attach seller listing to catalog)
export function useAttachProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ variantId, data, searchToken }: { variantId: number; data: FormData; searchToken: string }) => {
      const response = await controlPrivateApi.post(
        `/company-product-variants/attach/${variantId}`,
        data,
        { headers: { 'X-Search-Token': searchToken } },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProductVariants"] });
    },
  });
}
