import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Review {
  id: number;
  user_name: string;
  user_email: string;
  product_title: string;
  rating: number;
  comment: string;
  is_active: boolean;
  created_date: string;
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
  search?: string;
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

async function getReview(id: number) {
  const response = await controlPrivateApi.get(`/reviews/show/${id}`);
  return response.data.data as Review;
}

async function deleteReview(id: number) {
  const response = await controlPrivateApi.delete(`/reviews/delete/${id}`);
  return response.data;
}

async function toggleReviewStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/reviews/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

// Query options
export const reviewsQueryOptions = (filters: ReviewsFilters) =>
  queryOptions({
    queryKey: ["reviews", filters],
    queryFn: () => getReviews(filters),
    staleTime: 5 * 60 * 1000,
  });

export const reviewQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["review", id],
    queryFn: () => getReview(id),
    enabled: !!id,
  });

// Hooks
export function useReviews(filters: ReviewsFilters) {
  return useQuery(reviewsQueryOptions(filters));
}

export function useReview(id: number) {
  return useQuery(reviewQueryOptions(id));
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useToggleReviewStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleReviewStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
