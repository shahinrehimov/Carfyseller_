import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrderItemStatus =
  | "pending"
  | "processing"
  | "ready_for_delivery"
  | "handed_to_courier"
  | "canceled";

export interface SellerOrderItem {
  id: number;
  status: OrderItemStatus;
  status_label: string;
  cancel_reason: string | null;
  quantity: number;
  amount: number;
  amount_final: number;
  is_set: boolean;
  sets: unknown[];
  product_variant: {
    id: number;
    title: string;
  };
  fitment_selection?: {
    brand: { id: number; title: string } | null;
    brand_model: { id: number; title: string } | null;
  } | null;
  company_product_variant: {
    id: number;
    uuid: string;
  };
  status_history?: Array<{
    status: OrderItemStatus;
    created_at: string;
  }>;
}

export interface SellerOrderListEntry {
  id: number;
  uuid: string;
  status: string;
  status_label: string;
  payment_status: string;
  payment_status_label: string;
  created_at: string;
  shipping: number;
  items: Array<SellerOrderItem>;
}

export interface SellerOrderDetail {
  id: number;
  uuid: string;
  status: string;
  status_label: string;
  payment_status: string;
  payment_status_label: string;
  created_at: string;
  shipping: number;
  items: Array<SellerOrderItem>;
}

interface SellerOrdersListResponse {
  data: Array<SellerOrderListEntry>;
  meta: {
    current_page: number;
    total: number;
  };
}

interface SellerOrderShowResponse {
  data: SellerOrderDetail;
}

export interface SellerOrdersFilters {
  page: number;
  limit?: number;
}

export interface UpdateItemStatusPayload {
  status: OrderItemStatus;
  cancel_reason: string | null;
}

export interface BulkItemStatusPayload {
  item_ids: Array<number>;
  status: OrderItemStatus;
  cancel_reason: string | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function getSellerOrders(filters: SellerOrdersFilters) {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit ?? 15));
  const response = await controlPrivateApi.get(
    `/orders/load?${params.toString()}`,
  );
  return response.data as SellerOrdersListResponse;
}

async function getSellerOrderDetail(orderUuid: string) {
  const response = await controlPrivateApi.get(`/orders/show/${orderUuid}`);
  return (response.data as SellerOrderShowResponse).data;
}

async function updateOrderItemStatus(
  orderItemId: number,
  payload: UpdateItemStatusPayload,
) {
  const response = await controlPrivateApi.post(
    `/orders/items/${orderItemId}/status`,
    payload,
  );
  return response.data;
}

async function bulkUpdateOrderItemStatus(
  orderUuid: string,
  payload: BulkItemStatusPayload,
) {
  const response = await controlPrivateApi.post(
    `/orders/${orderUuid}/items/bulk-status`,
    payload,
  );
  return response.data;
}

// ─── Query options ────────────────────────────────────────────────────────────

export const sellerOrdersQueryOptions = (filters: SellerOrdersFilters) =>
  queryOptions({
    queryKey: ["seller-orders", filters],
    queryFn: () => getSellerOrders(filters),
    staleTime: 60 * 1000,
  });

export const sellerOrderDetailQueryOptions = (orderUuid: string) =>
  queryOptions({
    queryKey: ["seller-order", orderUuid],
    queryFn: () => getSellerOrderDetail(orderUuid),
    enabled: !!orderUuid,
  });

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSellerOrders(filters: SellerOrdersFilters) {
  return useQuery(sellerOrdersQueryOptions(filters));
}

export function useSellerOrderDetail(orderUuid: string) {
  return useQuery(sellerOrderDetailQueryOptions(orderUuid));
}

export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      orderItemId: number;
      orderUuid: string;
      payload: UpdateItemStatusPayload;
    }) => updateOrderItemStatus(vars.orderItemId, vars.payload),
    onSuccess: (_d, { orderUuid }) => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      queryClient.invalidateQueries({ queryKey: ["seller-order", orderUuid] });
    },
  });
}

export function useBulkUpdateOrderItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderUuid,
      payload,
    }: {
      orderUuid: string;
      payload: BulkItemStatusPayload;
    }) => bulkUpdateOrderItemStatus(orderUuid, payload),
    onSuccess: (_d, { orderUuid }) => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      queryClient.invalidateQueries({ queryKey: ["seller-order", orderUuid] });
    },
  });
}

/** Allowed target statuses for an item given current item + order status (seller API rules). */
export function getAllowedNextItemStatuses(
  itemStatus: OrderItemStatus,
  orderStatus: string,
): Array<OrderItemStatus> {
  if (itemStatus === "canceled") return [];
  const next: Array<OrderItemStatus> = [];
  if (itemStatus === "pending") next.push("processing");
  else if (itemStatus === "processing") next.push("ready_for_delivery");
  else if (
    itemStatus === "ready_for_delivery" &&
    orderStatus === "courier_assigned"
  ) {
    next.push("handed_to_courier");
  }
  next.push("canceled");
  return next;
}
