import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportTicketStatus = "open" | "in_progress" | "closed";

export interface SupportTicket {
  id: number;
  uuid: string;
  subject: string;
  status: SupportTicketStatus;
  status_label: string;
  messages_count: number;
  unread_count: number;
  last_message_at: string;
  created_at: string;
}

export interface SupportFile {
  id: number;
  url: string;
  name: string;
  size: number;
}

export interface SupportMessage {
  id: number;
  body: string;
  sender_type: "admin" | "seller";
  sender_name: string;
  files: SupportFile[];
  is_read_by_seller: boolean;
  created_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

interface TicketsResponse {
  data: SupportTicket[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface TicketDetailResponse {
  data: SupportTicketDetail;
}

export interface TicketsFilters {
  status?: string;
  search?: string;
  limit?: number;
}

// ─── API functions ─────────────────────────────────────────────────────────────

async function getTickets(filters: TicketsFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/support/load?${params}`);
  return response.data as TicketsResponse;
}

async function getTicket(id: number) {
  const response = await controlPrivateApi.get(`/support/show/${id}`);
  return (response.data as TicketDetailResponse).data;
}

async function createTicket(payload: {
  subject: string;
  body: string;
  files?: File[];
}) {
  const formData = new FormData();
  formData.append("subject", payload.subject);
  formData.append("body", payload.body);
  payload.files?.forEach((file) => formData.append("files[]", file));

  const response = await controlPrivateApi.post("/support/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function replyTicket(
  id: number,
  payload: { body: string; files?: File[] },
) {
  const formData = new FormData();
  formData.append("body", payload.body);
  payload.files?.forEach((file) => formData.append("files[]", file));

  const response = await controlPrivateApi.post(
    `/support/reply/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

async function closeTicket(id: number) {
  const response = await controlPrivateApi.post(`/support/close/${id}`);
  return response.data;
}

// ─── Query options ─────────────────────────────────────────────────────────────

export const ticketsQueryOptions = (filters: TicketsFilters) =>
  queryOptions({
    queryKey: ["support-tickets", filters],
    queryFn: () => getTickets(filters),
    staleTime: 2 * 60 * 1000,
  });

export const ticketQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["support-ticket", id],
    queryFn: () => getTicket(id),
    enabled: !!id,
  });

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useTickets(filters: TicketsFilters) {
  return useQuery(ticketsQueryOptions(filters));
}

export function useTicket(id: number) {
  return useQuery(ticketQueryOptions(id));
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}

export function useReplyTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number;
      body: string;
      files?: File[];
    }) => replyTicket(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["support-ticket", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeTicket,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
}
