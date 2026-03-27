import { queryOptions, useQuery } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface ProductVariantInfo {
  id: number;
  uuid: string;
  slug: string;
  oem_code: string | null;
  product: { title: string } | null;
}

export interface Review {
  id: number;
  product_variant: ProductVariantInfo | null;
  rating: number;
  name: string;
  surname: string;
  review: string;
  created_at: string;
  is_approved: boolean;
  approved_at: string | null;
}

interface ReviewsResponse {
  data: Array<Review>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface ReviewsFilters {
  page: number;
  rating?: number | string;
  approved?: string;
}

// API functions
async function getReviews(filters: ReviewsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/reviews/load?${queryParams}`);
  return response.data as ReviewsResponse;
}

// Query options
export const reviewsQueryOptions = (filters: ReviewsFilters) =>
  queryOptions({
    queryKey: ["reviews", filters],
    queryFn: () => getReviews(filters),
    staleTime: 5 * 60 * 1000,
  });

// Hooks
export function useReviews(filters: ReviewsFilters) {
  return useQuery(reviewsQueryOptions(filters));
}
