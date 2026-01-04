import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  gender: string | null;
  gender_label: string;
  birth_date: string | null;
  is_active: boolean;
  email_is_verified: boolean;
  email_verified_at: string | null;
  created_date: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  type_title: string;
  address: string;
  city: string;
  country: string;
  created_date: string;
}

interface UsersResponse {
  data: Array<User>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface UserAddressesResponse {
  data: Array<UserAddress>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface UsersFilters {
  page: number;
  search?: string;
}

interface UserAddressesFilters {
  page: number;
  user_id: number;
}

// API functions - Users
async function getUsers(filters: UsersFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/users/load?${queryParams}`);
  return response.data as UsersResponse;
}

async function getUser(id: number) {
  const response = await controlPrivateApi.get(`/users/show/${id}`);
  return response.data.data as User;
}

async function deleteUser(id: number) {
  const response = await controlPrivateApi.delete(`/users/delete/${id}`);
  return response.data;
}

async function toggleUserStatus(id: number) {
  const response = await controlPrivateApi.post(`/users/change-active-status/${id}`);
  return response.data;
}

// API functions - User Addresses
async function getUserAddresses(filters: UserAddressesFilters) {
  const { user_id, page } = filters;
  const response = await controlPrivateApi.get(`/users/${user_id}/addresses/load?page=${page}`);
  return response.data as UserAddressesResponse;
}

async function deleteUserAddress(userId: number, addressId: number) {
  const response = await controlPrivateApi.delete(`/users/${userId}/addresses/delete/${addressId}`);
  return response.data;
}

// Query options - Users
export const usersQueryOptions = (filters: UsersFilters) =>
  queryOptions({
    queryKey: ["users", filters],
    queryFn: () => getUsers(filters),
    staleTime: 5 * 60 * 1000,
  });

export const userQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });

// Query options - User Addresses
export const userAddressesQueryOptions = (filters: UserAddressesFilters) =>
  queryOptions({
    queryKey: ["userAddresses", filters],
    queryFn: () => getUserAddresses(filters),
    staleTime: 5 * 60 * 1000,
  });

// Hooks - Users
export function useUsers(filters: UsersFilters) {
  return useQuery(usersQueryOptions(filters));
}

export function useUser(id: number) {
  return useQuery(userQueryOptions(id));
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Hooks - User Addresses
export function useUserAddresses(filters: UserAddressesFilters) {
  return useQuery(userAddressesQueryOptions(filters));
}

export function useDeleteUserAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, addressId }: { userId: number; addressId: number }) =>
      deleteUserAddress(userId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAddresses"] });
    },
  });
}
