import { ReactElement } from "react";

import { getActiveAnnouncements } from "@/app/api/announcements/announcement.service";

import { AnnouncementsCarousel } from "./AnnouncementsCarousel";

export const AnnouncementsBlock = async (): Promise<ReactElement | null> => {
  const announcements = await getActiveAnnouncements();

  if (announcements.length === 0) {
    return null;
  }

  return <AnnouncementsCarousel announcements={announcements} />;
};
