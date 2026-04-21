import { useEffect, useMemo } from "react";
import { useAppStore } from "../store/StoreProvider";
import { useTranslation } from "react-i18next";
import "./Notifications.css";

type NotificationItem = {
  id?: string | number;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  date?: string;
  route?: string;
  link?: string;
  target?: string;
};

function normalizeDate(value?: string) {
  if (!value) return "";
  if (value.includes("T")) {
    return value.replace("T", " ").slice(0, 16);
  }
  return value;
}

function getNotificationType(type?: string) {
  const value = String(type ?? "").trim().toLowerCase();

  if (
    value === "budget" ||
    value === "budget_limit" ||
    value === "budget_exceeded"
  ) {
    return { icon: "💸", className: "budget" };
  }

  if (
    value === "goal" ||
    value === "goal_completed" ||
    value === "goal_finished"
  ) {
    return { icon: "🎯", className: "goal" };
  }

  if (
    value === "payment" ||
    value === "payment_due" ||
    value === "bill_due"
  ) {
    return { icon: "⏰", className: "payment" };
  }

  return { icon: "🔔", className: "general" };
}

export default function Notifications() {
  const { t } = useTranslation();
  const useStore = useAppStore();

  const notifications = useStore((s: any) => s.notifications ?? []);
  const isLoadingNotifications = useStore(
    (s: any) => s.isLoadingNotifications ?? false
  );

  const loadNotifications = useStore(
    (s: any) => s.loadNotifications ?? null
  );
  const markNotificationAsRead = useStore(
    (s: any) => s.markNotificationAsRead ?? null
  );
  const markAllNotificationsAsRead = useStore(
    (s: any) => s.markAllNotificationsAsRead ?? null
  );
  const deleteNotification = useStore(
    (s: any) => s.deleteNotification ?? null
  );

  useEffect(() => {
    if (typeof loadNotifications === "function") {
      loadNotifications().catch((error: unknown) => {
        console.error("Failed to load notifications:", error);
      });
    }
  }, [loadNotifications]);

  const unreadCount = useMemo(() => {
    return (notifications as NotificationItem[]).filter(
      (item) => !(item.isRead ?? item.read ?? false)
    ).length;
  }, [notifications]);

  const sortedNotifications = useMemo(() => {
    return [...(notifications as NotificationItem[])].sort((a, b) => {
      const aDate = new Date(a.createdAt || a.date || 0).getTime();
      const bDate = new Date(b.createdAt || b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [notifications]);

  const openNotification = async (item: NotificationItem) => {
    try {
      if (
        typeof markNotificationAsRead === "function" &&
        !(item.isRead ?? item.read ?? false)
      ) {
        await markNotificationAsRead(item.id);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    const targetPath = item.route || item.link || item.target;
    if (targetPath) {
      window.location.href = targetPath;
    }
  };

  const handleMarkAsRead = async (
    e: React.MouseEvent<HTMLButtonElement>,
    item: NotificationItem
  ) => {
    e.stopPropagation();

    try {
      if (typeof markNotificationAsRead === "function") {
        await markNotificationAsRead(item.id);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
    item: NotificationItem
  ) => {
    e.stopPropagation();

    try {
      if (typeof deleteNotification === "function") {
        await deleteNotification(item.id);
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (typeof markAllNotificationsAsRead === "function") {
        await markAllNotificationsAsRead();
        return;
      }

      if (typeof markNotificationAsRead === "function") {
        const unreadItems = sortedNotifications.filter(
          (item) => !(item.isRead ?? item.read ?? false)
        );

        await Promise.all(
          unreadItems.map((item) => markNotificationAsRead(item.id))
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      if (typeof loadNotifications === "function") {
        await loadNotifications();
      }
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  };

  if (isLoadingNotifications) {
    return (
      <div className="notifications-loading">
        <div className="notifications-spinner" />
        <span>{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-hero">
        <div>
          <span className="notifications-badge">
            🔔 {t("notifications.title")}
          </span>
          <h2 className="notifications-title">{t("notifications.title")}</h2>
          <p className="notifications-subtitle">
            {t("notifications.subtitle")}
          </p>
        </div>

        <div className="notifications-actions">
          <button
            type="button"
            className="notifications-secondary-btn"
            onClick={handleRefresh}
          >
            🔄 {t("notifications.refresh")}
          </button>

          <button
            type="button"
            className="notifications-primary-btn"
            onClick={handleMarkAllAsRead}
          >
            ✅ {t("notifications.markAllAsRead")}
          </button>
        </div>
      </div>

      <div className="notifications-summary-grid">
        <div className="notifications-summary-card">
          <div className="notifications-summary-icon">📬</div>
          <div>
            <span className="notifications-summary-label">
              {t("notifications.total")}
            </span>
            <strong className="notifications-summary-value">
              {sortedNotifications.length}
            </strong>
          </div>
        </div>

        <div className="notifications-summary-card">
          <div className="notifications-summary-icon">🆕</div>
          <div>
            <span className="notifications-summary-label">
              {t("notifications.unread")}
            </span>
            <strong className="notifications-summary-value">
              {unreadCount}
            </strong>
          </div>
        </div>
      </div>

      {sortedNotifications.length === 0 ? (
        <div className="notifications-empty">
          <div className="notifications-empty-icon">📭</div>
          <h3>{t("notifications.noNotifications")}</h3>
          <p>{t("notifications.emptyDescription")}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {sortedNotifications.map((item) => {
            const isRead = item.isRead ?? item.read ?? false;
            const typeMeta = getNotificationType(item.type);

            return (
              <button
                type="button"
                key={String(item.id ?? Math.random())}
                className={`notification-card ${isRead ? "read" : "unread"} ${typeMeta.className}`}
                onClick={() => openNotification(item)}
              >
                <div className="notification-card-left">
                  <div className="notification-icon">{typeMeta.icon}</div>

                  <div className="notification-content">
                    <div className="notification-content-top">
                      <h3 className="notification-title">
                        {item.title || t("notifications.defaultTitle")}
                      </h3>

                      {!isRead && (
                        <span className="notification-dot">
                          {t("notifications.new")}
                        </span>
                      )}
                    </div>

                    <p className="notification-message">
                      {item.message || t("notifications.defaultMessage")}
                    </p>

                    <div className="notification-meta">
                      <span>
                        {normalizeDate(item.createdAt || item.date) ||
                          t("notifications.noDate")}
                      </span>

                      {item.route || item.link || item.target ? (
                        <span className="notification-link-hint">
                          {t("notifications.openSection")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="notification-actions-row">
                  {!isRead && (
                    <button
                      type="button"
                      className="notification-action-btn read"
                      onClick={(e) => handleMarkAsRead(e, item)}
                    >
                      ✓ {t("notifications.markAsRead")}
                    </button>
                  )}

                  <button
                    type="button"
                    className="notification-action-btn delete"
                    onClick={(e) => handleDelete(e, item)}
                  >
                    🗑️ {t("notifications.delete")}
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}