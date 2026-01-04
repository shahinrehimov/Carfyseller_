import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface AddressType {
  id: number;
  title: string;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface AddressTypesResponse {
  data: Array<AddressType>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateAddressTypeRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

interface UpdateAddressTypeRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

interface AddressTypesFilters {
  page: number;
}

// API functions
async function getAddressTypes(filters: AddressTypesFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/address-types/load?${queryParams}`);
  return response.data as AddressTypesResponse;
}

async function getAddressType(id: number) {
  const response = await controlPrivateApi.get(`/address-types/show/${id}`);
  return response.data.data as AddressType;
}

async function createAddressType(data: CreateAddressTypeRequest) {
  const response = await controlPrivateApi.post("/address-types/add", data);
  return response.data;
}

async function updateAddressType(id: number, data: UpdateAddressTypeRequest) {
  const response = await controlPrivateApi.post(`/address-types/update/${id}`, data);
  return response.data;
}

async function deleteAddressType(id: number) {
  const response = await controlPrivateApi.delete(`/address-types/delete/${id}`);
  return response.data;
}

async function toggleAddressTypeStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/address-types/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

// Query options
export const addressTypesQueryOptions = (filters: AddressTypesFilters) =>
  queryOptions({
    queryKey: ["addressTypes", filters],
    queryFn: () => getAddressTypes(filters),
    staleTime: 5 * 60 * 1000,
  });

export const addressTypeQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["addressType", id],
    queryFn: () => getAddressType(id),
    enabled: !!id,
  });

// Hooks
export function useAddressTypes(filters: AddressTypesFilters) {
  return useQuery(addressTypesQueryOptions(filters));
}

export function useAddressType(id: number) {
  return useQuery(addressTypeQueryOptions(id));
}

export function useCreateAddressType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddressType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressTypes"] });
    },
  });
}

export function useUpdateAddressType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAddressTypeRequest }) =>
      updateAddressType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressTypes"] });
    },
  });
}

export function useDeleteAddressType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAddressType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressTypes"] });
    },
  });
}

export function useToggleAddressTypeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleAddressTypeStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addressTypes"] });
    },
  });
}
