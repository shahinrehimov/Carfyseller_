import { useQuery, queryOptions } from "@tanstack/react-query";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderPeriod = "daily" | "monthly";

export interface OrdersStatisticsSummary {
  total_orders: number;
  total_revenue: number;
  total_quantity: number;
}

export interface OrdersChartPoint {
  date: string;
  order_count: number;
  revenue: number;
  quantity: number;
}

export interface OrdersStatistics {
  summary: OrdersStatisticsSummary;
  chart: OrdersChartPoint[];
}

export interface StatisticsCpv {
  id: number;
  uuid: string;
  title: string | null;
  main_image: string | null;
}

export interface TopSellingProduct {
  /** null when the listing row no longer exists */
  cpv: StatisticsCpv | null;
  quantity_sold: number;
  revenue: number;
  order_count: number;
}

export interface TopViewedProduct {
  cpv: StatisticsCpv | null;
  view_count: number;
}

export interface CustomerBehaviorOverview {
  total_views: number;
  total_basket_adds: number;
  converted_baskets: number;
  view_to_basket_rate: number;
  basket_to_order_rate: number;
  view_to_order_rate: number;
}

export interface AbandonedProduct {
  cpv: StatisticsCpv | null;
  basket_count: number;
  order_count: number;
  abandoned_count: number;
  abandonment_rate: number;
}

export interface CustomerBehavior {
  overview: CustomerBehaviorOverview;
  abandoned_products: AbandonedProduct[];
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface OrdersParams {
  period?: OrderPeriod;
  date_from?: string;
  date_to?: string;
  status?: string;
}

export interface TopProductsParams {
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export interface CustomerBehaviorParams {
  date_from?: string;
  date_to?: string;
  abandoned_limit?: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

function buildParams(obj: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== "") p.append(k, String(v));
  });
  return p.toString();
}

async function getOrdersStatistics(params: OrdersParams) {
  const qs = buildParams(params as Record<string, string | number | undefined>);
  const res = await controlPrivateApi.get(
    `/statistics/orders${qs ? `?${qs}` : ""}`,
  );
  // Response: { summary: {...}, chart: [...] }
  return res.data as OrdersStatistics;
}

async function getTopSelling(params: TopProductsParams) {
  const qs = buildParams(params as Record<string, string | number | undefined>);
  const res = await controlPrivateApi.get(
    `/statistics/top-selling${qs ? `?${qs}` : ""}`,
  );
  // Response: { data: [...] }
  return (res.data.data ?? []) as TopSellingProduct[];
}

async function getTopViewed(params: TopProductsParams) {
  const qs = buildParams(params as Record<string, string | number | undefined>);
  const res = await controlPrivateApi.get(
    `/statistics/top-viewed${qs ? `?${qs}` : ""}`,
  );
  // Response: { data: [...] }
  return (res.data.data ?? []) as TopViewedProduct[];
}

async function getCustomerBehavior(params: CustomerBehaviorParams) {
  const qs = buildParams(params as Record<string, string | number | undefined>);
  const res = await controlPrivateApi.get(
    `/statistics/customer-behavior${qs ? `?${qs}` : ""}`,
  );
  // Response: { overview: {...}, abandoned_products: [...] }
  return res.data as CustomerBehavior;
}

// ─── Query options ────────────────────────────────────────────────────────────

export const ordersStatisticsQueryOptions = (params: OrdersParams) =>
  queryOptions({
    queryKey: ["seller-statistics-orders", params],
    queryFn: () => getOrdersStatistics(params),
    staleTime: 2 * 60 * 1000,
  });

export const topSellingQueryOptions = (params: TopProductsParams) =>
  queryOptions({
    queryKey: ["seller-statistics-top-selling", params],
    queryFn: () => getTopSelling(params),
    staleTime: 2 * 60 * 1000,
  });

export const topViewedQueryOptions = (params: TopProductsParams) =>
  queryOptions({
    queryKey: ["seller-statistics-top-viewed", params],
    queryFn: () => getTopViewed(params),
    staleTime: 2 * 60 * 1000,
  });

export const customerBehaviorQueryOptions = (params: CustomerBehaviorParams) =>
  queryOptions({
    queryKey: ["seller-statistics-customer-behavior", params],
    queryFn: () => getCustomerBehavior(params),
    staleTime: 2 * 60 * 1000,
  });

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useOrdersStatistics(params: OrdersParams) {
  return useQuery(ordersStatisticsQueryOptions(params));
}

export function useTopSelling(params: TopProductsParams) {
  return useQuery(topSellingQueryOptions(params));
}

export function useTopViewed(params: TopProductsParams) {
  return useQuery(topViewedQueryOptions(params));
}

export function useCustomerBehavior(params: CustomerBehaviorParams) {
  return useQuery(customerBehaviorQueryOptions(params));
}
