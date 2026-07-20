import { DashboardNotification } from "@/types/dashboard.type";

import { findActiveNotifications } from "./notification.repository";

export const getActiveNotifications = (): Promise<DashboardNotification[]> =>
  findActiveNotifications(new Date());
