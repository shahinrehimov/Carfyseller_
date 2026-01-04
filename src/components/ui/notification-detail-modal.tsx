import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ExternalLink, Loader2 } from "lucide-react";
import Modal from "./modal";
import { Button } from "./button";
import { notificationDetailQueryOptions } from "@/lib/queries/notifications";
import type { NotificationType } from "@/lib/types/notification";
import { useTranslation } from "@/lib/utils/translationLoader";

interface NotificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationId: number;
}

export function NotificationDetailModal({
  isOpen,
  onClose,
  notificationId,
}: NotificationDetailModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: notification, isLoading } = useQuery(
    notificationDetailQueryOptions(notificationId),
  );

  const getNavigationPath = (type: NotificationType, modelId: number) => {
    switch (type) {
      case "exam_assigned":
      case "exam_completed":
        return `/quizzes`;

      case "training_assigned":
      case "training_completed":
        return `/trainings`;

      case "submission_new":
      case "submission_sent_to_admin":
      case "submission_changed_status":
        return `/support`;

      case "support_message_new":
      case "support_message_sent_to_admin":
      case "support_message_changed_status":
        return `/support/${modelId}`;

      default:
        return "/";
    }
  };

  const getActionLabel = (type: NotificationType) => {
    switch (type) {
      case "exam_assigned":
        return t("view_exam") || "View Exam";
      case "exam_completed":
        return t("view_results") || "View Results";
      case "training_assigned":
        return t("view_training") || "View Training";
      case "training_completed":
        return t("view_certificate") || "View Certificate";
      case "submission_new":
      case "submission_sent_to_admin":
      case "submission_changed_status":
      case "support_message_new":
      case "support_message_sent_to_admin":
      case "support_message_changed_status":
        return t("view_details") || "View Details";
      default:
        return t("view") || "View";
    }
  };

  const handleNavigate = () => {
    if (notification) {
      const path = getNavigationPath(notification.type, notification.model_id);
      navigate({ to: path as any });
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("notification_details") || "Notification Details"}
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notification ? (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {notification.title}
            </h3>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(notification.sent_date)}</span>
          </div>

          {/* Message */}
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-foreground whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t("close") || "Close"}
            </Button>
            <Button onClick={handleNavigate} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              {getActionLabel(notification.type)}
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          {t("notification_not_found") || "Notification not found"}
        </div>
      )}
    </Modal>
  );
}

