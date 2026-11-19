import { ReactElement } from "react";

import { hasNotificationBell } from "@/app/api/notifications/notification.service";
import { SessionUser } from "@/types/global";

import { NotificationBell } from "./NotificationBell";

// Une panne de la cloche ne doit pas faire tomber le tableau de bord
export const NotificationBellLoader = async ({
  user,
}: Props): Promise<ReactElement | null> => {
  const isAvailable = await hasNotificationBell(user).catch(
    (error: unknown) => {
      console.error("Cloche des notifications indisponible", error);
      return false;
    }
  );
  return isAvailable ? <NotificationBell /> : null;
};

type Props = {
  user: SessionUser;
};
