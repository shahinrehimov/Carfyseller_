import { queryOptions } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";
import type {
  Notification,
  NotificationsResponse,
} from "../types/notification";

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await controlPrivateApi.get<NotificationsResponse>(
        "/notifications/list",
      );
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

export const notificationDetailQueryOptions = (notificationId: number) =>
  queryOptions({
    queryKey: ["notification", notificationId],
    queryFn: async () => {
      const response = await controlPrivateApi.get<{ data: Notification }>(
        `/notifications/${notificationId}/show`,
      );
      return response.data.data;
    },
  });
