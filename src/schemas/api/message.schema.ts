import { z } from "zod";

import type { AuthorLevel } from "@/generated/prisma/enums";
import { ConversationVisibility } from "@/types/conversation.type";

const MESSAGE_MAX_LENGTH = 10_000;
const MESSAGE_MAX_ATTACHMENTS = 20;
const MESSAGE_RECEIPTS_MAX_COUNT = 500;

const visibilitySchema = z.enum(ConversationVisibility);
const messageIdSchema = z.number().int().positive();

export const messageApiCreateSchema = z
  .object({
    visibility: visibilitySchema,
    text: z.string().trim().max(MESSAGE_MAX_LENGTH, {
      error: "Un message ne peut pas dépasser 10 000 caractères",
    }),
    tagKey: z.string().min(1).nullish().default(null),
    fileKeys: z
      .array(z.string().min(1))
      .max(MESSAGE_MAX_ATTACHMENTS)
      .default([]),
  })
  .refine((message) => message.text.length > 0 || message.fileKeys.length > 0, {
    error: "Un message contient un texte ou au moins une pièce jointe",
    path: ["text"],
  });

export type MessageApiCreate = z.infer<typeof messageApiCreateSchema>;
export type MessageApiCreateClient = z.input<typeof messageApiCreateSchema>;

export type MessageApiRead = {
  id: number;
  text: string;
  tagKey: string | null;
  authorLevel: AuthorLevel;
  createdAt: string;
  author: MessageUserApiRead;
  receipts: { createdAt: string; user: MessageUserApiRead }[];
  attachments: {
    id: number;
    key: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
  }[];
};

type MessageUserApiRead = { id: number; name: string | null };

export const messageApiUpdateSchema = z.object({
  tagKey: z.string().min(1).nullable(),
});

export type MessageApiUpdate = z.infer<typeof messageApiUpdateSchema>;

export const messageReceiptApiCreateSchema = z.object({
  visibility: visibilitySchema,
  messageIds: z.array(messageIdSchema).min(1).max(MESSAGE_RECEIPTS_MAX_COUNT),
});

export type MessageReceiptApiCreate = z.infer<
  typeof messageReceiptApiCreateSchema
>;

export const conversationQuerySchema = z.object({
  visibility: visibilitySchema,
});

export const tarificationParamsSchema = z.object({
  structureId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const messageParamsSchema = z.object({
  messageId: z.coerce.number().int().positive(),
});
