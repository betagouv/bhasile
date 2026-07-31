import { ReactElement } from "react";

import { getActiveNotifications } from "@/app/api/notifications/notification.service";

import { NotificationsCarousel } from "./NotificationsCarousel";

export const NotificationsBlock = async (): Promise<ReactElement | null> => {
  const notifications = await getActiveNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return <NotificationsCarousel notifications={notifications} />;
};
