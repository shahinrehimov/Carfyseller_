import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { NotificationDetailModal } from "./notification-detail-modal";
import type { NotificationType } from "@/lib/types/notification";
import { cn } from "@/lib/utils";
import { notificationsQueryOptions } from "@/lib/queries/notifications";
import { useTranslation } from "@/lib/utils/translationLoader";

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: notifications, isLoading } = useQuery(
    notificationsQueryOptions(),
  );

  const unreadCount = notifications?.filter((n) => !n.is_seen).length || 0;

  const handleNotificationClick = (notificationId: number) => {
    setSelectedNotificationId(notificationId);
    setIsModalOpen(true);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return t("just_now") || "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t("minutes_ago") || "minutes ago"}`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${t("hours_ago") || "hours ago"}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${t("days_ago") || "days ago"}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "h-5 w-5 flex-shrink-0";
    switch (type) {
      case "exam_assigned":
        return <ClipboardCheck className={cn(iconClass, "text-blue-500")} />;
      case "exam_completed":
        return <CheckCircle2 className={cn(iconClass, "text-green-500")} />;
      case "training_assigned":
        return <BookOpen className={cn(iconClass, "text-purple-500")} />;
      case "training_completed":
        return <CheckCircle2 className={cn(iconClass, "text-green-500")} />;
      case "submission_new":
      case "submission_sent_to_admin":
        return <FileText className={cn(iconClass, "text-orange-500")} />;
      case "submission_changed_status":
        return <FileText className={cn(iconClass, "text-amber-500")} />;
      case "support_message_new":
      case "support_message_sent_to_admin":
        return <MessageSquare className={cn(iconClass, "text-cyan-500")} />;
      case "support_message_changed_status":
        return <MessageSquare className={cn(iconClass, "text-teal-500")} />;
      default:
        return <Bell className={cn(iconClass, "text-gray-500")} />;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors relative border border-input cursor-pointer">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-[500px]">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>{t("notifications") || "Notifications"}</span>
            {unreadCount > 0 && (
              <span className="text-xs font-normal text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">
                {unreadCount} {t("new") || "new"}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "cursor-pointer flex-col items-start gap-1 py-3 px-3 focus:bg-accent",
                    !notification.is_seen && "bg-primary/5",
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium line-clamp-1",
                            !notification.is_seen && "font-semibold",
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.is_seen && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.sent_date)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("no_notifications") || "No notifications"}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedNotificationId && (
        <NotificationDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNotificationId(null);
          }}
          notificationId={selectedNotificationId}
        />
      )}
    </>
  );
}

