import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Slider {
  id: number;
  title: string;
  slug: string;
  type: string;
  height: number;
  mobile_height: number;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface SlidersResponse {
  data: Array<Slider>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface SlidersFilters {
  page: number;
  search?: string;
}

// API functions
async function getSliders(filters: SlidersFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/sliders/load?${queryParams}`);
  return response.data as SlidersResponse;
}

async function getSlider(id: number) {
  const response = await controlPrivateApi.get(`/sliders/show/${id}`);
  return response.data.data as Slider;
}

async function deleteSlider(id: number) {
  const response = await controlPrivateApi.delete(`/sliders/delete/${id}`);
  return response.data;
}

async function toggleSliderStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/sliders/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

async function changeSliderSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(`/sliders/change-sorting/${id}`, {
    sort,
  });
  return response.data;
}

// Query options
export const slidersQueryOptions = (filters: SlidersFilters) =>
  queryOptions({
    queryKey: ["sliders", filters],
    queryFn: () => getSliders(filters),
    staleTime: 5 * 60 * 1000,
  });

export const sliderQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["slider", id],
    queryFn: () => getSlider(id),
    enabled: !!id,
  });

// Hooks
export function useSliders(filters: SlidersFilters) {
  return useQuery(slidersQueryOptions(filters));
}

export function useSlider(id: number) {
  return useQuery(sliderQueryOptions(id));
}

export function useDeleteSlider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSlider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sliders"] });
    },
  });
}

export function useToggleSliderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleSliderStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sliders"] });
    },
  });
}

export function useChangeSliderSorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) => changeSliderSorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sliders"] });
    },
  });
}
