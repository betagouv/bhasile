import { z } from "zod";

export const notificationSeenApiUpdateSchema = z.object({
  seenUntil: z.iso.datetime().transform((value) => new Date(value)),
});

export type NotificationSeenApiUpdate = z.infer<
  typeof notificationSeenApiUpdateSchema
>;
export type NotificationSeenApiUpdateClient = z.input<
  typeof notificationSeenApiUpdateSchema
>;

export const notificationReadApiCreateSchema = z.object({
  eventId: z.number().int().positive(),
});

export type NotificationReadApiCreate = z.infer<
  typeof notificationReadApiCreateSchema
>;

export type NotificationApiRead = {
  key: string;
  eventId: number | null;
  occurredAt: string;
  dateLabel: string;
  label: string;
  structureCode: string;
  departement: string;
  authorLevelLabel: string | null;
  href: string;
  isNew: boolean;
};
