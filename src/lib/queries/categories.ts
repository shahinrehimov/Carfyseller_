import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Category {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  sort: number;
  is_active: boolean;
  subs_count: number;
  created_user: string;
  created_date: string;
}

export interface SubCategory {
  id: number;
  category_id: number;
  title: string;
  slug: string;
  image: string | null;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface CategoriesResponse {
  data: Array<Category>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface SubCategoriesResponse {
  data: Array<SubCategory>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateCategoryRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  slug?: string;
  sort: number;
  image: File;
}

interface UpdateCategoryRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  slug?: string;
  sort: number;
  image?: File;
}

interface CreateSubCategoryRequest {
  category_id: number;
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  slug?: string;
  sort: number;
  image: File;
}

interface UpdateSubCategoryRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  slug?: string;
  sort: number;
  image?: File;
}

interface CategoriesFilters {
  page: number;
}

interface SubCategoriesFilters {
  page: number;
  category_id: number;
}

// API functions - Categories
async function getCategories(filters: CategoriesFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/categories/load?${queryParams}`);
  return response.data as CategoriesResponse;
}

async function getCategory(id: number) {
  const response = await controlPrivateApi.get(`/categories/show/${id}`);
  return response.data.data as Category;
}

async function createCategory(data: CreateCategoryRequest) {
  const formData = new FormData();

  data.translations.forEach((translation, index) => {
    formData.append(`translations[${index}][language_id]`, String(translation.language_id));
    formData.append(`translations[${index}][title]`, translation.title);
  });

  if (data.slug) formData.append("slug", data.slug);
  formData.append("sort", String(data.sort));
  formData.append("image", data.image);

  const response = await controlPrivateApi.post("/categories/add", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function updateCategory(id: number, data: UpdateCategoryRequest) {
  const formData = new FormData();

  data.translations.forEach((translation, index) => {
    formData.append(`translations[${index}][language_id]`, String(translation.language_id));
    formData.append(`translations[${index}][title]`, translation.title);
  });

  if (data.slug) formData.append("slug", data.slug);
  formData.append("sort", String(data.sort));
  if (data.image) formData.append("image", data.image);

  const response = await controlPrivateApi.post(`/categories/update/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function deleteCategory(id: number) {
  const response = await controlPrivateApi.delete(`/categories/delete/${id}`);
  return response.data;
}

async function deleteCategoryImage(id: number) {
  const response = await controlPrivateApi.delete(`/categories/delete-image/${id}`);
  return response.data;
}

async function toggleCategoryStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/categories/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

async function changeCategorySorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(`/categories/change-sorting/${id}`, {
    sort,
  });
  return response.data;
}

// API functions - SubCategories
async function getSubCategories(filters: SubCategoriesFilters) {
  const { category_id, page } = filters;
  const response = await controlPrivateApi.get(`/categories/${category_id}/subs/load?page=${page}`);
  return response.data as SubCategoriesResponse;
}

async function getSubCategory(id: number) {
  const response = await controlPrivateApi.get(`/categories/show/${id}`);
  return response.data.data as SubCategory;
}

async function createSubCategory(data: CreateSubCategoryRequest) {
  const formData = new FormData();

  formData.append("parent_id", String(data.category_id));
  data.translations.forEach((translation, index) => {
    formData.append(`translations[${index}][language_id]`, String(translation.language_id));
    formData.append(`translations[${index}][title]`, translation.title);
  });

  if (data.slug) formData.append("slug", data.slug);
  formData.append("sort", String(data.sort));
  formData.append("image", data.image);

  const response = await controlPrivateApi.post("/categories/add", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function updateSubCategory(id: number, data: UpdateSubCategoryRequest) {
  const formData = new FormData();

  data.translations.forEach((translation, index) => {
    formData.append(`translations[${index}][language_id]`, String(translation.language_id));
    formData.append(`translations[${index}][title]`, translation.title);
  });

  if (data.slug) formData.append("slug", data.slug);
  formData.append("sort", String(data.sort));
  if (data.image) formData.append("image", data.image);

  const response = await controlPrivateApi.post(`/categories/update/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function deleteSubCategory(id: number) {
  const response = await controlPrivateApi.delete(`/categories/delete/${id}`);
  return response.data;
}

async function deleteSubCategoryImage(id: number) {
  const response = await controlPrivateApi.delete(`/categories/delete-image/${id}`);
  return response.data;
}

async function toggleSubCategoryStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(`/categories/change-active-status/${id}`, {
    is_active: !isActive,
  });
  return response.data;
}

async function changeSubCategorySorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(`/categories/change-sorting/${id}`, {
    sort,
  });
  return response.data;
}

// Query options - Categories
export const categoriesQueryOptions = (filters: CategoriesFilters) =>
  queryOptions({
    queryKey: ["categories", filters],
    queryFn: () => getCategories(filters),
    staleTime: 5 * 60 * 1000,
  });

export const categoryQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["category", id],
    queryFn: () => getCategory(id),
    enabled: !!id,
  });

// Query options - SubCategories
export const subCategoriesQueryOptions = (filters: SubCategoriesFilters) =>
  queryOptions({
    queryKey: ["subCategories", filters],
    queryFn: () => getSubCategories(filters),
    staleTime: 5 * 60 * 1000,
  });

export const subCategoryQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["subCategory", id],
    queryFn: () => getSubCategory(id),
    enabled: !!id,
  });

// Hooks - Categories
export function useCategories(filters: CategoriesFilters) {
  return useQuery(categoriesQueryOptions(filters));
}

export function useCategory(id: number) {
  return useQuery(categoryQueryOptions(id));
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryRequest }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategoryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategoryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useToggleCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleCategoryStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useChangeCategorySorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) => changeCategorySorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// Hooks - SubCategories
export function useSubCategories(filters: SubCategoriesFilters) {
  return useQuery(subCategoriesQueryOptions(filters));
}

export function useSubCategory(id: number) {
  return useQuery(subCategoryQueryOptions(id));
}

export function useCreateSubCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subCategories"] });
    },
  });
}

export function useUpdateSubCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubCategoryRequest }) =>
      updateSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subCategories"] });
    },
  });
}

export function useDeleteSubCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subCategories"] });
    },
  });
}

export function useDeleteSubCategoryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubCategoryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subCategories"] });
    },
  });
}

export function useToggleSubCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleSubCategoryStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subCategories"] });
    },
  });
}

export function useChangeSubCategorySorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) => changeSubCategorySorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subCategories"] });
    },
  });
}
