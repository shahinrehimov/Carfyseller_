import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Order {
  id: number;
  code: string;
  user_name: string;
  user_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_date: string;
}

export interface OrderDetail extends Order {
  items: Array<{
    id: number;
    product_title: string;
    variant_title: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  shipping_address: {
    address: string;
    city: string;
    country: string;
  };
}

interface OrdersResponse {
  data: Array<Order>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface OrdersFilters {
  page: number;
  search?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  from_date?: string;
  to_date?: string;
}

interface UpdateOrderStatusRequest {
  status: string;
}

interface UpdatePaymentStatusRequest {
  payment_status: string;
}

// API functions
async function getOrders(filters: OrdersFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/orders/load?${queryParams}`);
  return response.data as OrdersResponse;
}

async function getOrder(id: number) {
  const response = await controlPrivateApi.get(`/orders/show/${id}`);
  return response.data.data as OrderDetail;
}

async function updateOrderStatus(id: number, data: UpdateOrderStatusRequest) {
  const response = await controlPrivateApi.post(`/orders/change-status/${id}`, data);
  return response.data;
}

async function updatePaymentStatus(id: number, data: UpdatePaymentStatusRequest) {
  const response = await controlPrivateApi.post(`/orders/change-payment-status/${id}`, data);
  return response.data;
}

async function refundOrder(id: number) {
  const response = await controlPrivateApi.post(`/orders/refund/${id}`);
  return response.data;
}

// Query options
export const ordersQueryOptions = (filters: OrdersFilters) =>
  queryOptions({
    queryKey: ["orders", filters],
    queryFn: () => getOrders(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

export const orderQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });

// Hooks
export function useOrders(filters: OrdersFilters) {
  return useQuery(ordersQueryOptions(filters));
}

export function useOrder(id: number) {
  return useQuery(orderQueryOptions(id));
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderStatusRequest }) =>
      updateOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentStatusRequest }) =>
      updatePaymentStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refundOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}
