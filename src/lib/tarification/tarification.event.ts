import { AuthorLevel, TarificationEventType } from "@/generated/prisma/enums";
import {
  type AuthorKind,
  type ColumnRule,
  TARIFICATION_EVENT_DEFINITIONS,
} from "@/lib/tarification/tarification.definition";
import type { TarificationJournalEvent } from "@/types/tarification.type";

// Le système (script de reprise) n'écrit que des dépôts, sans auteur ni niveau
export const isEventShapeValid = (
  event: Omit<TarificationJournalEvent, "id" | "createdAt">
): boolean => {
  const definition = TARIFICATION_EVENT_DEFINITIONS[event.type];
  return (
    isAuthorValid(event, definition.author) &&
    isColumnValid(event.documentId, definition.document) &&
    isColumnValid(event.stepCode, definition.stepCode) &&
    isColumnValid(event.text?.trim() || null, definition.text)
  );
};

const isAuthorValid = (
  {
    type,
    authorId,
    authorLevel,
  }: Pick<TarificationJournalEvent, "type" | "authorId" | "authorLevel">,
  expectedAuthor: AuthorKind
): boolean => {
  if (authorId === null || authorLevel === null) {
    return (
      authorId === null &&
      authorLevel === null &&
      type === TarificationEventType.DOCUMENT_DEPOSITED
    );
  }
  const isOperateur = authorLevel === AuthorLevel.OPERATEUR;
  if (expectedAuthor === "AGENT") {
    return !isOperateur;
  }
  if (expectedAuthor === "OPERATEUR") {
    return isOperateur;
  }
  return true;
};

const isColumnValid = (value: unknown, rule: ColumnRule): boolean => {
  if (rule === "REQUIRED") {
    return value !== null;
  }
  if (rule === "FORBIDDEN") {
    return value === null;
  }
  return true;
};
