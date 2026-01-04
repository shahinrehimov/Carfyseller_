import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Social {
  id: number;
  key: string;
  link: string;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface SocialsResponse {
  data: Array<Social>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateSocialRequest {
  key: string;
  link: string;
}

interface UpdateSocialRequest {
  key: string;
  link: string;
}

interface SocialsFilters {
  page: number;
}

// API functions
async function getSocials(filters: SocialsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/socials/load?${queryParams}`);
  return response.data as SocialsResponse;
}

async function getSocial(id: number) {
  const response = await controlPrivateApi.get(`/socials/show/${id}`);
  return response.data.data as Social;
}

async function createSocial(data: CreateSocialRequest) {
  const response = await controlPrivateApi.post("/socials/add", data);
  return response.data;
}

async function updateSocial(id: number, data: UpdateSocialRequest) {
  const response = await controlPrivateApi.post(`/socials/update/${id}`, data);
  return response.data;
}

async function deleteSocial(id: number) {
  const response = await controlPrivateApi.delete(`/socials/delete/${id}`);
  return response.data;
}

async function toggleSocialStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/socials/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

// Query options
export const socialsQueryOptions = (filters: SocialsFilters) =>
  queryOptions({
    queryKey: ["socials", filters],
    queryFn: () => getSocials(filters),
    staleTime: 5 * 60 * 1000,
  });

export const socialQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["social", id],
    queryFn: () => getSocial(id),
    enabled: !!id,
  });

// Hooks
export function useSocials(filters: SocialsFilters) {
  return useQuery(socialsQueryOptions(filters));
}

export function useSocial(id: number) {
  return useQuery(socialQueryOptions(id));
}

export function useCreateSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSocial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socials"] });
    },
  });
}

export function useUpdateSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSocialRequest }) => updateSocial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socials"] });
    },
  });
}

export function useDeleteSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSocial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socials"] });
    },
  });
}

export function useToggleSocialStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleSocialStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socials"] });
    },
  });
}
