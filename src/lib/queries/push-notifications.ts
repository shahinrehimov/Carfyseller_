import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";
import type {
  SellerNotification,
  SellerNotificationDetail,
  SellerNotificationsResponse,
  CreateSellerNotificationRequest,
  UpdateSellerNotificationRequest,
} from "../types/push-notification";

// API functions

async function getSellerNotifications(page: number) {
  const response = await controlPrivateApi.get(
    `/notifications/load?page=${page}`,
  );
  return response.data as SellerNotificationsResponse;
}

async function getSellerNotification(id: number) {
  const response = await controlPrivateApi.get(`/notifications/show/${id}`);
  return response.data.data as SellerNotificationDetail;
}

async function createSellerNotification(
  data: CreateSellerNotificationRequest,
) {
  const response = await controlPrivateApi.post("/notifications/add", data);
  return response.data as { message: string; data: { id: number } };
}

async function updateSellerNotification(
  id: number,
  data: UpdateSellerNotificationRequest,
) {
  const response = await controlPrivateApi.post(
    `/notifications/update/${id}`,
    data,
  );
  return response.data as { message: string };
}

async function deleteSellerNotification(id: number) {
  const response = await controlPrivateApi.delete(
    `/notifications/delete/${id}`,
  );
  return response.data as { message: string };
}

async function resendSellerNotification(id: number) {
  const response = await controlPrivateApi.post(
    `/notifications/resend/${id}`,
  );
  return response.data as { message: string; data: { id: number } };
}

async function getTargetingPreview() {
  const response = await controlPrivateApi.get(
    "/notifications/targeting-preview",
  );
  return response.data as { count: number };
}

// Query options

export const sellerNotificationsQueryOptions = (page: number) =>
  queryOptions({
    queryKey: ["seller-notifications", page],
    queryFn: () => getSellerNotifications(page),
    staleTime: 30 * 1000,
  });

export const sellerNotificationQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["seller-notification", id],
    queryFn: () => getSellerNotification(id),
    enabled: !!id,
  });

export const targetingPreviewQueryOptions = () =>
  queryOptions({
    queryKey: ["seller-targeting-preview"],
    queryFn: getTargetingPreview,
    staleTime: 60 * 1000,
  });

// Hooks

export function useSellerNotifications(page: number) {
  return useQuery(sellerNotificationsQueryOptions(page));
}

export function useSellerNotification(id: number) {
  return useQuery(sellerNotificationQueryOptions(id));
}

export function useTargetingPreview() {
  return useQuery(targetingPreviewQueryOptions());
}

export function useCreateSellerNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSellerNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-notifications"] });
    },
  });
}

export function useUpdateSellerNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateSellerNotificationRequest;
    }) => updateSellerNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["seller-notification"] });
    },
  });
}

export function useDeleteSellerNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSellerNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-notifications"] });
    },
  });
}

export function useResendSellerNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resendSellerNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-notifications"] });
    },
  });
}

export type { SellerNotification, SellerNotificationDetail };
