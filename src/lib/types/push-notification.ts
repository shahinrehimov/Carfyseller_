export type SellerNotificationStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "sending"
  | "sent"
  | "cancelled";

export type NotificationChannel = "in_app" | "push" | "sms" | "email";

export type NotificationTargetType = "bulk" | "individual";

export type NotificationActionType = "none" | "order" | "product" | "category" | "url";

export interface NotificationSender {
  type: string;
  name: string;
}

export interface NotificationTranslation {
  language_id: number;
  title: string;
  body: string;
}

export interface SellerNotification {
  id: number;
  uuid: string;
  title: string;
  source: "seller";
  status: SellerNotificationStatus;
  target_type: NotificationTargetType;
  channels: NotificationChannel[];
  total_recipients: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  sender: NotificationSender | null;
}

export interface SellerNotificationDetail extends SellerNotification {
  event_type: string | null;
  target_filters: Record<string, unknown> | null;
  action_type: NotificationActionType;
  action_id: string | null;
  image: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  translations: NotificationTranslation[];
  approved_by: NotificationSender | null;
}

export interface SellerNotificationsResponse {
  data: SellerNotification[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface CreateSellerNotificationRequest {
  target_type: NotificationTargetType;
  target_filters?: { user_ids?: number[] } | null;
  channels: NotificationChannel[];
  action_type: NotificationActionType;
  action_id?: string | null;
  image?: string | null;
  translations: NotificationTranslation[];
}

export interface UpdateSellerNotificationRequest {
  channels?: NotificationChannel[];
  action_type?: NotificationActionType;
  action_id?: string | null;
  image?: string | null;
  translations?: NotificationTranslation[];
}
