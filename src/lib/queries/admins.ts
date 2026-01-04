import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
interface Admin {
  id: number;
  username: string;
  email: string;
  name: string | null;
  surname: string | null;
  is_root: boolean;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

interface AdminsResponse {
  data: Admin[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

interface AdminsFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

interface CreateAdminRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  surname?: string;
  is_active?: boolean;
}

interface UpdateAdminRequest {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  surname?: string;
  is_active?: boolean;
}

interface ChangeActiveStatusResponse {
  message: string;
  status: boolean;
}

// API functions
async function getCompanyAdmins(
  companyId: number,
  filters: AdminsFilters = {},
) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/companies/${companyId}/admins/load?${queryParams}`,
  );
  return response.data as AdminsResponse;
}

async function changeAdminActiveStatus(companyId: number, adminId: number) {
  const response = await controlPrivateApi.post(
    `/companies/${companyId}/admins/change-active-status/${adminId}`,
  );
  return response.data as ChangeActiveStatusResponse;
}

async function deleteAdmin(companyId: number, adminId: number) {
  const response = await controlPrivateApi.delete(
    `/companies/${companyId}/admins/delete/${adminId}`,
  );
  return response.data as ChangeActiveStatusResponse;
}

async function createAdmin(companyId: number, data: CreateAdminRequest) {
  const response = await controlPrivateApi.post(
    `/companies/${companyId}/admins/add`,
    data,
  );
  return response.data;
}

async function updateAdmin(
  companyId: number,
  adminId: number,
  data: UpdateAdminRequest,
) {
  const response = await controlPrivateApi.post(
    `/companies/${companyId}/admins/update/${adminId}`,
    data,
  );
  return response.data;
}

// Query Options
export const companyAdminsQueryOptions = (
  companyId: number,
  filters: AdminsFilters = {},
) =>
  queryOptions({
    queryKey: ["companies", companyId, "admins", filters],
    queryFn: () => getCompanyAdmins(companyId, filters),
    enabled: !!companyId,
  });

// Custom hooks
export function useCompanyAdmins(
  companyId: number,
  filters: AdminsFilters = {},
) {
  return useQuery(companyAdminsQueryOptions(companyId, filters));
}

export function useChangeAdminActiveStatus(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId: number) =>
      changeAdminActiveStatus(companyId, adminId),
    onSuccess: () => {
      // Invalidate and refetch admins data
      queryClient.invalidateQueries({
        queryKey: ["companies", companyId, "admins"],
      });
    },
  });
}

export function useDeleteAdmin(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId: number) => deleteAdmin(companyId, adminId),
    onSuccess: () => {
      // Invalidate and refetch admins data
      queryClient.invalidateQueries({
        queryKey: ["companies", companyId, "admins"],
      });
    },
  });
}

export function useCreateAdmin(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminRequest) => createAdmin(companyId, data),
    onSuccess: () => {
      // Invalidate and refetch admins data
      queryClient.invalidateQueries({
        queryKey: ["companies", companyId, "admins"],
      });
    },
  });
}

export function useUpdateAdmin(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { adminId: number; updateData: UpdateAdminRequest }) =>
      updateAdmin(companyId, data.adminId, data.updateData),
    onSuccess: () => {
      // Invalidate and refetch admins data
      queryClient.invalidateQueries({
        queryKey: ["companies", companyId, "admins"],
      });
    },
  });
}

// Export types for use in components
export type {
  Admin,
  AdminsResponse,
  AdminsFilters,
  CreateAdminRequest,
  UpdateAdminRequest,
};
