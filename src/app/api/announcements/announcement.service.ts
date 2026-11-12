import { DashboardAnnouncement } from "@/types/dashboard.type";

import { findActiveAnnouncements } from "./announcement.repository";

export const getActiveAnnouncements = (): Promise<DashboardAnnouncement[]> =>
  findActiveAnnouncements(new Date());
