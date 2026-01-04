export type NotificationType =
  | "support_message_new"
  | "support_message_sent_to_admin"
  | "support_message_changed_status"
  | "exam_assigned"
  | "exam_completed"
  | "training_assigned"
  | "training_completed"
  | "submission_new"
  | "submission_sent_to_admin"
  | "submission_changed_status";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  model: string;
  model_id: number;
  sent_date: string;
  is_seen: boolean;
}

export interface NotificationsResponse {
  data: Notification[];
}

