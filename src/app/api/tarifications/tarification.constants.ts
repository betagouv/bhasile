import { TARIFICATION_STEP_DEFINITIONS } from "@/lib/tarification/tarification.definition";
import type { ConversationTag } from "@/types/conversation.type";

export const TARIFICATION_CONVERSATION_TAGS: ConversationTag[] = Object.entries(
  TARIFICATION_STEP_DEFINITIONS
).map(([key, { label }]) => ({ key, label }));
